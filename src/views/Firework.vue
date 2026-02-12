<template>
  <div class="firework-page">
    <!-- 动态星空背景 -->
    <div class="starfield">
      <div v-for="n in 100" :key="n" class="star" :style="getStarStyle(n)"></div>
    </div>
    
    <!-- 月亮 -->
    <div class="moon">
      <div class="moon-glow"></div>
      <div class="moon-surface">🌕</div>
    </div>

    <!-- 烟花画布 -->
    <canvas ref="canvas" class="firework-canvas"></canvas>

    <!-- 城市剪影 -->
    <div class="cityscape">
      <div class="building" v-for="n in 15" :key="n" :style="getBuildingStyle(n)">
        <div class="windows">
          <div v-for="w in 8" :key="w" class="window" :class="{ lit: Math.random() > 0.3 }"></div>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel" :class="{ hidden: isFullscreen }">
      <div class="panel-header">
        <h2>🎆 马年烟花盛典</h2>
        <p class="subtitle">2025 乙巳马年 · 璀璨之夜</p>
      </div>

      <div class="show-info" v-if="currentShow">
        <div class="show-badge">{{ currentShow.name }}</div>
        <div class="show-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: showProgress + '%' }"></div>
          </div>
          <span class="progress-text">{{ Math.floor(showProgress) }}%</span>
        </div>
      </div>

      <div class="controls">
        <button 
          class="btn-control primary" 
          @click="toggleShow"
          :class="{ playing: isPlaying }">
          <span class="btn-icon">{{ isPlaying ? '⏸' : '▶' }}</span>
          <span>{{ isPlaying ? '暂停表演' : '开始表演' }}</span>
        </button>

        <button class="btn-control" @click="launchRandom">
          <span class="btn-icon">🎆</span>
          <span>随机燃放</span>
        </button>

        <button class="btn-control" @click="launchGolden">
          <span class="btn-icon">✨</span>
          <span>金色盛典</span>
        </button>

        <button class="btn-control" @click="launchFinale">
          <span class="btn-icon">🎇</span>
          <span>压轴大戏</span>
        </button>
      </div>

      <div class="show-selector">
        <h4>选择表演主题</h4>
        <div class="theme-grid">
          <button 
            v-for="show in shows" 
            :key="show.id"
            :class="['theme-btn', { active: selectedShow === show.id }]"
            @click="selectShow(show.id)">
            <span class="theme-icon">{{ show.icon }}</span>
            <span class="theme-name">{{ show.name }}</span>
          </button>
        </div>
      </div>

      <div class="stats">
        <div class="stat-item">
          <span class="stat-value">{{ fireworkCount }}</span>
          <span class="stat-label">已燃放</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ particleCount }}</span>
          <span class="stat-label">粒子数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ currentColor }}</span>
          <span class="stat-label">当前色系</span>
        </div>
      </div>
    </div>

    <!-- 全屏按钮 -->
    <button class="btn-fullscreen" @click="toggleFullscreen">
      <span>{{ isFullscreen ? '⛶' : '⛶' }}</span>
    </button>

    <!-- 表演倒计时 -->
    <div class="countdown-overlay" v-if="showCountdown">
      <div class="countdown-number">{{ countdown }}</div>
    </div>

    <!-- 表演标题 -->
    <transition name="fade">
      <div class="show-title-overlay" v-if="showTitle">
        <h1>{{ currentShow?.name }}</h1>
        <p>{{ currentShow?.description }}</p>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const canvas = ref(null)
const ctx = ref(null)
const isPlaying = ref(false)
const isFullscreen = ref(false)
const fireworkCount = ref(0)
const particleCount = ref(0)
const currentColor = ref('多彩')
const showCountdown = ref(false)
const countdown = ref(3)
const showTitle = ref(false)
const selectedShow = ref('grand')
const showProgress = ref(0)
const currentShow = ref(null)

// 烟花系统
let fireworks = []
let particles = []
let stars = []
let animationId = null
let showStartTime = null
let showDuration = 60000 // 60秒表演

