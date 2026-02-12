// 微信授权回调处理
export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // 这是之前传递的 userId
  
  if (!code || !state) {
    return new Response('授权失败：缺少必要参数', { status: 400 })
  }
  
  const userId = decodeURIComponent(state)
  const appId = env.WECHAT_APPID
  const appSecret = env.WECHAT_SECRET
  
  if (!appId || !appSecret) {
    return new Response('服务器配置错误：缺少微信应用信息', { status: 500 })
  }
  
  try {
    // 1. 用 code 换取 access_token 和 openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()
    
    if (tokenData.errcode) {
      console.error('WeChat token error:', tokenData)
      return new Response(`授权失败：${tokenData.errmsg}`, { status: 400 })
    }
    
    const openid = tokenData.openid
    const accessToken = tokenData.access_token
    
    // 2. 保存绑定关系
    await env.FOLLOW_STATUS?.put(`openid:${openid}`, userId)
    await env.FOLLOW_STATUS?.put(`user:${userId}:openid`, openid)
    await env.FOLLOW_STATUS?.put(`${userId}:auth_time`, Date.now().toString())
    
    // 3. 检查用户是否已关注公众号（检查pending状态）
    const pendingStatus = await env.FOLLOW_STATUS?.get(`pending:${openid}`)
    if (pendingStatus) {
      // 用户之前已经关注，现在才授权，立即设置关注状态
      await env.FOLLOW_STATUS?.put(userId, 'true')
      await env.FOLLOW_STATUS?.put(`${userId}:time`, Date.now().toString())
      await env.FOLLOW_STATUS?.delete(`pending:${openid}`)
      console.log(`User ${userId} follow status restored from pending`)
    }
    // 注意：网页授权无法直接获取关注状态，需要通过其他方式判断
    // 这里我们先标记为已授权，后续通过事件推送更新关注状态
    
    // 4. 获取用户信息（可选）
    let userInfo = null
    if (tokenData.scope === 'snsapi_userinfo') {
      const userUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
      const userRes = await fetch(userUrl)
      userInfo = await userRes.json()
      
      if (!userInfo.errcode) {
        // 保存用户信息
        await env.FOLLOW_STATUS?.put(`user:${userId}:info`, JSON.stringify({
          nickname: userInfo.nickname,
          avatar: userInfo.headimgurl,
          openid: openid
        }))
      }
    }
    
    // 5. 重定向到前端授权回调页面
    const frontendUrl = env.FRONTEND_URL || 'https://268ff199.new-year-horse.pages.dev'
    const redirectUrl = `${frontendUrl}/auth-callback?auth=success&userId=${userId}`
    return Response.redirect(redirectUrl, 302)
    
  } catch (error) {
    console.error('WeChat callback error:', error)
    return new Response(`授权处理失败：${error.message}`, { status: 500 })
  }
}
