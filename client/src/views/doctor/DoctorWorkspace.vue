<template>
  <div class="workspace-page">
    <!-- 全屏危急预警遮罩 -->
    <transition name="alert-overlay">
      <div v-if="showCriticalOverlay" class="critical-overlay" @click.self="dismissOverlay">
        <div class="critical-modal">
          <div class="critical-pulse-ring"></div>
          <div class="critical-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 class="critical-title">危急预警</h2>
          <p class="critical-desc">
            您有 <span class="critical-num">{{ criticalAlerts.length }}</span> 位患者出现危急情况，请尽快处理
          </p>
          <div class="critical-patients">
            <div
              v-for="alert in criticalAlerts.slice(0, 3)"
              :key="alert.id"
              class="critical-patient-row"
              @click="handleCriticalClick(alert.id)"
            >
              <div class="cp-left">
                <span class="cp-name">{{ alert.patientName }}</span>
                <span class="cp-age">{{ alert.patientAge }}岁</span>
              </div>
              <div class="cp-right">
                <span class="cp-value">{{ alert.alertValue }}</span>
                <span class="cp-unit">{{ alert.alertUnit }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </div>
          <button class="critical-dismiss" @click="dismissOverlay">我已知悉，查看待办列表</button>
        </div>
      </div>
    </transition>

    <!-- 顶部标题栏 -->
    <div class="page-title-bar">
      <div class="title-placeholder"></div>
      <span class="page-title-text">工作台</span>
      <div class="chat-btn" @click="router.push('/d/messages')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <div v-if="unreadCount > 0" class="chat-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</div>
      </div>
    </div>

    <!-- 预警统计卡片 -->
    <div v-if="dashboard" class="risk-stats">
      <div class="risk-stat-card risk-bp" @click="router.push('/risk-detail/bp')">
        <div class="risk-stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div class="risk-stat-info">
          <span class="risk-stat-label">血压预警</span>
          <div class="risk-stat-nums">
            <span class="risk-stat-today">今日 <b>{{ dashboard.bp.todayCount }}</b></span>
            <span class="risk-stat-week">本周 {{ dashboard.bp.weekCount }}</span>
          </div>
        </div>
      </div>
      <div class="risk-stat-card risk-glucose" @click="router.push('/risk-detail/glucose')">
        <div class="risk-stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
        </div>
        <div class="risk-stat-info">
          <span class="risk-stat-label">血糖预警</span>
          <div class="risk-stat-nums">
            <span class="risk-stat-today">今日 <b>{{ dashboard.glucose.todayCount }}</b></span>
            <span class="risk-stat-week">本周 {{ dashboard.glucose.weekCount }}</span>
          </div>
        </div>
      </div>
      <div class="risk-stat-card risk-hr" @click="router.push('/risk-detail/hr')">
        <div class="risk-stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <div class="risk-stat-info">
          <span class="risk-stat-label">心率预警</span>
          <div class="risk-stat-nums">
            <span class="risk-stat-today">今日 <b>{{ dashboard.hr.todayCount }}</b></span>
            <span class="risk-stat-week">本周 {{ dashboard.hr.weekCount }}</span>
          </div>
        </div>
      </div>
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

    <!-- 待办任务区 -->
    <section class="review-section" ref="reviewSectionRef">
      <!-- 区域标题行 -->
      <div class="section-header">
        <template v-if="reviewListMode === 'pending'">
          <span class="section-title">待审核任务<span class="section-count">({{ reviewCount }})</span></span>
          <span class="section-link" @click="switchReviewMode('completed')">已审核({{ completedCount }})
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </template>
        <template v-else>
          <span class="section-back" @click="switchReviewMode('pending')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            返回待审核
          </span>
          <span class="section-title">已审核<span class="section-count">({{ completedCount }})</span></span>
        </template>
      </div>

      <!-- 分类 Tab（仅待审核模式） -->
      <div v-if="reviewListMode === 'pending'" class="filter-tabs-wrap">
        <div class="filter-tabs" ref="tabsRef" @scroll="onTabsScroll">
          <div
            v-for="tab in reviewFilterTabs"
            :key="tab.value"
            :class="['filter-tab', { active: activeReviewFilter === tab.value }]"
            @click="activeReviewFilter = tab.value"
          >
            {{ tab.label }}<span class="tab-num">({{ tab.count }})</span>
          </div>
        </div>
        <div v-if="showScrollHint" class="scroll-fade"></div>
      </div>

      <!-- 加载 / 空 / 列表 -->
      <div v-if="currentReviewLoading" class="loading-box">
        <van-loading size="24" color="#396CFF" />
      </div>

      <div v-else-if="currentReviewList.length === 0" class="empty-state">
        <p>{{ reviewListMode === 'pending' ? '暂无待审核任务' : '暂无已审核任务' }}</p>
      </div>

      <div v-else class="review-list">
        <template v-for="task in currentReviewList" :key="task.id">
          <!-- ===== 高危预警卡片 (三段式) ===== -->
          <div
            v-if="task.taskType === 'high_risk_alert' && reviewListMode === 'pending'"
            class="monitor-card"
            @click="router.push('/d/review/' + task.id)"
          >
            <!-- TOP: 身份与状态定位区 -->
            <div class="mc-top">
              <div :class="['mc-icon-block', 'mc-icon-' + (task.alertType || 'bp')]">
                <svg v-if="task.alertType === 'bp'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <svg v-else-if="task.alertType === 'glucose'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div class="mc-identity">
                <div class="mc-name-row">
                  <span class="mc-name">{{ task.patientName }}</span>
                  <span class="mc-age">{{ task.patientAge }}岁</span>
                  <span class="mc-tag-red">红色预警</span>
                  <span v-if="isOverdue(task.deadline)" class="mc-tag-overdue">已超时</span>
                </div>
              </div>
              <span class="mc-time">{{ formatAlertTime(task.alertTime) }}</span>
            </div>

            <!-- MIDDLE: 核心数据与趋势区 -->
            <div class="mc-body">
              <div class="mc-data-left">
                <div class="mc-value-row">
                  <span class="mc-value">{{ task.alertValue }}</span>
                  <span class="mc-unit">{{ task.alertUnit }}</span>
                </div>
                <span class="mc-ref">正常参考: {{ referenceRangeShort(task.alertType) }}</span>
              </div>
              <div class="mc-data-right">
                <SparkLine
                  v-if="task.trendData && task.trendData.length > 1"
                  :data="task.trendData"
                  :color="alertColor(task.alertLevel)"
                  :width="100"
                  :height="40"
                  label="近5次趋势"
                />
                <span v-else class="mc-trend-loading">趋势加载中...</span>
              </div>
            </div>
          </div>

          <!-- ===== 非监测类卡片 ===== -->
          <div
            v-else
            class="review-card"
            @click="router.push('/d/review/' + task.id)"
          >
            <div class="card-header">
              <div class="patient-info">
                <span class="patient-name">{{ task.patientName }}</span>
                <span class="patient-meta">{{ genderLabel(task.patientGender) }} · {{ task.patientAge }}岁</span>
              </div>
              <span class="card-time">
                <template v-if="reviewListMode === 'pending'">
                  <span v-if="isOverdue(task.deadline)" class="time-overdue">超时</span>
                  <span v-else>{{ formatAlertTime(task.createdAt) }}</span>
                </template>
                <template v-else>{{ formatDate(task.reviewedAt) }}</template>
              </span>
            </div>
            <div class="card-detail">
              <span class="detail-type">{{ taskTypeLabel(task.taskType) }}</span>
              <template v-if="task.taskType === 'initial_plan'">
                <span v-for="tag in (task.diseaseTags || [])" :key="tag" class="detail-tag">{{ tag }}</span>
                <span v-for="tag in (task.surgeryTags || [])" :key="tag" class="detail-tag">{{ tag }}</span>
                <span v-if="task.dischargeTime" class="detail-sub">出院 {{ task.dischargeTime }}</span>
              </template>
              <template v-else-if="task.taskType === 'high_risk_alert' && task.alertValue">
                <span class="detail-alert">{{ task.alertValue }} {{ task.alertUnit }}</span>
              </template>
              <span v-if="reviewListMode === 'completed' && task.status" :class="['detail-status', 'status-' + task.status]">
                {{ task.status === 'approved' ? '已通过' : '已驳回' }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getPendingReviews, getCompletedReviews, getConversations, getAlertTrend, getProfile, getBindQrCode, getActivityQrCode, getActivities, getRiskDashboard } from '@/api'
import type { ReviewTask, TrendPoint, Doctor, Activity, RiskDashboard } from '@/api'
import SparkLine from '@/components/SparkLine.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const defaultAvatar = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face'
const doctor = ref<Doctor | null>(null)
const dashboard = ref<RiskDashboard | null>(null)

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

const loadQrActivities = async () => {
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
    loadQrActivities()
  }
})

