<template>
  <div class="rp-page">
    <!-- Nav -->
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="nav-title">健康计划</span>
      <button class="nav-btn" @click="showCalendar = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <van-loading type="spinner" size="36" color="#8A7BFE" />
    </div>

    <template v-else-if="planData">
      <!-- ========== 计划变更审核通知 ========== -->
      <div v-if="planData.reviewStatus" class="review-banner" :class="'review-banner--' + planData.reviewStatus.status">
        <template v-if="planData.reviewStatus.status === 'reviewing'">
          <div class="review-icon">⏳</div>
          <div class="review-body">
            <div class="review-title">康复计划变更审核中</div>
            <div class="review-desc">医生正在审核您的康复计划调整方案，审核期间请暂停康复运动，其他任务正常执行。</div>
          </div>
        </template>
        <template v-else-if="planData.reviewStatus.status === 'approved'">
          <div class="review-icon">✅</div>
          <div class="review-body">
            <div class="review-title">计划变更已通过</div>
            <div class="review-desc">医生已审核通过新的康复方案，请查看变更内容。</div>
            <button class="review-view-btn" @click="showChanges = true">查看变更内容</button>
          </div>
        </template>
      </div>

      <!-- ========== 1. 康复计划总览（横向步骤条） ========== -->
      <div class="section plan-section">
        <div class="sec-title">康复第 {{ planData.recoveryDays }} 天</div>
        <!-- 横向步骤条 -->
        <div class="stepper">
          <div
            v-for="(m, i) in planData.milestones"
            :key="m.stage"
            class="step"
            :class="[
              'step--' + m.status,
              { 'step--selected': expandedMilestone === i },
            ]"
            @click="toggleMilestone(i)"
          >
            <!-- 连接线（左侧） -->
            <div v-if="i > 0" class="step-line" :class="{ 'step-line--done': planData.milestones[i - 1].status === 'completed' }"></div>
            <!-- 节点圆 -->
            <div class="step-dot">
              <svg v-if="m.status === 'completed'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span v-else-if="m.status === 'current'" class="step-dot-pulse"></span>
            </div>
            <!-- 连接线（右侧） -->
            <div v-if="i < planData.milestones.length - 1" class="step-line" :class="{ 'step-line--done': m.status === 'completed' }"></div>
          </div>
        </div>
        <!-- 阶段标签行 -->
        <div class="stepper-labels">
          <div
            v-for="(m, i) in planData.milestones"
            :key="'lbl-' + m.stage"
            class="step-label"
            :class="[
              'step-label--' + m.status,
              { 'step-label--selected': expandedMilestone === i },
            ]"
            @click="toggleMilestone(i)"
          >
            <span class="step-label-stage">{{ m.stage }}期</span>
            <span class="step-label-period">{{ m.period }}</span>
          </div>
        </div>
        <!-- 选中节点折叠卡片 -->
        <div v-if="expandedMilestone !== null" class="node-card" :class="'node-card--' + planData.milestones[expandedMilestone].status">
          <div class="nc-header" @click="nodeDetailExpanded = !nodeDetailExpanded">
            <div class="nc-left">
              <span class="nc-tag">{{ planData.milestones[expandedMilestone].stage }}期</span>
              <span class="nc-label">{{ planData.milestones[expandedMilestone].label }}</span>
            </div>
            <svg :class="{ 'nc-chevron--open': nodeDetailExpanded }" class="nc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <!-- 进度条（仅已完成/当前节点显示） -->
          <div v-if="planData.milestones[expandedMilestone].status !== 'future'" class="nc-progress">
            <div class="nc-bar">
              <div class="nc-fill" :style="{ width: planData.milestones[expandedMilestone].progress + '%' }"></div>
            </div>
            <span class="nc-pct">{{ planData.milestones[expandedMilestone].progress }}%</span>
          </div>
          <!-- 展开：描述 + 康复目标 -->
          <div v-if="nodeDetailExpanded" class="nc-detail">
            <div class="nc-desc">{{ planData.milestones[expandedMilestone].description }}</div>
            <div class="nc-goals-title">康复目标</div>
            <div v-for="(g, gi) in planData.milestones[expandedMilestone].goals" :key="gi" class="nc-goal">
              <span class="nc-goal-check" :class="{ 'nc-goal-check--done': planData.milestones[expandedMilestone].status === 'completed' }">
                <svg v-if="planData.milestones[expandedMilestone].status === 'completed'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <span>{{ g }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 3. AI 报告（可收起） ========== -->
      <div class="section">
        <div class="report-header" @click="toggleReport">
          <span class="sec-title" style="margin-bottom: 0;">AI 康复报告</span>
          <div class="report-header-right">
            <span v-if="!reportExpanded" class="report-peek">{{ reportData?.overallScore ?? '--' }}分</span>
            <svg :class="{ 'report-chevron--open': reportExpanded }" class="report-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        <template v-if="reportExpanded">
          <div class="report-tabs-row">
            <div class="report-tabs">
              <button
                v-for="rt in reportTypes"
                :key="rt.key"
                class="report-tab"
                :class="{ 'report-tab--active': activeReportType === rt.key }"
                @click.stop="switchReportType(rt.key)"
              >{{ rt.label }}</button>
            </div>
          </div>
          <div v-if="reportLoading" class="report-loading">
            <van-loading type="spinner" size="24" color="#8A7BFE" />
          </div>
          <div v-else-if="reportData" class="report-card">
            <div class="rpt-title">{{ reportData.title }}</div>
            <div class="rpt-score-row">
              <span class="rpt-score-label">综合评分</span>
              <span class="rpt-score">{{ reportData.overallScore }}</span>
              <span class="rpt-score-unit">/ 100</span>
            </div>
            <div v-for="(s, si) in reportData.sections" :key="si" class="rpt-section">
              <div class="rpt-sec-title">{{ s.title }}</div>
              <div class="rpt-sec-content">{{ s.content }}</div>
            </div>
          </div>
        </template>
      </div>

      <!-- ========== 4. 今日任务完成情况 ========== -->
      <div class="section">
        <div class="sec-title">今日任务完成情况</div>
        <div v-if="dayDetailLoading" class="report-loading">
          <van-loading type="spinner" size="24" color="#8A7BFE" />
        </div>
        <template v-else-if="todayDetail">
          <div class="task-progress-row">
            <div class="task-progress-bar">
              <div class="task-progress-fill" :style="{ width: todayProgressPct + '%' }"></div>
            </div>
            <span class="task-progress-text">{{ todayDetail.completedCount }}/{{ todayDetail.totalCount }}</span>
          </div>
          <div class="task-list">
            <div v-for="t in todayDetail.tasks" :key="t.id" class="task-item" :class="{ 'task-item--done': t.status === 'completed' }">
              <div class="task-icon-wrap" :class="'task-icon--' + t.taskType">
                <span>{{ taskIcon(t.taskType) }}</span>
              </div>
              <div class="task-info">
                <span class="task-name">{{ t.title }}</span>
                <span class="task-status-text">{{ t.status === 'completed' ? '已完成' : t.status === 'missed' ? '已错过' : '待完成' }}</span>
              </div>
              <span v-if="t.completedAt" class="task-time">{{ formatTime(t.completedAt) }}</span>
              <button
                v-else-if="t.status === 'pending'"
                class="task-do-btn"
                :disabled="planData.reviewStatus?.status === 'reviewing' && t.taskType === 'exercise'"
                @click="doCheckIn(t)"
              >
                {{ planData.reviewStatus?.status === 'reviewing' && t.taskType === 'exercise' ? '审核中' : '去完成' }}
              </button>
            </div>
          </div>
          <div v-if="todayDetail.aiSummary" class="day-ai-card">
            <span class="day-ai-icon">✨</span>
            <span class="day-ai-text">{{ todayDetail.aiSummary }}</span>
          </div>
        </template>
      </div>

      <div class="safe-bottom"></div>
    </template>

    <!-- ========== 日历弹窗 ========== -->
    <van-popup v-model:show="showCalendar" position="bottom" round :style="{ maxHeight: '80%' }">
      <div class="cal-popup">
        <div class="cal-header">
          <button class="cal-nav" @click="changeMonth(-1)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span class="cal-month-label">{{ calYear }}-{{ String(calMonth).padStart(2, '0') }}</span>
          <button class="cal-nav" @click="changeMonth(1)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <button class="cal-close" @click="showCalendar = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <!-- 阶段图例 -->
        <div class="cal-legend">
          <span class="cal-legend-item"><span class="cal-dot cal-dot--I"></span>I期</span>
          <span class="cal-legend-item"><span class="cal-dot cal-dot--II"></span>II期</span>
          <span class="cal-legend-item"><span class="cal-dot cal-dot--III"></span>III期</span>
          <span class="cal-legend-item"><span class="cal-dot cal-dot--IV"></span>IV期</span>
        </div>
        <!-- 星期头 -->
        <div class="cal-weekdays">
          <span v-for="w in ['日','一','二','三','四','五','六']" :key="w">{{ w }}</span>
        </div>
        <!-- 日历网格 -->
        <van-loading v-if="calLoading" type="spinner" size="24" color="#8A7BFE" class="cal-loading" />
        <div v-else class="cal-grid">
          <div v-for="blank in calStartBlanks" :key="'b'+blank" class="cal-cell cal-cell--empty"></div>
          <div
            v-for="d in calDays"
            :key="d.date"
            class="cal-cell"
            :class="[
              d.hasData ? 'cal-cell--stage-' + d.stage : '',
              selectedCalDate === d.date ? 'cal-cell--selected' : '',
              d.date === todayStr ? 'cal-cell--today' : '',
            ]"
            @click="selectCalDate(d)"
          >
            <span class="cal-day-num">{{ d.dayOfMonth }}</span>
            <div v-if="d.hasData" class="cal-task-dots">
              <span v-for="n in d.taskCount" :key="n" class="cal-task-dot" :class="{ 'cal-task-dot--done': n <= d.completedCount }"></span>
            </div>
          </div>
        </div>
        <!-- 选中日期详情 -->
        <div v-if="selectedCalDate" class="cal-day-detail">
          <div class="cal-day-title">{{ selectedCalDate }}</div>
          <van-loading v-if="calDayLoading" type="spinner" size="20" color="#8A7BFE" class="cal-day-loading" />
          <template v-else-if="calDayData">
            <div class="cal-day-progress">完成 {{ calDayData.completedCount }}/{{ calDayData.totalCount }} 项任务</div>
            <div v-for="t in calDayData.tasks" :key="t.id" class="cal-task-row">
              <span class="cal-task-icon">{{ taskIcon(t.taskType) }}</span>
              <span class="cal-task-name">{{ t.title }}</span>
              <span class="cal-task-status" :class="'cal-task-status--' + t.status">
                {{ t.status === 'completed' ? '已完成' : '未完成' }}
              </span>
            </div>
            <div v-if="calDayData.aiSummary" class="cal-ai-summary">
              <span>✨</span>
              <span>{{ calDayData.aiSummary }}</span>
            </div>
          </template>
        </div>
      </div>
    </van-popup>

    <!-- ========== 计划变更详情弹窗 ========== -->
    <van-popup v-model:show="showChanges" position="bottom" round :style="{ maxHeight: '75%' }">
      <div class="changes-popup" v-if="planData?.reviewStatus?.changes">
        <div class="chg-header">
          <span class="chg-title">康复计划变更详情</span>
          <button class="chg-close" @click="showChanges = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="chg-reason">
          <div class="chg-reason-label">变更原因</div>
          <div class="chg-reason-text">{{ planData.reviewStatus.changes.reason }}</div>
        </div>
        <div class="chg-list">
          <div class="chg-list-title">调整项目</div>
          <div v-for="(adj, ai) in planData.reviewStatus.changes.adjustments" :key="ai" class="chg-item">
            <span class="chg-item-icon">{{ adj.type === 'exercise' ? '🏃' : adj.type === 'medication' ? '💊' : '📊' }}</span>
            <div class="chg-item-info">
              <span class="chg-item-type">{{ adj.type === 'exercise' ? '运动调整' : adj.type === 'medication' ? '用药调整' : '监测调整' }}</span>
              <span class="chg-item-desc">{{ adj.desc }}</span>
            </div>
          </div>
        </div>
        <div class="chg-note">
          <div class="chg-note-label">医生备注</div>
          <div class="chg-note-text">{{ planData.reviewStatus.changes.doctorNote }}</div>
        </div>
        <button class="chg-accept-btn" @click="handleAcceptChanges">确认接受变更</button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import {
  getRecoveryPlanDetail, getRecoveryCalendar, getDayDetail,
  getRecoveryReport, checkInTask, triggerPlanReview, approvePlanReview, acceptPlanChanges,
} from '@/api/patient'

