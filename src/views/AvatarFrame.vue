<template>
  <div class="avatar-frame">
    <!-- 顶部统计栏 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-icon">🐴</span>
        <span class="stat-number">{{ formatNumber(stats.totalUsers) }}</span>
        <span class="stat-label">人已使用</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🎨</span>
        <span class="stat-number">{{ formatNumber(stats.todayFrames) }}</span>
        <span class="stat-label">今日生成</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🔥</span>
        <span class="stat-number">{{ formatNumber(stats.hotFrame) }}</span>
        <span class="stat-label">最热头像框</span>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：头像预览区 -->
      <div class="preview-section">
        <div class="preview-card">
          <div class="preview-header">
            <span class="preview-badge">实时预览</span>
            <div class="preview-actions">
              <button class="action-btn" @click="toggleFullscreen" title="全屏预览">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M4 4h16v16H4zM4 4V2M16 4V2M4 4H2M16 4h2M4 4l16 0M4 4v16M16 4v16M4 20h16M4 20v2M16 20v2M4 20H2M16 20h2" stroke-width="2"/>
                </svg>
              </button>
              <button class="action-btn" @click="downloadAvatar" title="下载头像">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M10 2v14M4 10l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="4" y="16" width="12" height="2" stroke-width="2"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="preview-container" :class="{ fullscreen: isFullscreen }">
            <canvas ref="previewCanvas" class="preview-canvas"></canvas>

            <!-- 加载动画 -->
            <div v-if="isGenerating" class="loading-overlay">
              <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
              </div>
              <p class="loading-text">正在生成头像...</p>
            </div>
          </div>

          <!-- 底部提示 -->
          <div class="preview-tip">
            <span class="tip-icon">💡</span>
            <span class="tip-text">上传正方形照片效果最佳</span>
          </div>
        </div>

        <!-- 上传区域 -->
        <div class="upload-section">
          <div
            class="upload-zone"
            :class="{ 'has-image': avatarImage, 'drag-over': isDragOver }"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleDrop"
            @click="triggerUpload"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              style="display: none"
            />

            <div v-if="!avatarImage" class="upload-placeholder">
              <div class="upload-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 32v-10M24 22l-7 7M24 22l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <p class="upload-text">点击或拖拽上传照片</p>
              <p class="upload-hint">支持 JPG、PNG 格式</p>
            </div>

            <div v-else class="upload-preview">
              <img :src="avatarImage" alt="头像预览" class="upload-thumb" />
              <div class="upload-overlay">
                <span class="overlay-text">点击更换照片</span>
              </div>
            </div>
          </div>

          <button class="btn-camera" @click="takePhoto" v-if="isMobile">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path d="M10 8a2 2 0 100-4 2 2 0 000 4z" stroke-width="1.5"/>
              <path d="M2 8a2 2 0 012-2h2l2-3h4l2 3h2a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>拍照</span>
          </button>
        </div>
      </div>

      <!-- 右侧：头像框选择区 -->
      <div class="frames-section">
        <div class="frames-header">
          <h2 class="section-title">选择头像框</h2>
          <div class="filter-tabs">
            <button
              v-for="tab in filterTabs"
              :key="tab.value"
              class="filter-tab"
              :class="{ active: activeFilter === tab.value }"
              @click="activeFilter = tab.value"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
              <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
            </button>
          </div>
        </div>

        <div class="frames-grid">
          <div
            v-for="(frame, index) in filteredFrames"
            :key="frame.id"
            class="frame-card"
            :class="{
              selected: selectedFrameId === frame.id,
              locked: frame.locked && !isFollowed
            }"
            @click="selectFrame(frame)"
          >
            <div class="frame-preview">
              <img :src="frame.preview" :alt="frame.name" />
              <div class="frame-overlay">
                <div v-if="frame.locked && !isFollowed" class="lock-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div v-if="selectedFrameId === frame.id" class="selected-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
              <div class="frame-badge" :class="frame.rarity">
                {{ frame.rarityText }}
              </div>
            </div>
            <div class="frame-info">
              <h3 class="frame-name">{{ frame.name }}</h3>
              <p class="frame-desc">{{ frame.desc }}</p>
              <div class="frame-meta">
                <span v-if="frame.locked && !isFollowed" class="meta-locked">
                  <span class="meta-icon">🔒</span>
                  需关注解锁
                </span>
                <span v-else-if="frame.isNew" class="meta-new">
                  <span class="meta-icon">✨</span>
                  新品
                </span>
                <span v-else class="meta-free">
                  <span class="meta-icon">✅</span>
                  免费
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作区 -->
        <div class="actions-section">
          <button
            v-if="selectedFrame && avatarImage"
            class="btn-primary"
            :disabled="isGenerating || (selectedFrame.locked && !isFollowed)"
            @click="generateAvatar"
          >
            <span v-if="isGenerating" class="btn-content">
              <span class="btn-spinner"></span>
              <span class="btn-text">生成中...</span>
            </span>
            <span v-else-if="selectedFrame.locked && !isFollowed" class="btn-content">
              <span class="btn-icon">🔓</span>
              <span class="btn-text">关注解锁</span>
            </span>
            <span v-else class="btn-content">
              <span class="btn-icon">🎨</span>
              <span class="btn-text">生成头像</span>
            </span>
          </button>

          <div v-if="generatedImage" class="success-actions">
            <button class="btn-secondary" @click="downloadAvatar">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                <path d="M9 14V3M4 8l5 6 5-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="4" y="15" width="10" height="2" stroke-width="2"/>
              </svg>
              下载头像
            </button>
            <button class="btn-secondary" @click="shareAvatar">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                <circle cx="9" cy="9" r="8" stroke-width="2"/>
                <path d="M9 12v-1M9 8h.01" stroke-width="2" stroke-linecap="round"/>
              </svg>
              分享好友
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 全屏预览弹窗 -->
    <transition name="fade">
      <div v-if="isFullscreen" class="fullscreen-modal" @click="toggleFullscreen">
        <img :src="generatedImage || avatarImage" alt="全屏预览" class="fullscreen-image" />
        <button class="btn-close-fullscreen" @click.stop="toggleFullscreen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </transition>

    <!-- 引导提示 -->
    <transition name="slide-up">
      <div v-if="showGuide" class="guide-toast">
        <div class="guide-content">
          <div class="guide-icon">🎉</div>
          <div class="guide-text">
            <h4>恭喜！头像已生成</h4>
            <p>点击"下载头像"保存，然后在微信中设置新头像</p>
          </div>
          <button class="btn-guide-close" @click="showGuide = false">
            知道了
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { checkFollowStatus, isWechatBrowser } from '../utils/followCheck'

