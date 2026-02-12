/**
 * 关注状态管理 Composable
 * 统一管理关注状态，提供更好的用户体验
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  getUserId, 
  checkFollowStatus, 
  pollFollowStatus,
  isWechatBrowser,
  checkReturnFromFollow,
  clearFollowClick
} from '../utils/followCheck'

const FOLLOW_KEY = 'ny_follow_status'
const QUOTA_KEY = 'ny_quota'

// 全局状态
const isFollowed = ref(false)
const isChecking = ref(false)
const quota = ref(0)
const lastCheckTime = ref(0)

// 状态变化回调列表
const statusCallbacks = []

/**
 * 注册状态变化回调
 */
export const onStatusChange = (callback) => {
  statusCallbacks.push(callback)
  return () => {
    const index = statusCallbacks.indexOf(callback)
    if (index > -1) {
      statusCallbacks.splice(index, 1)
    }
  }
}

/**
 * 触发状态变化通知
 */
const notifyStatusChange = () => {
  statusCallbacks.forEach(cb => cb(isFollowed.value))
}

/**
 * 初始化关注状态
 * @param {Object} options 配置选项
 * @param {boolean} options.forceRefresh - 是否强制刷新
 * @param {boolean} options.showLoading - 是否显示加载状态
 */
export const useFollowStatus = (options = {}) => {
  const { forceRefresh = false, showLoading = true } = options

  /**
   * 从本地读取状态
   */
  const loadFromLocal = () => {
    const status = localStorage.getItem(FOLLOW_KEY)
    const q = localStorage.getItem(QUOTA_KEY)
    const time = localStorage.getItem('ny_follow_check_time')
    
    isFollowed.value = status === 'true'
    quota.value = parseInt(q || '0')
    lastCheckTime.value = parseInt(time || '0')
    
    // 本地状态有效期为24小时
    const isExpired = Date.now() - lastCheckTime.value > 24 * 60 * 60 * 1000
    
    return !isExpired && status === 'true'
  }

  /**
   * 保存状态到本地
   */
  const saveToLocal = () => {
    localStorage.setItem(FOLLOW_KEY, isFollowed.value ? 'true' : 'false')
    localStorage.setItem(QUOTA_KEY, quota.value.toString())
    localStorage.setItem('ny_follow_check_time', Date.now().toString())
  }

  /**
   * 刷新关注状态
   */
  const refreshStatus = async () => {
    isChecking.value = true
    
    try {
      const status = await checkFollowStatus(true)
      isFollowed.value = status
      
      if (status) {
        quota.value = 9999
      }
      
      saveToLocal()
      notifyStatusChange()
      
      return status
    } catch (error) {
      console.error('刷新关注状态失败:', error)
      // 网络错误时使用本地缓存
      return isFollowed.value
    } finally {
      isChecking.value = false
    }
  }

  /**
   * 开始轮询检测（用于关注后等待状态更新）
   */
  const startPolling = (callback) => {
    isChecking.value = true
    
    // 快速轮询：前10次每1秒，后30次每2秒
    let attempts = 0
    let interval = 1000
    
    const stopPolling = pollFollowStatus(
      (status, isTimeout) => {
        isChecking.value = false
        isFollowed.value = status
        
        if (status) {
          quota.value = 9999
          saveToLocal()
          notifyStatusChange()
          
          if (callback) callback('success')
        } else if (isTimeout) {
          if (callback) callback('timeout')
        }
      },
      interval,
      40
    )
    
    return stopPolling
  }

  /**
   * 初始化
   */
  const init = async () => {
    // 检查是否刚从关注页面返回
    if (checkReturnFromFollow()) {
      // 开始轮询检测
      return 'polling'
    }
    
    // 检查本地缓存
    if (loadFromLocal() && !forceRefresh) {
      return 'cached'
    }
    
    // 从服务器刷新状态
    if (showLoading) {
      isChecking.value = true
    }
    
    await refreshStatus()
    
    return 'refreshed'
  }

  /**
   * 标记已关注（本地）
   */
  const markAsFollowed = () => {
    isFollowed.value = true
    quota.value = 9999
    saveToLocal()
    notifyStatusChange()
  }

  return {
    // 状态
    isFollowed,
    isChecking,
    quota,
    lastCheckTime,
    
    // 方法
    refreshStatus,
    startPolling,
    init,
    markAsFollowed,
    
    // 工具
    loadFromLocal,
    saveToLocal,
    getUserId,
    isWechatBrowser
  }
}

// 导出全局状态
export {
  isFollowed,
  isChecking,
  quota
}