const router = useRouter()
const loading = ref(true)
const planData = ref<any>(null)

// Milestone expansion
const expandedMilestone = ref<number | null>(null)
const nodeDetailExpanded = ref(false)
const toggleMilestone = (i: number) => {
  if (expandedMilestone.value === i) {
    expandedMilestone.value = null
  } else {
    expandedMilestone.value = i
  }
  nodeDetailExpanded.value = false
}

// Report
const activeReportType = ref<'daily' | 'weekly' | 'monthly'>('daily')
const reportTypes = [
  { key: 'daily' as const, label: '日报' },
  { key: 'weekly' as const, label: '周报' },
  { key: 'monthly' as const, label: '月报' },
]
const reportData = ref<any>(null)
const reportLoading = ref(false)
const reportExpanded = ref(false)

function toggleReport() {
  reportExpanded.value = !reportExpanded.value
}

// Today detail
const todayDetail = ref<any>(null)
const dayDetailLoading = ref(false)
const todayStr = new Date().toISOString().split('T')[0]

const todayProgressPct = computed(() => {
  if (!todayDetail.value) return 0
  const { completedCount, totalCount } = todayDetail.value
  return totalCount > 0 ? Math.floor(completedCount / totalCount * 100) : 0
})

// Calendar
const showCalendar = ref(false)
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth() + 1)
const calDays = ref<any[]>([])
const calLoading = ref(false)
const selectedCalDate = ref<string | null>(null)
const calDayData = ref<any>(null)
const calDayLoading = ref(false)