// 状态管理
const stats = ref({
  totalUsers: 23456,
  todayFrames: 1892,
  hotFrame: 8765
})

const isDragOver = ref(false)
const isGenerating = ref(false)
const isFullscreen = ref(false)
const isMobile = ref(/Mobile|Android|iPhone/i.test(navigator.userAgent))
const isFollowed = ref(false)
const showGuide = ref(false)

const avatarImage = ref(null)
const generatedImage = ref(null)
const selectedFrameId = ref(1)
const activeFilter = ref('all')

const fileInput = ref(null)
const previewCanvas = ref(null)

// 头像框数据
const frames = ref([
  {
    id: 1,
    name: '马年到啦',
    desc: '经典马年主题，简约大气',
    rarity: 'common',
    rarityText: '免费',
    preview: generateFramePreview('#FFD700', '#e74c3c'),
    color: '#FFD700',
    locked: false,
    isNew: true
  },
  {
    id: 2,
    name: '马年大吉',
    desc: '传统红色喜庆风格',
    rarity: 'common',
    rarityText: '免费',
    preview: generateFramePreview('#e74c3c', '#c0392b'),
    color: '#e74c3c',
    locked: false,
    isNew: false
  },
  {
    id: 3,
    name: '一马当先',
    desc: '金色奢华风格',
    rarity: 'common',
    rarityText: '免费',
    preview: generateFramePreview('#FFD700', '#FFA500'),
    color: '#FFD700',
    locked: false,
    isNew: false
  },
  {
    id: 4,
    name: '龙马精神',
    desc: '马年限定稀有款',
    rarity: 'rare',
    rarityText: '稀有',
    preview: generateFramePreview('#3498db', '#2980b9'),
    color: '#3498db',
    locked: true,
    isNew: true
  },
  {
    id: 5,
    name: '马到成功',
    desc: '成功人士专属',
    rarity: 'rare',
    rarityText: '稀有',
    preview: generateFramePreview('#27ae60', '#1e8449'),
    color: '#27ae60',
    locked: true,
    isNew: false
  },
  {
    id: 6,
    name: '马年财运',
    desc: '招财进宝传说款',
    rarity: 'epic',
    rarityText: '传说',
    preview: generateFramePreview('#f1c40f', '#d68910'),
    color: '#f1c40f',
    locked: true,
    isNew: true
  },
  {
    id: 7,
    name: '天马行空',
    desc: '星空梦幻传说款',
    rarity: 'epic',
    rarityText: '传说',
    preview: generateFramePreview('#9b59b6', '#8e44ad'),
    color: '#9b59b6',
    locked: true,
    isNew: false
  },
  {
    id: 8,
    name: '万马奔腾',
    desc: '限量限定传说款',
    rarity: 'epic',
    rarityText: '传说',
    preview: generateFramePreview('#e67e22', '#d35400'),
    color: '#e67e22',
    locked: true,
    isNew: true
  }
])