const reviews = ref<ReviewTask[]>([])
const reviewCount = ref(0)
const completedReviews = ref<ReviewTask[]>([])
const completedCount = ref(0)
const completedLoading = ref(false)
const reviewLoading = ref(true)
const unreadCount = ref(0)
const showCriticalOverlay = ref(false)

// 危急预警（danger级别）
const criticalAlerts = computed(() =>
  reviews.value.filter(t => t.taskType === 'high_risk_alert' && t.alertLevel === 'danger')
)

const dismissOverlay = () => {
  showCriticalOverlay.value = false
}

const handleCriticalClick = (id: number) => {
  showCriticalOverlay.value = false
  router.push('/d/review/' + id)
}

// 待审核分类筛选
const activeReviewFilter = ref('high_risk_alert')
const reviewListMode = ref<'pending' | 'completed'>('pending')
const tabsRef = ref<HTMLElement | null>(null)
const reviewSectionRef = ref<HTMLElement | null>(null)
const showScrollHint = ref(true)

const genderLabel = (g?: string) => {
  if (g === 'male') return '男'
  if (g === 'female') return '女'
  return ''
}

const alertColor = (level?: string) => {
  return level === 'danger' ? '#FF4C61' : '#FFD166'
}

const referenceRangeShort = (type?: string) => {
  if (type === 'bp') return '90-140/60-90'
  if (type === 'glucose') return '3.9-6.1'
  if (type === 'hr') return '60-100'
  return ''
}

