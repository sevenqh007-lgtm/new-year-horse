<template>
  <div class="horoscope">
    <!-- 顶部统计跑马灯 -->
    <div class="marquee">
      <div class="marquee-content">
        🐴 马年运势天机 · 已有 {{ stats.tested }} 人测试 · 运势最高分：{{ stats.highestScore }} · 今日测试：{{ stats.todayTested }} 人
      </div>
    </div>

    <!-- 主视觉 -->
    <div v-if="!showResult" class="hero">
      <div class="horse-container">
        <div class="orbit">
          <span class="orbit-item" v-for="n in 8" :key="n" :style="{ '--delay': n * 0.2 + 's' }">✨</span>
        </div>
        <div class="main-horse">🐴</div>
      </div>
      <h1 class="title">2026马年运势天机</h1>
      <p class="subtitle">输入姓名生日 · AI预测你的马年运势</p>
      <div class="social-proof">
        <span class="proof-item">🎉 已有 {{ formatNumber(stats.tested) }} 人测试</span>
        <span class="proof-item">🔥 平均运势分数：{{ stats.avgScore }}分</span>
      </div>
    </div>

    <!-- 输入表单 -->
    <div v-if="!showResult && !isGenerating" class="form-section">
      <div class="input-group">
        <label>你的名字</label>
        <input 
          v-model="form.name" 
          placeholder="请输入你的名字" 
          maxlength="10"
          @input="validateForm"
        >
      </div>
      
      <div class="input-group">
        <label>出生日期</label>
        <input 
          type="date" 
          v-model="form.birthday"
          @input="validateForm"
        >
      </div>

      <div class="input-group">
        <label>出生时辰</label>
        <select v-model="form.zodiacHour" @change="validateForm">
          <option value="">请选择</option>
          <option value="子">子时 (23:00-01:00)</option>
          <option value="丑">丑时 (01:00-03:00)</option>
          <option value="寅">寅时 (03:00-05:00)</option>
          <option value="卯">卯时 (05:00-07:00)</option>
          <option value="辰">辰时 (07:00-09:00)</option>
          <option value="巳">巳时 (09:00-11:00)</option>
          <option value="午">午时 (11:00-13:00)</option>
          <option value="未">未时 (13:00-15:00)</option>
          <option value="申">申时 (15:00-17:00)</option>
          <option value="酉">酉时 (17:00-19:00)</option>
          <option value="戌">戌时 (19:00-21:00)</option>
          <option value="亥">亥时 (21:00-23:00)</option>
        </select>
      </div>

      <button 
        class="btn-test" 
        :disabled="!isValid || isSubmitting"
        @click="startTest"
      >
        <span v-if="isSubmitting" class="btn-loading">⏳ 正在预测...</span>
        <span v-else class="btn-content">
          <span class="btn-icon">🔮</span>
          <span class="btn-text">开始预测运势</span>
        </span>
      </button>
      
      <p class="tip">💡 真实预测更准确 · 已有 {{ formatNumber(stats.tested) }} 人参与</p>
    </div>

    <!-- 生成中动画 -->
    <div v-if="isGenerating" class="generating">
      <div class="ai-orbital">
        <div class="orb">
          <span class="orb-icon">🔮</span>
          <div class="orb-glow"></div>
        </div>
        <div class="satellites">
          <span v-for="n in 6" :key="n" class="satellite" :style="{ '--delay': n * 0.3 + 's' }">⭐</span>
        </div>
      </div>
      <h2 class="gen-title">正在分析你的马年运势...</h2>
      <p class="gen-desc">{{ currentPhase }}</p>
    </div>

    <!-- 结果展示 -->
    <div v-if="showResult" class="result-section">
      <!-- 结果卡片 -->
      <div class="result-card" :class="result.rarity">
        <!-- 顶部装饰 -->
        <div class="card-header">
          <div class="rarity-badge">{{ result.rarityText }}</div>
          <div class="share-hint">长按保存或点击分享</div>
        </div>

        <!-- 核心分数 -->
        <div class="score-section">
          <div class="score-circle">
            <span class="score-number">{{ result.totalScore }}</span>
            <span class="score-label">运势总分</span>
          </div>
          <div class="score-stars">
            <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= result.starLevel }">⭐</span>
          </div>
        </div>

        <!-- 详细运势 -->
        <div class="fortune-details">
          <div class="fortune-item" v-for="(item, key) in result.details" :key="key">
            <div class="fortune-icon">{{ item.icon }}</div>
            <div class="fortune-content">
              <h4>{{ item.title }}</h4>
              <div class="fortune-score">
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: item.score + '%' }"></div>
                </div>
                <span class="score-num">{{ item.score }}分</span>
              </div>
              <p>{{ item.desc }}</p>
            </div>
          </div>
        </div>

        <!-- 关键词和建议 -->
        <div class="key-words">
          <h3>🎯 马年关键词</h3>
          <div class="keywords">
            <span class="keyword" v-for="word in result.keywords" :key="word">{{ word }}</span>
          </div>
        </div>

        <!-- 马年贵人 -->
        <div class="noble">
          <h3>👤 你的马年贵人</h3>
          <p class="noble-desc">2026年，属{{ result.nobleZodiac }}的人会成为你的贵人，多与他们交流合作</p>
        </div>

        <!-- 每月运势简表 -->
        <div class="monthly-chart">
          <h3>📅 马年每月运势趋势</h3>
          <div class="chart">
            <div class="month" v-for="month in 12" :key="month">
              <span class="month-num">{{ month }}月</span>
              <div class="month-bar" :style="{ height: getMonthHeight(month) + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="card-actions">
          <button class="btn-share" @click="shareResult">
            <span class="btn-icon">📤</span>
            <span class="btn-text">分享运势</span>
          </button>
          <button class="btn-rank" @click="showRanking = true">
            <span class="btn-icon">🏆</span>
            <span class="btn-text">查看排名</span>
          </button>
          <button class="btn-test-again" @click="reset">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">重新测试</span>
          </button>
        </div>
      </div>

      <!-- 关注解锁高级 -->
      <div v-if="!isFollowed" class="unlock-card">
        <h3>🔮 解锁马年详细运势</h3>
        <p>关注公众号，立即解锁以下内容：</p>
        <ul class="unlock-features">
          <li>✅ 2026全年12个月详细运势</li>
          <li>✅ 每日吉凶预测与建议</li>
          <li>✅ 你的专属马年开运方法</li>
          <li>✅ 贵人运势深度解析</li>
        </ul>
        <button class="btn-unlock" @click="handleFollow">
          <span class="btn-icon">🔓</span>
          <span class="btn-text">立即解锁</span>
        </button>
      </div>

      <!-- 已解锁高级内容 -->
      <div v-else class="unlocked-card">
        <h3>✅ 高级运势已解锁</h3>
        <p>尊贵会员，感谢您的关注！</p>
      </div>
    </div>

    <!-- 排行榜弹窗 -->
    <transition name="fade">
      <div class="modal-overlay" v-if="showRanking" @click="showRanking = false">
        <div class="ranking-modal" @click.stop>
          <button class="btn-close" @click="showRanking = false">×</button>
          <h2 class="modal-title">🏆 马年运势排行榜</h2>
          
          <div class="my-rank" v-if="showResult">
            <div class="rank-badge">{{ result.totalScore }}分</div>
            <div class="rank-info">
              <p class="rank-title">我的运势分数</p>
              <p class="rank-desc">击败了 {{ result.percentile }}% 的人</p>
            </div>
          </div>

          <div class="rank-list">
            <div class="rank-item" v-for="(item, index) in ranking" :key="index" :class="{ me: item.isMe }">
              <div class="rank-num">{{ index + 1 }}</div>
              <div class="rank-name">{{ item.name }}</div>
              <div class="rank-score">{{ item.score }}分</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 分享弹窗 -->
    <transition name="slide-up">
      <div class="share-toast" v-if="showShareToast">
        <div class="toast-content">
          <span class="toast-icon">🎉</span>
          <span class="toast-text">分享成功！财运+1</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { markAsFollowed } from '../utils/followCheck'