const calStartBlanks = computed(() => {
  const firstDay = new Date(calYear.value, calMonth.value - 1, 1).getDay()
  return firstDay
})

// Plan changes
const showChanges = ref(false)

function taskIcon(type: string) {
  const icons: Record<string, string> = { monitoring: '📊', exercise: '🏃', medication: '💊' }
  return icons[type] || '📋'
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  try {
    planData.value = await getRecoveryPlanDetail() as any
    // Auto-expand current milestone
    if (planData.value?.milestones) {
      const idx = planData.value.milestones.findIndex((m: any) => m.status === 'current')
      if (idx >= 0) expandedMilestone.value = idx
    }
    // Load today detail and report in parallel
    const [day, report] = await Promise.all([
      getDayDetail(todayStr) as any,
      getRecoveryReport('daily', todayStr) as any,
    ])
    todayDetail.value = day
    reportData.value = report

    // Mock: trigger plan review for demo
    if (!planData.value.reviewStatus) {
      await triggerPlanReview()
      // Simulate doctor approval after 2s
      setTimeout(async () => {
        await approvePlanReview()
        planData.value = await getRecoveryPlanDetail() as any
      }, 3000)
      planData.value = await getRecoveryPlanDetail() as any
    }
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
})

async function switchReportType(type: 'daily' | 'weekly' | 'monthly') {
  activeReportType.value = type
  reportLoading.value = true
  try {
    reportData.value = await getRecoveryReport(type, todayStr) as any
  } catch { /* */ }
  finally { reportLoading.value = false }
}

