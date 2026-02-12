// Cloudflare Worker - 微信关注状态检查 API
// 部署命令: wrangler deploy

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// SHA1 哈希函数（不依赖 crypto 模块）
async function sha1(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 微信签名验证
async function verifyWechatSignature(params, token) {
  const { signature, timestamp, nonce } = params
  
  // 1. 将token、timestamp、nonce按字典序排序
  const arr = [token, timestamp, nonce].sort()
  
  // 2. 拼接成字符串
  const str = arr.join('')
  
  // 3. SHA1加密
  const hash = await sha1(str)
  
  // 4. 比较signature
  return hash === signature
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // 处理 CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      })
    }

    try {
      switch (url.pathname) {
        case '/api/check-follow':
          return await checkFollowStatus(url, env)
        
        case '/api/update-follow':
          return await updateFollowStatus(request, env)
        
        case '/api/wechat-webhook':
          return await handleWechatWebhook(request, env)
        
        case '/api/stats':
          return await getStats(env)
        
        case '/api/health':
          return jsonResponse({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            wechat: 'configured',
            appid: env.WECHAT_APPID?.substring(0, 6) + '...'
          })
        
        default:
          return jsonResponse({ error: 'Not Found' }, 404)
      }
    } catch (error) {
      console.error('Worker Error:', error)
      return jsonResponse({ 
        error: 'Internal Server Error',
        message: error.message 
      }, 500)
    }
  }
}

// 处理微信 webhook
async function handleWechatWebhook(request, env) {
  const url = new URL(request.url)
  const params = {
    signature: url.searchParams.get('signature'),
    timestamp: url.searchParams.get('timestamp'),
    nonce: url.searchParams.get('nonce'),
    echostr: url.searchParams.get('echostr'),
    openid: url.searchParams.get('openid')
  }
  
  console.log('Wechat webhook called:', params)
  
  // GET 请求 - 服务器验证
  if (request.method === 'GET') {
    // 验证签名
    const isValid = await verifyWechatSignature(params, env.WECHAT_TOKEN)
    
    console.log('Signature valid:', isValid)
    
    if (!isValid) {
      return new Response('Invalid signature', { status: 403 })
    }
    
    // 返回 echostr 完成验证
    return new Response(params.echostr)
  }
  
  // POST 请求 - 处理消息/事件
  if (request.method === 'POST') {
    // 验证签名
    const isValid = await verifyWechatSignature(params, env.WECHAT_TOKEN)
    
    if (!isValid) {
      return new Response('Invalid signature', { status: 403 })
    }
    
    // 解析 XML
    const xml = await request.text()
    console.log('Wechat event:', xml)
    
    // 提取关键信息
    const msgType = extractXmlValue(xml, 'MsgType')
    const event = extractXmlValue(xml, 'Event')
    const openid = extractXmlValue(xml, 'FromUserName')
    const toUser = extractXmlValue(xml, 'ToUserName')
    
    console.log('Event:', event, 'OpenID:', openid)
    
    // 处理关注/取消关注事件
    if (msgType === 'event' && openid) {
      // 查找对应的 userId
      const userId = await env.FOLLOW_STATUS.get(`openid:${openid}`)
      
      if (userId) {
        if (event === 'subscribe') {
          await env.FOLLOW_STATUS.put(userId, 'true')
          await env.FOLLOW_STATUS.put(`${userId}:time`, Date.now().toString())
          console.log('User subscribed:', userId)
          await updateStats(env, true)
          
          // 返回欢迎消息
          return xmlResponse(toUser, openid, '🎉 欢迎关注景略科技！马年大吉！')
          
        } else if (event === 'unsubscribe') {
          await env.FOLLOW_STATUS.put(userId, 'false')
          console.log('User unsubscribed:', userId)
          await updateStats(env, false)
        }
      } else {
        if (event === 'subscribe') {
          await env.FOLLOW_STATUS.put(`openid:${openid}`, `pending_${Date.now()}`)
        }
      }
    }
    
    return new Response('success')
  }
  
  return jsonResponse({ error: 'Method Not Allowed' }, 405)
}

// 提取 XML 值
function extractXmlValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`)) ||
                xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`))
  return match ? match[1] : null
}

// 生成 XML 响应
function xmlResponse(toUser, fromUser, content) {
  const xml = `<xml>
<ToUserName><![CDATA[${fromUser}]]></ToUserName>
<FromUserName><![CDATA[${toUser}]]></FromUserName>
<CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`
  
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  })
}

// 检查关注状态
async function checkFollowStatus(url, env) {
  const userId = url.searchParams.get('userId')
  
  if (!userId) {
    return jsonResponse({ isFollowed: false, error: 'Missing userId' }, 400)
  }

  const followStatus = await env.FOLLOW_STATUS.get(userId)
  const followTime = await env.FOLLOW_STATUS.get(`${userId}:time`)
  
  return jsonResponse({
    isFollowed: followStatus === 'true',
    userId,
    followTime: followTime ? parseInt(followTime) : null,
    timestamp: Date.now()
  })
}

// 更新关注状态
async function updateFollowStatus(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405)
  }

  const body = await request.json()
  const { userId, isFollowed } = body
  
  if (!userId) {
    return jsonResponse({ error: 'Missing userId' }, 400)
  }

  await env.FOLLOW_STATUS.put(userId, isFollowed ? 'true' : 'false')
  
  if (isFollowed) {
    await env.FOLLOW_STATUS.put(`${userId}:time`, Date.now().toString())
  }
  
  await updateStats(env, isFollowed)

  return jsonResponse({ success: true, userId, isFollowed })
}

// 获取统计数据
async function getStats(env) {
  const stats = await env.FOLLOW_STATUS.get('global:stats')
  return jsonResponse(stats ? JSON.parse(stats) : { totalUsers: 0, totalFollowed: 0 })
}

// 更新统计数据
async function updateStats(env, isFollowed) {
  const statsKey = 'global:stats'
  const statsStr = await env.FOLLOW_STATUS.get(statsKey)
  
  let stats = statsStr ? JSON.parse(statsStr) : {
    totalUsers: 0,
    totalFollowed: 0,
    todayFollowed: 0
  }
  
  stats.totalUsers++
  if (isFollowed) stats.totalFollowed++
  stats.lastUpdate = Date.now()
  
  await env.FOLLOW_STATUS.put(statsKey, JSON.stringify(stats))
}

// 辅助函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}