// 筛选标签
const filterTabs = computed(() => [
  { label: '全部', value: 'all', icon: '🎨', count: frames.value.length },
  { label: '免费', value: 'free', icon: '✅', count: frames.value.filter(f => !f.locked).length },
  { label: '稀有', value: 'rare', icon: '💎', count: frames.value.filter(f => f.locked).length }
])

// 筛选后的头像框
const filteredFrames = computed(() => {
  if (activeFilter.value === 'all') return frames.value
  if (activeFilter.value === 'free') return frames.value.filter(f => !f.locked)
  if (activeFilter.value === 'rare') return frames.value.filter(f => f.locked)
  return frames.value
})

// 选中的头像框
const selectedFrame = computed(() => frames.value.find(f => f.id === selectedFrameId.value))

// 生成头像框预览图
function generateFramePreview(primaryColor, secondaryColor) {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const ctx = canvas.getContext('2d')

  // 绘制渐变背景
  const gradient = ctx.createLinearGradient(0, 0, 200, 200)
  gradient.addColorStop(0, primaryColor)
  gradient.addColorStop(1, secondaryColor)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 200, 200)

  // 绘制边框
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, 192, 192)

  // 添加马图标
  ctx.font = '80px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🐴', 100, 100)

  return canvas.toDataURL()
}

// 格式化数字
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

// 触发文件上传
function triggerUpload() {
  fileInput.value?.click()
}

// 处理文件选择
function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

// 处理拖拽
function handleDrop(event) {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
  }
}

// 处理文件
function processFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('请上传图片文件')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过5MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    avatarImage.value = e.target.result
    generatedImage.value = null
    nextTick(() => {
      drawPreview()
    })
  }
  reader.readAsDataURL(file)
}

// 拍照
function takePhoto() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
  }
  input.click()
}

// 选择头像框
function selectFrame(frame) {
  if (frame.locked && !isFollowed.value) {
    const isWechat = isWechatBrowser()
    if (isWechat) {
      if (confirm('关注公众号可解锁此稀有头像框，是否前往关注？')) {
        window.location.href = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=gh_d8c2ff4637f8==&scene=126#wechat_redirect'
      }
    } else {
      alert('请使用微信访问以解锁稀有头像框')
    }
    return
  }

  selectedFrameId.value = frame.id
  nextTick(() => {
    drawPreview()
  })
}

// 绘制预览
function drawPreview() {
  const canvas = previewCanvas.value
  if (!canvas || !avatarImage.value) return

  const ctx = canvas.getContext('2d')
  const size = 400

  canvas.width = size
  canvas.height = size

  // 绘制头像
  const img = new Image()
  img.onload = () => {
    // 居中裁剪为正方形
    const minSide = Math.min(img.width, img.height)
    const x = (img.width - minSide) / 2
    const y = (img.height - minSide) / 2

    ctx.drawImage(img, x, y, minSide, minSide, 0, 0, size, size)

    // 添加头像框
    if (selectedFrame.value) {
      drawFrame(ctx, size, selectedFrame.value)
    }
  }
  img.src = avatarImage.value
}