// 表演主题配置
const shows = [
  {
    id: 'grand',
    name: '马年盛典',
    icon: '🐴',
    description: '金红交织，马年大吉',
    colors: ['#FFD700', '#FF6B6B', '#FF1744', '#FFA000', '#FF5722'],
    duration: 60000
  },
  {
    id: 'golden',
    name: '金色辉煌',
    icon: '✨',
    description: '金碧辉煌，财运亨通',
    colors: ['#FFD700', '#FFA500', '#FFECB3', '#FFC107', '#FF8F00'],
    duration: 45000
  },
  {
    id: 'rainbow',
    name: '七彩祥云',
    icon: '🌈',
    description: '七彩绚烂，吉祥如意',
    colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
    duration: 50000
  },
  {
    id: 'romantic',
    name: '浪漫之夜',
    icon: '💕',
    description: '粉紫交织，浪漫满溢',
    colors: ['#FF69B4', '#DA70D6', '#FFB6C1', '#DDA0DD', '#FF1493'],
    duration: 40000
  },
  {
    id: 'ocean',
    name: '深海奇缘',
    icon: '🌊',
    description: '蓝绿交织，深邃神秘',
    colors: ['#00CED1', '#40E0D0', '#00BFFF', '#1E90FF', '#00FA9A'],
    duration: 45000
  },
  {
    id: 'finale',
    name: '压轴大戏',
    icon: '🎇',
    description: '万炮齐发，震撼全场',
    colors: ['#FFD700', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF'],
    duration: 30000
  }
]

// 烟花类型
const fireworkTypes = {
  // 标准球形
  sphere: {
    particleCount: 80,
    spread: 1,
    gravity: 0.08,
    friction: 0.96
  },
  // 心形
  heart: {
    particleCount: 60,
    spread: 0.8,
    gravity: 0.06,
    friction: 0.97,
    shape: 'heart'
  },
  // 星形
  star: {
    particleCount: 50,
    spread: 1.2,
    gravity: 0.07,
    friction: 0.96,
    shape: 'star'
  },
  // 环形
  ring: {
    particleCount: 70,
    spread: 0.5,
    gravity: 0.05,
    friction: 0.98,
    shape: 'ring'
  },
  // 双环
  doubleRing: {
    particleCount: 100,
    spread: 0.6,
    gravity: 0.06,
    friction: 0.97,
    shape: 'doubleRing'
  },
  // 柳树型
  willow: {
    particleCount: 120,
    spread: 0.4,
    gravity: 0.12,
    friction: 0.95,
    shape: 'willow'
  },
  // 菊花型
  chrysanthemum: {
    particleCount: 90,
    spread: 0.7,
    gravity: 0.07,
    friction: 0.96,
    shape: 'chrysanthemum'
  },
  // 闪频型
  strobe: {
    particleCount: 40,
    spread: 1.5,
    gravity: 0.04,
    friction: 0.99,
    shape: 'strobe'
  }
}

class Firework {
  constructor(x, targetY, colors, type = 'sphere') {
    this.x = x
    this.y = canvas.value.height
    this.targetY = targetY
    this.speed = 12 + Math.random() * 6
    this.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.1
    this.vx = Math.cos(this.angle) * this.speed
    this.vy = Math.sin(this.angle) * this.speed
    this.colors = colors
    this.type = type
    this.exploded = false
    this.trail = []
    this.hue = Math.random() * 360
    this.brightness = Math.random() * 30 + 70
    this.targetRadius = 1
    this.currentRadius = 1
  }

  update() {
    this.trail.push({ x: this.x, y: this.y, alpha: 1 })
    if (this.trail.length > 10) this.trail.shift()

    this.trail.forEach((t, i) => {
      t.alpha = i / this.trail.length
    })

    this.vx *= 0.99
    this.vy *= 0.99
    this.vy += 0.15

    this.x += this.vx
    this.y += this.vy

    if (this.vy >= 0 || this.y <= this.targetY) {
      this.explode()
      return false
    }
    return true
  }

  explode() {
    const config = fireworkTypes[this.type]
    const particleNum = config.particleCount
    
    // 创建爆炸粒子
    for (let i = 0; i < particleNum; i++) {
      const color = this.colors[Math.floor(Math.random() * this.colors.length)]
      particles.push(new Particle(this.x, this.y, color, this.type, i, particleNum))
    }

    // 创建闪光效果
    for (let i = 0; i < 20; i++) {
      particles.push(new Spark(this.x, this.y, '#FFFFFF'))
    }

    fireworkCount.value++
  }

  draw() {
    ctx.value.beginPath()
    ctx.value.arc(this.x, this.y, 3, 0, Math.PI * 2)
    ctx.value.fillStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`
    ctx.value.fill()

    // 绘制尾迹
    this.trail.forEach((t, i) => {
      ctx.value.beginPath()
      ctx.value.arc(t.x, t.y, 2 * (i / this.trail.length), 0, Math.PI * 2)
      ctx.value.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${t.alpha * 0.5})`
      ctx.value.fill()
    })
  }
}