const onTabsScroll = () => {
  const el = tabsRef.value
  if (!el) return
  showScrollHint.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

const checkTabsOverflow = () => {
  const el = tabsRef.value
  if (!el) return
  showScrollHint.value = el.scrollWidth > el.clientWidth + 4
}

const switchReviewMode = async (mode: 'pending' | 'completed') => {
  reviewListMode.value = mode
  if (mode === 'completed' && completedReviews.value.length === 0 && !completedLoading.value) {
    completedLoading.value = true
    try {
      const res = await getCompletedReviews() as any
      completedReviews.value = res?.list || []
      completedCount.value = res?.count || 0
    } catch { /* ignore */ }
    completedLoading.value = false
  }
}

const currentReviewLoading = computed(() => {
  return reviewListMode.value === 'pending' ? reviewLoading.value : completedLoading.value
})

const currentReviewList = computed(() => {
  return reviewListMode.value === 'pending' ? filteredReviews.value : completedReviews.value
})

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const taskTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    high_risk_alert: '红色预警',
    plan_adjustment: '计划变更',
    initial_plan: '患者入组',
    monthly_report: '周报审核',
  }
  return map[type] || '其他'
}

// 各类型数量统计
const reviewTypeCounts = computed(() => {
  const counts: Record<string, number> = {
    high_risk_alert: 0,
    initial_plan: 0,
    plan_adjustment: 0,
    monthly_report: 0,
    other: 0,
  }
  reviews.value.forEach(t => {
    if (counts[t.taskType] !== undefined) counts[t.taskType]++
    else counts.other++
  })
  return counts
})

const reviewFilterTabs = computed(() => [
  { label: '高危预警', value: 'high_risk_alert', count: reviewTypeCounts.value.high_risk_alert },
  { label: '患者入组', value: 'initial_plan', count: reviewTypeCounts.value.initial_plan },
  { label: '计划变更', value: 'plan_adjustment', count: reviewTypeCounts.value.plan_adjustment },
  { label: '周报审核', value: 'monthly_report', count: reviewTypeCounts.value.monthly_report },
  { label: '其他', value: 'other', count: reviewTypeCounts.value.other },
])

