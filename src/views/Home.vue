<template>
  <div class="home">
    <!-- 顶部跑马灯 -->
    <div class="marquee">
      <div class="marquee-content">
        🐴 马年大吉！已有 {{ userCount }} 人生成拜年图 🧧 关注公众号无限次免费使用 🎉
      </div>
    </div>

    <!-- 主视觉 -->
    <div class="hero">
      <div class="horse-animation">🐴</div>
      <h1 class="title">马到成功</h1>
      <p class="year">2026 丙午马年</p>
      <div class="subtitle">AI拜年神器 · 一键生成专属表情包</div>
    </div>

    <!-- 关注状态卡片 -->
    <div class="status-card" :class="{ 'followed': isFollowed, 'checking': isChecking }">
      <div class="status-icon">
        <span v-if="isChecking" class="loading">⏳</span>
        <span v-else>{{ isFollowed ? '✅' : '🔒' }}</span>
      </div>
      <div class="status-text">
        <h3 v-if="isChecking">正在检测关注状态...</h3>
        <h3 v-else>{{ isFollowed ? '无限使用已解锁' : '关注立享无限次制作！' }}</h3>
        <p v-if="!isChecking">{{ isFollowed ? '尊贵会员，畅玩所有功能' : '点击关注，立享无限次拜年神器制作！' }}</p>
      </div>
      <button class="btn-status" @click="isFollowed ? showFollowModal = true : handleFollow()" :disabled="isChecking">
        {{ isFollowed ? '查看权益' : (isChecking ? '检测中...' : '立即解锁') }}
      </button>
    </div>

    <!-- 关注成功提示 -->
    <transition name="fade">
      <div class="success-toast" v-if="showFollowSuccess">
        <div class="toast-content">
          <span class="icon">🎉</span>
          <span class="text">关注成功！无限使用已解锁</span>
        </div>
      </div>
    </transition>

    <!-- 功能入口 -->
    <div class="features">
      <div
          v-for="feature in features"
          :key="feature.id"
          class="feature-card"
          :class="{ featured: feature.featured }"
          @click="handleFeatureClick(feature)"
      >
        <div class="feature-icon">{{ feature.icon }}</div>
        <h3>{{ feature.name }}</h3>
        <p>{{ feature.desc }}</p>
        <span class="feature-tag" v-if="feature.hot">HOT</span>
        <span class="feature-tag featured" v-if="feature.featured">✨ 体验</span>
        <div class="lock-overlay" v-if="!isFollowed && feature.needFollow">
          <span>🔒</span>
        </div>
      </div>
    </div>

    <!-- 使用数据 -->
    <div class="stats-bar">
      <div class="stat">
        <span class="number">{{ stats.generated }}</span>
        <span class="label">已生成</span>
      </div>
      <div class="stat">
        <span class="number">{{ stats.shared }}</span>
        <span class="label">已分享</span>
      </div>
      <div class="stat">
        <span class="number">{{ stats.users }}</span>
        <span class="label">用户数</span>
      </div>
    </div>

    <!-- 关注弹窗 -->
    <FollowModal
        :show="showFollowModal"
        :isFollowed="isFollowed"
        @close="showFollowModal = false"
        @follow="handleFollow"
        @use="handleUse"
    />

    <!-- 底部提示 -->
    <div class="footer-tip">
      <p>💡 提示：关注公众号后返回本页面，自动解锁无限使用</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import FollowModal from '../components/FollowModal.vue'
import { 
  initFollowStatus, 
  checkFollowStatus, 
  pollFollowStatus,
  goToWechatAuth,
  openFollowPage,
  isWechatBrowser,
  checkReturnFromFollow,
  clearFollowClick,
  getWechatAuthUrl
} from '../utils/followCheck'

const router = useRouter()
const isFollowed = ref(false)
const showFollowModal = ref(false)
const isChecking = ref(false)
const showFollowSuccess = ref(false)
const userCount = ref(8234)
let stopPolling = null

const features = [
  { id: 1, name: '🎨 马年头像框', icon: '🐴', desc: '专属头像框', path: '/avatar', needFollow: false, hot: true, featured: true },
  { id: 2, name: '🔮 运势测试', icon: '🔮', desc: '测测你的马年运势', path: '/horoscope', needFollow: false },
  { id: 3, name: 'AI拜年生成', icon: '📸', desc: '上传照片生成', path: '/generator', needFollow: false },
  { id: 4, name: '🧧 红包封面', icon: '🎁', desc: '马年限定红包', path: '/redpacket', needFollow: false },
  { id: 5, name: '在线烟花', icon: '🎆', desc: '许愿放烟花', path: '/firework', needFollow: false },
  { id: 6, name: '领取祝福', icon: '🧧', desc: '马年吉祥话', path: '/blessing', needFollow: false }
]

const stats = ref({
  generated: 12847,
  shared: 5632,
  users: 8234
})

onMounted(async () => {
  // 先检查本地缓存，避免每次都显示检测中
  const localStatus = localStorage.getItem('ny_follow_status')
  if (localStatus === 'true') {
    // 本地已标记关注，直接显示
    isFollowed.value = true
  }

  // 检查是否刚从关注页面返回
  if (checkReturnFromFollow()) {
    // 开始轮询检测关注状态
    startPollingCheck()
  } else {
    // 正常页面加载，静默检测状态
    isChecking.value = !isFollowed.value // 只有未关注时才显示检测中
    const status = await checkFollowStatus()
    isFollowed.value = status
    isChecking.value = false
  }

  // 模拟实时数据更新
  setInterval(() => {
    stats.value.generated += Math.floor(Math.random() * 3)
  }, 5000)
})

