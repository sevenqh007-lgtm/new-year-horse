<template>
  <div class="generator">
    <div class="header">
      <button class="btn-back" @click="$router.back()">←</button>
      <h2>🐴 马年拜年生成</h2>
      <div class="quota-badge" v-if="isUnlimited">
        <span>♾️ 无限</span>
      </div>
      <div class="quota-badge limited" v-else>
        <span>剩余 {{ quota }} 次</span>
      </div>
    </div>

    <!-- 强制关注弹窗（未关注用户首次访问） -->
    <div class="force-follow-modal" v-if="showForceFollow" @click.self="handleForceFollowClick">
      <div class="modal-content">
        <div class="horse">🐴</div>
        <h2>关注立享无限次拜年神器制作！</h2>
        <p class="desc">马年专属AI拜年图，一键生成个性化祝福</p>
        <div class="features">
          <div class="feature">
            <span class="icon">✅</span>
            <span>20+马年主题模板</span>
          </div>
          <div class="feature">
            <span class="icon">✅</span>
            <span>高清无水印下载</span>
          </div>
          <div class="feature">
            <span class="icon">✅</span>
            <span>无限次免费使用</span>
          </div>
        </div>
        <button class="btn-follow" @click="handleForceFollow">
          🎁 立即关注解锁
        </button>
        <p class="tip">💡 关注后返回本页面即可使用</p>
      </div>
    </div>

    <!-- 步骤指示器 -->
    <div class="steps" v-if="!showForceFollow">
      <div class="step" :class="{ active: step >= 1, current: step === 1 }">
        <span class="num">1</span>
        <span>上传照片</span>
      </div>
      <div class="step-line" :class="{ active: step >= 2 }"></div>
      <div class="step" :class="{ active: step >= 2, current: step === 2 }">
        <span class="num">2</span>
        <span>选择模板</span>
      </div>
      <div class="step-line" :class="{ active: step >= 3 }"></div>
      <div class="step" :class="{ active: step >= 3, current: step === 3 }">
        <span class="num">3</span>
        <span>生成下载</span>
      </div>
    </div>

    <!-- 步骤1：上传 -->
    <div class="step-content" v-if="step === 1 && !showForceFollow">
      <div class="upload-box" @click="triggerUpload" @drop.prevent="handleDrop" @dragover.prevent>
        <input type="file" ref="fileInput" accept="image/*" hidden @change="handleFile">

        <div v-if="!preview" class="upload-placeholder">
          <div class="upload-icon">📷</div>
          <h3>点击或拖拽上传照片</h3>
          <p>支持 JPG、PNG 格式，建议上传清晰正面照</p>
          <div class="examples">
            <div class="ex-item">✅ 正面清晰</div>
            <div class="ex-item">✅ 光线充足</div>
            <div class="ex-item">❌ 避免遮挡</div>
          </div>
        </div>

        <div v-else class="preview-box">
          <img :src="preview" class="preview-img">
          <button class="btn-reupload" @click.stop="triggerUpload">重新上传</button>
        </div>
      </div>

      <button class="btn-next" :disabled="!preview" @click="step = 2">
        下一步：选择模板 →
      </button>
    </div>

    <!-- 步骤2：选模板 -->
    <div class="step-content" v-if="step === 2 && !showForceFollow">
      <div class="template-tabs">
        <button
            v-for="cat in categories"
            :key="cat.id"
            :class="{ active: currentCat === cat.id }"
            @click="currentCat = cat.id"
        >
          {{ cat.name }}
        </button>
      </div>

      <div class="template-grid">
        <div
            v-for="tmpl in filteredTemplates"
            :key="tmpl.id"
            class="template-item"
            :class="{
            active: selected === tmpl.id,
            locked: tmpl.locked && !isUnlimited
          }"
            @click="selectTemplate(tmpl)"
        >
          <img :src="tmpl.thumb" :alt="tmpl.name">
          <div class="tmpl-info">
            <span class="name">{{ tmpl.name }}</span>
            <span class="badge" v-if="tmpl.locked && !isUnlimited">🔒 关注解锁</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn-prev" @click="step = 1">← 上一步</button>
        <button class="btn-generate" :disabled="!selected" @click="generate">
          ✨ 立即生成
        </button>
      </div>
    </div>

    <!-- 步骤3：结果 -->
    <div class="step-content" v-if="step === 3 && !showForceFollow">
      <div class="result-box">
        <div v-if="generating" class="generating">
          <div class="spinner"></div>
          <p>AI生成中...</p>
          <span>正在融合马年元素</span>
        </div>

        <div v-else class="result-display">
          <img :src="resultImage" class="result-img">
          <div class="watermark" v-if="!isUnlimited">预览版</div>
        </div>
      </div>

      <div class="result-actions" v-if="!generating">
        <button class="btn-download" @click="download">
          💾 保存到相册
        </button>
        <button class="btn-share" @click="share">
          📤 分享给好友
        </button>
        <button class="btn-again" @click="reset">
          🔄 再生成一张
        </button>
      </div>

      <div class="share-tip" v-if="!isUnlimited">
        <p>💡 关注公众号，去除水印，无限次生成！</p>
        <button class="btn-follow-small" @click="$router.push('/?action=follow')">
          去关注
        </button>
      </div>
    </div>

    <canvas ref="canvas" hidden></canvas>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { checkFollowStatus } from '../utils/followCheck'