// 绘制头像框
function drawFrame(ctx, size, frame) {
  const padding = 20
  const frameSize = size - padding * 2

  // 绘制边框
  ctx.strokeStyle = frame.color
  ctx.lineWidth = 8
  ctx.shadowColor = frame.color
  ctx.shadowBlur = 10
  ctx.strokeRect(padding, padding, frameSize, frameSize)
  ctx.shadowBlur = 0

  // 添加角落装饰
  const cornerSize = 30
  ctx.fillStyle = frame.color

  // 左上角
  ctx.beginPath()
  ctx.moveTo(padding, padding + cornerSize)
  ctx.lineTo(padding, padding)
  ctx.lineTo(padding + cornerSize, padding)
  ctx.lineTo(padding, padding + cornerSize)
  ctx.fill()

  // 右上角
  ctx.beginPath()
  ctx.moveTo(size - padding - cornerSize, padding)
  ctx.lineTo(size - padding, padding)
  ctx.lineTo(size - padding, padding + cornerSize)
  ctx.lineTo(size - padding - cornerSize, padding)
  ctx.fill()

  // 右下角
  ctx.beginPath()
  ctx.moveTo(size - padding, size - padding - cornerSize)
  ctx.lineTo(size - padding, size - padding)
  ctx.lineTo(size - padding - cornerSize, size - padding)
  ctx.lineTo(size - padding, size - padding - cornerSize)
  ctx.fill()

  // 左下角
  ctx.beginPath()
  ctx.moveTo(padding + cornerSize, size - padding)
  ctx.lineTo(padding, size - padding)
  ctx.lineTo(padding, size - padding - cornerSize)
  ctx.lineTo(padding + cornerSize, size - padding)
  ctx.fill()

  // 添加马图标
  ctx.font = '60px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🐴', size / 2, size / 2)
}

// 生成头像
async function generateAvatar() {
  if (!avatarImage.value || !selectedFrame.value) return

  // 检查关注状态
  if (selectedFrame.value.locked && !isFollowed.value) {
    const isWechat = isWechatBrowser()
    if (isWechat) {
      window.location.href = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=gh_d8c2ff4637f8==&scene=126#wechat_redirect'
    } else {
      alert('请使用微信访问以解锁稀有头像框')
    }
    return
  }

  isGenerating.value = true

  // 模拟生成过程
  await new Promise(resolve => setTimeout(resolve, 800))

  const canvas = document.createElement('canvas')
  const size = 800
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')

  // 绘制头像
  const img = new Image()
  await new Promise((resolve) => {
    img.onload = resolve
    img.src = avatarImage.value
  })

  const minSide = Math.min(img.width, img.height)
  const x = (img.width - minSide) / 2
  const y = (img.height - minSide) / 2

  ctx.drawImage(img, x, y, minSide, minSide, 0, 0, size, size)

  // 绘制头像框
  drawFrame(ctx, size, selectedFrame.value)

  generatedImage.value = canvas.toDataURL('image/png', 0.95)
  isGenerating.value = false
  showGuide.value = true

  // 更新统计
  stats.value.todayFrames++
  stats.value.totalUsers++
}

// 下载头像
function downloadAvatar() {
  if (!generatedImage.value) {
    alert('请先生成头像')
    return
  }

  const link = document.createElement('a')
  link.href = generatedImage.value
  link.download = '马年专属头像.png'
  link.click()
}

// 分享头像
function shareAvatar() {
  if (!generatedImage.value) {
    alert('请先生成头像')
    return
  }

  const text = `🐴 我的2026马年限定头像框已换好！\n✨ 头像框：${selectedFrame.value.name}\n\n快来领取你的专属头像框 👇\n${window.location.href}`

  if (navigator.share) {
    navigator.share({
      title: '2026马年限定头像框',
      text: text,
      url: window.location.href
    }).catch(() => {
      copyToClipboard(text)
    })
  } else {
    copyToClipboard(text)
  }
}

// 复制到剪贴板
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('分享文案已复制，去粘贴分享吧！')
  }).catch(() => {
    alert('复制失败，请手动复制')
  })
}

// 切换全屏预览
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// 监听头像框变化
watch(selectedFrameId, () => {
  nextTick(() => {
    drawPreview()
  })
})