const router = useRouter()

// 表单
const form = ref({
  name: '',
  birthday: '',
  zodiacHour: ''
})

const isValid = ref(false)
const isSubmitting = ref(false)
const isGenerating = ref(false)
const showResult = ref(false)
const showRanking = ref(false)
const showShareToast = ref(false)

// 统计数据
const stats = ref({
  tested: 8234,
  highestScore: 99,
  avgScore: 78,
  todayTested: 456
})

// 当前生成阶段
const currentPhase = ref('正在分析你的姓名五行...')
const phases = [
  '正在分析你的姓名五行...',
  '正在计算你的马年气场...',
  '正在查阅星象吉凶...',
  '正在匹配马年贵人运势...',
  '正在生成你的专属运势...'
]

// 结果数据
const result = ref({})

// 排行榜数据
const ranking = ref([
  { name: '王晓明', score: 99, isMe: false },
  { name: '李美娜', score: 96, isMe: false },
  { name: '张浩然', score: 95, isMe: false },
  { name: '陈思语', score: 94, isMe: false },
  { name: '刘雨桐', score: 93, isMe: false },
  { name: '杨宇航', score: 92, isMe: false },
  { name: '赵梦琪', score: 91, isMe: false },
  { name: '孙志远', score: 90, isMe: false },
  { name: '周佳怡', score: 89, isMe: false },
  { name: '吴天宇', score: 88, isMe: false }
])

