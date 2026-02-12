<template>
  <div class="generator">
    <!-- 动态背景 -->
    <div class="animated-bg">
      <div class="floating-lantern" v-for="n in 6" :key="n">🏮</div>
      <div class="floating-coin" v-for="n in 8" :key="'c'+n">💰</div>
    </div>

    <!-- 头部 -->
    <div class="header">
      <button class="btn-back" @click="$router.back()">
        <span class="icon">←</span>
      </button>
      <div class="title-wrapper">
        <h2 class="main-title">🐴 马年拜年神器</h2>
        <p class="sub-title">AI智能生成 · 专属祝福</p>
      </div>
      <div class="header-actions">
        <button class="btn-history" @click="showHistory = true">
          <span>📷</span>
          <span class="badge" v-if="history.length">{{ history.length }}</span>
        </button>
      </div>
    </div>

    <!-- 进度指示器 -->
    <div class="progress-bar">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: (step / 3 * 100) + '%' }"></div>
      </div>
      <div class="step-indicators">
        <div class="step-dot" :class="{ active: step >= 1, current: step === 1 }">
          <span class="dot-num">1</span>
          <span class="dot-label">上传</span>
        </div>
        <div class="step-dot" :class="{ active: step >= 2, current: step === 2 }">
          <span class="dot-num">2</span>
          <span class="dot-label">定制</span>
        </div>
        <div class="step-dot" :class="{ active: step >= 3, current: step === 3 }">
          <span class="dot-num">3</span>
          <span class="dot-label">生成</span>
        </div>
      </div>
    </div>

    <!-- 步骤1：智能上传 -->
    <transition name="slide-fade" mode="out-in">
      <div class="step-panel" v-if="step === 1" key="step1">
        <div class="upload-zone" 
             :class="{ 'has-file': preview, 'drag-over': isDragOver }"
             @click="triggerUpload"
             @drop.prevent="handleDrop"
             @dragover.prevent="isDragOver = true"
             @dragleave="isDragOver = false">
          
          <input type="file" ref="fileInput" accept="image/*" hidden @change="handleFile">

          <div v-if="!preview" class="upload-content">
            <div class="upload-animation">
              <div class="orbit">
                <span class="orbit-item" style="--delay: 0s">📸</span>
                <span class="orbit-item" style="--delay: 0.5s">✨</span>
                <span class="orbit-item" style="--delay: 1s">🎊</span>
                <span class="orbit-item" style="--delay: 1.5s">🧧</span>
              </div>
              <div class="center-icon">🐴</div>
            </div>
            <h3 class="upload-title">点击或拖拽上传照片</h3>
            <p class="upload-desc">AI将自动识别面部特征，生成专属拜年图</p>
            <div class="upload-tips">
              <div class="tip-item" v-for="tip in uploadTips" :key="tip.icon">
                <span class="tip-icon">{{ tip.icon }}</span>
                <span class="tip-text">{{ tip.text }}</span>
              </div>
            </div>
          </div>

          <div v-else class="preview-content">
            <div class="photo-frame">
              <img :src="preview" class="preview-image">
              <div class="frame-decoration">
                <span class="corner tl">🏮</span>
                <span class="corner tr">🏮</span>
                <span class="corner bl">🏮</span>
                <span class="corner br">🏮</span>
              </div>
            </div>
            <div class="photo-actions">
              <button class="btn-replace" @click.stop="triggerUpload">
                <span>🔄</span> 更换照片
              </button>
              <button class="btn-continue" @click.stop="step = 2">
                <span>✨</span> 继续定制
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2：个性化定制 -->
      <div class="step-panel" v-else-if="step === 2" key="step2">
        <div class="customization-panel">
          <!-- 模板选择 -->
          <div class="section">
            <h3 class="section-title">
              <span class="icon">🎨</span>
              选择拜年风格
            </h3>
            <div class="category-tabs">
              <button v-for="cat in categories" 
                      :key="cat.id"
                      :class="['tab-btn', { active: currentCat === cat.id }]"
                      @click="currentCat = cat.id">
                <span class="tab-icon">{{ cat.icon }}</span>
                <span>{{ cat.name }}</span>
              </button>
            </div>
            <div class="template-scroll">
              <div class="template-cards">
                <div v-for="tmpl in filteredTemplates" 
                     :key="tmpl.id"
                     :class="['template-card', { active: selectedTemplate === tmpl.id }]"
                     @click="selectTemplate(tmpl)">
                  <div class="card-preview" :style="{ background: tmpl.gradient }">
                    <span class="card-emoji">{{ tmpl.emoji }}</span>
                  </div>
                  <div class="card-info">
                    <span class="card-name">{{ tmpl.name }}</span>
                    <span class="card-desc">{{ tmpl.desc }}</span>
                  </div>
                  <div class="card-check" v-if="selectedTemplate === tmpl.id">✓</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 祝福词选择 -->
          <div class="section">
            <h3 class="section-title">
              <span class="icon">💬</span>
              选择祝福语
              <button class="btn-random" @click="randomBlessing">🎲 随机</button>
            </h3>
            <div class="blessing-categories">
              <button v-for="cat in blessingCategories" 
                      :key="cat.id"
                      :class="['blessing-tab', { active: currentBlessingCat === cat.id }]"
                      @click="currentBlessingCat = cat.id">
                {{ cat.name }}
              </button>
            </div>
            <div class="blessing-list">
              <div v-for="(blessing, idx) in filteredBlessings" 
                   :key="idx"
                   :class="['blessing-item', { active: selectedBlessing === blessing }]"
                   @click="selectedBlessing = blessing">
                <span class="blessing-text">{{ blessing }}</span>
                <span class="blessing-check" v-if="selectedBlessing === blessing">✓</span>
              </div>
            </div>
          </div>

          <!-- 自定义文字 -->
          <div class="section">
            <h3 class="section-title">
              <span class="icon">✏️</span>
              添加自定义文字
            </h3>
            <div class="custom-text-input">
              <input type="text" 
                     v-model="customText" 
                     placeholder="输入您的专属祝福语（可选）"
                     maxlength="20">
              <span class="char-count">{{ customText.length }}/20</span>
            </div>
          </div>

          <div class="action-bar">
            <button class="btn-back-step" @click="step = 1">
              <span>←</span> 上一步
            </button>
            <button class="btn-generate" :disabled="!selectedTemplate" @click="generate">
              <span class="btn-icon">✨</span>
              <span class="btn-text">AI智能生成</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 步骤3：生成结果 -->
      <div class="step-panel" v-else-if="step === 3" key="step3">
        <div class="result-panel">
          <div v-if="generating" class="generating-state">
            <div class="ai-animation">
              <div class="brain">
                <span class="brain-icon">🧠</span>
                <div class="neural-lines">
                  <span v-for="n in 5" :key="n" :style="{ '--delay': n * 0.2 + 's' }"></span>
                </div>
              </div>
              <div class="processing-steps">
                <div class="process-item" :class="{ active: genProgress >= 20 }">
                  <span class="process-icon">👤</span>
                  <span>识别人脸</span>
                </div>
                <div class="process-item" :class="{ active: genProgress >= 50 }">
                  <span class="process-icon">🎨</span>
                  <span>融合风格</span>
                </div>
                <div class="process-item" :class="{ active: genProgress >= 80 }">
                  <span class="process-icon">✨</span>
                  <span>添加祝福</span>
                </div>
                <div class="process-item" :class="{ active: genProgress >= 100 }">
                  <span class="process-icon">🎉</span>
                  <span>完成生成</span>
                </div>
              </div>
            </div>
            <div class="progress-text">{{ genProgress }}%</div>
          </div>

          <div v-else class="result-display">
            <div class="result-frame">
              <img :src="resultImage" class="result-image">
              <div class="result-overlay">
                <div class="sparkles">
                  <span v-for="n in 6" :key="n">✨</span>
                </div>
              </div>
            </div>
            
            <div class="result-actions">
              <button class="btn-action primary" @click="download">
                <span class="action-icon">💾</span>
                <span>保存到相册</span>
              </button>
              <button class="btn-action secondary" @click="share">
                <span class="action-icon">📤</span>
                <span>分享好友</span>
              </button>
              <button class="btn-action tertiary" @click="reset">
                <span class="action-icon">🔄</span>
                <span>再生成一张</span>
              </button>
            </div>

            <div class="share-hint">
              <p>🎊 分享给好友，一起传递马年祝福！</p>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 历史记录弹窗 -->
    <transition name="fade">
      <div class="history-modal" v-if="showHistory" @click.self="showHistory = false">
        <div class="history-content">
          <div class="history-header">
            <h3>📷 生成历史</h3>
            <button class="btn-close" @click="showHistory = false">×</button>
          </div>
          <div class="history-list" v-if="history.length">
            <div v-for="(item, idx) in history" :key="idx" class="history-item">
              <img :src="item" @click="previewHistory(item)">
            </div>
          </div>
          <div class="history-empty" v-else>
            <span class="empty-icon">📭</span>
            <p>还没有生成记录</p>
          </div>
        </div>
      </div>
    </transition>

    <canvas ref="canvas" hidden></canvas>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref(1)
