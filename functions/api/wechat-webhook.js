// Cloudflare Pages Function - 微信 Webhook 处理服务器验证和事件推送

// 微信服务器验证（GET 请求）
export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  
  const signature = url.searchParams.get('signature')
  const timestamp = url.searchParams.get('timestamp')
  const nonce = url.searchParams.get('nonce')
  const echostr = url.searchParams.get('echostr')
  
  console.log('WeChat verification request:', { signature, timestamp, nonce, echostr })
  
  if (!signature || !timestamp || !nonce || !echostr) {
    return new Response('Missing parameters', { status: 400 })
  }
  
  // 验证签名
  const token = env.WECHAT_TOKEN || 'nyhorse2025'
  const arr = [token, timestamp, nonce].sort()
  const str = arr.join('')
  
  // 使用 Web Crypto API 进行 SHA1 签名
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  console.log('Calculated hash:', hash)
  console.log('Received signature:', signature)
  
  if (hash !== signature) {
    console.error('Signature mismatch!')
    return new Response('Invalid signature', { status: 403 })
  }
  
  console.log('Verification successful, returning echostr')
  // 必须原样返回 echostr
  return new Response(echostr)
}

// 处理微信事件推送（POST 请求）
export async function onRequestPost(context) {
  const { request, env } = context
  const xml = await request.text()
  
  console.log('Received WeChat event:', xml)
  
  // 解析 XML
  const eventMatch = xml.match(/<Event><!\[CDATA\[(.*?)\]\]><\/Event>/)
  const openidMatch = xml.match(/<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/)
  const msgTypeMatch = xml.match(/<MsgType><!\[CDATA\[(.*?)\]\]><\/MsgType>/)
  
  const msgType = msgTypeMatch ? msgTypeMatch[1] : ''
  
  // 处理关注/取消关注事件
  if (eventMatch && openidMatch) {
    const event = eventMatch[1]
    const openid = openidMatch[1]
    
    console.log(`Event: ${event}, OpenID: ${openid}`)
    
    // 查找关联的用户ID
    const userId = await env.FOLLOW_STATUS?.get(`openid:${openid}`)
    
    if (userId) {
      if (event === 'subscribe') {
        await env.FOLLOW_STATUS?.put(userId, 'true')
        await env.FOLLOW_STATUS?.put(`${userId}:time`, Date.now().toString())
        console.log(`User ${userId} subscribed`)
      } else if (event === 'unsubscribe') {
        await env.FOLLOW_STATUS?.put(userId, 'false')
        console.log(`User ${userId} unsubscribed`)
      }
    } else {
      // 如果没有找到关联的用户ID，保存 openid 等待关联
      await env.FOLLOW_STATUS?.put(`pending:${openid}`, Date.now().toString())
      console.log(`Pending follow status for OpenID: ${openid}`)
    }
  }
  
  // 处理文本消息（用户发送关键词）
  if (msgType === 'text') {
    const contentMatch = xml.match(/<Content><!\[CDATA\[(.*?)\]\]><\/Content>/)
    const toUserMatch = xml.match(/<ToUserName><!\[CDATA\[(.*?)\]\]><\/ToUserName>/)
    const fromUserMatch = xml.match(/<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/)
    
    if (contentMatch && toUserMatch && fromUserMatch) {
      const content = contentMatch[1]
      const toUser = toUserMatch[1]
      const fromUser = fromUserMatch[1]
      
      // 回复文本消息
      if (content.includes('拜年') || content.includes('祝福')) {
        return new Response(createTextReply(fromUser, toUser, '欢迎使用马年新春拜年神器！🐎🧧 点击下方菜单或访问 https://6f6ee680.new-year-horse.pages.dev 开始生成您的专属祝福~'))
      }
    }
  }
  
  // 必须返回 success
  return new Response('success')
}

// 创建文本回复消息
function createTextReply(toUser, fromUser, content) {
  const timestamp = Math.floor(Date.now() / 1000)
  return `<xml>
    <ToUserName><![CDATA[${toUser}]]></ToUserName>
    <FromUserName><![CDATA[${fromUser}]]></FromUserName>
    <CreateTime>${timestamp}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${content}]]></Content>
  </xml>`
}