const isFollowed = ref(localStorage.getItem('ny_follow_status') === 'true')

// 验证表单
const validateForm = () => {
  isValid.value = form.value.name.trim().length > 0 && 
                form.value.birthday.length > 0
}

// 格式化数字
const formatNumber = (num) => {
  return num.toLocaleString()
}

// 开始测试
const startTest = async () => {
  isSubmitting.value = true
  isGenerating.value = true
  
  // 模拟AI分析过程
  for (let i = 0; i < phases.length; i++) {
    currentPhase.value = phases[i]
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400))
  }
  
  // 生成结果
  generateResult()
  
  isGenerating.value = false
  isSubmitting.value = false
  showResult.value = true
  
  // 更新统计
  stats.value.tested++
  stats.value.todayTested++
}

// 生成运势结果
const generateResult = () => {
  // 基于姓名和生日生成"伪随机"结果
  const seed = form.value.name + form.value.birthday + form.value.zodiacHour
  const hash = simpleHash(seed)
  
  const totalScore = 60 + (hash % 40) // 60-99分
  const starLevel = Math.ceil(totalScore / 20)
  
  // 生成各个维度分数
  const careerScore = 50 + (hash * 7 % 50)
  const wealthScore = 50 + ((hash * 11) % 50)
  const loveScore = 50 + ((hash * 13) % 50)
  const healthScore = 50 + ((hash * 17) % 50)
  const socialScore = 50 + ((hash * 19) % 50)
  
  // 稀有度
  const rarityScore = hash % 100
  let rarity = 'common'
  let rarityText = '普通运势'
  if (rarityScore > 85) {
    rarity = 'epic'
    rarityText = '🌟 稀有运势'
  } else if (rarityScore > 60) {
    rarity = 'rare'
    rarityText = '✨ 珍贵运势'
  } else if (rarityScore > 30) {
    rarity = 'uncommon'
    rarityText = '💫 特殊运势'
  }
  
  // 关键词
  const allKeywords = [
    '马到成功', '一马当先', '马年大吉', '策马奔腾',
    '龙马精神', '马上有钱', '马蹄生辉', '万马奔腾',
    '天马行空', '马年行大运', '马年财运', '快马加鞭'
  ]
  const keywords = []
  keywords.push(allKeywords[hash % allKeywords.length])
  keywords.push(allKeywords[(hash + 3) % allKeywords.length])
  keywords.push(allKeywords[(hash + 7) % allKeywords.length])
  
  // 马年贵人
  const nobleZodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
  const nobleZodiac = nobleZodiacs[hash % 12]
  
  // 击败比例
  const percentile = Math.floor((totalScore - 60) / 40 * 100)
  
  result.value = {
    totalScore,
    starLevel,
    rarity,
    rarityText,
    keywords,
    nobleZodiac,
    percentile,
    details: {
      career: {
        icon: '💼',
        title: '事业运势',
        score: careerScore,
        desc: careerScore >= 80 ? '马年事业突飞猛进，机会多多，宜进取！' :
               careerScore >= 70 ? '事业稳步上升，贵人相助，保持势头！' :
               '上半年平稳，下半年发力，耐心等待时机！'
      },
      wealth: {
        icon: '💰',
        title: '财运运势',
        score: wealthScore,
        desc: wealthScore >= 80 ? '马年财运亨通，挡都挡不住，把握机会！' :
               wealthScore >= 70 ? '财运平稳上升，宜投资理财！' :
               '财源需稳扎稳打，不宜冒进！'
      },
      love: {
        icon: '💕',
        title: '爱情运势',
        score: loveScore,
        desc: loveScore >= 80 ? '桃花运旺盛，单身有缘，已婚甜蜜！' :
               loveScore >= 70 ? '感情顺利，宜主动表达！' :
               '感情需经营，多沟通理解！'
      },
      health: {
        icon: '🏥',
        title: '健康运势',
        score: healthScore,
        desc: healthScore >= 80 ? '精力充沛，活力四射，注意劳逸结合！' :
               healthScore >= 70 ? '健康状况良好，坚持锻炼！' :
               '注意休息，预防小病小痛！'
      },
      social: {
        icon: '👥',
        title: '人缘运势',
        score: socialScore,
        desc: socialScore >= 80 ? '人缘极佳，贵人云集，广结善缘！' :
               socialScore >= 70 ? '人际关系和谐，多参加活动！' :
               '低调做人，高调做事，积累人脉！'
      }
    }
  }
  
  // 添加到排行榜
  ranking.value.push({
    name: form.value.name || '神秘用户',
    score: totalScore,
    isMe: true
  })
  ranking.value.sort((a, b) => b.score - a.score)
}