const fileInput = ref(null)
const canvas = ref(null)

// 上传相关
const preview = ref('')
const isDragOver = ref(false)
const uploadTips = [
  { icon: '👤', text: '正面清晰照片' },
  { icon: '💡', text: '光线充足明亮' },
  { icon: '😊', text: '表情自然微笑' }
]

// 模板相关
const currentCat = ref('all')
const selectedTemplate = ref('')
const categories = [
  { id: 'all', name: '全部', icon: '✨' },
  { id: 'classic', name: '经典', icon: '🏮' },
  { id: 'fun', name: '趣味', icon: '😄' },
  { id: 'biz', name: '商务', icon: '💼' },
  { id: 'family', name: '亲情', icon: '👨‍👩‍👧' },
  { id: 'love', name: '爱情', icon: '💕' }
]

const templates = [
  { id: 'horse-1', name: '马到成功', cat: 'classic', emoji: '🐴', gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', desc: '事业腾飞' },
  { id: 'horse-2', name: '龙马精神', cat: 'classic', emoji: '🐉', gradient: 'linear-gradient(135deg, #FF6B6B, #EE5A6F)', desc: '身体健康' },
  { id: 'horse-3', name: '一马当先', cat: 'classic', emoji: '🏆', gradient: 'linear-gradient(135deg, #4ECDC4, #44A08D)', desc: '勇夺第一' },
  { id: 'horse-4', name: '马上有钱', cat: 'fun', emoji: '💰', gradient: 'linear-gradient(135deg, #F093FB, #F5576C)', desc: '财源广进' },
  { id: 'horse-5', name: '马上脱单', cat: 'love', emoji: '💑', gradient: 'linear-gradient(135deg, #FA709A, #FEE140)', desc: '桃花朵朵' },
  { id: 'horse-6', name: '商务拜年', cat: 'biz', emoji: '💼', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', desc: '合作共赢' },
  { id: 'horse-7', name: '国潮马年', cat: 'classic', emoji: '🏮', gradient: 'linear-gradient(135deg, #f5af19, #f12711)', desc: '国风潮流' },
  { id: 'horse-8', name: '萌马贺岁', cat: 'fun', emoji: '🦄', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)', desc: '可爱萌趣' },
  { id: 'horse-9', name: '全家福', cat: 'family', emoji: '👨‍👩‍👧‍👦', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)', desc: '阖家欢乐' },
  { id: 'horse-10', name: '甜蜜爱恋', cat: 'love', emoji: '💕', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)', desc: '爱情甜蜜' },
  { id: 'horse-11', name: '学业有成', cat: 'classic', emoji: '📚', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', desc: '金榜题名' },
  { id: 'horse-12', name: '步步高升', cat: 'biz', emoji: '📈', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)', desc: '平步青云' }
]

const filteredTemplates = computed(() => {
  if (currentCat.value === 'all') return templates
  return templates.filter(t => t.cat === currentCat.value)
})

// 祝福词相关
const currentBlessingCat = ref('classic')
const selectedBlessing = ref('')
const customText = ref('')

const blessingCategories = [
  { id: 'classic', name: '经典' },
  { id: 'fun', name: '趣味' },
  { id: 'biz', name: '商务' },
  { id: 'family', name: '亲情' },
  { id: 'love', name: '爱情' },
  { id: 'wealth', name: '财运' }
]

const blessings = {
  classic: [
    '马年大吉，万事如意！',
    '龙马精神，身体健康！',
    '马到成功，前程似锦！',
    '一马当先，勇攀高峰！',
    '万马奔腾，气势如虹！',
    '快马加鞭，梦想成真！',
    '金马玉堂，富贵吉祥！',
    '天马行空，自由翱翔！'
  ],
  fun: [
    '马上有钱，数钱数到手抽筋！',
    '马上脱单，桃花朵朵开！',
    '马上暴富，躺平也能赢！',
    '马上暴瘦，吃啥都不胖！',
    '马上升职，老板都听你的！',
    '马上放假，睡到自然醒！',
    '马上中奖，彩票中头奖！',
    '马上开挂，人生赢家就是你！'
  ],
  biz: [
    '祝贵公司业绩长虹，蒸蒸日上！',
    '愿我们合作愉快，共创辉煌！',
    '祝事业腾飞，财源广进！',
    '愿项目顺利，圆满成功！',
    '祝生意兴隆，客似云来！',
    '愿团队壮大，人才济济！',
    '祝产品大卖，市场领先！',
    '愿创新不断，引领行业！'
  ],
  family: [
    '祝爸妈身体健康，笑口常开！',
    '愿家人平安喜乐，幸福美满！',
    '祝宝贝快乐成长，聪明伶俐！',
    '愿阖家欢乐，团团圆圆！',
    '祝长辈福如东海，寿比南山！',
    '愿兄弟姐妹情深意长！',
    '祝全家幸福安康，其乐融融！',
    '愿亲情永驻，温暖常伴！'
  ],
  love: [
    '愿我们的爱情甜甜蜜蜜！',
    '祝我们白头偕老，永结同心！',
    '愿爱情如马奔腾，永不止步！',
    '祝亲爱的你，新年快乐！',
    '愿我们的故事越来越精彩！',
    '祝恋爱中的小确幸不断！',
    '愿缘分让我们永远在一起！',
    '祝爱情事业双丰收！'
  ],
  wealth: [
    '财源滚滚，日进斗金！',
    '财运亨通，富贵吉祥！',
    '招财进宝，金玉满堂！',
    '财源广进，生意兴隆！',
    '财运滚滚来，挡都挡不住！',
    '愿你的钱包装不下！',
    '祝投资大赚，股票涨停！',
    '愿财神爷常驻你家！'
  ]
}

const filteredBlessings = computed(() => {
  return blessings[currentBlessingCat.value] || blessings.classic
})

// 生成相关
const generating = ref(false)
const genProgress = ref(0)
const resultImage = ref('')
const history = ref([])
const showHistory = ref(false)

// 方法
const triggerUpload = () => fileInput.value.click()

const handleFile = (e) => {
  const file = e.target.files[0]
  if (file) processFile(file)
}

const handleDrop = (e) => {
  isDragOver.value = false
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
  selectedTemplate.value = tmpl.id
}

const randomBlessing = () => {
  const cats = Object.keys(blessings)
  const randomCat = cats[Math.floor(Math.random() * cats.length)]
  currentBlessingCat.value = randomCat
  const catBlessings = blessings[randomCat]
  selectedBlessing.value = catBlessings[Math.floor(Math.random() * catBlessings.length)]
}

const generate = async () => {
  step.value = 3
  generating.value = true
  genProgress.value = 0

  // 模拟进度
  const progressInterval = setInterval(() => {
    genProgress.value += Math.floor(Math.random() * 15) + 5
    if (genProgress.value >= 100) {
      genProgress.value = 100
      clearInterval(progressInterval)
      setTimeout(() => {
        composeImage()
        generating.value = false
      }, 500)
    }
  }, 300)
}

const composeImage = () => {
  const cvs = canvas.value
  const ctx = cvs.getContext('2d')
  const photo = localStorage.getItem('ny_temp_photo')
  const tmpl = templates.find(t => t.id === selectedTemplate.value)

  cvs.width = 1080
  cvs.height = 1920

  // 绘制背景渐变
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920)
  if (tmpl) {
    // 根据模板设置背景色
    gradient.addColorStop(0, '#8B0000')
    gradient.addColorStop(0.5, '#DC143C')
    gradient.addColorStop(1, '#FFD700')
  } else {
    gradient.addColorStop(0, '#8B0000')
    gradient.addColorStop(1, '#DC143C')
  }
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, cvs.width, cvs.height)

  // 绘制装饰边框
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 8
  ctx.strokeRect(40, 40, 1000, 1840)
  
  // 内边框
  ctx.lineWidth = 3
  ctx.strokeRect(55, 55, 970, 1810)

  // 绘制标题
  ctx.font = 'bold 70px "Microsoft YaHei", serif'
  ctx.fillStyle = '#FFD700'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 10
  ctx.fillText('🐴 马年大吉 🐴', 540, 150)
  ctx.shadowBlur = 0

  // 绘制照片圆形框
  ctx.save()
  ctx.beginPath()
  ctx.arc(540, 550, 280, 0, Math.PI * 2)
  ctx.clip()

  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 260, 270, 560, 560)
    ctx.restore()

    // 照片边框
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(540, 550, 280, 0, Math.PI * 2)
    ctx.stroke()

    // 装饰角
    const corners = [
      { x: 280, y: 290, rot: 0 },
      { x: 800, y: 290, rot: 90 },
      { x: 280, y: 810, rot: 270 },
      { x: 800, y: 810, rot: 180 }
    ]
    corners.forEach(corner => {
      ctx.save()
      ctx.translate(corner.x, corner.y)
      ctx.rotate(corner.rot * Math.PI / 180)
      ctx.font = '40px serif'
      ctx.fillText('🏮', 0, 0)
      ctx.restore()
    })

    // 绘制模板名称
    if (tmpl) {
      ctx.font = 'bold 50px "Microsoft YaHei"'
      ctx.fillStyle = '#fff'
      ctx.fillText(tmpl.name, 540, 950)
      ctx.font = '30px "Microsoft YaHei"'
      ctx.fillStyle = '#FFD700'
      ctx.fillText(tmpl.desc, 540, 1000)
    }

    // 绘制祝福语
    ctx.font = 'bold 45px "Microsoft YaHei"'
    ctx.fillStyle = '#fff'
    const blessing = customText.value || selectedBlessing.value || '马年大吉，万事如意！'
    
    // 自动换行
    const maxWidth = 900
    const lineHeight = 60
    const x = 540
    let y = 1150
    
    const words = blessing.split('')
    let line = ''
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i]
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, y)
        line = words[i]
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, x, y)

    // 绘制底部装饰文字
    ctx.font = '35px "Microsoft YaHei"'
    ctx.fillStyle = '#FFD700'
    ctx.fillText('—— 祝您马年行大运 ——', 540, 1650)

    // 绘制年份
    ctx.font = 'bold 80px serif'
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
    ctx.fillText('2025', 540, 1780)

    resultImage.value = cvs.toDataURL('image/jpeg', 0.95)
    
    // 保存到历史
    history.value.unshift(resultImage.value)
    if (history.value.length > 10) history.value.pop()
    localStorage.setItem('ny_history', JSON.stringify(history.value))
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
  if (navigator.share) {
    navigator.share({
      title: '马年拜年神器',
      text: '快来看看我生成的马年拜年图！',
      url: window.location.href
    })
  } else {
    alert('点击右上角"..."分享给好友！')
  }
}

