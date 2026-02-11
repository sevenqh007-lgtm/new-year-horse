/**
 * 关注状态检测与营销逻辑
 * 实际项目中需要配合后端API验证
 */

const FOLLOW_KEY = 'ny_follow_status'
const CHECK_COUNT = 'ny_check_count'

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
    const userId = localStorage.getItem('ny_user_id') || generateUserId()
    // 公众号关注链接（需替换为实际链接）
    // 场景值：从H5关注后返回
    return `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=A_java007==&scene=126#wechat_redirect`
}

const generateUserId = () => {
    const id = 'user_' + Date.now()
    localStorage.setItem('ny_user_id', id)
    return id
}