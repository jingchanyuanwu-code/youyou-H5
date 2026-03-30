<template>
  <div class="me-page">
    <!-- 顶部标题栏 -->
    <div class="page-title-bar">
      <span class="page-title-text">我的</span>
      <div class="settings-btn" @click="router.push('/d/settings')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </div>
    </div>

    <!-- 个人信息卡片 -->
    <div class="profile-card">
      <div class="profile-main" @click="router.push('/d/profile')">
        <img :src="doctor?.avatar || defaultAvatar" class="profile-avatar" />
        <div class="profile-info">
          <div class="profile-name-row">
            <p class="profile-name">{{ doctor?.name || '医生' }}</p>
            <span class="profile-title-tag">{{ doctor?.title || '主治医师' }}</span>
          </div>
          <p class="profile-sub">泰达国际心血管病医院 · 心内科</p>
        </div>
      </div>
      <div class="card-icon-btn" @click="showCardPopup = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      </div>
    </div>

    <!-- 执业数据 -->
    <div class="stats-grid">
      <div class="stat-tile">
        <span class="stat-value">{{ practiceStats.guardDays }}</span>
        <span class="stat-label">累计守护天数</span>
      </div>
      <div class="stat-tile">
        <span class="stat-value">{{ practiceStats.patientCount }}</span>
        <span class="stat-label">管理患者数</span>
      </div>
      <div class="stat-tile">
        <span class="stat-value">{{ practiceStats.recoveryRate }}%</span>
        <span class="stat-label">康复达标率</span>
      </div>
      <div class="stat-tile">
        <span class="stat-value">{{ practiceStats.alertInterventionCount }}+</span>
        <span class="stat-label">处置预警数</span>
      </div>
    </div>

    <!-- 快捷链接 -->
    <div class="links-card">
      <div class="link-item" @click="router.push('/d/income')">
        <div class="link-icon link-icon-amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <span class="link-text">我的收入</span>
        <svg class="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="link-divider"></div>
      <div class="link-item" @click="router.push('/d/settings')">
        <div class="link-icon link-icon-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span class="link-text">账号安全</span>
        <svg class="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="link-divider"></div>
      <div class="link-item" @click="router.push('/d/notification')">
        <div class="link-icon link-icon-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <span class="link-text">通知设置</span>
        <svg class="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="link-divider"></div>
      <div class="link-item">
        <div class="link-icon link-icon-gray">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span class="link-text">隐私协议</span>
        <svg class="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>

    <!-- 名片弹窗 -->
    <van-popup v-model:show="showCardPopup" position="bottom" round :style="{ maxHeight: '85vh' }">
      <div class="card-popup">
        <div class="popup-bar"></div>
        <div class="popup-header">
          <h3 class="popup-title">我的名片</h3>
        </div>

        <div class="qr-card">
          <div class="mode-switcher">
            <div
              v-for="tab in qrTabs"
              :key="tab.value"
              :class="['switch-btn', { active: activeQrTab === tab.value }]"
              @click="switchQrTab(tab.value)"
            >
              {{ tab.label }}
            </div>
            <div class="switch-cursor" :style="{ left: activeQrTab === 'bind' ? '2px' : 'calc(50% + 2px)' }"></div>
          </div>

          <div class="qr-content" :class="activeQrTab">
            <div v-if="activeQrTab === 'activity' && activities.length > 0" class="activity-info" @click="activities.length > 1 && (showActivityPicker = true)">
              <span class="act-name">{{ currentActivity?.name || '默认活动' }}</span>
              <van-icon name="arrow-down" v-if="activities.length > 1" />
            </div>

            <div class="qr-wrapper" :class="activeQrTab">
              <img v-if="qrCode" :src="qrCode" class="qr-img" />
              <van-loading v-else type="spinner" size="44" color="#396CFF" />
            </div>

            <p class="qr-hint">{{ activeQrTab === 'bind' ? '扫码下载呦呦并绑定医生' : '扫码领取权益并绑定医生' }}</p>
            <p class="save-tip">长按二维码可直接保存相册</p>
          </div>
        </div>

        <div class="badge-footer">
          <van-icon name="shield-o" />
          <span>呦呦医生专业认证 · 数字工牌</span>
        </div>
      </div>
    </van-popup>

    <!-- 活动选择弹窗 -->
    <van-popup v-model:show="showActivityPicker" position="bottom" round>
      <van-picker :columns="activityColumns" @confirm="onActivityConfirm" @cancel="showActivityPicker = false" />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getProfile, getBindQrCode, getActivityQrCode, getActivities,
  getPracticeStats,
} from '@/api'
import type { Doctor, Activity, PracticeStats } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const defaultAvatar = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face'