async function loadCalendar() {
  calLoading.value = true
  selectedCalDate.value = null
  calDayData.value = null
  try {
    const data = await getRecoveryCalendar(`${calYear.value}-${calMonth.value}`) as any
    calDays.value = data.days || []
  } catch { /* */ }
  finally { calLoading.value = false }
}

function changeMonth(delta: number) {
  calMonth.value += delta
  if (calMonth.value > 12) { calMonth.value = 1; calYear.value++ }
  if (calMonth.value < 1) { calMonth.value = 12; calYear.value-- }
  loadCalendar()
}

async function selectCalDate(d: any) {
  if (!d.hasData) return
  selectedCalDate.value = d.date
  calDayLoading.value = true
  try {
    calDayData.value = await getDayDetail(d.date) as any
  } catch { /* */ }
  finally { calDayLoading.value = false }
}

// Load calendar when popup opens
import { watch } from 'vue'
watch(showCalendar, (val) => {
  if (val) loadCalendar()
})

async function doCheckIn(task: any) {
  try {
    await checkInTask(task.id)
    showToast('打卡成功')
    todayDetail.value = await getDayDetail(todayStr) as any
  } catch {
    showToast('操作失败')
  }
}

async function handleAcceptChanges() {
  try {
    await acceptPlanChanges()
    showToast('已更新康复计划')
    showChanges.value = false
    planData.value = await getRecoveryPlanDetail() as any
  } catch {
    showToast('操作失败')
  }
}
</script>