// 简单哈希函数
const simpleHash = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// 获取每月高度
const getMonthHeight = (month) => {
  const seed = form.value.name + form.value.birthday
  const hash = simpleHash(seed + month)
  return 40 + (hash % 60)
}

// 分享结果
const shareResult = () => {
  showShareToast.value = true
  
  if (navigator.share) {
    navigator.share({
      title: '我的2026马年运势',
      text: `🐴 我的马年运势分数是${result.value.totalScore}分！测测你的马年能跑多快？`,
      url: window.location.href
    })
  } else {
    // 复制分享文案
    const text = `🐴 我的2026马年运势分数是${result.value.totalScore}分！\n🎯 马年关键词：${result.value.keywords.join(' ')}\n\n测测你的马年运势 👇\n${window.location.href}`
    navigator.clipboard.writeText(text)
    alert('已复制分享文案，去粘贴分享吧！')
  }
  
  setTimeout(() => {
    showShareToast.value = false
  }, 3000)
}

// 关注处理
const handleFollow = () => {
  const isWechat = /MicroMessenger/i.test(navigator.userAgent)
  
  if (isWechat) {
    // 在微信环境中,直接跳转关注
    markAsFollowed()
    window.location.href = 'https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=gh_d8c2ff4637f8==&scene=126#wechat_redirect'
  } else {
    // 非微信环境,显示提示
    alert('请使用微信扫码或打开此链接进行测试\n\n或者:\n1. 保存当前链接\n2. 在微信中打开')
  }
}

// 重置
const reset = () => {
  showResult.value = false
  form.value = {
    name: '',
    birthday: '',
    zodiacHour: ''
  }
  isValid.value = false
}

onMounted(() => {
  // 模拟实时统计更新
  setInterval(() => {
    stats.value.tested += Math.floor(Math.random() * 2)
  }, 10000)
})
</script>

<style scoped>
.horoscope {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
  padding-bottom: 40px;
}