onUnmounted(() => {
  // 清理轮询
  if (stopPolling) {
    stopPolling()
  }
})

// 开始轮询检测关注状态
const startPollingCheck = () => {
  isChecking.value = true
  
  stopPolling = pollFollowStatus((status, isTimeout) => {
    isChecking.value = false
    isFollowed.value = status
    
    if (status) {
      // 关注成功，保存到本地
      localStorage.setItem('ny_follow_status', 'true')
      localStorage.setItem('ny_quota', '9999')
      clearFollowClick()
      showFollowSuccess.value = true
      // 3秒后关闭成功提示
      setTimeout(() => {
        showFollowSuccess.value = false
      }, 3000)
    } else if (isTimeout) {
      // 检测超时，显示弹窗让用户手动确认
      showFollowModal.value = true
    }
  }, 3000, 20) // 每3秒检测一次，最多20次
}

const handleFeatureClick = (feature) => {
  // 所有功能都可以直接使用，无需强制关注
  if (feature.path) {
    router.push(feature.path)
  }
}

const handleFollow = async () => {
  console.log('用户点击关注')
  
  // 判断是否在微信环境
  if (isWechatBrowser()) {
    // 在微信中，尝试获取授权链接
    try {
      const authUrl = await getWechatAuthUrl()
      if (authUrl) {
        window.location.href = authUrl
        return
      }
    } catch (e) {
      console.error('获取授权链接失败:', e)
    }
    // 授权链接获取失败，直接打开关注页面
    openFollowPage()
  } else {
    // 非微信环境，直接打开关注页面
    openFollowPage()
  }
}

const handleUse = () => {
  showFollowModal.value = false
  router.push('/generator')
}

// 刷新关注状态
const refreshFollowStatus = async () => {
  isChecking.value = true
  isFollowed.value = await checkFollowStatus(true)
  isChecking.value = false
  
  if (isFollowed.value) {
    showFollowSuccess.value = true
    setTimeout(() => {
      showFollowSuccess.value = false
    }, 2000)
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
  padding-bottom: 40px;
}

.marquee {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
  color: #FFD700;
  padding: 10px 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
  font-weight: bold;
}

.marquee-content {
  display: inline-block;
  animation: marquee 15s linear infinite;
  padding-left: 100%;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

.hero {
  text-align: center;
  padding: 40px 20px;
  position: relative;
}

.horse-animation {
  font-size: 100px;
  animation: gallop 1s ease-in-out infinite;
  display: inline-block;
  margin-bottom: 10px;
}

@keyframes gallop {
  0%, 100% { transform: translateX(0) scaleX(1); }
  25% { transform: translateX(-10px) scaleX(1); }
  50% { transform: translateX(0) scaleX(1); }
  75% { transform: translateX(10px) scaleX(1); }
}

.title {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 5px;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.year {
  color: #e74c3c;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.subtitle {
  color: #aaa;
  font-size: 16px;
}

.status-card {
  margin: 0 20px 30px;
  background: rgba(231, 76, 60, 0.1);
  border: 2px solid #e74c3c;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s;
}

.status-card.followed {
  background: rgba(39, 174, 96, 0.1);
  border-color: #27ae60;
}

.status-icon {
  font-size: 40px;
}

.status-text {
  flex: 1;
}

.status-text h3 {
  color: #fff;
  font-size: 18px;
  margin-bottom: 5px;
}

.status-text p {
  color: #aaa;
  font-size: 14px;
}

.btn-status {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}

.followed .btn-status {
  background: #27ae60;
}

.features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 0 20px;
  margin-bottom: 30px;
}

.feature-card {
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 25px 15px;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-5px);
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,215,0,0.3);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.feature-card h3 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 5px;
}

.feature-card p {
  color: #888;
  font-size: 13px;
}

.feature-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #e74c3c;
  color: white;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.feature-card.featured {
  border-color: #FFD700;
  box-shadow: 0 10px 30px rgba(255, 215, 0, 0.2);
}

.feature-tag.featured {
  background: #FFD700;
  color: #1a1a2e;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background: rgba(255,255,255,0.03);
  margin: 0 20px 20px;
  border-radius: 12px;
}

.stat {
  text-align: center;
}

.number {
  display: block;
  color: #FFD700;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.label {
  color: #666;
  font-size: 12px;
}

.footer-tip {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 13px;
}

.footer-tip p {
  background: rgba(255,255,255,0.05);
  display: inline-block;
  padding: 10px 20px;
  border-radius: 20px;
}

/* 加载动画 */
.loading {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 检查中状态 */
.status-card.checking {
  background: rgba(241, 196, 15, 0.1);
  border-color: #f1c40f;
}

/* 成功提示 Toast */
.success-toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  animation: slideDown 0.3s ease;
}

.toast-content {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  padding: 15px 25px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 30px rgba(39, 174, 96, 0.4);
}

.toast-content .icon {
  font-size: 24px;
}

.toast-content .text {
  font-size: 16px;
  font-weight: bold;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