onMounted(async () => {
  // 检查关注状态
  isFollowed.value = await checkFollowStatus()

  // 模拟实时数据更新
  setInterval(() => {
    stats.value.todayFrames += Math.floor(Math.random() * 3)
  }, 20000)

  // 初始化画布
  nextTick(() => {
    if (previewCanvas.value) {
      const ctx = previewCanvas.value.getContext('2d')
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, 400, 400)
    }
  })
})
</script>

<style scoped>
.avatar-frame {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
  padding-bottom: 40px;
}

/* 顶部统计栏 */
.stats-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.stat-icon {
  font-size: 24px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #FFD700;
  font-feature-settings: 'tnum';
}

.stat-label {
  font-size: 12px;
  color: #888;
}

/* 主内容区 */
.main-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

/* 预览区域 */
.preview-section {
  position: sticky;
  top: 20px;
  height: fit-content;
}

.preview-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.preview-badge {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.preview-container {
  position: relative;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  min-height: 440px;
  transition: all 0.3s;
}

.preview-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-canvas {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.preview-container.fullscreen .preview-canvas {
  max-height: 80vh;
}

/* 加载动画 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  animation: spin 1.5s ease-in-out infinite;
}

.spinner-ring:nth-child(1) {
  border: 3px solid transparent;
  border-top-color: #FFD700;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  border: 3px solid transparent;
  border-top-color: #e74c3c;
  animation-delay: 0.2s;
}

.spinner-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  border: 3px solid transparent;
  border-top-color: #FFD700;
  animation-delay: 0.4s;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #fff;
  font-size: 14px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.preview-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 215, 0, 0.05);
  border-left: 3px solid #FFD700;
}

.tip-icon {
  font-size: 16px;
}

.tip-text {
  color: #888;
  font-size: 13px;
}

/* 上传区域 */
.upload-section {
  margin-top: 20px;
  padding: 20px;
}

.upload-zone {
  position: relative;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.02);
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.05);
}

.upload-zone.has-image {
  border: none;
  padding: 10px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  color: #666;
  margin-bottom: 8px;
}

.upload-text {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.upload-hint {
  color: #888;
  font-size: 13px;
}

.upload-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.upload-thumb {
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-zone:hover .upload-overlay {
  opacity: 1;
}

.overlay-text {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.btn-camera {
  width: 100%;
  margin-top: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-camera:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

/* 头像框选择区 */
.frames-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  padding: 24px;
}

.frames-header {
  margin-bottom: 24px;
}

.section-title {
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  color: #888;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
}

.filter-tab.active {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  border-color: #e74c3c;
  color: #fff;
}

.tab-icon {
  font-size: 16px;
}

.tab-count {
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.frames-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.frame-card {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.frame-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.frame-card.selected {
  border-color: #FFD700;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.frame-card.locked {
  opacity: 0.6;
}

.frame-preview {
  position: relative;
  aspect-ratio: 1;
  background: #2a2a4a;
  overflow: hidden;
}

.frame-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.frame-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.frame-card:hover .frame-overlay,
.frame-card.locked .frame-overlay,
.frame-card.selected .frame-overlay {
  opacity: 1;
}

.lock-badge {
  color: #e74c3c;
}

.selected-badge {
  color: #27ae60;
}

.frame-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.frame-badge.common {
  background: linear-gradient(135deg, #666, #444);
}

.frame-badge.rare {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.frame-badge.epic {
  background: linear-gradient(135deg, #f1c40f, #e74c3c);
}

.frame-info {
  padding: 16px;
}

.frame-name {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}

.frame-desc {
  color: #888;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.frame-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.meta-locked {
  color: #e74c3c;
}

.meta-new {
  color: #FFD700;
}

.meta-free {
  color: #27ae60;
}

.meta-icon {
  margin-right: 2px;
}

/* 操作区域 */
.actions-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  width: 100%;
  padding: 18px 30px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(231, 76, 60, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  font-size: 20px;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.success-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-secondary {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

/* 全屏预览 */
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.btn-close-fullscreen {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close-fullscreen:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

/* 引导提示 */
.guide-toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
  max-width: 400px;
  width: 90%;
}

.guide-content {
  background: rgba(39, 174, 96, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  box-shadow: 0 20px 60px rgba(39, 174, 96, 0.4);
}

.guide-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.guide-text {
  flex: 1;
}

.guide-text h4 {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 6px;
}

.guide-text p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.6;
}

.btn-guide-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s;
}

.btn-guide-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 100%);
}
</style>
