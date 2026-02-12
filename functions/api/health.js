// 健康检查 API - 验证配置是否正确
export async function onRequestGet(context) {
  const { env } = context
  
  const config = {
    WECHAT_TOKEN: env.WECHAT_TOKEN ? '✅ 已配置' : '❌ 未配置',
    WECHAT_APPID: env.WECHAT_APPID ? '✅ 已配置' : '❌ 未配置',
    WECHAT_SECRET: env.WECHAT_SECRET ? '✅ 已配置' : '❌ 未配置',
    WECHAT_AES_KEY: env.WECHAT_AES_KEY ? '✅ 已配置' : '❌ 未配置',
    FRONTEND_URL: env.FRONTEND_URL || 'https://b0282f43.new-year-horse.pages.dev',
    FOLLOW_STATUS: env.FOLLOW_STATUS ? '✅ KV 已绑定' : '❌ KV 未绑定',
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify({
    status: 'ok',
    config
  }, null, 2), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