class Particle {
  constructor(x, y, color, type, index, total) {
    this.x = x
    this.y = y
    this.color = color
    this.type = type
    this.alpha = 1
    this.decay = Math.random() * 0.015 + 0.008
    
    const config = fireworkTypes[type]
    const angle = (Math.PI * 2 / total) * index + Math.random() * 0.1
    const velocity = Math.random() * 4 + 3
    
    // 根据形状调整速度
    if (type === 'heart') {
      const t = (index / total) * Math.PI * 2
      const heartX = 16 * Math.pow(Math.sin(t), 3)
      const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t))
      this.vx = heartX * 0.15
      this.vy = heartY * 0.15
    } else if (type === 'star') {
      const starAngle = Math.floor(index / (total / 5)) * (Math.PI * 2 / 5) + Math.PI / 2
      this.vx = Math.cos(starAngle) * velocity * 1.5
      this.vy = Math.sin(starAngle) * velocity * 1.5
    } else if (type === 'ring') {
      this.vx = Math.cos(angle) * velocity * 0.8
      this.vy = Math.sin(angle) * velocity * 0.8
    } else if (type === 'doubleRing') {
      const radius = index % 2 === 0 ? 1 : 0.5
      this.vx = Math.cos(angle) * velocity * radius
      this.vy = Math.sin(angle) * velocity * radius
    } else if (type === 'willow') {
      this.vx = (Math.random() - 0.5) * 2
      this.vy = -Math.random() * 3 - 2
    } else if (type === 'chrysanthemum') {
      const petal = Math.floor(index / (total / 8))
      const petalAngle = petal * (Math.PI * 2 / 8)
      this.vx = Math.cos(petalAngle) * velocity * (0.8 + Math.random() * 0.4)
      this.vy = Math.sin(petalAngle) * velocity * (0.8 + Math.random() * 0.4)
    } else if (type === 'strobe') {
      this.vx = (Math.random() - 0.5) * velocity * 2
      this.vy = (Math.random() - 0.5) * velocity * 2
      this.decay = 0.05
      this.strobe = true
    } else {
      this.vx = Math.cos(angle) * velocity
      this.vy = Math.sin(angle) * velocity
    }

    this.gravity = config.gravity
    this.friction = config.friction
    this.flicker = Math.random() * 0.2 + 0.8
  }

  update() {
    this.vx *= this.friction
    this.vy *= this.friction
    this.vy += this.gravity
    this.x += this.vx
    this.y += this.vy
    this.alpha -= this.decay

    if (this.strobe) {
      this.alpha = this.alpha > 0.5 ? 1 : 0.3
    }

    return this.alpha > 0
  }

  draw() {
    ctx.value.save()
    ctx.value.globalAlpha = this.alpha * this.flicker
    
    // 发光效果
    ctx.value.shadowBlur = 10
    ctx.value.shadowColor = this.color
    
    ctx.value.beginPath()
    ctx.value.arc(this.x, this.y, 2.5, 0, Math.PI * 2)
    ctx.value.fillStyle = this.color
    ctx.value.fill()
    
    ctx.value.restore()
  }
}

