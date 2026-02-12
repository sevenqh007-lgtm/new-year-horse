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
      <p class="year">2025 乙巳马年</p>
      <div class="subtitle">AI拜年神器 · 一键生成专属表情包</div>
    </div>

    <!-- 关注状态卡片 -->
    <div class="status-card" :class="{ 'followed': isFollowed }">
      <div class="status-icon">{{ isFollowed ? '✅' : '🔒' }}</div>
      <div class="status-text">
        <h3>{{ isFollowed ? '无限使用已解锁' : '关注立享无限次制作！' }}</h3>
        <p>{{ isFollowed ? '尊贵会员，畅玩所有功能' : '点击关注，立享无限次拜年神器制作！' }}</p>
      </div>
      <button class="btn-status" @click="showFollowModal = true">
        {{ isFollowed ? '查看权益' : '立即解锁' }}
      </button>
    </div>

    <!-- 功能入口 -->
    <div class="features">
      <div
          v-for="feature in features"
          :key="feature.id"
          class="feature-card"
          @click="handleFeatureClick(feature)"
      >
        <div class="feature-icon">{{ feature.icon }}</div>
        <h3>{{ feature.name }}</h3>
        <p>{{ feature.desc }}</p>
        <span class="feature-tag" v-if="feature.hot">HOT</span>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FollowModal from '../components/FollowModal.vue'
import { checkFollowStatus } from '../utils/followCheck'

const router = useRouter()
const isFollowed = ref(false)
const showFollowModal = ref(false)
const userCount = ref(8234)

const features = [
  { id: 1, name: '领取祝福', icon: '🧧', desc: '马年吉祥话', path: '/blessing', needFollow: false },
  { id: 2, name: '在线烟花', icon: '🎆', desc: '许愿放烟花', path: '/firework', needFollow: false },
  { id: 3, name: 'AI拜年生成', icon: '📸', desc: '上传照片生成', path: '/generator', needFollow: false, hot: true },
  { id: 4, name: '分享好友', icon: '📤', desc: '邀请好友', path: '/share', needFollow: false }
]

const stats = ref({
  generated: 12847,
  shared: 5632,
  users: 8234
})

onMounted(async () => {
  // 检测关注状态
  isFollowed.value = await checkFollowStatus()

  // 检查是否刚从关注页面返回
  const followClick = localStorage.getItem('ny_follow_click')
  if (followClick) {
    const timeDiff = Date.now() - parseInt(followClick)
    if (timeDiff < 60000) { // 1分钟内返回，认为是刚关注
      setTimeout(async () => {
        isFollowed.value = true
        localStorage.setItem('ny_follow_status', 'true')
        localStorage.setItem('ny_quota', '9999')
        localStorage.removeItem('ny_follow_click')
        showFollowModal.value = true
      }, 1000)
    }
  }

  // 模拟实时数据更新
  setInterval(() => {
    stats.value.generated += Math.floor(Math.random() * 3)
  }, 5000)
})

const handleFeatureClick = (feature) => {
  // 强制关注已关闭，所有功能都可以直接使用
  if (feature.path) {
    router.push(feature.path)
  }
}

const handleFollow = () => {
  console.log('用户点击关注')
}

const handleUse = () => {
  showFollowModal.value = false
  router.push('/generator')
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
</style>
