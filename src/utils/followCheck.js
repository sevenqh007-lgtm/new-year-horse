/**
 * 关注状态检测与营销逻辑
 * 实际项目中需要配合后端API验证
 */

const FOLLOW_KEY = 'ny_follow_status'

// 模拟检测（实际应调用微信API或后端验证）
export const checkFollowStatus = async () => {
    // 方案1：本地存储（演示用，实际不安全）
    // return localStorage.getItem(FOLLOW_KEY) === 'true'

    // 方案2：后端验证（推荐）
    try {
        const userId = localStorage.getItem('ny_user_id')
        const response = await fetch(`https://你的worker地址/api/check-follow?userId=${userId}`)
        const data = await response.json()
        return data.isFollowed
    } catch (e) {
        // 离线模式默认未关注
        return false
    }
}

// 标记已关注（用户点击关注后调用）
export const markAsFollowed = () => {
    localStorage.setItem(FOLLOW_KEY, 'true')
    localStorage.setItem('ny_quota', '9999') // 无限次
}

// 获取营销文案
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

// 生成带参数的关注链接（用于追踪）
export const generateFollowLink = () => {
    // 确保有用户ID
    const userId = localStorage.getItem('ny_user_id') || generateUserId()
    // 公众号关注链接（需替换为实际的公众号ID）
    // 场景值：从H5关注后返回
    return `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=gh_d8c2ff4637f8==&scene=126#wechat_redirect`
}

// 在微信中打开关注页面
export const openFollowPage = () => {
    const followUrl = generateFollowLink()
    
    // 记录点击时间，用于返回后检测
    localStorage.setItem('ny_follow_click', Date.now())
    
    // 判断是否在微
    const isWechat = /MicroMessenger/i.test(navigator.userAgent)
    
    if (isWechat) {
        // 在微信中使用location.href跳转
        window.location.href = followUrl
    } else {
        // 非微信环境，打开新窗口
        window.open(followUrl, '_blank')
    }
}

// 检测是否从关注页面返回
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

const generateUserId = () => {
    const id = 'user_' + Date.now()
    localStorage.setItem('ny_user_id', id)
    return id
}