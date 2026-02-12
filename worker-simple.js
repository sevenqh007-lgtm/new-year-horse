// Cloudflare Worker - 简化版关注状态检查
// 使用 Durable Objects 替代 KV，无需预先创建 namespace

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      switch (url.pathname) {
        case '/api/check-follow':
          return await checkFollow(url, env)
        
        case '/api/update-follow':
          return await updateFollow(request, env)
        
        case '/api/health':
          return jsonResponse({ status: 'ok' })
        
        default:
          return jsonResponse({ error: 'Not Found' }, 404)
      }
    } catch (error) {
      return jsonResponse({ error: error.message }, 500)
    }
  }
}

async function checkFollow(url, env) {
  const userId = url.searchParams.get('userId')
  
  if (!userId) {
    return jsonResponse({ isFollowed: false, error: 'Missing userId' }, 400)
  }

  // 从 Durable Object 获取状态
  const id = env.FOLLOW_STORE.idFromName(userId)
  const store = await env.FOLLOW_STORE.get(id)
  const status = await store.fetch(`http://internal/get?key=${userId}`)
  const data = await status.json()
  
  return jsonResponse({
    isFollowed: data.value === 'true',
    userId,
    timestamp: Date.now()
  })
}

async function updateFollow(request, env) {
  const body = await request.json()
  const { userId, isFollowed } = body
  
  if (!userId) {
    return jsonResponse({ error: 'Missing userId' }, 400)
  }

  // 保存到 Durable Object
  const id = env.FOLLOW_STORE.idFromName(userId)
  const store = await env.FOLLOW_STORE.get(id)
  await store.fetch('http://internal/set', {
    method: 'POST',
    body: JSON.stringify({ key: userId, value: isFollowed ? 'true' : 'false' })
  })

  return jsonResponse({ success: true, isFollowed, userId })
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

// Durable Object 类
export class FollowStore {
  constructor(state, env) {
    this.state = state
    this.env = env
  }

  async fetch(request) {
    const url = new URL(request.url)
    
    if (url.pathname === '/get') {
      const key = url.searchParams.get('key')
      const value = await this.state.storage.get(key)
      return new Response(JSON.stringify({ value }))
    }
    
    if (url.pathname === '/set') {
      const body = await request.json()
      await this.state.storage.put(body.key, body.value)
      return new Response(JSON.stringify({ success: true }))
    }
    
    return new Response('Not Found', { status: 404 })
  }
}
