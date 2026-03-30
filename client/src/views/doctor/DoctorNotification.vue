<template>
  <div class="notification-page">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <div class="nav-back" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </div>
      <span class="nav-title">通知设置</span>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 提醒设置 -->
    <section class="settings-section">
      <div class="info-card">
        <div class="info-row">
          <div class="row-left">
            <span class="info-label">预警推送通知</span>
            <span class="info-desc">收到高危预警时立即推送</span>
          </div>
          <van-switch v-model="alertNotify" size="20" />
        </div>
        <div class="info-row">
          <div class="row-left">
            <span class="info-label">审核任务提醒</span>
            <span class="info-desc">有新的审核任务时提醒</span>
          </div>
          <van-switch v-model="reviewNotify" size="20" />
        </div>
        <div class="info-row last">
          <div class="row-left">
            <span class="info-label">患者消息通知</span>
            <span class="info-desc">收到患者消息时通知</span>
          </div>
          <van-switch v-model="msgNotify" size="20" />
        </div>
      </div>
    </section>

    <!-- 免打扰时段 -->
    <section class="settings-section">
      <div class="section-header">
        <span class="section-title">免打扰</span>
      </div>
      <div class="info-card">
        <div class="info-row last">
          <div class="row-left">
            <span class="info-label">夜间免打扰</span>
            <span class="info-desc">22:00 - 07:00 不推送通知</span>
          </div>
          <van-switch v-model="dndMode" size="20" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const alertNotify = ref(true)
const reviewNotify = ref(true)
const msgNotify = ref(true)
const dndMode = ref(false)
</script>

<style scoped>
.notification-page {
  min-height: 100vh;
  background: #F2F5FA;
  padding-bottom: env(safe-area-inset-bottom);
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #F2F5FA;
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1A2238;
  border-radius: 12px;
}
.nav-back:active {
  background: rgba(57, 108, 255, 0.08);
}
.nav-back svg {
  width: 20px;
  height: 20px;
}
.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #1A2238;
}
.nav-placeholder {
  width: 36px;
}

.settings-section {
  padding: 0 16px;
  margin-bottom: 8px;
}
.section-header {
  padding: 16px 0 10px;
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #8A9AC3;
  letter-spacing: 0.5px;
}
.info-card {
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  margin-top: 8px;
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #E8ECF4;
}
.info-row.last {
  border-bottom: none;
}
.row-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-label {
  font-size: 15px;
  color: #1A2238;
  font-weight: 500;
}
.info-desc {
  font-size: 12px;
  color: #8A9AC3;
}
</style>