// 按类型排序：高危预警优先
const taskTypePriority: Record<string, number> = {
  high_risk_alert: 0,
  initial_plan: 1,
  plan_adjustment: 2,
  monthly_report: 3,
}

const filteredReviews = computed(() => {
  const list = activeReviewFilter.value === 'other'
    ? reviews.value.filter(t => !['high_risk_alert', 'initial_plan', 'plan_adjustment', 'monthly_report'].includes(t.taskType))
    : reviews.value.filter(t => t.taskType === activeReviewFilter.value)
  return [...list].sort((a, b) => {
    const pa = taskTypePriority[a.taskType] ?? 9
    const pb = taskTypePriority[b.taskType] ?? 9
    if (pa !== pb) return pa - pb
    return a.priority - b.priority
  })
})

const isOverdue = (deadline?: string) => {
  if (!deadline) return false
  return new Date(deadline).getTime() < Date.now()
}

const formatAlertTime = (timeStr?: string) => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffHours < 1) return `${Math.max(1, Math.floor(diffMs / 60000))}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  const isToday = d.toDateString() === now.toDateString()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  if (isToday) return `今天${hours}:${mins}`
  return `${d.getMonth() + 1}/${d.getDate()} ${hours}:${mins}`
}

// 加载近15条监测记录趋势
const loadTrendData = async () => {
  const alertTasks = reviews.value.filter(t => t.taskType === 'high_risk_alert' && t.alertType && t.patientId)
  await Promise.all(alertTasks.map(async (task) => {
    try {
      const trend = await getAlertTrend(task.patientId!, task.alertType!) as unknown as TrendPoint[]
      task.trendData = trend || []
    } catch {
      task.trendData = []
    }
  }))
}

const loadData = async () => {
  // 加载医生信息
  try {
    const res = await getProfile() as unknown as Doctor
    doctor.value = res
    userStore.setDoctor(res)
  } catch { /* ignore */ }

  // 加载预警统计
  try {
    dashboard.value = await getRiskDashboard() as unknown as RiskDashboard
  } catch { /* ignore */ }

  // 加载未读消息数
  try {
    const convRes = await getConversations() as any
    const convList = Array.isArray(convRes) ? convRes : []
    unreadCount.value = convList.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0)
  } catch { /* ignore */ }

  // 加载审核任务
  try {
    const res = await getPendingReviews() as any
    reviews.value = res?.list || []
    reviewCount.value = res?.count || 0
  } catch { /* ignore */ }
  reviewLoading.value = false
  nextTick(checkTabsOverflow)

  // 有危急预警时弹出全屏提醒
  if (criticalAlerts.value.length > 0) {
    showCriticalOverlay.value = true
  }

  // 加载趋势数据
  loadTrendData()
}

onMounted(loadData)
</script>

<style scoped>
/* ========== 页面底色 ========== */
.workspace-page {
  min-height: 100vh;
  background: #F2F5FA;
  padding: 0 16px 24px;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
}

/* ========== 全屏危急预警遮罩 ========== */
.critical-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10, 15, 30, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  backdrop-filter: blur(8px);
}
.alert-overlay-enter-active {
  transition: opacity 0.3s ease;
}
.alert-overlay-enter-active .critical-modal {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.alert-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.alert-overlay-leave-active .critical-modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.alert-overlay-enter-from {
  opacity: 0;
}
.alert-overlay-enter-from .critical-modal {
  opacity: 0;
  transform: scale(0.85) translateY(20px);
}
.alert-overlay-leave-to {
  opacity: 0;
}
.alert-overlay-leave-to .critical-modal {
  opacity: 0;
  transform: scale(0.9);
}
.critical-modal {
  background: #ffffff;
  border-radius: 24px;
  padding: 32px 24px 24px;
  width: 100%;
  max-width: 340px;
  text-align: center;
  position: relative;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15), 0 4px 20px rgba(0, 0, 0, 0.02);
}
.critical-pulse-ring {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 76, 97, 0.12);
  animation: critical-pulse 2s ease-in-out infinite;
}
@keyframes critical-pulse {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
  50% { transform: translateX(-50%) scale(1.3); opacity: 0.3; }
}
.critical-icon {
  width: 56px;
  height: 56px;
  margin: -28px auto 16px;
  background: #FF4C61;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(255, 76, 97, 0.35);
  position: relative;
  z-index: 1;
}
.critical-icon svg {
  width: 28px;
  height: 28px;
  color: #fff;
}
.critical-title {
  font-size: 20px;
  font-weight: 800;
  color: #1A2238;
  margin: 0 0 8px;
}
.critical-desc {
  font-size: 14px;
  color: #8A9AC3;
  line-height: 1.5;
  margin: 0 0 20px;
}
.critical-num {
  font-weight: 800;
  color: #FF4C61;
  font-size: 18px;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
}
.critical-patients {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
.critical-patient-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(255, 76, 97, 0.04);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.critical-patient-row:active {
  background: rgba(255, 76, 97, 0.08);
}
.cp-left {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.cp-name {
  font-size: 14px;
  font-weight: 700;
  color: #1A2238;
}
.cp-age {
  font-size: 12px;
  color: #8A9AC3;
}
.cp-right {
  display: flex;
  align-items: center;
  gap: 2px;
}
.cp-value {
  font-size: 16px;
  font-weight: 800;
  color: #FF4C61;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
  font-variant-numeric: tabular-nums;
}
.cp-unit {
  font-size: 11px;
  color: #FF4C61;
  opacity: 0.6;
  margin-right: 4px;
}
.cp-right svg {
  width: 14px;
  height: 14px;
  color: #B4C0DC;
}
.critical-dismiss {
  width: 100%;
  padding: 14px;
  border: none;
  background: #FF4C61;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 8px 20px rgba(255, 76, 97, 0.3);
}
.critical-dismiss:active {
  transform: scale(0.97);
  box-shadow: 0 4px 12px rgba(255, 76, 97, 0.25);
}

/* ========== 顶部标题栏 ========== */
.page-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0 8px;
}
.title-placeholder {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}
.page-title-text {
  font-size: 18px;
  font-weight: 800;
  color: #1A2238;
  letter-spacing: -0.3px;
}
.chat-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8A9AC3;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.15s;
  position: relative;
  flex-shrink: 0;
}
.chat-btn:active {
  background: rgba(57, 108, 255, 0.06);
  color: #396CFF;
}
.chat-btn svg {
  width: 22px;
  height: 22px;
}
.chat-badge {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #FF4C61;
  color: white;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

/* ========== 预警统计卡片 ========== */
.risk-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.risk-stat-card {
  flex: 1;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.risk-stat-card:active {
  transform: scale(0.97);
}
.risk-stat-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.risk-stat-icon svg {
  width: 14px;
  height: 14px;
}
.risk-bp .risk-stat-icon {
  background: rgba(255, 76, 97, 0.08);
  color: #FF4C61;
}
.risk-glucose .risk-stat-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}
.risk-hr .risk-stat-icon {
  background: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
}
.risk-stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.risk-stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #8A9AC3;
}
.risk-stat-nums {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.risk-stat-today {
  font-size: 11px;
  color: #1A2238;
  font-weight: 500;
}
.risk-stat-today b {
  font-size: 16px;
  font-weight: 800;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
  font-variant-numeric: tabular-nums;
}
.risk-bp .risk-stat-today b { color: #FF4C61; }
.risk-glucose .risk-stat-today b { color: #F59E0B; }
.risk-hr .risk-stat-today b { color: #8B5CF6; }
.risk-stat-week {
  font-size: 10px;
  color: #B4C0DC;
  font-weight: 500;
}

/* ========== 审核区 ========== */
.review-section {
  margin-top: 4px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title {
  font-size: 16px;
  font-weight: 800;
  color: #1A2238;
}
.section-count {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #8A9AC3;
}
.section-link {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  color: #8A9AC3;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s;
}
.section-link:active {
  color: #396CFF;
}
.section-link svg {
  width: 14px;
  height: 14px;
}
.section-back {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  color: #396CFF;
  font-weight: 600;
  cursor: pointer;
}
.section-back svg {
  width: 14px;
  height: 14px;
}

/* ========== 分类 Tab ========== */
.filter-tabs-wrap {
  position: relative;
  margin-bottom: 14px;
}
.filter-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-right: 24px;
}
.filter-tabs::-webkit-scrollbar {
  display: none;
}
.scroll-fade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to right, transparent, #F2F5FA);
  pointer-events: none;
}
.filter-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  font-size: 13px;
  color: #8A9AC3;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s;
  white-space: nowrap;
  font-weight: 500;
}
.filter-tab.active {
  background: #396CFF;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(57, 108, 255, 0.25);
}
.tab-num {
  margin-left: 2px;
  font-size: 12px;
}

.loading-box {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #8A9AC3;
  font-size: 14px;
  font-weight: 500;
}

/* ========== 卡片列表 ========== */
.review-list {
  display: flex;
  flex-direction: column;
}

/* ========== 高危预警卡片 (三段式) ========== */
.monitor-card {
  padding: 0;
  border-radius: 24px;
  cursor: pointer;
  margin-bottom: 12px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 2px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}
.monitor-card:active {
  border-color: rgba(57, 108, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(57, 108, 255, 0.1);
}

/* --- TOP: 身份与状态定位区 --- */
.mc-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 18px 18px 0;
}
.mc-icon-block {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #F2F5FA;
}
.mc-icon-block svg {
  width: 18px;
  height: 18px;
}
.mc-icon-bp {
  color: #396CFF;
}
.mc-icon-glucose {
  color: #396CFF;
}
.mc-icon-hr {
  color: #396CFF;
}
.mc-identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mc-name-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.mc-name {
  font-size: 16px;
  font-weight: 800;
  color: #1A2238;
  white-space: nowrap;
}
.mc-age {
  font-size: 12px;
  color: #8A9AC3;
  white-space: nowrap;
  font-weight: 500;
}
.mc-tag-red {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #FF4C61;
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.02em;
}
.mc-tag-overdue {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 76, 97, 0.08);
  color: #FF4C61;
  font-weight: 600;
  white-space: nowrap;
}
.mc-time {
  font-size: 11px;
  color: #8A9AC3;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
  padding-top: 2px;
}

/* --- MIDDLE: 核心数据与趋势区 --- */
.mc-body {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin: 14px 18px 18px;
  padding: 16px;
  background: #F8FAFC;
  border-radius: 16px;
  position: relative;
}
.mc-data-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.mc-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.mc-value {
  font-size: 28px;
  font-weight: 800;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -1px;
  color: #FF4C61;
}
.mc-unit {
  font-size: 12px;
  color: #8A9AC3;
  font-weight: 600;
  text-transform: uppercase;
}
.mc-ref {
  font-size: 11px;
  color: #8A9AC3;
  white-space: nowrap;
  font-weight: 500;
}
.mc-data-right {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
}
.mc-trend-loading {
  font-size: 11px;
  color: #B4C0DC;
  font-weight: 500;
}

/* ========== 非监测类卡片 ========== */
.review-card {
  padding: 16px 18px;
  background: #ffffff;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  margin-bottom: 10px;
  border: 2px solid transparent;
}
.review-card:active {
  border-color: rgba(57, 108, 255, 0.3);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.patient-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.patient-name {
  font-size: 15px;
  font-weight: 800;
  color: #1A2238;
  white-space: nowrap;
  line-height: 1.3;
}
.patient-meta {
  font-size: 12px;
  color: #8A9AC3;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
}
.card-time {
  font-size: 11px;
  color: #8A9AC3;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.3;
  padding-top: 2px;
  font-weight: 500;
}
.time-overdue {
  color: #FF4C61;
  font-weight: 700;
}

.card-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.detail-type {
  font-size: 13px;
  color: #8A9AC3;
  font-weight: 600;
}
.detail-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(57, 108, 255, 0.06);
  color: #396CFF;
  font-weight: 600;
}
.detail-sub {
  font-size: 11px;
  color: #8A9AC3;
  font-weight: 500;
}
.detail-alert {
  font-size: 13px;
  font-weight: 700;
  color: #FF4C61;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
  font-variant-numeric: tabular-nums;
}
.detail-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
  margin-left: auto;
}
.status-approved {
  background: rgba(16, 185, 129, 0.08);
  color: #10B981;
}
.status-rejected {
  background: rgba(255, 76, 97, 0.08);
  color: #FF4C61;
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
