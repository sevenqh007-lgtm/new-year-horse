// Cloudflare Pages Function - 检查关注状态
export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')
  
  if (!userId) {
    return new Response(JSON.stringify({ 
      isFollowed: false,
      message: 'Missing userId parameter'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  try {
    const followStatus = await env.FOLLOW_STATUS?.get(userId)
    const followTime = await env.FOLLOW_STATUS?.get(`${userId}:time`)
    const openid = await env.FOLLOW_STATUS?.get(`user:${userId}:openid`)
    
    return new Response(JSON.stringify({
      isFollowed: followStatus === 'true',
      userId,
      followTime: followTime ? parseInt(followTime) : null,
      openid: openid || null,
      timestamp: Date.now()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      isFollowed: false,
      userId,
      error: error.message,
      timestamp: Date.now()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
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
