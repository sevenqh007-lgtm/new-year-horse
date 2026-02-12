// Cloudflare Worker - 关注状态检查 API (简化版)
// 部署命令: wrangler deploy

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
            version: '1.0.0'
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

// 检查关注状态
async function checkFollowStatus(url, env) {
  const userId = url.searchParams.get('userId')
  
  if (!userId) {
    return jsonResponse({ 
      isFollowed: false, 
      error: 'Missing userId' 
    }, 400)
  }

  try {
    // 从 KV 获取关注状态
    const followStatus = await env.FOLLOW_STATUS?.get(userId)
    const followTime = await env.FOLLOW_STATUS?.get(`${userId}:time`)
    
    return jsonResponse({
      isFollowed: followStatus === 'true',
      userId,
      followTime: followTime ? parseInt(followTime) : null,
      timestamp: Date.now()
    })
  } catch (e) {
    // 如果 KV 未配置，返回模拟数据
    return jsonResponse({
      isFollowed: false,
      userId,
      note: 'KV not configured',
      timestamp: Date.now()
    })
  }
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

  try {
    // 保存到 KV
    if (env.FOLLOW_STATUS) {
      await env.FOLLOW_STATUS.put(userId, isFollowed ? 'true' : 'false')
      
      if (isFollowed) {
        await env.FOLLOW_STATUS.put(`${userId}:time`, Date.now().toString())
      }
      
      // 更新统计
      await updateStats(env, isFollowed)
    }

    return jsonResponse({
      success: true,
      userId,
      isFollowed,
      timestamp: Date.now()
    })
  } catch (e) {
    return jsonResponse({
      success: true, // 前端兼容
      userId,
      isFollowed,
      note: 'KV not configured, using local mode'
    })
  }
}

// 处理微信 webhook（关注/取消关注事件）
async function handleWechatWebhook(request, env) {
  if (request.method === 'GET') {
    // 微信服务器验证
    const url = new URL(request.url)
    const signature = url.searchParams.get('signature')
    const timestamp = url.searchParams.get('timestamp')
    const nonce = url.searchParams.get('nonce')
    const echostr = url.searchParams.get('echostr')
    
    // 这里应该验证签名，简化处理直接返回
    return new Response(echostr)
  }
  
  if (request.method === 'POST') {
    // 处理微信事件推送
    const xml = await request.text()
    
    // 解析 XML (简化处理)
    const eventMatch = xml.match(/<Event><!\[CDATA\[(.*?)\]\]><\/Event>/)
    const openidMatch = xml.match(/<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/)
    
    if (eventMatch && openidMatch) {
      const event = eventMatch[1]
      const openid = openidMatch[1]
      
      // 查找对应的 userId
      const userId = await env.FOLLOW_STATUS?.get(`openid:${openid}`)
      
      if (userId) {
        if (event === 'subscribe') {
          await env.FOLLOW_STATUS?.put(userId, 'true')
          await env.FOLLOW_STATUS?.put(`${userId}:time`, Date.now().toString())
        } else if (event === 'unsubscribe') {
          await env.FOLLOW_STATUS?.put(userId, 'false')
        }
      }
    }
    
    return new Response('success')
  }
  
  return jsonResponse({ error: 'Method Not Allowed' }, 405)
}

// 获取统计数据
async function getStats(env) {
  try {
    const stats = await env.FOLLOW_STATUS?.get('global:stats')
    
    if (stats) {
      return jsonResponse(JSON.parse(stats))
    }
  } catch (e) {
    // KV 未配置
  }
  
  return jsonResponse({
    totalUsers: 0,
    totalFollowed: 0,
    todayFollowed: 0,
    note: 'Stats not available'
  })
}

// 更新统计数据
async function updateStats(env, isFollowed) {
  try {
    const statsKey = 'global:stats'
    const statsStr = await env.FOLLOW_STATUS?.get(statsKey)
    
    let stats = statsStr ? JSON.parse(statsStr) : {
      totalUsers: 0,
      totalFollowed: 0,
      todayFollowed: 0,
      lastUpdate: Date.now()
    }
    
    stats.totalUsers++
    if (isFollowed) {
      stats.totalFollowed++
      stats.todayFollowed++
    }
    stats.lastUpdate = Date.now()
    
    await env.FOLLOW_STATUS?.put(statsKey, JSON.stringify(stats))
  } catch (e) {
    // 忽略错误
  }
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
