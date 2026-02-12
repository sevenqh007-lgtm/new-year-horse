<template>
  <div class="redpacket-cover">
    <!-- 顶部跑马灯 -->
    <div class="marquee">
      <div class="marquee-content">
        🧧 新年限定红包封面 · 已有 {{ stats.claimed }} 人领取 · 今日发放：{{ stats.todayClaimed }} 个
      </div>
    </div>

    <!-- 主视觉区 -->
    <div class="hero">
      <div class="cover-preview">
        <div class="cover-base" :style="{ backgroundImage: `url(${selectedCover.image})` }">
          <div class="cover-text">
            <div class="cover-wish">{{ selectedCover.wish }}</div>
            <div class="cover-name">{{ form.name || '你的名字' }}</div>
          </div>
          <div class="cover-decoration" v-if="selectedCover.hasDecoration">
            <span class="deco-item">🐴</span>
            <span class="deco-item">✨</span>
            <span class="deco-item">🧧</span>
          </div>
        </div>
        <div class="cover-badge" :class="selectedCover.rarity">{{ selectedCover.rarityText }}</div>
      </div>

      <h1 class="title">2026马年限定红包封面</h1>
      <p class="subtitle">免费领取 · 马年专属 · 限量发行</p>

      <div class="social-proof">
        <span class="proof-item">🔥 {{ formatNumber(stats.claimed) }}人已领取</span>
        <span class="proof-item">⏰ 限时限量</span>
        <span class="proof-item">🎁 免费</span>
      </div>
    </div>

    <!-- 封面选择 -->
    <div class="covers-section">
      <h3 class="section-title">🎨 选择你的马年封面</h3>
      <div class="covers-grid">
        <div
          v-for="(cover, index) in covers"
          :key="index"
          class="cover-item"
          :class="{ selected: selectedCoverIndex === index, locked: cover.locked }"
          @click="selectCover(index)"
        >
          <div class="cover-thumb">
            <img :src="cover.image" :alt="cover.name" />
            <div class="thumb-text">{{ cover.wish }}</div>
            <div class="thumb-rarity" :class="cover.rarity">{{ cover.rarityText }}</div>
          </div>
          <div class="cover-info">
            <div class="cover-name-text">{{ cover.name }}</div>
            <div class="cover-meta">
              <span v-if="cover.locked" class="meta-locked">🔒 需关注解锁</span>
              <span v-else class="meta-free">✅ 可领取</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义区域 -->
    <div class="custom-section">
      <h3 class="section-title">✏️ 自定义祝福语</h3>
      <div class="input-group">
        <input
          v-model="form.wish"
          type="text"
          placeholder="输入你的专属祝福语"
          maxlength="12"
          class="wish-input"
          @input="updatePreview"
        />
        <div class="char-count">{{ form.wish.length }}/12</div>
      </div>

      <div class="quick-wishes">
        <span
          v-for="wish in quickWishes"
          :key="wish"
          class="quick-wish-tag"
          @click="form.wish = wish; updatePreview()"
        >
          {{ wish }}
        </span>
      </div>
    </div>

    <!-- 名字输入 -->
    <div class="name-section">
      <h3 class="section-title">👤 您的名字</h3>
      <input
        v-model="form.name"
        type="text"
        placeholder="输入您的名字"
        maxlength="8"
        class="name-input"
        @input="updatePreview"
      />
    </div>

    <!-- 领取按钮 -->
    <div class="action-section">
      <button
        v-if="!isClaimed"
        class="btn-claim"
        :disabled="!canClaim || isClaiming"
        @click="handleClaim"
      >
        <span v-if="isClaiming" class="btn-loading">⏳ 正在生成...</span>
        <span v-else-if="selectedCover.locked && !isFollowed" class="btn-content">
          <span class="btn-icon">🔓</span>
          <span class="btn-text">关注后领取</span>
        </span>
        <span v-else class="btn-content">
          <span class="btn-icon">🧧</span>
          <span class="btn-text">立即领取</span>
        </span>
      </button>

      <button
        v-else
        class="btn-download"
        @click="handleDownload"
      >
        <span class="btn-icon">📥</span>
        <span class="btn-text">下载封面</span>
      </button>

      <p class="tip">
        {{ selectedCover.locked && !isFollowed
          ? '💡 关注公众号可解锁全部限量封面'
          : '💡 领取后可在微信钱包中找到'
        }}
      </p>
    </div>

    <!-- 领取成功 -->
    <div v-if="isClaimed" class="success-card">
      <h3>🎉 领取成功！</h3>
      <p class="success-desc">
        您的马年限定红包封面已生成<br>
        可以在发送红包时选择使用
      </p>
      <div class="success-actions">
        <button class="btn-share" @click="shareCover">
          <span class="btn-icon">📤</span>
          <span class="btn-text">分享给好友</span>
        </button>
        <button class="btn-get-more" @click="reset">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">再领一个</span>
        </button>
      </div>
    </div>

    <!-- 活动说明 -->
    <div class="info-section">
      <h3 class="section-title">📝 活动说明</h3>
      <div class="info-card">
        <ul class="info-list">
          <li>✅ 完全免费，无需任何费用</li>
          <li>✅ 2026马年限定设计</li>
          <li>✅ 可在微信红包中使用</li>
          <li>✅ 自定义祝福语和名字</li>
          <li>✅ 多种封面可选</li>
          <li>✅ 关注解锁更多稀有封面</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { isWechatBrowser, markAsFollowed, checkFollowStatus } from '../utils/followCheck'