const router = useRouter()
const step = ref(1)
const fileInput = ref(null)
const preview = ref('')
const selected = ref('')
const currentCat = ref('all')
const generating = ref(false)
const resultImage = ref('')
const canvas = ref(null)
const showForceFollow = ref(false)
const isUnlimited = ref(false)
const quota = ref(2)

const categories = [
  { id: 'all', name: '全部' },
  { id: 'classic', name: '经典' },
  { id: 'fun', name: '趣味' },
  { id: 'biz', name: '商务' }
]

const templates = [
  { id: 'horse-1', name: '马到成功', cat: 'classic', thumb: '', locked: false },
  { id: 'horse-2', name: '一马当先', cat: 'classic', thumb: '', locked: false },
  { id: 'horse-3', name: '龙马精神', cat: 'classic', thumb: '', locked: false },
  { id: 'horse-4', name: '马上有钱', cat: 'fun', thumb: '', locked: true },
  { id: 'horse-5', name: '马上脱单', cat: 'fun', thumb: '', locked: true },
  { id: 'horse-6', name: '商务拜年', cat: 'biz', thumb: '', locked: true },
  { id: 'horse-7', name: '国潮马年', cat: 'classic', thumb: '', locked: true },
  { id: 'horse-8', name: '萌马贺岁', cat: 'fun', thumb: '', locked: true }
]

const filteredTemplates = computed(() => {
  if (currentCat.value === 'all') return templates
  return templates.filter(t => t.cat === currentCat.value)
})

onMounted(async () => {
  isUnlimited.value = await checkFollowStatus()
  quota.value = parseInt(localStorage.getItem('ny_quota') || '2')

  // 检查是否已看过强制关注弹窗
  const hasSeenFollowModal = localStorage.getItem('ny_seen_follow_modal')
  if (!isUnlimited.value && !hasSeenFollowModal) {
    showForceFollow.value = true
  }
})

const handleForceFollowClick = () => {
  // 点击遮罩关闭
  localStorage.setItem('ny_seen_follow_modal', 'true')
  showForceFollow.value = false
}

const handleForceFollow = () => {
  const userId = 'user_' + Date.now()
  localStorage.setItem('ny_user_id', userId)
  localStorage.setItem('ny_follow_click', Date.now())
  window.location.href = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=你的公众号ID==&scene=126#wechat_redirect`
}

const triggerUpload = () => fileInput.value.click()

const handleFile = (e) => {
  const file = e.target.files[0]
  if (file) processFile(file)
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

const processFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    preview.value = e.target.result
    localStorage.setItem('ny_temp_photo', e.target.result)
  }
  reader.readAsDataURL(file)
}

const selectTemplate = (tmpl) => {
  if (tmpl.locked && !isUnlimited.value) {
    if (confirm('该模板需要关注公众号解锁，是否去关注？')) {
      router.push('/?action=follow')
    }
    return
  }
  selected.value = tmpl.id
}

const generate = async () => {
  if (!isUnlimited.value && quota.value <= 0) {
    alert('次数已用完！关注公众号无限使用')
    router.push('/?action=follow')
    return
  }

  step.value = 3
  generating.value = true

  setTimeout(() => {
    composeImage()
    generating.value = false

    if (!isUnlimited.value) {
      quota.value--
      localStorage.setItem('ny_quota', quota.value)
    }
  }, 2000)
}

const composeImage = () => {
  const cvs = canvas.value
  const ctx = cvs.getContext('2d')
  const photo = localStorage.getItem('ny_temp_photo')

  cvs.width = 1080
  cvs.height = 1920

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920)
  gradient.addColorStop(0, '#8B0000')
  gradient.addColorStop(1, '#DC143C')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, cvs.width, cvs.height)

  ctx.font = 'bold 80px serif'
  ctx.fillStyle = '#FFD700'
  ctx.textAlign = 'center'
  ctx.fillText('🐴 马年大吉 🐴', 540, 200)

  ctx.save()
  ctx.beginPath()
  ctx.arc(540, 800, 300, 0, Math.PI * 2)
  ctx.clip()

  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 240, 500, 600, 600)
    ctx.restore()

    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.arc(540, 800, 300, 0, Math.PI * 2)
    ctx.stroke()

    ctx.font = 'bold 60px "Microsoft YaHei"'
    ctx.fillStyle = '#fff'
    ctx.fillText('新年快乐', 540, 1400)
    ctx.font = '40px "Microsoft YaHei"'
    ctx.fillText('万事如意 · 马到成功', 540, 1500)

    resultImage.value = cvs.toDataURL('image/jpeg', 0.9)
  }
  img.src = photo
}

