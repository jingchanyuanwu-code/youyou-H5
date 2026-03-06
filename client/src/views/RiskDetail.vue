<template>
  <div class="risk-detail-page">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <div class="nav-back" @click="router.back()">
        <van-icon name="arrow-left" />
      </div>
      <div class="nav-title">{{ pageTitle }}</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <div
        :class="['tab-item', { active: activeTab === 'today' }]"
        @click="activeTab = 'today'"
      >
        今日预警
      </div>
      <div
        :class="['tab-item', { active: activeTab === 'week' }]"
        @click="activeTab = 'week'"
      >
        近7日风险
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content">
      <!-- 骨架屏 -->
      <div v-if="loading" class="skeleton-list">
        <div v-for="i in 3" :key="i" class="skeleton-card">
          <div class="sk-avatar"></div>
          <div class="sk-content">
            <div class="sk-line w50"></div>
            <div class="sk-line w70"></div>
            <div class="sk-line w40"></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="patients.length === 0" class="empty">
        <van-icon name="checked" class="empty-icon" />
        <p>暂无{{ activeTab === 'today' ? '今日' : '近7日' }}预警</p>
      </div>

      <!-- 今日预警列表 -->
      <div v-else-if="activeTab === 'today'" class="patient-list">
        <div v-for="patient in patientsWithTodayAlerts" :key="patient.id" class="patient-card">
          <div class="card-header">
            <div class="avatar">{{ patient.name.charAt(0) }}</div>
            <div class="info">
              <div class="name-row">
                <span class="name">{{ patient.name }}</span>
                <span class="age">{{ patient.age }}岁</span>
              </div>
              <span class="phone">{{ maskPhone(patient.phone) }}</span>
            </div>
            <a :href="`tel:${patient.phone}`" class="call-btn" @click.stop>
              <van-icon name="phone-o" />
            </a>
          </div>

          <!-- 今日预警时间线 -->
          <div class="today-alerts">
            <div v-for="(alert, idx) in patient.todayAlerts" :key="idx" class="alert-item">
              <div class="alert-time">{{ formatTime(alert.alertTime) }}</div>
              <div :class="['alert-dot', alert.level]"></div>
              <div class="alert-content">
                <span :class="['alert-value', alert.level]">
                  {{ alert.value }}{{ alert.unit }}
                </span>
                <span class="alert-trend">{{ alert.level === 'danger' ? '↑↑' : '↑' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="patientsWithTodayAlerts.length === 0" class="empty-inline">
          今日暂无预警记录
        </div>
      </div>

      <!-- 近7日风险列表 -->
      <div v-else class="patient-list">
        <div v-for="patient in patients" :key="patient.id" class="patient-card">
          <div class="card-header">
            <div class="avatar">{{ patient.name.charAt(0) }}</div>
            <div class="info">
              <div class="name-row">
                <span class="name">{{ patient.name }}</span>
                <span class="age">{{ patient.age }}岁</span>
                <span class="week-count">{{ patient.weekAlertCount }}次/周</span>
              </div>
              <span class="phone">{{ maskPhone(patient.phone) }}</span>
            </div>
            <a :href="`tel:${patient.phone}`" class="call-btn" @click.stop>
              <van-icon name="phone-o" />
            </a>
          </div>

          <!-- 7日预警分布图 -->
          <div class="week-chart">
            <div class="chart-label">预警分布</div>
            <div class="chart-dots">
              <div
                v-for="(hasAlert, idx) in patient.weekAlertDays"
                :key="idx"
                :class="['day-dot', { alert: hasAlert }]"
              >
                <span class="day-label">{{ dayLabels[idx] }}</span>
              </div>
            </div>
          </div>

          <!-- 最近异常 -->
          <div class="latest-alert">
            <span class="label">最近异常：</span>
            <span :class="['value', patient.latestLevel]">
              {{ patient.latestValue }}{{ patient.latestUnit }}
            </span>
            <span class="time">{{ formatTime(patient.latestAlertTime) }}</span>
          </div>

          <!-- 描述 -->
          <div v-if="patient.description" class="description">
            {{ patient.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getRiskPatients } from '@/api'
import type { RiskPatient } from '@/api'

const router = useRouter()
const route = useRoute()

const alertType = computed(() => route.params.type as 'glucose' | 'bp' | 'hr')
const activeTab = ref<'today' | 'week'>('today')
const patients = ref<RiskPatient[]>([])
const loading = ref(true)

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    glucose: '血糖预警',
    bp: '血压预警',
    hr: '心率预警',
  }
  return map[alertType.value] || '风险预警'
})