// 统计数据
const stats = ref({
  claimed: 15678,
  todayClaimed: 892
})

// 表单数据
const form = ref({
  name: '',
  wish: '马年大吉'
})

// 状态
const isClaiming = ref(false)
const isClaimed = ref(false)
const isFollowed = ref(localStorage.getItem('ny_follow_status') === 'true')
const selectedCoverIndex = ref(0)

// 快捷祝福语
const quickWishes = [
  '马年大吉',
  '马到成功',
  '一马当先',
  '龙马精神',
  '马上有钱',
  '万马奔腾'
]

// 封面数据
const covers = ref([
  {
    id: 1,
    name: '马到成功',
    wish: '马到成功',
    rarity: 'common',
    rarityText: '普通',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZGQjMyMyIvPjx0ZXh0IHg9IjUwJSIgeT0iMzAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjRkZEMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5OhPC90ZXh0Pjwvc3ZnPg==',
    hasDecoration: true,
    locked: false
  },
  {
    id: 2,
    name: '金马呈祥',
    wish: '金马呈祥',
    rarity: 'common',
    rarityText: '普通',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZGRDcwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iMzAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjRkZDNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5OhPC90ZXh0Pjwvc3ZnPg==',
    hasDecoration: true,
    locked: false
  },
  {
    id: 3,
    name: '龙马精神',
    wish: '龙马精神',
    rarity: 'rare',
    rarityText: '稀有',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzkwQjQ0NCIvPjx0ZXh0IHg9IjUwJSIgeT0iMzAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjRkZEMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5OhPC90ZXh0Pjwvc3ZnPg==',
    hasDecoration: true,
    locked: false
  },
  {
    id: 4,
    name: '万马奔腾',
    wish: '万马奔腾',
    rarity: 'rare',
    rarityText: '稀有',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0NDQzQwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iMzAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjRkZCNzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5OhPC90ZXh0Pjwvc3ZnPg==',
    hasDecoration: true,
    locked: false
  },
  {
    id: 5,
    name: '马年财运',
    wish: '马年财运',
    rarity: 'epic',
    rarityText: '传说',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzY2MjQyMiIvPjx0ZXh0IHg9IjUwJSIgeT0iMzAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjRkZEMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5OhPC90ZXh0Pjwvc3ZnPg==',
    hasDecoration: true,
    locked: true
  },
  {
    id: 6,
    name: '天马行空',
    wish: '天马行空',
    rarity: 'epic',
    rarityText: '传说',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzQwMDA3MyIvPjx0ZXh0IHg9IjUwJSIgeT0iMzAlIiBmb250LXNpemU9IjQwIiBmaWxsPSIjRkZEMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5OhPC90ZXh0Pjwvc3ZnPg==',
    hasDecoration: true,
    locked: true
  }
])

// 当前选中的封面
const selectedCover = computed(() => covers.value[selectedCoverIndex.value])

// 是否可以领取
const canClaim = computed(() => {
  return form.value.name.trim().length > 0 &&
         (isFollowed.value || !selectedCover.value.locked)
})

// 格式化数字
const formatNumber = (num) => {
  return num.toLocaleString()
}

// 选择封面
const selectCover = (index) => {
  const cover = covers.value[index]
  if (cover.locked && !isFollowed.value) {
    alert('关注公众号可解锁此稀有封面！')
    return
  }
  selectedCoverIndex.value = index
  form.value.wish = cover.wish
}

// 更新预览
const updatePreview = () => {
  // 可以在这里实现实时预览更新
}

// 领取封面
const handleClaim = async () => {
  if (!canClaim.value) return

  // 如果选择了锁定封面且未关注
  if (selectedCover.value.locked && !isFollowed.value) {
    const isWechat = isWechatBrowser()
    if (isWechat) {
      markAsFollowed()
      window.location.href = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=gh_d8c2ff4637f8==&scene=126#wechat_redirect'
    } else {
      alert('请使用微信访问以解锁稀有封面')
    }
    return
  }

  isClaiming.value = true

  // 模拟生成过程
  await new Promise(resolve => setTimeout(resolve, 1500))

  isClaiming.value = false
  isClaimed.value = true

  // 更新统计
  stats.value.claimed++
  stats.value.todayClaimed++
}

// 下载封面
const handleDownload = () => {
  alert('封面已保存到相册，发送红包时选择使用即可！')
}

