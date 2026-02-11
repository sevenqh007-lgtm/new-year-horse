<template>
  <transition name="fade">
    <div class="follow-modal" v-if="show" @click.self="close">
      <div class="modal-content" :class="theme">
        <!-- 顶部装饰 -->
        <div class="decoration">
          <span class="horse">🐴</span>
          <div class="lanterns">
            <span>🏮</span>
            <span>🏮</span>
            <span>🏮</span>
          </div>
        </div>

        <!-- 主要内容 -->
        <div class="main">
          <h2>{{ copy.title }}</h2>
          <p class="subtitle">{{ copy.subtitle }}</p>

          <div class="benefits" v-if="!isFollowed">
            <div class="benefit-item">
              <span class="icon">✅</span>
              <span>无限次生成拜年图</span>
            </div>
            <div class="benefit-item">
              <span class="icon">✅</span>
              <span>20+马年专属模板</span>
            </div>
            <div class="benefit-item">
              <span class="icon">✅</span>
              <span>高清下载无水印</span>
            </div>
          </div>

          <div class="unlimited-badge" v-else>
            <div class="badge-content">
              <span class="crown">👑</span>
              <span class="text">无限会员</span>
              <span class="count">剩余次数：∞</span>
            </div>
          </div>

          <p class="urgency" v-if="copy.urgency">{{ copy.urgency }}</p>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <button class="btn-primary pulse" @click="handleMainAction">
            {{ copy.btnText }}
          </button>

          <button class="btn-secondary" v-if="!isFollowed" @click="close">
            暂不需要
          </button>

          <p class="tip" v-if="!isFollowed">
            💡 关注后返回本页面即可使用
          </p>
        </div>

        <!-- 关闭按钮 -->
        <button class="btn-close" @click="close">×</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { getMarketingCopy, openFollowPage, markAsFollowed, checkReturnFromFollow } from '../utils/followCheck'

const props = defineProps({
  show: Boolean,
  isFollowed: Boolean
})

const emit = defineEmits(['close', 'follow', 'use'])

const copy = computed(() => getMarketingCopy(props.isFollowed))
const theme = computed(() => props.isFollowed ? 'gold-theme' : 'red-theme')

const handleMainAction = () => {
  if (props.isFollowed) {
    emit('use')
  } else {
    emit('follow')
    // 打开关注页面
    openFollowPage()
  }
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.follow-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  width: 100%;
  max-width: 380px;
  position: relative;
  overflow: hidden;
  border: 2px solid;
}

/* 红色主题（未关注） */
.red-theme {
  border-color: #e74c3c;
  box-shadow: 0 20px 60px rgba(231, 76, 60, 0.3);
}

/* 金色主题（已关注） */
.gold-theme {
  border-color: #f1c40f;
  box-shadow: 0 20px 60px rgba(241, 196, 15, 0.3);
}

.decoration {
  text-align: center;
  padding: 30px 0 20px;
  position: relative;
}

.horse {
  font-size: 80px;
  display: block;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.lanterns {
  position: absolute;
  top: 10px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 40px;
  font-size: 30px;
  opacity: 0.6;
}

.lanterns span {
  animation: swing 3s ease-in-out infinite;
}

.lanterns span:nth-child(2) { animation-delay: 1s; }
.lanterns span:nth-child(3) { animation-delay: 2s; }

@keyframes swing {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}

.main {
  padding: 0 30px 20px;
  text-align: center;
}

h2 {
  font-size: 28px;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #FFD700, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #aaa;
  font-size: 16px;
  margin-bottom: 25px;
}

.benefits {
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: left;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  color: #fff;
  font-size: 15px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.benefit-item:last-child {
  border-bottom: none;
}

.icon {
  font-size: 20px;
}

.unlimited-badge {
  background: linear-gradient(135deg, rgba(241, 196, 15, 0.2), rgba(243, 156, 18, 0.2));
  border: 2px solid #f1c40f;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
}

.badge-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.crown {
  font-size: 40px;
}

.text {
  font-size: 20px;
  font-weight: bold;
  color: #f1c40f;
}

.count {
  color: #aaa;
  font-size: 14px;
}

.urgency {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 15px;
  animation: pulse-text 2s infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.actions {
  padding: 0 30px 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.gold-theme .btn-primary {
  background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
  color: #1a1a2e;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
}

.pulse {
  animation: pulse-btn 2s infinite;
}

@keyframes pulse-btn {
  0%, 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
  50% { box-shadow: 0 0 0 15px rgba(231, 76, 60, 0); }
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.3);
  color: #aaa;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  border-color: #fff;
  color: #fff;
}

.tip {
  color: #666;
  font-size: 13px;
  text-align: center;
  margin-top: 10px;
}

.btn-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: none;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-close:hover {
  background: rgba(255,255,255,0.2);
  color: #fff;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>