const download = () => {
  const link = document.createElement('a')
  link.download = `马年拜年_${Date.now()}.jpg`
  link.href = resultImage.value
  link.click()
}

const share = () => {
  alert('点击右上角"..."分享给好友！')
}

const reset = () => {
  step.value = 1
  preview.value = ''
  selected.value = ''
  resultImage.value = ''
}
</script>

<style scoped>
.generator {
  min-height: 100vh;
  background: #0f0f1e;
  color: #fff;
}

.header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0,0,0,0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.btn-back {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  margin-right: 15px;
}

.header h2 {
  flex: 1;
  font-size: 18px;
}

.quota-badge {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  color: #000;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.quota-badge.limited {
  background: #e74c3c;
  color: #fff;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  gap: 10px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 12px;
}

.step.active {
  color: #fff;
}

.step.current .num {
  background: #e74c3c;
  transform: scale(1.1);
}

.step .num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s;
}

.step-line {
  width: 40px;
  height: 2px;
  background: #333;
  margin-top: -15px;
}

.step-line.active {
  background: #e74c3c;
}

.step-content {
  padding: 0 20px 40px;
  max-width: 600px;
  margin: 0 auto;
}

.upload-box {
  border: 3px dashed rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 30px;
}

.upload-box:hover {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.05);
}

.upload-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.upload-placeholder h3 {
  font-size: 20px;
  margin-bottom: 10px;
}

.upload-placeholder p {
  color: #888;
  font-size: 14px;
  margin-bottom: 20px;
}

.examples {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.ex-item {
  background: rgba(255,255,255,0.1);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
}

.preview-box {
  position: relative;
}

.preview-img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 10px;
}

.btn-reupload {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
}

.btn-next, .btn-generate, .btn-download {
  width: 100%;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 18px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-next:disabled, .btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.template-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.template-tabs button {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #aaa;
  padding: 10px 20px;
  border-radius: 20px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s;
}

.template-tabs button.active {
  background: #e74c3c;
  color: white;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.template-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s;
}

.template-item.active {
  border-color: #e74c3c;
}

.template-item.locked {
  opacity: 0.6;
}

.template-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.tmpl-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.9));
  padding: 15px 10px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  font-size: 14px;
  font-weight: bold;
}

.badge {
  font-size: 11px;
  background: #e74c3c;
  padding: 3px 8px;
  border-radius: 10px;
}

.actions {
  display: flex;
  gap: 15px;
}

.btn-prev {
  background: rgba(255,255,255,0.1);
  color: white;
  border: none;
  padding: 18px 30px;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
}

.result-box {
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 30px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.generating {
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(231, 76, 60, 0.3);
  border-top-color: #e74c3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-display {
  position: relative;
}

.result-img {
  max-width: 100%;
  border-radius: 10px;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 48px;
  color: rgba(255,255,255,0.3);
  font-weight: bold;
  pointer-events: none;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.btn-share {
  background: rgba(255,255,255,0.1);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  padding: 18px;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
}

.btn-again {
  background: transparent;
  color: #888;
  border: none;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
}

.share-tip {
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid #e74c3c;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.share-tip p {
  color: #e74c3c;
  margin-bottom: 15px;
  font-size: 14px;
}

.btn-follow-small {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 15px;
  font-size: 13px;
  cursor: pointer;
  margin-top: 10px;
}

/* 强制关注弹窗 */
.force-follow-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.force-follow-modal .modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #e74c3c;
  border-radius: 24px;
  padding: 40px 30px;
  text-align: center;
  max-width: 380px;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.force-follow-modal .horse {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.force-follow-modal h2 {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

.force-follow-modal .desc {
  color: #aaa;
  font-size: 14px;
  margin-bottom: 30px;
}

.force-follow-modal .features {
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: left;
}

.force-follow-modal .feature {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  color: #fff;
  font-size: 14px;
}

.force-follow-modal .feature .icon {
  font-size: 18px;
}

.force-follow-modal .btn-follow {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 16px 40px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s;
}

.force-follow-modal .btn-follow:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
}

.force-follow-modal .tip {
  color: #666;
  font-size: 12px;
  margin-top: 15px;
}
</style>