class Spark {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.color = color
    this.vx = (Math.random() - 0.5) * 8
    this.vy = (Math.random() - 0.5) * 8
    this.alpha = 1
    this.decay = Math.random() * 0.05 + 0.02
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.alpha -= this.decay
    return this.alpha > 0
  }

  draw() {
    ctx.value.save()
    ctx.value.globalAlpha = this.alpha
    ctx.value.fillStyle = this.color
    ctx.value.fillRect(this.x, this.y, 2, 2)
    ctx.value.restore()
  }
}

// 表演序列
const showSequences = {
  grand: [
    { time: 0, action: 'launch', count: 3, height: 'high', colors: ['#FFD700', '#FF6B6B'] },
    { time: 2000, action: 'launch', count: 2, height: 'low', colors: ['#FF1744', '#FFA000'] },
    { time: 4000, action: 'barrage', count: 5, interval: 300 },
    { time: 7000, action: 'shape', type: 'heart', colors: ['#FF6B6B', '#FFD700'] },
    { time: 10000, action: 'launch', count: 4, height: 'high', colors: ['#FFD700', '#FFA000', '#FF5722'] },
    { time: 13000, action: 'wave', count: 8, direction: 'left' },
    { time: 16000, action: 'shape', type: 'star', colors: ['#FFD700', '#FFFFFF'] },
    { time: 19000, action: 'barrage', count: 6, interval: 200 },
    { time: 22000, action: 'launch', count: 3, height: 'mixed', colors: ['#FF1744', '#FFD700', '#FFA000'] },
    { time: 25000, action: 'shape', type: 'doubleRing', colors: ['#FFD700', '#FF6B6B', '#FF1744'] },
    { time: 28000, action: 'finale', count: 10 }
  ],
  golden: [
    { time: 0, action: 'launch', count: 5, height: 'high', colors: ['#FFD700', '#FFA500', '#FFECB3'] },
    { time: 3000, action: 'shape', type: 'ring', colors: ['#FFD700', '#FFC107'] },
    { time: 5000, action: 'barrage', count: 8, interval: 250, colors: ['#FFD700', '#FFA500'] },
    { time: 8000, action: 'shape', type: 'willow', colors: ['#FFD700', '#FFFFFF'] },
    { time: 12000, action: 'wave', count: 10, direction: 'alternate' },
    { time: 15000, action: 'shape', type: 'chrysanthemum', colors: ['#FFD700', '#FFA500', '#FF8F00'] },
    { time: 18000, action: 'finale', count: 15 }
  ],
  rainbow: [
    { time: 0, action: 'launch', count: 7, height: 'mixed', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF'] },
    { time: 2000, action: 'shape', type: 'heart', colors: ['#FF69B4', '#DA70D6', '#FF1493'] },
    { time: 5000, action: 'wave', count: 12, direction: 'alternate' },
    { time: 8000, action: 'barrage', count: 10, interval: 200 },
    { time: 12000, action: 'shape', type: 'star', colors: ['#FFD700', '#FF69B4', '#00CED1'] },
    { time: 15000, action: 'launch', count: 8, height: 'high' },
    { time: 18000, action: 'finale', count: 20 }
  ],
  romantic: [
    { time: 0, action: 'launch', count: 3, height: 'high', colors: ['#FF69B4', '#FFB6C1'] },
    { time: 3000, action: 'shape', type: 'heart', colors: ['#FF1493', '#FF69B4', '#FFB6C1'] },
    { time: 6000, action: 'wave', count: 6, direction: 'center' },
    { time: 9000, action: 'shape', type: 'doubleRing', colors: ['#DA70D6', '#FF69B4'] },
    { time: 12000, action: 'barrage', count: 5, interval: 400 },
    { time: 15000, action: 'finale', count: 8 }
  ],
  ocean: [
    { time: 0, action: 'launch', count: 4, height: 'high', colors: ['#00CED1', '#40E0D0', '#00BFFF'] },
    { time: 3000, action: 'shape', type: 'willow', colors: ['#00FA9A', '#40E0D0', '#00CED1'] },
    { time: 6000, action: 'wave', count: 8, direction: 'alternate' },
    { time: 9000, action: 'shape', type: 'ring', colors: ['#1E90FF', '#00BFFF', '#00CED1'] },
    { time: 12000, action: 'barrage', count: 6, interval: 300 },
    { time: 15000, action: 'finale', count: 12 }
  ],
  finale: [
    { time: 0, action: 'launch', count: 8, height: 'high' },
    { time: 1000, action: 'launch', count: 8, height: 'high' },
    { time: 2000, action: 'launch', count: 8, height: 'high' },
    { time: 3000, action: 'launch', count: 10, height: 'mixed' },
    { time: 4000, action: 'barrage', count: 15, interval: 100 },
    { time: 6000, action: 'shape', type: 'heart' },
    { time: 7000, action: 'shape', type: 'star' },
    { time: 8000, action: 'shape', type: 'doubleRing' },
    { time: 9000, action: 'launch', count: 20, height: 'high' }
  ]
}

let showTimer = null
let sequenceIndex = 0

function startShow() {
  if (!currentShow.value) {
    currentShow.value = shows.find(s => s.id === selectedShow.value)
  }
  
  isPlaying.value = true
  showStartTime = Date.now()
  sequenceIndex = 0
  
  const sequence = showSequences[currentShow.value.id]
  
  function runSequence() {
    if (!isPlaying.value) return
    
    const elapsed = Date.now() - showStartTime
    showProgress.value = Math.min((elapsed / currentShow.value.duration) * 100, 100)
    
    // 执行当前时间点的动作
    while (sequenceIndex < sequence.length && sequence[sequenceIndex].time <= elapsed) {
      executeAction(sequence[sequenceIndex])
      sequenceIndex++
    }
    
    if (sequenceIndex < sequence.length) {
      showTimer = setTimeout(runSequence, 100)
    } else if (elapsed < currentShow.value.duration) {
      // 序列结束后随机发射
      if (Math.random() < 0.3) {
        launchRandomFirework()
      }
      showTimer = setTimeout(runSequence, 500)
    } else {
      isPlaying.value = false
      showProgress.value = 0
    }
  }
  
  runSequence()
}

function executeAction(action) {
  const colors = action.colors || currentShow.value.colors
  
  switch (action.action) {
    case 'launch':
      for (let i = 0; i < action.count; i++) {
        setTimeout(() => {
          const x = Math.random() * (canvas.value.width * 0.8) + canvas.value.width * 0.1
          const height = action.height === 'high' ? 150 : action.height === 'low' ? 350 : 200 + Math.random() * 150
          const type = Math.random() > 0.7 ? ['sphere', 'ring', 'chrysanthemum'][Math.floor(Math.random() * 3)] : 'sphere'
          fireworks.push(new Firework(x, height, colors, type))
        }, i * 200)
      }
      break
      
    case 'barrage':
      for (let i = 0; i < action.count; i++) {
        setTimeout(() => {
          const x = (canvas.value.width / (action.count + 1)) * (i + 1)
          const height = 150 + Math.random() * 200
          fireworks.push(new Firework(x, height, colors, 'sphere'))
        }, i * (action.interval || 300))
      }
      break
      
    case 'wave':
      const direction = action.direction
      for (let i = 0; i < action.count; i++) {
        setTimeout(() => {
          let x
          if (direction === 'left') {
            x = canvas.value.width - ((canvas.value.width / action.count) * i)
          } else if (direction === 'alternate') {
            x = i % 2 === 0 ? (canvas.value.width / action.count) * i : canvas.value.width - ((canvas.value.width / action.count) * i)
          } else {
            x = (canvas.value.width / action.count) * i
          }
          fireworks.push(new Firework(x, 200, colors, 'sphere'))
        }, i * 150)
      }
      break
      
    case 'shape':
      const type = action.type
      const positions = [
        { x: canvas.value.width * 0.3, y: 200 },
        { x: canvas.value.width * 0.5, y: 180 },
        { x: canvas.value.width * 0.7, y: 200 }
      ]
      positions.forEach((pos, i) => {
        setTimeout(() => {
          fireworks.push(new Firework(pos.x, pos.y, colors, type))
        }, i * 300)
      })
      break
      
    case 'finale':
      // 万炮齐发
      for (let i = 0; i < action.count; i++) {
        setTimeout(() => {
          const x = Math.random() * canvas.value.width
          const height = 100 + Math.random() * 250
          const types = ['sphere', 'heart', 'star', 'doubleRing', 'chrysanthemum']
          const randomType = types[Math.floor(Math.random() * types.length)]
          fireworks.push(new Firework(x, height, currentShow.value.colors, randomType))
        }, i * 150)
      }
      break
  }
}

function launchRandomFirework() {
  const show = currentShow.value || shows[0]
  const x = Math.random() * (canvas.value.width * 0.8) + canvas.value.width * 0.1
  const height = 150 + Math.random() * 250
  const types = Object.keys(fireworkTypes)
  const type = types[Math.floor(Math.random() * types.length)]
  fireworks.push(new Firework(x, height, show.colors, type))
}

function launchRandom() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => launchRandomFirework(), i * 300)
  }
}