const reset = () => {
  step.value = 1
  preview.value = ''
  selectedTemplate.value = ''
  selectedBlessing.value = ''
  customText.value = ''
  resultImage.value = ''
  genProgress.value = 0
}

const previewHistory = (item) => {
  resultImage.value = item
  step.value = 3
  showHistory.value = false
}

onMounted(() => {
  const saved = localStorage.getItem('ny_history')
  if (saved) {
    history.value = JSON.parse(saved)
  }
  quota.value = 9999
})
</script>

<style scoped>
.generator {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
  color: #fff;
  position: relative;
  overflow-x: hidden;
}

/* 动态背景 */
.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.floating-lantern {
  position: absolute;
  font-size: 30px;
  animation: float 8s ease-in-out infinite;
  opacity: 0.3;
}

.floating-lantern:nth-child(1) { left: 10%; animation-delay: 0s; }
.floating-lantern:nth-child(2) { left: 30%; animation-delay: 1s; }
.floating-lantern:nth-child(3) { left: 50%; animation-delay: 2s; }
.floating-lantern:nth-child(4) { left: 70%; animation-delay: 3s; }
.floating-lantern:nth-child(5) { left: 85%; animation-delay: 4s; }
.floating-lantern:nth-child(6) { left: 20%; animation-delay: 5s; }

