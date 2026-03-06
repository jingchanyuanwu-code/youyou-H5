<template>
  <div class="card-page">
    <!-- 背景层 - 与登录页同步 -->
    <div class="warm-bg">
      <div class="bg-gradient"></div>
      <div class="glow glow-tl"></div>
      <div class="glow glow-br"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="card-wrapper">
      <!-- 医生信息头部 -->
      <header class="doc-header">
        <div class="avatar-box" @click="showLogoutDialog = true">
          <img :src="doctor?.avatar || defaultAvatar" class="avatar-img" />
          <div class="status-dot"></div>
        </div>
        <div class="doc-info">
          <p class="name">{{ doctor?.name || '医生' }}</p>
          <p class="title-line">
            <span class="title">{{ doctor?.title || '主治医师' }}</span>
          </p>
          <p class="hospital-dept">{{ doctor?.hospital || '医院' }} · {{ doctor?.department || '科室' }}</p>
        </div>
        <!-- 荣誉勋章挂件 - 流动光效 -->
        <div class="honor-widget">
          <div class="honor-glow"></div>
          <div class="honor-content">
            <div class="honor-shield">
              <van-icon name="shield-o" />
            </div>
            <div class="honor-stats">
              <span class="honor-stat-item">累计守护：<b>1258</b>天</span>
              <span class="honor-stat-item">管理患者：<b>342</b>人</span>
            </div>
          </div>
        </div>
      </header>

      <!-- 光感呼吸线 -->
      <div class="breath-line"></div>

      <!-- 二维码主卡片 -->
      <main class="qr-card">
        <!-- 切换器 -->
        <div class="mode-switcher">
          <div
            v-for="tab in tabs"
            :key="tab.value"
            :class="['switch-btn', { active: activeTab === tab.value }]"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
          </div>
          <div class="switch-cursor" :style="{ left: activeTab === 'bind' ? '2px' : 'calc(50% + 2px)' }"></div>
        </div>

        <!-- 二维码内容 -->
        <div class="qr-content" :class="activeTab">
          <div v-if="activeTab === 'activity' && activities.length > 0" class="activity-info" @click="activities.length > 1 && (showActivityPicker = true)">
            <span class="act-name">{{ currentActivity?.name || '默认活动' }}</span>
            <van-icon name="arrow-down" v-if="activities.length > 1" />
          </div>

          <div class="qr-wrapper" :class="activeTab">
            <img v-if="qrCode" :src="qrCode" class="qr-img" />
            <van-loading v-else type="spinner" size="44" color="#3B82F6" />
          </div>

          <p class="qr-hint">{{ activeTab === 'bind' ? '扫码下载呦呦并绑定医生' : '扫码领取权益并绑定医生' }}</p>
          <p class="save-tip">长按二维码可直接保存相册</p>
        </div>
      </main>

      <!-- 底部背书 -->
      <footer class="badge-footer">
        <van-icon name="shield-o" />
        <span>呦呦医生专业认证 · 数字工牌</span>
      </footer>
    </div>

    <!-- 弹窗 -->
    <van-popup v-model:show="showActivityPicker" position="bottom" round>
      <van-picker :columns="activityColumns" @confirm="onActivityConfirm" @cancel="showActivityPicker = false" />
    </van-popup>
    <van-dialog v-model:show="showLogoutDialog" title="退出登录" message="确定要退出登录吗？" show-cancel-button @confirm="handleLogout" />

    <!-- 底部导航 -->
    <van-tabbar v-model="activeNav" fixed class="warm-tabbar">
      <van-tabbar-item name="card" icon="qr">名片</van-tabbar-item>
      <van-tabbar-item name="patients" icon="friends" @click="router.push('/patients')">患者</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile, getBindQrCode, getActivityQrCode, getActivities } from '@/api'
import type { Doctor, Activity } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const defaultAvatar = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face'

const doctor = ref<Doctor | null>(null)
const qrCode = ref('')
const activeTab = ref<'bind' | 'activity'>('bind')
const activeNav = ref('card')
const showActivityPicker = ref(false)
const showLogoutDialog = ref(false)
const activities = ref<Activity[]>([])
const selectedActivityId = ref<number | null>(null)
const currentActivity = ref<Activity | null>(null)

const tabs = [
  { label: '个人名片', value: 'bind' as const },
  { label: '专项活动', value: 'activity' as const }
]

const activityColumns = computed(() => activities.value.map(a => ({ text: a.name, value: a.id })))

const switchTab = (tab: 'bind' | 'activity') => {
  if (tab === 'activity' && activeTab.value === 'bind' && activities.value.length > 0) {
    if (!selectedActivityId.value) {
      selectedActivityId.value = activities.value[0].id
    }
  }
  activeTab.value = tab
}

const loadProfile = async () => {
  try {
    const res = await getProfile() as unknown as Doctor
    doctor.value = res
    userStore.setDoctor(res)
  } catch { /* handled */ }
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
    activeTab.value = 'activity'
    loadActivityQr(sel.value)
  }
  showActivityPicker.value = false
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

watch(activeTab, (val) => {
  qrCode.value = ''
  if (val === 'bind') loadBindQr()
  else loadActivityQr(selectedActivityId.value || undefined)
})

onMounted(() => {
  loadProfile()
  loadBindQr()
  loadActivities()
})
</script>

