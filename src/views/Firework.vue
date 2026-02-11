<template>
  <div class="firework-page">
    <canvas ref="canvas" id="fireworkCanvas"></canvas>

    <div class="overlay">
      <div class="header">
        <button class="btn-back" @click="$router.back()">←</button>
        <h2>🎆 马年烟花许愿</h2>
      </div>

      <div class="wish-input" v-if="!isFiring">
        <input
            v-model="wishText"
            type="text"
            placeholder="写下你的新年愿望..."
            maxlength="30"
            @keyup.enter="startFirework"
        >
        <button class="btn-launch" @click="startFirework">
          🎆 放飞愿望
        </button>
      </div>

      <div class="wish-display" v-if="currentWish">
        <div class="wish-text">{{ currentWish }}</div>
        <div class="wish-tip">马年愿望已许下，必定实现！🐴</div>
      </div>

      <div class="controls">
        <button class="btn-auto" :class="{ active: autoFire }" @click="toggleAuto">
          {{ autoFire ? '⏸ 暂停' : '▶ 自动' }}
        </button>
        <button class="btn-clear" @click="clearCanvas">
          🧹 清空
        </button>
      </div>

      <div class="tips">
        <p>💡 点击屏幕任意位置也可以放烟花哦！</p>
        <p>💡 关注公众号解锁更多精美烟花效果！</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvas = ref(null)
const wishText = ref('')
const currentWish = ref('')
const isFiring = ref(false)
const autoFire = ref(false)
let ctx = null
let fireworks = []
let particles = []
let animationId = null
let autoInterval = null

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', resizeCanvas)
  canvas.value.addEventListener('click', handleCanvasClick)
  // 初始放几个烟花
  setTimeout(() => launchFirework(), 500)
  setTimeout(() => launchFirework(), 1500)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  clearInterval(autoInterval)
  window.removeEventListener('resize', resizeCanvas)
  if (canvas.value) {
    canvas.value.removeEventListener('click', handleCanvasClick)
  }
})

const initCanvas = () => {
  const cvs = canvas.value
  cvs.width = window.innerWidth
  cvs.height = window.innerHeight
  ctx = cvs.getContext('2d')
  loop()
}

const resizeCanvas = () => {
  const cvs = canvas.value
  cvs.width = window.innerWidth
  cvs.height = window.innerHeight
}

const handleCanvasClick = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  createExplosion(x, y)
}

const startFirework = () => {
  if (!wishText.value.trim()) {
    alert('请先写下你的愿望哦～')
    return
  }

  isFiring.value = true
  currentWish.value = wishText.value

  // 连续放几个烟花
  setTimeout(() => launchFirework(), 300)
  setTimeout(() => launchFirework(), 800)
  setTimeout(() => launchFirework(), 1300)
  setTimeout(() => launchFirework(), 1800)

  setTimeout(() => {
    isFiring.value = false
    wishText.value = ''
  }, 3000)
}

const launchFirework = (x, y) => {
  const startX = x || Math.random() * canvas.value.width
  const startY = y || canvas.value.height

  fireworks.push({
    x: startX,
    y: startY,
    targetY: Math.random() * canvas.value.height * 0.5 + 100,
    speed: 8 + Math.random() * 4,
    trail: []
  })
}

const createExplosion = (x, y) => {
  const colors = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1',
    '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
  ]
  const particleCount = 80 + Math.random() * 40

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount
    const speed = 2 + Math.random() * 4
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      decay: 0.01 + Math.random() * 0.01,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 3
    })
  }
}

const loop = () => {
  ctx.fillStyle = 'rgba(10, 10, 30, 0.2)'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)

  // 更新烟花
  fireworks = fireworks.filter(fw => {
    fw.y -= fw.speed
    fw.trail.push({ x: fw.x, y: fw.y })
    if (fw.trail.length > 10) fw.trail.shift()

    // 绘制尾迹
    ctx.beginPath()
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2
    fw.trail.forEach((point, i) => {
      ctx.globalAlpha = i / fw.trail.length
      if (i === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.stroke()
    ctx.globalAlpha = 1

    // 到达目标高度爆炸
    if (fw.y <= fw.targetY) {
      createExplosion(fw.x, fw.y)
      return false
    }
    return true
  })

  // 更新粒子
  particles = particles.filter(p => {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.05 // 重力
    p.alpha -= p.decay

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.globalAlpha = p.alpha
    ctx.fill()
    ctx.globalAlpha = 1

    return p.alpha > 0
  })

  animationId = requestAnimationFrame(loop)
}

const toggleAuto = () => {
  autoFire.value = !autoFire.value
  if (autoFire.value) {
    autoInterval = setInterval(() => {
      launchFirework()
    }, 1000)
  } else {
    clearInterval(autoInterval)
  }
}

const clearCanvas = () => {
  fireworks = []
  particles = []
  ctx.fillStyle = 'rgba(10, 10, 30, 1)'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  currentWish.value = ''
}
</script>

<style scoped>
.firework-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

#fireworkCanvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #0a0a1e 0%, #1a1a3e 100%);
}

.overlay {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(10px);
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
  background: linear-gradient(45deg, #FFD700, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.wish-input {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 100;
}

.wish-input input {
  width: 280px;
  padding: 15px 20px;
  border: 2px solid rgba(255,215,0,0.5);
  border-radius: 25px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 16px;
  text-align: center;
  outline: none;
  backdrop-filter: blur(10px);
}

.wish-input input::placeholder {
  color: #888;
}

.wish-input input:focus {
  border-color: #FFD700;
}

.btn-launch {
  display: block;
  margin: 20px auto 0;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #1a1a2e;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-launch:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
}

.wish-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 100;
}

.wish-text {
  font-size: 28px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  margin-bottom: 15px;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.wish-tip {
  font-size: 16px;
  color: #fff;
}

.controls {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
}

.btn-auto, .btn-clear {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-auto.active {
  background: #27ae60;
  border-color: #27ae60;
}

.btn-auto:hover, .btn-clear:hover {
  background: rgba(255,255,255,0.2);
}

.tips {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #888;
  font-size: 12px;
}

.tips p {
  margin-bottom: 5px;
}
</style>