.marquee {
  background: linear-gradient(90deg, #8B4513, #CD853F);
  color: #FFD700;
  padding: 12px 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
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
  padding: 50px 20px 30px;
  position: relative;
}

.horse-container {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.orbit {
  position: absolute;
  width: 140px;
  height: 140px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: rotate 10s linear infinite;
}

.orbit-item {
  position: absolute;
  font-size: 20px;
  animation: twinkle 2s ease-in-out infinite;
}

.orbit-item:nth-child(1) { top: 0; left: 50%; transform: translateX(-50%); }
.orbit-item:nth-child(2) { top: 15%; right: 5%; }
.orbit-item:nth-child(3) { right: 0; top: 50%; transform: translateY(-50%); }
.orbit-item:nth-child(4) { bottom: 15%; right: 5%; }
.orbit-item:nth-child(5) { bottom: 0; left: 50%; transform: translateX(-50%); }
.orbit-item:nth-child(6) { bottom: 15%; left: 5%; }
.orbit-item:nth-child(7) { left: 0; top: 50%; transform: translateY(-50%); }
.orbit-item:nth-child(8) { top: 15%; left: 5%; }

@keyframes rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.main-horse {
  font-size: 100px;
  display: block;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.title {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FF6B6B, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.subtitle {
  color: #aaa;
  font-size: 16px;
  margin-bottom: 20px;
}

.social-proof {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.proof-item {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  color: #FFD700;
  font-size: 14px;
}

.form-section {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  color: #fff;
  font-size: 14px;
  margin-bottom: 8px;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 16px;
  transition: all 0.3s;
}

.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.05);
}

.input-group select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23fff' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 20px;
}

.btn-test {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #8B4513 0%, #CD853F 100%);
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.btn-test:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-test:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(139, 69, 19, 0.4);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
  margin-top: 15px;
}

/* 生成中动画 */
.generating {
  text-align: center;
  padding: 60px 20px;
}

.ai-orbital {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 30px;
}

.orb {
  width: 100px;
  height: 100px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s ease-in-out infinite;
}

.orb-icon {
  font-size: 50px;
  z-index: 1;
}

.orb-glow {
  position: absolute;
  width: 150%;
  height: 150%;
  top: -25%;
  left: -25%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
  animation: glow 3s ease-in-out infinite;
}

.satellites {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: rotate 8s linear infinite reverse;
}

.satellite {
  position: absolute;
  font-size: 16px;
}

.satellite:nth-child(1) { top: 0; left: 50%; transform: translateX(-50%); }
.satellite:nth-child(2) { top: 20%; right: 10%; }
.satellite:nth-child(3) { right: 0; top: 50%; transform: translateY(-50%); }
.satellite:nth-child(4) { bottom: 20%; right: 10%; }
.satellite:nth-child(5) { bottom: 0; left: 50%; transform: translateX(-50%); }
.satellite:nth-child(6) { bottom: 20%; left: 10%; }

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.gen-title {
  color: #fff;
  font-size: 24px;
  margin-bottom: 15px;
}

.gen-desc {
  color: #888;
  font-size: 16px;
}

/* 结果卡片 */
.result-section {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 20px;
}

.result-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  padding: 0;
  overflow: hidden;
  border: 2px solid;
  margin-bottom: 20px;
}

.result-card.common {
  border-color: #666;
}

.result-card.uncommon {
  border-color: #3498db;
}

.result-card.rare {
  border-color: #9b59b6;
}

.result-card.epic {
  border-color: #f1c40f;
  box-shadow: 0 0 40px rgba(241, 196, 15, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.03);
}

.rarity-badge {
  background: linear-gradient(135deg, #f1c40f 0%, #e74c3c 100%);
  padding: 6px 16px;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.share-hint {
  color: #666;
  font-size: 12px;
}

.score-section {
  text-align: center;
  padding: 40px 20px;
  background: rgba(255, 215, 0, 0.05);
}

.score-circle {
  width: 150px;
  height: 150px;
  margin: 0 auto 15px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.05));
  border: 3px solid #FFD700;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.score-number {
  font-size: 48px;
  font-weight: bold;
  color: #FFD700;
}

.score-label {
  color: #aaa;
  font-size: 14px;
  margin-top: 5px;
}

.score-stars {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 10px;
}

.star {
  font-size: 24px;
  opacity: 0.3;
  filter: grayscale(1);
}

.star.filled {
  opacity: 1;
  filter: none;
  animation: star-pulse 0.5s ease;
}

@keyframes star-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.fortune-details {
  padding: 20px;
}

.fortune-item {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.fortune-item:last-child {
  border-bottom: none;
}

.fortune-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.fortune-content {
  flex: 1;
}

.fortune-content h4 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 10px;
}

.fortune-score {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.score-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FF6B6B);
  border-radius: 4px;
  transition: width 1s ease;
}