const doctor = ref<Doctor | null>(null)
const practiceStats = ref<PracticeStats>({ guardDays: 0, patientCount: 0, recoveryRate: 0, alertInterventionCount: 0 })

// 名片弹窗
const showCardPopup = ref(false)
const qrCode = ref('')
const activeQrTab = ref<'bind' | 'activity'>('bind')
const activities = ref<Activity[]>([])
const selectedActivityId = ref<number | null>(null)
const currentActivity = ref<Activity | null>(null)
const showActivityPicker = ref(false)

const qrTabs = [
  { label: '个人名片', value: 'bind' as const },
  { label: '专项活动', value: 'activity' as const },
]

const activityColumns = computed(() => activities.value.map(a => ({ text: a.name, value: a.id })))

const switchQrTab = (tab: 'bind' | 'activity') => {
  if (tab === 'activity' && activeQrTab.value === 'bind' && activities.value.length > 0) {
    if (!selectedActivityId.value) {
      selectedActivityId.value = activities.value[0].id
    }
  }
  activeQrTab.value = tab
}

const loadBindQr = async () => {
  try {
    const res = await getBindQrCode() as any
    qrCode.value = res.qrCode
  } catch { /* handled */ }
}

const loadActivityQr = async (activityId?: number) => {
  try {
    const res = await getActivityQrCode(activityId) as any
    qrCode.value = res.qrCode
    currentActivity.value = res.activity
    if (!selectedActivityId.value && res.activity) {
      selectedActivityId.value = res.activity.id
    }
  } catch {
    qrCode.value = ''
    currentActivity.value = null
  }
}

const loadActivities = async () => {
  try {
    const res = await getActivities() as unknown as Activity[]
    activities.value = res
  } catch { /* handled */ }
}

const onActivityConfirm = ({ selectedOptions }: any) => {
  const sel = selectedOptions[0]
  if (sel) {
    selectedActivityId.value = sel.value
    activeQrTab.value = 'activity'
    loadActivityQr(sel.value)
  }
  showActivityPicker.value = false
}

watch(activeQrTab, (val) => {
  qrCode.value = ''
  if (val === 'bind') loadBindQr()
  else loadActivityQr(selectedActivityId.value || undefined)
})

watch(showCardPopup, (val) => {
  if (val) {
    qrCode.value = ''
    activeQrTab.value = 'bind'
    loadBindQr()
    loadActivities()
  }
})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const loadData = async () => {
  try {
    const res = await getProfile() as unknown as Doctor
    doctor.value = res
    userStore.setDoctor(res)
  } catch { /* ignore */ }

  try {
    const stats = await getPracticeStats() as any
    if (stats) practiceStats.value = stats
  } catch { /* ignore */ }
}

onMounted(loadData)
</script>

<style scoped>
.me-page {
  min-height: 100vh;
  background: #F2F5FA;
  padding: 0 16px 24px;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
}