.floating-coin {
  position: absolute;
  font-size: 20px;
  animation: float-coin 6s ease-in-out infinite;
  opacity: 0.2;
}

.floating-coin:nth-child(7) { left: 15%; top: 20%; animation-delay: 0.5s; }
.floating-coin:nth-child(8) { left: 45%; top: 40%; animation-delay: 1.5s; }
.floating-coin:nth-child(9) { left: 75%; top: 30%; animation-delay: 2.5s; }
.floating-coin:nth-child(10) { left: 25%; top: 60%; animation-delay: 3.5s; }
.floating-coin:nth-child(11) { left: 60%; top: 70%; animation-delay: 4.5s; }
.floating-coin:nth-child(12) { left: 80%; top: 50%; animation-delay: 5.5s; }
.floating-coin:nth-child(13) { left: 5%; top: 80%; animation-delay: 0.8s; }
.floating-coin:nth-child(14) { left: 90%; top: 75%; animation-delay: 2.8s; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-30px) rotate(10deg); }
}

@keyframes float-coin {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* 头部 */
.header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0,0,0,0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.btn-back {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-back:hover {
  background: rgba(255,255,255,0.2);
  transform: translateX(-3px);
}

.title-wrapper {
  flex: 1;
  text-align: center;
}

.main-title {
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
}

.sub-title {
  font-size: 12px;
  color: #888;
}

.btn-history {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  font-size: 18px;
}

.btn-history .badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: #fff;
  font-size: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 进度条 */
.progress-bar {
  padding: 20px;
  position: relative;
  z-index: 1;
}

.progress-track {
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  margin-bottom: 15px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e74c3c, #f39c12);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.step-indicators {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dot-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.step-dot.active .dot-num {
  background: linear-gradient(135deg, #e74c3c, #f39c12);
}

.step-dot.current .dot-num {
  transform: scale(1.2);
  box-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
}

.dot-label {
  font-size: 12px;
  color: #888;
  transition: all 0.3s;
}

.step-dot.active .dot-label {
  color: #fff;
}

/* 步骤面板 */
.step-panel {
  padding: 0 20px 40px;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 上传区域 */
.upload-zone {
  border: 3px dashed rgba(255,255,255,0.2);
  border-radius: 24px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255,255,255,0.02);
  position: relative;
  overflow: hidden;
}

.upload-zone:hover {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.05);
}

.upload-zone.drag-over {
  border-color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
  transform: scale(1.02);
}

.upload-zone.has-file {
  border-style: solid;
  border-color: #27ae60;
}

.upload-animation {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 30px;
}

.orbit {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: rotate 10s linear infinite;
}

.orbit-item {
  position: absolute;
  font-size: 24px;
  animation: counter-rotate 10s linear infinite;
}

.orbit-item:nth-child(1) { top: 0; left: 50%; transform: translateX(-50%); }
.orbit-item:nth-child(2) { top: 50%; right: 0; transform: translateY(-50%); }
.orbit-item:nth-child(3) { bottom: 0; left: 50%; transform: translateX(-50%); }
.orbit-item:nth-child(4) { top: 50%; left: 0; transform: translateY(-50%); }

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes counter-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

.center-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 60px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

.upload-title {
  font-size: 22px;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.upload-desc {
  color: #888;
  font-size: 14px;
  margin-bottom: 25px;
}

.upload-tips {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.tip-item {
  background: rgba(255,255,255,0.05);
  padding: 10px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.tip-icon {
  font-size: 16px;
}

/* 预览内容 */
.preview-content {
  padding: 20px;
}

.photo-frame {
  position: relative;
  display: inline-block;
  margin-bottom: 25px;
}

.preview-image {
  max-width: 280px;
  max-height: 280px;
  border-radius: 50%;
  border: 5px solid #FFD700;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.frame-decoration .corner {
  position: absolute;
  font-size: 30px;
}

.corner.tl { top: -10px; left: -10px; }
.corner.tr { top: -10px; right: -10px; }
.corner.bl { bottom: -10px; left: -10px; }
.corner.br { bottom: -10px; right: -10px; }

.photo-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-replace, .btn-continue {
  padding: 14px 28px;
  border-radius: 25px;
  border: none;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-replace {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.btn-replace:hover {
  background: rgba(255,255,255,0.2);
}

.btn-continue {
  background: linear-gradient(135deg, #e74c3c, #f39c12);
  color: #fff;
}

.btn-continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
}

/* 定制面板 */
.customization-panel {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.section {
  background: rgba(255,255,255,0.03);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(255,255,255,0.05);
}

.section-title {
  font-size: 16px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title .icon {
  font-size: 20px;
}

.btn-random {
  margin-left: auto;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-random:hover {
  transform: scale(1.05);
}

/* 分类标签 */
.category-tabs, .blessing-categories {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.tab-btn, .blessing-tab {
  background: rgba(255,255,255,0.05);
  border: none;
  color: #aaa;
  padding: 10px 18px;
  border-radius: 20px;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  font-size: 13px;
}

.tab-btn.active, .blessing-tab.active {
  background: linear-gradient(135deg, #e74c3c, #f39c12);
  color: #fff;
}

.tab-icon {
  font-size: 16px;
}

/* 模板卡片 */
.template-scroll {
  overflow-x: auto;
  margin: 0 -20px;
  padding: 0 20px;
}

.template-cards {
  display: flex;
  gap: 12px;
}

.template-card {
  flex-shrink: 0;
  width: 120px;
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
  position: relative;
}

.template-card:hover {
  transform: translateY(-5px);
}

.template-card.active {
  border-color: #e74c3c;
  box-shadow: 0 0 20px rgba(231, 76, 60, 0.3);
}

.card-preview {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-emoji {
  font-size: 50px;
}

.card-info {
  padding: 10px;
  text-align: center;
}

.card-name {
  display: block;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 4px;
}

.card-desc {
  display: block;
  font-size: 11px;
  color: #888;
}

.card-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #e74c3c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* 祝福词列表 */
.blessing-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.blessing-item {
  background: rgba(255,255,255,0.05);
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.blessing-item:hover {
  background: rgba(255,255,255,0.1);
}

.blessing-item.active {
  background: rgba(231, 76, 60, 0.2);
  border-color: #e74c3c;
}

.blessing-text {
  font-size: 14px;
}

.blessing-check {
  color: #e74c3c;
  font-weight: bold;
}

/* 自定义输入 */
.custom-text-input {
  position: relative;
}

.custom-text-input input {
  width: 100%;
  padding: 14px 50px 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}

.custom-text-input input:focus {
  border-color: #e74c3c;
  background: rgba(255,255,255,0.08);
}

.custom-text-input input::placeholder {
  color: #666;
}

.char-count {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #666;
}

/* 操作栏 */
.action-bar {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.btn-back-step {
  flex: 0 0 auto;
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-back-step:hover {
  background: rgba(255,255,255,0.2);
}

.btn-generate {
  flex: 1;
  background: linear-gradient(135deg, #e74c3c, #f39c12);
  border: none;
  color: #fff;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
}

.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 20px;
}

/* 生成状态 */
.generating-state {
  text-align: center;
  padding: 40px 20px;
}

.ai-animation {
  margin-bottom: 30px;
}

.brain {
  position: relative;
  display: inline-block;
  margin-bottom: 30px;
}

.brain-icon {
  font-size: 80px;
  display: block;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.neural-lines {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
}

.neural-lines span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e74c3c, transparent);
  transform-origin: left center;
  animation: neural-pulse 1.5s ease-in-out infinite;
  animation-delay: var(--delay);
}

.neural-lines span:nth-child(1) { transform: rotate(0deg); }
.neural-lines span:nth-child(2) { transform: rotate(72deg); }
.neural-lines span:nth-child(3) { transform: rotate(144deg); }
.neural-lines span:nth-child(4) { transform: rotate(216deg); }
.neural-lines span:nth-child(5) { transform: rotate(288deg); }

@keyframes neural-pulse {
  0%, 100% { opacity: 0; transform: rotate(var(--rotation, 0deg)) scaleX(0); }
  50% { opacity: 1; transform: rotate(var(--rotation, 0deg)) scaleX(1); }
}

.processing-steps {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.process-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.3;
  transition: all 0.3s;
}

.process-item.active {
  opacity: 1;
}

.process-icon {
  font-size: 30px;
}

.process-item span:last-child {
  font-size: 12px;
}

.progress-text {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 结果展示 */
.result-panel {
  padding: 20px 0;
}

.result-frame {
  position: relative;
  margin-bottom: 25px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.result-image {
  width: 100%;
  display: block;
}

.result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.sparkles {
  position: absolute;
  width: 100%;
  height: 100%;
}

.sparkles span {
  position: absolute;
  font-size: 24px;
  animation: sparkle 2s ease-in-out infinite;
}

.sparkles span:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
.sparkles span:nth-child(2) { top: 20%; right: 15%; animation-delay: 0.3s; }
.sparkles span:nth-child(3) { top: 50%; left: 5%; animation-delay: 0.6s; }
.sparkles span:nth-child(4) { top: 60%; right: 10%; animation-delay: 0.9s; }
.sparkles span:nth-child(5) { bottom: 20%; left: 15%; animation-delay: 1.2s; }
.sparkles span:nth-child(6) { bottom: 30%; right: 20%; animation-delay: 1.5s; }

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-action {
  padding: 16px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s;
}

.btn-action.primary {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: #fff;
}

.btn-action.secondary {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
}

.btn-action.tertiary {
  background: transparent;
  color: #888;
}

.btn-action:hover {
  transform: translateY(-2px);
}

.action-icon {
  font-size: 20px;
}

.share-hint {
  text-align: center;
  padding: 15px;
  background: rgba(255,215,0,0.1);
  border-radius: 12px;
  border: 1px solid rgba(255,215,0,0.3);
}

.share-hint p {
  color: #FFD700;
  font-size: 14px;
}

/* 历史记录 */
.history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.history-content {
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  border-radius: 24px 24px 0 0;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.history-header h3 {
  font-size: 18px;
}

.btn-close {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}

.history-list {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  overflow-y: auto;
  max-height: calc(80vh - 80px);
}

.history-item img {
  width: 100%;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.history-item img:hover {
  transform: scale(1.05);
}

.history-empty {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 60px;
  display: block;
  margin-bottom: 15px;
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 480px) {
  .processing-steps {
    gap: 15px;
  }
  
  .process-item span:last-child {
    font-size: 11px;
  }
  
  .template-card {
    width: 100px;
  }
  
  .card-preview {
    height: 80px;
  }
  
  .card-emoji {
    font-size: 40px;
  }
}
</style>