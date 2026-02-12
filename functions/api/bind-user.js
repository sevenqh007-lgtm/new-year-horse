// 绑定用户ID和微信OpenID
export async function onRequestPost(context) {
  const { request, env } = context
  
  try {
    const body = await request.json()
    const { userId, openid } = body
    
    if (!userId || !openid) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing userId or openid' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // 保存绑定关系
    await env.FOLLOW_STATUS?.put(`openid:${openid}`, userId)
    await env.FOLLOW_STATUS?.put(`user:${userId}:openid`, openid)
    
    // 检查是否有待处理的关注状态
    const pendingStatus = await env.FOLLOW_STATUS?.get(`pending:${openid}`)
    if (pendingStatus) {
      // 如果有待处理的关注，更新用户状态
      await env.FOLLOW_STATUS?.put(userId, 'true')
      await env.FOLLOW_STATUS?.delete(`pending:${openid}`)
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User bound successfully',
      userId,
      openid
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