/* ========== 顶部标题栏 ========== */
.page-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0 8px;
}
.page-title-text {
  font-size: 20px;
  font-weight: 800;
  color: #1A2238;
  letter-spacing: -0.3px;
}
.settings-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8A9AC3;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.15s;
}
.settings-btn:active {
  background: rgba(57, 108, 255, 0.08);
  color: #396CFF;
}
.settings-btn svg {
  width: 20px;
  height: 20px;
}

/* ========== 个人信息卡片 ========== */
.profile-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #396CFF;
  border-radius: 24px;
  margin-bottom: 16px;
  box-shadow: 0 12px 24px -8px rgba(57, 108, 255, 0.5);
}
.profile-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}
.profile-info { min-width: 0; }
.profile-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}
.profile-title-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  white-space: nowrap;
}
.profile-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  margin: 3px 0 0;
}
.card-icon-btn {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.card-icon-btn:active {
  background: rgba(255, 255, 255, 0.3);
}
.card-icon-btn svg {
  width: 26px;
  height: 26px;
  color: #fff;
}

/* ========== 执业数据 ========== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.stat-tile {
  background: #fff;
  border-radius: 24px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #396CFF;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.stat-label {
  font-size: 11px;
  color: #8A9AC3;
  font-weight: 500;
}

/* ========== 快捷链接 ========== */
.links-card {
  background: #fff;
  border-radius: 24px;
  padding: 4px 0;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.15s;
}
.link-item:active {
  background: #F9FAFB;
}
.link-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.link-icon svg {
  width: 16px;
  height: 16px;
}
.link-icon-amber { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
.link-icon-blue { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
.link-icon-green { background: rgba(32, 201, 151, 0.1); color: #20C997; }
.link-icon-gray { background: rgba(138, 154, 195, 0.1); color: #8A9AC3; }
.link-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1A2238;
}
.link-arrow {
  width: 16px;
  height: 16px;
  color: #B4C0DC;
  flex-shrink: 0;
}
.link-divider {
  height: 1px;
  background: #E8ECF4;
  margin: 0 20px;
}

/* ========== 退出登录 ========== */
.logout-section {
  margin-top: 8px;
  padding-bottom: 16px;
}
.logout-btn {
  width: 100%;
  padding: 14px;
  background: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  color: #FF4C61;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.logout-btn:active {
  background: #FEF2F2;
  transform: scale(0.98);
}

/* ========== 名片弹窗 ========== */
.card-popup {
  padding: 12px 20px 24px;
  max-height: 85vh;
  overflow-y: auto;
}
.popup-bar {
  width: 36px;
  height: 4px;
  background: #E5E7EB;
  border-radius: 2px;
  margin: 0 auto 16px;
}
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.popup-title {
  font-size: 18px;
  font-weight: 800;
  color: #1A2238;
  margin: 0;
}
.qr-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.mode-switcher {
  display: flex;
  background: #E8ECF4;
  border-radius: 12px;
  padding: 3px;
  position: relative;
  margin-bottom: 18px;
}
.switch-btn {
  flex: 1;
  text-align: center;
  font-size: 13px;
  padding: 9px 0;
  z-index: 2;
  color: #8A9AC3;
  transition: color 0.3s;
  cursor: pointer;
}
.switch-btn.active {
  color: #1A2238;
  font-weight: 600;
}
.switch-cursor {
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: calc(50% - 3px);
  background: #ffffff;
  border-radius: 10px;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.qr-content {
  text-align: center;
}
.activity-info {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  color: #8A9AC3;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.qr-wrapper {
  background: #F9FAFB;
  padding: 12px;
  border-radius: 16px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 220px;
  min-height: 220px;
}
.qr-img {
  width: 196px;
  height: 196px;
  display: block;
}
.qr-hint {
  margin-top: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #1A2238;
}
.save-tip {
  font-size: 11px;
  color: #8A9AC3;
  margin-top: 4px;
}
.badge-footer {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  color: #B4C0DC;
  font-size: 11px;
  letter-spacing: 1px;
}
</style>