.score-num {
  color: #FFD700;
  font-weight: bold;
  font-size: 14px;
  min-width: 40px;
}

.fortune-content p {
  color: #888;
  font-size: 14px;
  line-height: 1.6;
}

.key-words {
  padding: 20px;
  background: rgba(255, 215, 0, 0.05);
}

.key-words h3 {
  color: #FFD700;
  font-size: 16px;
  margin-bottom: 15px;
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.keyword {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 107, 107, 0.2));
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  color: #FFD700;
  font-size: 14px;
}

.noble {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.noble h3 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 10px;
}

.noble-desc {
  color: #888;
  font-size: 14px;
  line-height: 1.6;
}

.monthly-chart {
  padding: 20px;
}

.monthly-chart h3 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 20px;
}

.chart {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 120px;
}

.month {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.month-num {
  color: #888;
  font-size: 10px;
}

.month-bar {
  width: 100%;
  background: linear-gradient(180deg, #FFD700, #FF6B6B);
  border-radius: 4px 4px 0 0;
  min-height: 20%;
  transition: height 0.5s ease;
}

.card-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-share,
.btn-rank,
.btn-test-again {
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-share {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
}

.btn-rank {
  background: linear-gradient(135deg, #f1c40f 0%, #e74c3c 100%);
  color: white;
}

.btn-test-again {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #888;
}

.btn-share:hover,
.btn-rank:hover {
  transform: translateY(-2px);
}

.btn-test-again:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

/* 解锁卡片 */
.unlock-card,
.unlocked-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  border: 2px solid;
}

.unlock-card {
  border-color: #e74c3c;
}

.unlocked-card {
  border-color: #27ae60;
}

.unlock-card h3 {
  color: #FFD700;
  font-size: 20px;
  margin-bottom: 10px;
}

.unlock-card p,
.unlocked-card p {
  color: #888;
  font-size: 14px;
  margin-bottom: 15px;
}

.unlock-features {
  text-align: left;
  color: #aaa;
  font-size: 14px;
  line-height: 2;
  margin-bottom: 20px;
  list-style: none;
  padding: 0;
}

.unlock-features li {
  padding-left: 25px;
  position: relative;
}

.unlock-features li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #FFD700, #FF6B6B);
  border-radius: 50%;
}

.btn-unlock {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.btn-unlock:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
}

/* 排行榜弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.ranking-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.btn-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #aaa;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.modal-title {
  color: #FFD700;
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
  padding-top: 10px;
}

.my-rank {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.05));
  padding: 20px;
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.rank-badge {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f1c40f 0%, #e74c3c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  flex-shrink: 0;
}

.rank-info p {
  margin: 5px 0;
}

.rank-title {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.rank-desc {
  color: #888;
  font-size: 14px;
}

.rank-list {
  padding: 0 20px 20px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.rank-item.me {
  background: rgba(255, 215, 0, 0.1);
  padding: 15px;
  margin: 0 -20px;
  border-radius: 10px;
  border: 2px solid #FFD700;
}

.rank-num {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFD700, #FF6B6B);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a2e;
  font-weight: bold;
  font-size: 16px;
}

.rank-name {
  flex: 1;
  color: #fff;
  font-size: 16px;
}

.rank-score {
  color: #FFD700;
  font-weight: bold;
  font-size: 18px;
}

/* 分享提示 */
.share-toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
}

.toast-content {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 15px 25px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 30px rgba(39, 174, 96, 0.4);
}

.toast-icon {
  font-size: 24px;
}

.toast-text {
  font-size: 16px;
  font-weight: bold;
}

/* 动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s;
}

.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
