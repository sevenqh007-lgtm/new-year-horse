// 获取微信网页授权链接
export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  
  if (!userId) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Missing userId parameter' 
    }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
  
  const appId = env.WECHAT_APPID
  if (!appId) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'WeChat AppID not configured' 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
  
  // 构建授权链接
  const redirectUri = encodeURIComponent(`${url.origin}/api/wechat-callback`)
  const state = encodeURIComponent(userId) // 传递 userId
  const scope = 'snsapi_userinfo' // 需要用户同意授权
  
  const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`
  
  return new Response(JSON.stringify({
    success: true,
    authUrl,
    userId
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

// 处理 CORS 预检请求
export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