<style scoped>
.rp-page {
  min-height: 100vh;
  background: #F8F9FA;
}

.safe-bottom { height: 40px; }

/* ========== Nav ========== */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 20;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn:active { background: #e2e8f0; }

.nav-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

/* ========== Review Banner ========== */
.review-banner {
  margin: 12px 16px 0;
  padding: 16px;
  border-radius: 14px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.review-banner--reviewing {
  background: linear-gradient(135deg, #FFF7ED, #FEF3C7);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.review-banner--approved {
  background: linear-gradient(135deg, #ECFDF5, #D1FAE5);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.review-icon { font-size: 24px; flex-shrink: 0; }
.review-body { flex: 1; }
.review-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
.review-desc { font-size: 13px; color: #64748b; line-height: 1.5; }

.review-view-btn {
  margin-top: 10px;
  padding: 8px 18px;
  background: #8A7BFE;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.review-view-btn:active { opacity: 0.8; }

/* ========== Section ========== */
.section {
  margin: 12px 16px 0;
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.sec-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}

/* ========== 1. Horizontal Stepper ========== */
.plan-section {
  background: white !important;
}

/* Stepper row: dots + lines */
.stepper {
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.step {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  justify-content: center;
}

.step:first-child { justify-content: flex-start; }
.step:last-child { justify-content: flex-end; }

.step-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s;
  position: relative;
  z-index: 1;
}

.step--completed .step-dot { background: #10b981; }
.step--current .step-dot { background: #8A7BFE; box-shadow: 0 0 0 4px rgba(138, 123, 254, 0.18); }
.step--future .step-dot { background: #cbd5e1; }
.step--selected .step-dot { transform: scale(1.15); }

.step-dot-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.6); }
}

.step-line {
  flex: 1;
  height: 3px;
  background: #e2e8f0;
  border-radius: 1.5px;
  min-width: 12px;
}

.step-line--done { background: #10b981; }

/* Label row below stepper */
.stepper-labels {
  display: flex;
  padding: 8px 0 0;
}

.step-label {
  flex: 1;
  text-align: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  padding: 4px 0;
}

.step-label-stage {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.step-label--future .step-label-stage { color: #94a3b8; }
.step-label--current .step-label-stage { color: #8A7BFE; }
.step-label--completed .step-label-stage { color: #10b981; }
.step-label--selected .step-label-stage { text-decoration: underline; text-underline-offset: 3px; }

.step-label-period {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 1px;
}

/* Node card (collapsible per selected milestone) */
.node-card {
  margin-top: 14px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  animation: nc-in 0.2s ease;
}

@keyframes nc-in {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.node-card--current {
  background: linear-gradient(160deg, #F3F1FB, #EBE8F4);
  border-color: rgba(138, 123, 254, 0.1);
}

.node-card--completed {
  background: linear-gradient(160deg, #ECFDF5, #F0FDF4);
  border-color: rgba(16, 185, 129, 0.1);
}

.nc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.nc-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nc-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.node-card--current .nc-tag {
  color: #8A7BFE;
  background: rgba(138, 123, 254, 0.12);
}

.node-card--completed .nc-tag {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}

.node-card--future .nc-tag {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.12);
}

.nc-label {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.nc-chevron {
  transition: transform 0.2s;
  flex-shrink: 0;
}

.nc-chevron--open { transform: rotate(180deg); }

.nc-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.nc-bar {
  flex: 1;
  height: 6px;
  background: rgba(138, 123, 254, 0.15);
  border-radius: 3px;
  overflow: hidden;
}

.node-card--completed .nc-bar { background: rgba(16, 185, 129, 0.15); }

.nc-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s ease;
  background: linear-gradient(90deg, #8A7BFE, #A89AFE);
}

.node-card--completed .nc-fill { background: linear-gradient(90deg, #10b981, #34d399); }

.nc-pct {
  font-size: 13px;
  font-weight: 800;
  color: #8A7BFE;
  font-variant-numeric: tabular-nums;
  min-width: 32px;
  text-align: right;
}

.node-card--completed .nc-pct { color: #10b981; }

.nc-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  animation: nc-in 0.15s ease;
}

.nc-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 10px;
}

.nc-goals-title {
  font-size: 12px;
  font-weight: 700;
  color: #8A7BFE;
  margin-bottom: 6px;
}

.nc-goal {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  padding: 3px 0;
}

.nc-goal-check {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #cbd5e1;
}

.nc-goal-check--done {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

/* ========== 3. Report (collapsible) ========== */
.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  padding: 2px 0;
}

.report-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.report-peek {
  font-size: 14px;
  font-weight: 800;
  color: #8A7BFE;
  font-variant-numeric: tabular-nums;
}

.report-chevron {
  transition: transform 0.2s;
  flex-shrink: 0;
}

.report-chevron--open { transform: rotate(180deg); }

.report-tabs-row {
  display: flex;
  justify-content: flex-end;
  margin: 12px 0;
}

.report-tabs {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 2px;
}

.report-tab {
  padding: 5px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.report-tab--active {
  background: white;
  color: #8A7BFE;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.report-loading {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}

.report-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
}

.rpt-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.rpt-score-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 14px;
}

.rpt-score-label {
  font-size: 12px;
  color: #94a3b8;
  margin-right: 4px;
}

.rpt-score {
  font-size: 28px;
  font-weight: 900;
  color: #8A7BFE;
  font-variant-numeric: tabular-nums;
  font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace;
}

.rpt-score-unit {
  font-size: 13px;
  color: #cbd5e1;
}

.rpt-section {
  padding: 10px 0;
  border-top: 1px solid #f1f5f9;
}

.rpt-sec-title {
  font-size: 13px;
  font-weight: 700;
  color: #8A7BFE;
  margin-bottom: 4px;
}

.rpt-sec-content {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

/* ========== 4. Today Tasks ========== */
.task-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.task-progress-bar {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.task-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8A7BFE, #10b981);
  border-radius: 3px;
  transition: width 0.6s ease;
}

.task-progress-text {
  font-size: 13px;
  font-weight: 700;
  color: #8A7BFE;
  font-variant-numeric: tabular-nums;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.task-item--done { opacity: 0.7; }

.task-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.task-icon--monitoring { background: rgba(138, 123, 254, 0.1); }
.task-icon--exercise { background: rgba(16, 185, 129, 0.1); }
.task-icon--medication { background: rgba(245, 158, 11, 0.1); }

.task-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.task-item--done .task-name {
  color: #94a3b8;
  text-decoration: line-through;
}

.task-status-text {
  font-size: 12px;
  color: #94a3b8;
}

.task-time {
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
  flex-shrink: 0;
}

.task-do-btn {
  padding: 6px 14px;
  background: #8A7BFE;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

.task-do-btn:active { opacity: 0.8; }
.task-do-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

.day-ai-card {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #EAF8F1, #F4FCF8);
  border-radius: 12px;
  align-items: flex-start;
}

.day-ai-icon { font-size: 16px; flex-shrink: 0; }
.day-ai-text { font-size: 13px; color: #334155; line-height: 1.6; }

/* ========== Calendar Popup ========== */
.cal-popup {
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.cal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.cal-month-label {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.cal-nav {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
}

.cal-nav:active { background: #e2e8f0; }

.cal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cal-legend {
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-bottom: 10px;
}

.cal-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
}

.cal-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cal-dot--I { background: #ef4444; }
.cal-dot--II { background: #f59e0b; }
.cal-dot--III { background: #10b981; }
.cal-dot--IV { background: #8A7BFE; }

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 4px;
}

.cal-loading {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 2px;
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
  transition: background 0.15s;
}

.cal-cell--empty { cursor: default; }

.cal-cell--today { font-weight: 700; }
.cal-cell--today .cal-day-num { color: #8A7BFE; }

.cal-cell--selected {
  background: rgba(138, 123, 254, 0.1);
  outline: 2px solid #8A7BFE;
  outline-offset: -2px;
}

.cal-cell--stage-I { background: rgba(239, 68, 68, 0.05); }
.cal-cell--stage-II { background: rgba(245, 158, 11, 0.05); }
.cal-cell--stage-III { background: rgba(16, 185, 129, 0.05); }
.cal-cell--stage-IV { background: rgba(138, 123, 254, 0.05); }

.cal-day-num {
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.cal-task-dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}

.cal-task-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #e2e8f0;
}

.cal-task-dot--done { background: #10b981; }

/* Calendar day detail */
.cal-day-detail {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.cal-day-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.cal-day-loading {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.cal-day-progress {
  font-size: 13px;
  color: #8A7BFE;
  font-weight: 600;
  margin-bottom: 8px;
}

.cal-task-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f8fafc;
}

.cal-task-icon { font-size: 16px; flex-shrink: 0; }
.cal-task-name { flex: 1; font-size: 13px; color: #334155; }

.cal-task-status {
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.cal-task-status--completed { color: #10b981; }
.cal-task-status--pending,
.cal-task-status--missed { color: #ef4444; }

.cal-ai-summary {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding: 10px;
  background: linear-gradient(135deg, #F3F1FB, #EBE8F4);
  border-radius: 10px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

/* ========== Changes Popup ========== */
.changes-popup {
  padding: 20px 16px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.chg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.chg-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.chg-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.chg-reason {
  padding: 14px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 14px;
}

.chg-reason-label {
  font-size: 12px;
  font-weight: 700;
  color: #8A7BFE;
  margin-bottom: 4px;
}

.chg-reason-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.chg-list { margin-bottom: 14px; }

.chg-list-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 10px;
}

.chg-item {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 8px;
}

.chg-item-icon { font-size: 20px; flex-shrink: 0; }
.chg-item-info { flex: 1; }

.chg-item-type {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  display: block;
  margin-bottom: 2px;
}

.chg-item-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.chg-note {
  padding: 14px;
  background: linear-gradient(135deg, #EAF8F1, #F4FCF8);
  border-radius: 12px;
  margin-bottom: 20px;
}

.chg-note-label {
  font-size: 12px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 4px;
}

.chg-note-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
}

.chg-accept-btn {
  display: block;
  width: 100%;
  padding: 14px;
  background: #8A7BFE;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.chg-accept-btn:active { opacity: 0.8; }
</style>
