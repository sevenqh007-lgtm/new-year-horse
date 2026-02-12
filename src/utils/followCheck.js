/**
 * 关注状态检测与营销逻辑
 * 配合后端API验证用户关注状态
 */

const FOLLOW_KEY = 'ny_follow_status'
const USER_ID_KEY = 'ny_user_id'
const API_BASE = '' // 相对路径，同域名部署

/**
 * 生成唯一用户ID
 */
export const generateUserId = () => {
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
    localStorage.setItem(USER_ID_KEY, id)
    return id
}

/**
 * 获取或创建用户ID
 */
export const getUserId = () => {
    let userId = localStorage.getItem(USER_ID_KEY)
    if (!userId) {
        userId = generateUserId()
    }
    return userId
}

/**
 * 检测关注状态
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Promise<boolean>}
 */
export const checkFollowStatus = async (forceRefresh = false) => {
    // 先检查本地缓存（如果不是强制刷新）
    if (!forceRefresh) {
        const localStatus = localStorage.getItem(FOLLOW_KEY)
        if (localStatus === 'true') {
            return true
        }
    }

    const userId = getUserId()
    
    try {
        const response = await fetch(`${API_BASE}/api/check-follow?userId=${userId}`)
        const data = await response.json()
        
        // 更新本地状态
        if (data.isFollowed) {
            localStorage.setItem(FOLLOW_KEY, 'true')
            localStorage.setItem('ny_quota', '9999')
        } else {
            localStorage.removeItem(FOLLOW_KEY)
        }
        
        return data.isFollowed
    } catch (e) {
        console.error('Check follow status failed:', e)
        // 失败时回退到本地存储
        return localStorage.getItem(FOLLOW_KEY) === 'true'
    }
}

/**
 * 获取微信授权链接（用于获取用户openid）
 * @returns {Promise<string|null>}
 */
export const getWechatAuthUrl = async () => {
    const userId = getUserId()
    
    try {
        const response = await fetch(`${API_BASE}/api/wechat-auth?userId=${userId}`)
        const data = await response.json()
        
        if (data.success && data.authUrl) {
            return data.authUrl
        }
        return null
    } catch (e) {
        console.error('Get wechat auth url failed:', e)
        return null
    }
}

/**
 * 跳转到微信授权页面
 */
export const goToWechatAuth = async () => {
    const authUrl = await getWechatAuthUrl()
    if (authUrl) {
        // 记录授权开始时间
        localStorage.setItem('ny_auth_start', Date.now().toString())
        window.location.href = authUrl
    } else {
        // 如果获取授权链接失败，直接打开关注页面
        openFollowPage()
    }
}

/**
 * 检查是否从微信授权返回
 * @returns {boolean}
 */
export const checkReturnFromAuth = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const auth = urlParams.get('auth')
    const userId = urlParams.get('userId')
    
    if (auth === 'success' && userId) {
        // 清除URL参数
        window.history.replaceState({}, document.title, window.location.pathname)
        return true
    }
    return false
}

/**
 * 轮询检测关注状态
 * @param {Function} onStatusChange - 状态变化回调
 * @param {number} interval - 轮询间隔（毫秒）
 * @param {number} maxAttempts - 最大尝试次数
 * @returns {Function} - 停止轮询的函数
 */
export const pollFollowStatus = (onStatusChange, interval = 3000, maxAttempts = 20) => {
    let attempts = 0
    let isRunning = true
    
    const check = async () => {
        if (!isRunning || attempts >= maxAttempts) {
            return
        }
        
        attempts++
        const isFollowed = await checkFollowStatus(true)
        
        if (isFollowed) {
            isRunning = false
            onStatusChange(true)
        } else if (attempts < maxAttempts) {
            setTimeout(check, interval)
        } else {
            // 达到最大尝试次数
            onStatusChange(false, true)
        }
    }
    
    check()
    
    return () => {
        isRunning = false
    }
}

/**
 * 标记已关注（本地）
 */
export const markAsFollowed = () => {
    localStorage.setItem(FOLLOW_KEY, 'true')
    localStorage.setItem('ny_quota', '9999')
}

/**
 * 获取营销文案
 * @param {boolean} isFollowed
 * @returns {Object}
 */
export const getMarketingCopy = (isFollowed) => {
    if (isFollowed) {
        return {
            title: '🎉 尊贵会员',
            subtitle: '无限使用已解锁',
            btnText: '立即使用',
            badge: '无限次',
            theme: 'gold'
        }
    } else {
        return {
            title: '🎁 新人福利',
            subtitle: '关注公众号，无限次免费生成',
            btnText: '关注解锁',
            badge: '限时免费',
            theme: 'red',
            urgency: '已有 8,234 人关注使用'
        }
    }
}

/**
 * 生成公众号关注链接
 * 注意：需要在微信公众平台获取正确的关注链接
 * @returns {string}
 */
export const generateFollowLink = () => {
    // 标准公众号关注链接格式
    // 需要替换为你的公众号原始ID (gh_xxxx)
    // 可以在公众号设置 -> 账号详情中找到
    const ghId = 'gh_d8c2ff4637f8' // 请替换为实际的公众号ID
    return `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${ghId}&scene=126#wechat_redirect`
}

/**
 * 在微信中打开关注页面
 */
export const openFollowPage = () => {
    const followUrl = generateFollowLink()
    
    // 记录点击时间，用于返回后检测
    localStorage.setItem('ny_follow_click', Date.now().toString())
    
    // 判断是否在微信环境
    const isWechat = /MicroMessenger/i.test(navigator.userAgent)
    
    if (isWechat) {
        // 在微信中使用 location.href 跳转
        window.location.href = followUrl
    } else {
        // 非微信环境，打开新窗口
        window.open(followUrl, '_blank')
    }
}

/**
 * 检测是否从关注页面返回
 * @returns {boolean}
 */
export const checkReturnFromFollow = () => {
    const followClickTime = localStorage.getItem('ny_follow_click')
    if (followClickTime) {
        const timeDiff = Date.now() - parseInt(followClickTime)
        // 如果在5分钟内返回，认为是关注后返回
        if (timeDiff < 5 * 60 * 1000) {
            return true
        }
    }
    return false
}

/**
 * 清除关注点击记录
 */
export const clearFollowClick = () => {
    localStorage.removeItem('ny_follow_click')
}

/**
 * 获取用户信息
 * @returns {Promise<Object|null>}
 */
export const getUserInfo = async () => {
    const userId = getUserId()
    if (!userId) return null
    
    try {
        const response = await fetch(`${API_BASE}/api/check-follow?userId=${userId}`)
        return await response.json()
    } catch (e) {
        console.error('Get user info failed:', e)
        return null
    }
}

/**
 * 判断是否在微信浏览器中
 * @returns {boolean}
 */
export const isWechatBrowser = () => {
    return /MicroMessenger/i.test(navigator.userAgent)
}

/**
 * 初始化关注状态（页面加载时调用）
 * @returns {Promise<boolean>}
 */
export const initFollowStatus = async () => {
    // 检查是否从微信授权返回
    if (checkReturnFromAuth()) {
        // 授权成功，开始轮询检测关注状态
        return true
    }
    
    // 检查是否从关注页面返回
    if (checkReturnFromFollow()) {
        // 返回后重新检测关注状态
        const isFollowed = await checkFollowStatus(true)
        if (isFollowed) {
            clearFollowClick()
            return true
        }
    }
    
    // 正常检测关注状态
    return await checkFollowStatus()
}
