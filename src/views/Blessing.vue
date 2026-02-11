<template>
  <div class="blessing-page">
    <div class="header">
      <button class="btn-back" @click="$router.back()">←</button>
      <h2>🧧 马年吉祥话</h2>
      <button class="btn-copy" @click="copyBlessing">复制</button>
    </div>

    <div class="content">
      <div class="horse-icon">🐴</div>

      <div class="blessing-card" :class="{ animating: isAnimating }">
        <div class="card-inner">
          <div class="decoration-top">
            <span>🏮</span>
            <span>🏮</span>
            <span>🏮</span>
          </div>

          <h3 class="greeting">{{ currentBlessing.greeting }}</h3>

          <div class="couplets">
            <p class="couplet-up">{{ currentBlessing.up }}</p>
            <p class="couplet-down">{{ currentBlessing.down }}</p>
            <p class="couplet-horizontal">{{ currentBlessing.horizontal }}</p>
          </div>

          <div class="wish-text">
            {{ currentBlessing.wish }}
          </div>

          <div class="decoration-bottom">
            <span>🎊</span>
            <span>🎊</span>
            <span>🎊</span>
          </div>
        </div>
      </div>

      <div class="category-tabs">
        <button
            v-for="cat in categories"
            :key="cat.id"
            :class="{ active: currentCat === cat.id }"
            @click="changeCategory(cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>

      <button class="btn-refresh" @click="nextBlessing">
        🔄 换一句
      </button>

      <div class="share-section">
        <button class="btn-share" @click="share">
          📤 分享给好友
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentCat = ref('all')
const isAnimating = ref(false)

const categories = [
  { id: 'all', name: '全部' },
  { id: 'career', name: '事业' },
  { id: 'family', name: '家庭' },
  { id: 'wealth', name: '财运' }
]

const blessings = [
  {
    id: 1,
    cat: 'all',
    greeting: '马年大吉',
    up: '马到成功开新局',
    down: '龙马精神创辉煌',
    horizontal: '万事如意',
    wish: '新的一年，愿你如骏马奔腾，一往无前！事业蒸蒸日上，家庭幸福美满，身体健康安康！🐴✨'
  },
  {
    id: 2,
    cat: 'career',
    greeting: '事业腾飞',
    up: '一马当先创伟业',
    down: '马不停蹄追梦想',
    horizontal: '前程似锦',
    wish: '祝你在新的一年里，事业如骏马奔腾，勇往直前！职场乘风破浪，大展宏图，再创辉煌！🚀💪'
  },
  {
    id: 3,
    cat: 'family',
    greeting: '家庭幸福',
    up: '阖家欢乐迎马年',
    down: '马年吉祥福满堂',
    horizontal: '幸福安康',
    wish: '愿马年带给您和家人无尽的欢乐与幸福！团团圆圆，其乐融融，岁岁平安，年年有余！🏠❤️'
  },
  {
    id: 4,
    cat: 'wealth',
    greeting: '财源滚滚',
    up: '马上有钱财运旺',
    down: '马年黄金滚滚来',
    horizontal: '财源广进',
    wish: '祝您马年财源广进，金银满屋！事业有成，财运亨通，富甲一方，日进斗金！💰🎊'
  },
  {
    id: 5,
    cat: 'all',
    greeting: '马到功成',
    up: '万马奔腾迎新春',
    down: '金马呈祥庆团圆',
    horizontal: '吉星高照',
    wish: '马年春节，愿你万事如意心想事成！身体健康工作顺利，家庭美满幸福安康！🎉🧧'
  },
  {
    id: 6,
    cat: 'career',
    greeting: '马步青云',
    up: '马跃千山展雄心',
    down: '龙马精神显才华',
    horizontal: '步步高升',
    wish: '新的一年，愿你事业如骏马奔腾，勇往直前！职场一帆风顺，大展宏图，前程似锦！🌟🎯'
  },
  {
    id: 7,
    cat: 'family',
    greeting: '福满马年',
    up: '金马献瑞家兴旺',
    down: '福星高照人安康',
    horizontal: '阖家欢乐',
    wish: '马年新春，愿您的家庭如骏马奔腾，充满活力！家人和睦幸福，健康快乐每一天！👨‍👩‍👧‍👦💕'
  },
  {
    id: 8,
    cat: 'wealth',
    greeting: '金马招财',
    up: '马蹄踏出财富路',
    down: '马背驮来黄金屋',
    horizontal: '财运亨通',
    wish: '祝马年财运亨通，黄金满屋！事业红火，财源广进，富贵荣华，大吉大利！💵🎊'
  }
]

const filteredBlessings = computed(() => {
  if (currentCat.value === 'all') return blessings
  return blessings.filter(b => b.cat === currentCat.value)
})

const currentBlessing = computed(() => {
  return filteredBlessings.value[Math.floor(Math.random() * filteredBlessings.value.length)]
})

onMounted(() => {
  // 自动换祝福语
  setInterval(() => {
    if (!document.hidden) {
      nextBlessing()
    }
  }, 8000)
})

const changeCategory = (catId) => {
  currentCat.value = catId
  animateCard()
}

const nextBlessing = () => {
  animateCard()
}

const animateCard = () => {
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

const copyBlessing = () => {
  const text = `${currentBlessing.value.greeting}\n${currentBlessing.value.up}\n${currentBlessing.value.down}\n${currentBlessing.value.wish}`
  navigator.clipboard.writeText(text).then(() => {
    alert('复制成功！快去发给好友吧～')
  }).catch(() => {
    // 降级处理
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('复制成功！快去发给好友吧～')
  })
}

const share = () => {
  alert('点击右上角"..."分享给好友，一起接好运！')
}
</script>

<style scoped>
.blessing-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
  padding-bottom: 40px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: rgba(0,0,0,0.3);
}

.btn-back {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}

.header h2 {
  font-size: 18px;
  background: linear-gradient(45deg, #FFD700, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.btn-copy {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #1a1a2e;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.content {
  padding: 20px;
  text-align: center;
}

.horse-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.blessing-card {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.2), rgba(192, 57, 43, 0.2));
  border: 2px solid #e74c3c;
  border-radius: 20px;
  padding: 30px 20px;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
}

.blessing-card.animating {
  animation: cardChange 0.3s ease;
}

@keyframes cardChange {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.95); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.card-inner {
  position: relative;
  z-index: 1;
}

.decoration-top, .decoration-bottom {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 30px;
  margin-bottom: 15px;
}

.decoration-bottom {
  margin-top: 15px;
  margin-bottom: 0;
}

.greeting {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 25px;
}

.couplets {
  background: rgba(255,215,0,0.1);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
}

.couplet-up, .couplet-down {
  font-size: 18px;
  color: #fff;
  margin: 10px 0;
  font-weight: 500;
}

.couplet-horizontal {
  font-size: 20px;
  color: #FFD700;
  font-weight: bold;
  margin-top: 15px;
}

.wish-text {
  font-size: 15px;
  color: #ddd;
  line-height: 1.8;
  padding: 0 10px;
}

.category-tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.category-tabs button {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #aaa;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.category-tabs button.active {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
}

.btn-refresh {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 12px 30px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  transition: all 0.3s;
}

.btn-refresh:hover {
  background: rgba(255,255,255,0.2);
}

.share-section {
  margin-top: 20px;
}

.btn-share {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  max-width: 300px;
}

.btn-share:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(231, 76, 60, 0.4);
}
</style>