// 星期标签
const dayLabels = computed(() => {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const result: string[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    result.push(days[d.getDay()])
  }
  return result
})

// 有今日预警的患者
const patientsWithTodayAlerts = computed(() => {
  return patients.value.filter(p => p.todayAlerts && p.todayAlerts.length > 0)
})

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const loadPatients = async () => {
  loading.value = true
  try {
    patients.value = await getRiskPatients(alertType.value) as unknown as RiskPatient[]
  } catch { /* ignore */ }
  loading.value = false
}

onMounted(() => {
  loadPatients()
})
</script>

<style scoped>
.risk-detail-page {
  min-height: 100vh;
  background: #F7F8FA;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #FFF;
  border-bottom: 1px solid #EBEDF0;
}

.nav-back {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #323233;
  font-size: 18px;
  cursor: pointer;
}
.nav-back:active { background: #F7F8FA; }

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.nav-placeholder { width: 32px; }

/* Tab 栏 */
.tab-bar {
  display: flex;
  background: #FFF;
  padding: 0 16px;
  border-bottom: 1px solid #EBEDF0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  font-size: 14px;
  color: #969799;
  position: relative;
  cursor: pointer;
  transition: color 0.2s;
}

.tab-item.active {
  color: #3B82F6;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #3B82F6;
  border-radius: 2px;
}

/* 内容区域 */
.content {
  padding: 12px 16px;
}

/* 骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skeleton-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #FFF;
  border-radius: 12px;
}
.sk-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.sk-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sk-line {
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.sk-line.w50 { width: 50%; }
.sk-line.w70 { width: 70%; }
.sk-line.w40 { width: 40%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 80px 0;
  color: #9CA3AF;
}
.empty-icon {
  font-size: 48px;
  color: #10B981;
  margin-bottom: 12px;
}

.empty-inline {
  text-align: center;
  padding: 40px;
  color: #9CA3AF;
  font-size: 14px;
}

/* 患者列表 */
.patient-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.patient-card {
  background: #FFF;
  border-radius: 12px;
  padding: 14px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #FFF;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: #1F2937;
}

.age {
  font-size: 13px;
  color: #6B7280;
}

.week-count {
  font-size: 11px;
  padding: 2px 6px;
  background: #FEE2E2;
  color: #DC2626;
  border-radius: 4px;
  margin-left: auto;
}

.phone {
  font-size: 13px;
  color: #9CA3AF;
  font-family: 'SF Mono', Monaco, monospace;
}

.call-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3B82F6;
  font-size: 18px;
  text-decoration: none;
  flex-shrink: 0;
}
.call-btn:active { background: #E5E7EB; }

/* 今日预警时间线 */
.today-alerts {
  padding-left: 12px;
  border-left: 2px solid #E5E7EB;
  margin-left: 8px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  position: relative;
}

.alert-time {
  font-size: 13px;
  color: #6B7280;
  font-family: 'SF Mono', Monaco, monospace;
  width: 50px;
  flex-shrink: 0;
}

.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  left: -17px;
  margin-right: -8px;
}
.alert-dot.danger { background: #EF4444; }
.alert-dot.warning { background: #F59E0B; }

.alert-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.alert-value {
  font-size: 15px;
  font-weight: 600;
  font-family: 'SF Mono', Monaco, monospace;
}
.alert-value.danger { color: #DC2626; }
.alert-value.warning { color: #D97706; }

.alert-trend {
  font-size: 12px;
  color: #DC2626;
}

/* 7日预警分布图 */
.week-chart {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #F9FAFB;
  border-radius: 8px;
  margin-bottom: 12px;
}

.chart-label {
  font-size: 12px;
  color: #6B7280;
  flex-shrink: 0;
}

.chart-dots {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: space-around;
}

.day-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.day-dot::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #E5E7EB;
  transition: background 0.2s;
}

.day-dot.alert::before {
  background: #EF4444;
}

.day-label {
  font-size: 10px;
  color: #9CA3AF;
}

/* 最近异常 */
.latest-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 8px;
}

.latest-alert .label {
  color: #6B7280;
}

.latest-alert .value {
  font-weight: 600;
  font-family: 'SF Mono', Monaco, monospace;
}
.latest-alert .value.danger { color: #DC2626; }
.latest-alert .value.warning { color: #D97706; }

.latest-alert .time {
  color: #9CA3AF;
  margin-left: auto;
}

/* 描述 */
.description {
  font-size: 13px;
  color: #6B7280;
  padding: 10px;
  background: #F9FAFB;
  border-radius: 8px;
  line-height: 1.5;
}
</style>