function launchGolden() {
  const goldenColors = ['#FFD700', '#FFA500', '#FFECB3', '#FFC107', '#FF8F00']
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const x = Math.random() * (canvas.value.width * 0.8) + canvas.value.width * 0.1
      const height = 150 + Math.random() * 200
      const type = ['sphere', 'ring', 'willow', 'chrysanthemum'][Math.floor(Math.random() * 4)]
      fireworks.push(new Firework(x, height, goldenColors, type))
    }, i * 250)
  }
}

function launchFinale() {
  const allColors = ['#FFD700', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFA500', '#FF69B4']
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const x = Math.random() * canvas.value.width
      const height = 100 + Math.random() * 300
      const types = ['sphere', 'heart', 'star', 'doubleRing', 'chrysanthemum', 'willow']
      const type = types[Math.floor(Math.random() * types.length)]
      fireworks.push(new Firework(x, height, allColors, type))
    }, i * 100)
  }
}

function toggleShow() {
  if (isPlaying.value) {
    isPlaying.value = false
    clearTimeout(showTimer)
  } else {
    startCountdown()
  }
}

function startCountdown() {
  showCountdown.value = true
  countdown.value = 3
  
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      showCountdown.value = false
      showTitle.value = true
      setTimeout(() => {
        showTitle.value = false
      }, 3000)
      startShow()
    }
  }, 1000)
}

