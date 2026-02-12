<template>
  <div class="auth-callback">
    <div class="loading-container">
      <div class="spinner">🐴</div>
      <h2>{{ statusText }}</h2>
      <p class="subtitle">{{ subText }}</p>
      
      <div class="progress-bar" v-if="isChecking">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>

      <div class="actions" v-if="showActions">
        <button class="btn-primary" @click="goHome">
          {{ isFollowed ? '开始使用' : '返回首页' }}
        </button>
        <button class="btn-secondary" v-if="!isFollowed" @click="checkAgain">
          重新检测
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { checkFollowStatus, pollFollowStatus, getUserId } from '../utils/followCheck'

const router = useRouter()
const statusText = ref('正在处理...')
const subText = ref('请稍候')
const isChecking = ref(true)
const isFollowed = ref(false)
const showActions = ref(false)
const progress = ref(0)
let stopPolling = null

onMounted(async () => {
  // 获取URL参数
  const urlParams = new URLSearchParams(window.location.search)
  const auth = urlParams.get('auth')
  const userId = urlParams.get('userId')
  
  // 清除URL参数
  window.history.replaceState({}, document.title, window.location.pathname)
  
  if (auth === 'success' && userId) {
    // 保存用户ID
    localStorage.setItem('ny_user_id', userId)
    statusText.value = '授权成功！'
    subText.value = '正在检测关注状态...'
    
    // 开始检测关注状态
    startChecking()
  } else {
    statusText.value = '授权失败'
    subText.value = '请返回首页重试'
    isChecking.value = false
    showActions.value = true
  }
})

onUnmounted(() => {
  if (stopPolling) {
    stopPolling()
  }
})

const startChecking = () => {
  // 模拟进度条
  const progressInterval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += 5
    }
  }, 300)
  
  // 先立即检测一次
  checkFollowStatus(true).then(status => {
    if (status) {
      clearInterval(progressInterval)
      progress.value = 100
      isFollowed.value = true
      statusText.value = '🎉 关注成功！'
      subText.value = '无限使用已解锁'
      isChecking.value = false
      showActions.value = true
      
      // 3秒后自动跳转
      setTimeout(() => {
        goHome()
      }, 2000)
    } else {
      // 开始轮询
      stopPolling = pollFollowStatus((status, isTimeout) => {
        clearInterval(progressInterval)
        progress.value = 100
        isFollowed.value = status
        isChecking.value = false
        showActions.value = true
        
        if (status) {
          statusText.value = '🎉 关注成功！'
          subText.value = '无限使用已解锁'
          // 3秒后自动跳转
          setTimeout(() => {
            goHome()
          }, 2000)
        } else if (isTimeout) {
          statusText.value = '检测超时'
          subText.value = '请确认是否已关注公众号，或点击重新检测'
        }
      }, 2000, 15)
    }
  })
}

const checkAgain = async () => {
  isChecking.value = true
  showActions.value = false
  progress.value = 0
  statusText.value = '正在检测...'
  subText.value = '请稍候'
  
  const status = await checkFollowStatus(true)
  isFollowed.value = status
  isChecking.value = false
  showActions.value = true
  
  if (status) {
    statusText.value = '🎉 关注成功！'
    subText.value = '无限使用已解锁'
    setTimeout(() => {
      goHome()
    }, 1500)
  } else {
    statusText.value = '未检测到关注'
    subText.value = '请确认已在微信中关注公众号'
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-container {
  text-align: center;
  max-width: 350px;
}

.spinner {
  font-size: 80px;
  animation: bounce 1s ease-in-out infinite;
  margin-bottom: 30px;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.1); }
}

h2 {
  color: #fff;
  font-size: 28px;
  margin-bottom: 15px;
}

.subtitle {
  color: #888;
  font-size: 16px;
  margin-bottom: 30px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 30px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #e74c3c, #f1c40f);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.btn-primary {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 16px 40px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.3);
  color: #aaa;
  padding: 14px 40px;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  border-color: #fff;
  color: #fff;
}
</style>
