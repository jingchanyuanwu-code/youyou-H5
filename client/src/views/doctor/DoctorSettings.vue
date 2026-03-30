<template>
  <div class="settings-page">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <div class="nav-back" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </div>
      <span class="nav-title">设置</span>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 功能列表 -->
    <section class="settings-section">
      <div class="info-card">
        <div class="info-row" @click="showGuide = true">
          <span class="info-label">使用说明</span>
          <van-icon name="arrow" color="#B4C0DC" />
        </div>
        <div class="info-row last">
          <span class="info-label">关于呦呦</span>
          <div class="info-value">
            <span class="info-version">v1.0.0</span>
            <van-icon name="arrow" color="#B4C0DC" />
          </div>
        </div>
      </div>
    </section>

    <!-- 退出登录 -->
    <div class="logout-section">
      <button class="logout-btn" @click="showLogoutDialog = true">退出登录</button>
    </div>

    <!-- 退出确认弹窗 -->
    <van-dialog v-model:show="showLogoutDialog" title="退出登录" message="确定要退出登录吗？" show-cancel-button @confirm="handleLogout" />

    <!-- 使用说明弹窗 -->
    <van-popup v-model:show="showGuide" position="bottom" round :style="{ maxHeight: '80vh' }">
      <div class="guide-popup">
        <div class="popup-bar"></div>
        <h3 class="guide-title">使用说明</h3>
        <div class="guide-content">
          <div class="guide-item">
            <h4>工作台</h4>
            <p>在工作台可以查看待审核的任务，包括高危预警、患者入组、计划变更和周期报告。点击卡片进入详情进行审核操作。</p>
          </div>
          <div class="guide-item">
            <h4>患者沟通</h4>
            <p>与患者进行在线沟通，查看患者消息并及时回复。支持文字消息交流。</p>
          </div>
          <div class="guide-item">
            <h4>我的名片</h4>
            <p>生成个人二维码名片，患者扫码即可下载呦呦APP并绑定您为主治医生。支持个人名片和专项活动二维码。</p>
          </div>
          <div class="guide-item">
            <h4>患者管理</h4>
            <p>查看已绑定的患者列表，了解患者健康状况和预警信息，进行精细化管理。</p>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const showLogoutDialog = ref(false)
const showGuide = ref(false)

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #F2F5FA;
  padding-bottom: env(safe-area-inset-bottom);
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
}

/* 导航栏 */
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

/* 通用区块 */
.settings-section {
  padding: 8px 16px;
}
.info-card {
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  border-bottom: 1px solid #E8ECF4;
  cursor: pointer;
}
.info-row.last {
  border-bottom: none;
}
.info-row:active {
  background: #F9FAFB;
}
.info-label {
  font-size: 15px;
  color: #1A2238;
  font-weight: 500;
}
.info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8A9AC3;
  font-size: 14px;
}
.info-version {
  font-size: 13px;
  color: #8A9AC3;
}

/* 退出登录 */
.logout-section {
  padding: 24px 16px 40px;
}
.logout-btn {
  width: 100%;
  padding: 14px;
  border: none;
  background: rgba(255, 76, 97, 0.08);
  color: #FF4C61;
  font-size: 15px;
  font-weight: 600;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.15s;
}
.logout-btn:active {
  background: rgba(255, 76, 97, 0.15);
  transform: scale(0.98);
}

/* 使用说明弹窗 */
.guide-popup {
  padding: 12px 20px 32px;
}
.popup-bar {
  width: 36px;
  height: 4px;
  background: #E5E7EB;
  border-radius: 2px;
  margin: 0 auto 16px;
}
.guide-title {
  font-size: 18px;
  font-weight: 800;
  color: #1A2238;
  margin: 0 0 20px;
}
.guide-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.guide-item h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1A2238;
  margin: 0 0 6px;
}
.guide-item p {
  font-size: 13px;
  color: #8A9AC3;
  line-height: 1.6;
  margin: 0;
}
</style>