function selectShow(id) {
  selectedShow.value = id
  currentShow.value = shows.find(s => s.id === id)
  if (isPlaying.value) {
    clearTimeout(showTimer)
    startShow()
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function animate() {
  if (!ctx.value) return
  
  // 创建拖尾效果
  ctx.value.fillStyle = 'rgba(15, 15, 30, 0.15)'
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height)
  
  // 更新和绘制烟花
  fireworks = fireworks.filter(fw => {
    const alive = fw.update()
    if (alive) fw.draw()
    return alive
  })
  
  // 更新和绘制粒子
  particles = particles.filter(p => {
    const alive = p.update()
    if (alive) p.draw()
    return alive
  })
  
  particleCount.value = particles.length
  
  animationId = requestAnimationFrame(animate)
}

function getStarStyle(n) {
  return {
    left: Math.random() * 100 + '%',
    top: Math.random() * 60 + '%',
    animationDelay: Math.random() * 3 + 's',
    animationDuration: (Math.random() * 3 + 2) + 's'
  }
}

function getBuildingStyle(n) {
  return {
    height: (40 + Math.random() * 100) + 'px',
    width: (30 + Math.random() * 50) + 'px',
    left: ((n - 1) * 7) + '%'
  }
}

onMounted(() => {
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
  ctx.value = canvas.value.getContext('2d')
  
  currentShow.value = shows[0]
  
  window.addEventListener('resize', () => {
    canvas.value.width = window.innerWidth
    canvas.value.height = window.innerHeight
  })
  
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  clearTimeout(showTimer)
})
</script>

<style scoped>
.firework-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0f0f2e 100%);
  overflow: hidden;
}