// 分享封面
const shareCover = () => {
  const text = `🧧 我的2026马年限定红包封面已领取！\n✨ 祝福语：${form.value.wish}\n\n快来领取你的专属封面 👇\n${window.location.href}`

  if (navigator.share) {
    navigator.share({
      title: '2026马年限定红包封面',
      text: text,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(text)
    alert('分享文案已复制，去粘贴分享吧！')
  }
}

// 重置
const reset = () => {
  isClaimed.value = false
  form.value.name = ''
  selectedCoverIndex.value = 0
}

onMounted(() => {
  // 模拟实时统计更新
  setInterval(() => {
    stats.value.claimed += Math.floor(Math.random() * 3)
  }, 15000)

  // 检查关注状态
  checkFollowStatus().then(status => {
    isFollowed.value = status
  })
})
</script>

<style scoped>
.redpacket-cover {
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
  font-size: 13px;
  font-weight: bold;
}

.marquee-content {
  display: inline-block;
  animation: marquee 20s linear infinite;
  padding-left: 100%;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

.hero {
  text-align: center;
  padding: 30px 20px;
}

.cover-preview {
  position: relative;
  width: 200px;
  height: 300px;
  margin: 0 auto 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(255, 215, 0, 0.2);
}

.cover-base {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cover-text {
  text-align: center;
  color: white;
  z-index: 2;
}

.cover-wish {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.cover-name {
  font-size: 14px;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.cover-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.deco-item {
  position: absolute;
  font-size: 20px;
  animation: float 3s ease-in-out infinite;
}

.deco-item:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
.deco-item:nth-child(2) { top: 10%; right: 10%; animation-delay: 1s; }
.deco-item:nth-child(3) { bottom: 10%; right: 20%; animation-delay: 2s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.cover-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.cover-badge.common { background: #666; }
.cover-badge.rare { background: linear-gradient(135deg, #3498db, #2980b9); }
.cover-badge.epic { background: linear-gradient(135deg, #f1c40f, #e74c3c); }

.title {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #e74c3c, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.subtitle {
  color: #888;
  font-size: 14px;
  margin-bottom: 15px;
}

.social-proof {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.proof-item {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 6px 12px;
  border-radius: 16px;
  color: #FFD700;
  font-size: 12px;
}

.covers-section,
.custom-section,
.name-section,
.action-section,
.info-section {
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
}

.section-title {
  color: #fff;
  font-size: 18px;
  margin-bottom: 15px;
}

.covers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.cover-item {
  cursor: pointer;
  transition: all 0.3s;
}

.cover-item.selected {
  transform: scale(1.05);
}

.cover-item.selected .cover-thumb {
  border-color: #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

.cover-item.locked {
  opacity: 0.6;
}

.cover-thumb {
  aspect-ratio: 2/3;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 3px solid transparent;
  transition: all 0.3s;
  background: #2a2a4a;
}

.cover-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  text-align: center;
}

.thumb-rarity {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  color: white;
  font-weight: bold;
}

.thumb-rarity.common { background: #666; }
.thumb-rarity.rare { background: #3498db; }
.thumb-rarity.epic { background: linear-gradient(135deg, #f1c40f, #e74c3c); }

.cover-info {
  text-align: center;
  margin-top: 6px;
}

.cover-name-text {
  color: #fff;
  font-size: 13px;
  margin-bottom: 3px;
}

.cover-meta {
  font-size: 11px;
}

.meta-locked {
  color: #e74c3c;
}

.meta-free {
  color: #27ae60;
}

.input-group {
  position: relative;
  margin-bottom: 10px;
}

.wish-input,
.name-input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 16px;
  transition: all 0.3s;
}

.wish-input:focus,
.name-input:focus {
  outline: none;
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.05);
}

.char-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 12px;
}

.quick-wishes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-wish-tag {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 6px 12px;
  border-radius: 16px;
  color: #FFD700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-wish-tag:hover {
  background: rgba(255, 215, 0, 0.2);
}

.btn-claim,
.btn-download {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-claim {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.btn-download {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
}

.btn-claim:disabled,
.btn-download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-claim:hover:not(:disabled),
.btn-download:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
}

.btn-icon {
  font-size: 24px;
}

.btn-loading {
  font-size: 16px;
}

.tip {
  text-align: center;
  color: #666;
  font-size: 13px;
  margin-top: 12px;
}

.success-card {
  max-width: 400px;
  margin: 20px auto;
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.2), rgba(39, 174, 96, 0.05));
  border: 2px solid #27ae60;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.success-card h3 {
  color: #27ae60;
  font-size: 20px;
  margin-bottom: 10px;
}

.success-desc {
  color: #fff;
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 20px;
}

.success-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-share,
.btn-get-more {
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.btn-share {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.btn-get-more {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #888;
}

.info-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  color: #aaa;
  font-size: 14px;
  line-height: 2;
}
</style>