<style scoped>
.card-page {
  min-height: 100vh;
  padding: 40px 20px 100px;
  position: relative;
  overflow: hidden;
}

/* 背景层 - 与登录页同步的天蓝色系 */
.warm-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 径向渐变背景 */
.bg-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 120% 100% at 50% 0%,
    #FFFFFF 0%,
    #F5FAFD 40%,
    #E8F4FA 70%,
    #DCF0F8 100%
  );
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.glow-tl {
  top: -150px;
  right: -100px;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(125, 189, 232, 0.25) 0%, transparent 70%);
}

.glow-br {
  bottom: -100px;
  left: -80px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(240, 160, 184, 0.2) 0%, transparent 70%);
}

.grid-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background-image:
    linear-gradient(rgba(125, 189, 232, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 189, 232, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%);
}

.card-wrapper {
  position: relative;
  z-index: 1;
  max-width: 400px;
  margin: 0 auto;
}

/* 医生头部 */
.doc-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  padding: 0 10px;
}

.avatar-box {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.avatar-img {
  width: 68px;
  height: 68px;
  border-radius: 20px;
  background: #FFF;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  object-fit: cover;
  border: 3px solid #FFF;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #22C55E;
  border-radius: 50%;
  border: 2px solid #FFF;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: 0.02em;
  margin: 0;
}

.title-line {
  margin: 4px 0 0;
}

.title {
  font-size: 11px;
  color: #7DBDE8;
  background: rgba(125, 189, 232, 0.1);
  padding: 2px 8px;
  border-radius: 5px;
  font-weight: 600;
}

.hospital-dept {
  font-size: 12px;
  color: #64748B;
  margin: 2px 0 0;
}

/* 荣誉勋章挂件 - 流动光效 */
.honor-widget {
  position: relative;
  flex-shrink: 0;
  padding: 2px;
  border-radius: 14px;
  overflow: hidden;
}

/* 流动边框光效 */
.honor-glow {
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    #7DBDE8 60deg,
    #F59E0B 120deg,
    #7DBDE8 180deg,
    transparent 240deg,
    #D97706 300deg,
    transparent 360deg
  );
  animation: borderFlow 4s linear infinite;
}

@keyframes borderFlow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 挂件内容容器 */
.honor-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
}

/* 琥珀金盾牌 */
.honor-shield {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #FBBF24, #D97706);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
}

/* 数据统计 */
.honor-stats {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.honor-stat-item {
  font-size: 12px;
  color: #64748B;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.honor-stat-item b {
  color: #0F172A;
  font-weight: 700;
}

/* 光感呼吸线 */
.breath-line {
  height: 1px;
  margin: 0 20px 20px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(125, 189, 232, 0.2) 20%,
    rgba(125, 189, 232, 0.3) 50%,
    rgba(125, 189, 232, 0.2) 80%,
    transparent 100%
  );
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* 二维码卡片：琥珀质感 */
.qr-card {
  background: #FFFFFF;
  border-radius: 30px;
  padding: 24px;
  border: 1px solid rgba(251, 191, 36, 0.1);
  box-shadow:
    0 20px 50px rgba(234, 179, 8, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.03);
}

/* 切换器 */
.mode-switcher {
  display: flex;
  background: #F8FAFC;
  border-radius: 14px;
  padding: 3px;
  position: relative;
  margin-bottom: 22px;
}

.switch-btn {
  flex: 1;
  text-align: center;
  font-size: 13px;
  padding: 10px 0;
  z-index: 2;
  color: #94A3B8;
  transition: color 0.3s;
  cursor: pointer;
}

.switch-btn.active {
  color: #1E293B;
  font-weight: 600;
}

.switch-cursor {
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: calc(50% - 3px);
  background: #FFFFFF;
  border-radius: 11px;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 二维码内容 */
.qr-content {
  text-align: center;
}

.activity-info {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 14px;
  color: #F97316;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.qr-wrapper {
  background: #FAFAFA;
  padding: 14px;
  border-radius: 18px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 248px;
  min-height: 248px;
  transition: all 0.3s ease;
}

/* 蓝色边框 - 个人码 */
.qr-wrapper.bind {
  border: 2px solid #3B82F6;
}

/* 珊瑚金边框 - 活动码 */
.qr-wrapper.activity {
  border: 2px solid #F97316;
}

.qr-img {
  width: 220px;
  height: 220px;
  display: block;
}

.qr-hint {
  margin-top: 18px;
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}

.save-tip {
  font-size: 11px;
  color: #94A3B8;
  margin-top: 6px;
  letter-spacing: 0.5px;
}

/* 底部背书 */
.badge-footer {
  margin-top: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  color: #CBD5E1;
  font-size: 11px;
  letter-spacing: 1px;
}

/* 暖色底部导航 - Logo 天蓝色系 */
.warm-tabbar :deep(.van-tabbar) {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border-top: 1px solid rgba(226, 232, 240, 0.5) !important;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.03) !important;
}

.warm-tabbar :deep(.van-tabbar-item) {
  color: #94A3B8 !important;
}

.warm-tabbar :deep(.van-tabbar-item--active) {
  color: #7DBDE8 !important;
}

.warm-tabbar :deep(.van-tabbar-item--active .van-tabbar-item__icon) {
  color: #7DBDE8 !important;
}
</style>