/* 星空背景 */
.starfield {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 月亮 */
.moon {
  position: absolute;
  top: 60px;
  right: 80px;
  width: 80px;
  height: 80px;
}

.moon-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255,255,200,0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: moonPulse 4s ease-in-out infinite;
}

@keyframes moonPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.moon-surface {
  font-size: 80px;
  filter: drop-shadow(0 0 20px rgba(255,255,200,0.5));
}

/* 烟花画布 */
.firework-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 城市剪影 */
.cityscape {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  pointer-events: none;
}

.building {
  background: linear-gradient(180deg, #1a1a3e 0%, #0a0a1a 100%);
  border-radius: 4px 4px 0 0;
  position: relative;
}

.windows {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.window {
  width: 6px;
  height: 8px;
  background: #333;
  border-radius: 1px;
  transition: all 0.5s;
}

.window.lit {
  background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

/* 控制面板 */
.control-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 25px;
  min-width: 400px;
  max-width: 500px;
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.5s;
  z-index: 100;
}

.control-panel.hidden {
  transform: translateX(-50%) translateY(120%);
  opacity: 0;
}

.panel-header {
  text-align: center;
  margin-bottom: 20px;
}

.panel-header h2 {
  font-size: 24px;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 5px;
}

.subtitle {
  color: #888;
  font-size: 14px;
}

/* 表演信息 */
.show-info {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
}

.show-badge {
  display: inline-block;
  background: linear-gradient(135deg, #e74c3c, #f39c12);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}

.show-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #e74c3c, #f39c12);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #888;
  min-width: 35px;
}

/* 控制按钮 */
.controls {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.btn-control {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  padding: 14px 20px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-control:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-2px);
}

.btn-control.primary {
  background: linear-gradient(135deg, #e74c3c, #f39c12);
  grid-column: span 2;
}

.btn-control.primary:hover {
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
}

.btn-control.playing {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.btn-icon {
  font-size: 18px;
}

/* 主题选择 */
.show-selector {
  margin-bottom: 20px;
}

.show-selector h4 {
  font-size: 14px;
  color: #888;
  margin-bottom: 12px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.theme-btn {
  background: rgba(255,255,255,0.05);
  border: 2px solid transparent;
  color: #fff;
  padding: 12px 8px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.theme-btn:hover {
  background: rgba(255,255,255,0.1);
}

.theme-btn.active {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.2);
}

.theme-icon {
  font-size: 24px;
}

.theme-name {
  font-size: 12px;
}

/* 统计 */
.stats {
  display: flex;
  justify-content: space-around;
  padding-top: 15px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #FFD700;
}

.stat-label {
  font-size: 11px;
  color: #888;
}

/* 全屏按钮 */
.btn-fullscreen {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s;
  z-index: 100;
}

.btn-fullscreen:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.1);
}

/* 倒计时 */
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  z-index: 200;
}

.countdown-number {
  font-size: 200px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: countdownPulse 1s ease-in-out;
}

@keyframes countdownPulse {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* 表演标题 */
.show-title-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 150;
  pointer-events: none;
}

.show-title-overlay h1 {
  font-size: 60px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 15px;
  text-shadow: 0 0 60px rgba(255, 215, 0, 0.5);
  animation: titleGlow 2s ease-in-out infinite;
}

.show-title-overlay p {
  font-size: 24px;
  color: #fff;
  text-shadow: 0 0 20px rgba(255,255,255,0.5);
}

@keyframes titleGlow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 600px) {
  .control-panel {
    min-width: auto;
    width: calc(100% - 40px);
    padding: 20px;
  }
  
  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .controls {
    grid-template-columns: 1fr;
  }
  
  .btn-control.primary {
    grid-column: span 1;
  }
  
  .moon {
    top: 40px;
    right: 40px;
    transform: scale(0.7);
  }
  
  .show-title-overlay h1 {
    font-size: 40px;
  }
  
  .countdown-number {
    font-size: 120px;
  }
}
</style>