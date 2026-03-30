<template>
  <div class="report-page">
    <div class="header-bar">
      <button class="header-back" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="header-title">康复报告</span>
      <div class="header-back" style="visibility: hidden;"><svg width="22" height="22" viewBox="0 0 24 24" /></div>
    </div>

    <!-- Tab bar -->
    <div class="tab-bar">
      <button
        v-for="t in tabs"
        :key="t.value"
        class="tab-item"
        :class="{ 'tab-item--active': reportType === t.value }"
        @click="switchTab(t.value)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Date nav -->
    <div class="date-nav">
      <button class="date-btn" @click="prevDate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <span class="date-label">{{ dateLabel }}</span>
      <button class="date-btn" @click="nextDate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 6 15 12 9 18" /></svg>
      </button>
    </div>

    <van-loading v-if="loading" type="spinner" size="36" color="#8A7BFE" class="page-loading" />

    <template v-else-if="reportData">
      <!-- Doctor review badge (weekly/monthly) -->
      <div v-if="reportData.reviewed" class="review-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span class="review-badge-text">医生已审核</span>
        <span class="review-badge-date">{{ reportData.reviewedAt }}</span>
      </div>

      <!-- Score card -->
      <div class="score-card">
        <div class="score-ring">
          <span class="score-num">{{ reportData.overallScore || 0 }}</span>
          <span class="score-unit">分</span>
        </div>
        <div class="score-label">综合评分</div>
      </div>

      <!-- Doctor comment card (weekly/monthly) -->
      <div v-if="reportData.reviewDoctor" class="doctor-comment-card">
        <div class="dc-header">
          <div class="dc-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="dc-doctor-info">
            <span class="dc-doctor-name">{{ reportData.reviewDoctor.name }}</span>
            <span class="dc-doctor-title">{{ reportData.reviewDoctor.title }} · {{ reportData.reviewDoctor.department }}</span>
          </div>
          <span class="dc-label">医生总评</span>
        </div>
        <div class="dc-content">{{ reportData.doctorComment }}</div>
      </div>

      <!-- Report sections -->
      <div class="report-sections">
        <div v-for="(s, i) in reportData.sections" :key="i" class="report-card">
          <div class="rc-title">{{ s.title }}</div>
          <div class="rc-content">{{ s.content }}</div>
        </div>
      </div>

      <!-- AI Summary -->
      <div v-if="reportData.summary" class="ai-summary">
        <span class="ai-icon">✨</span>
        <span class="ai-text">{{ reportData.summary }}</span>
      </div>
    </template>

    <div v-else class="empty-state">暂无报告数据</div>

    <div class="safe-bottom"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRecoveryReport } from '@/api/patient'

const router = useRouter()
const loading = ref(false)
const reportData = ref<any>(null)
const reportType = ref<'daily' | 'weekly' | 'monthly'>('daily')
const reportDate = ref(new Date().toISOString().split('T')[0])

const tabs = [
  { label: '日报', value: 'daily' as const },
  { label: '周报', value: 'weekly' as const },
  { label: '月报', value: 'monthly' as const },
]

const dateLabel = computed(() => {
  const d = new Date(reportDate.value)
  if (reportType.value === 'daily') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  if (reportType.value === 'weekly') {
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay() + 1)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return `${weekStart.getMonth() + 1}.${weekStart.getDate()} - ${weekEnd.getMonth() + 1}.${weekEnd.getDate()}`
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

async function loadReport() {
  loading.value = true
  reportData.value = null
  try {
    reportData.value = await getRecoveryReport(reportType.value, reportDate.value) as any
  } catch { /* silent */ }
  finally { loading.value = false }
}

function switchTab(type: 'daily' | 'weekly' | 'monthly') {
  reportType.value = type
  loadReport()
}

function prevDate() {
  const d = new Date(reportDate.value)
  if (reportType.value === 'daily') d.setDate(d.getDate() - 1)
  else if (reportType.value === 'weekly') d.setDate(d.getDate() - 7)
  else d.setMonth(d.getMonth() - 1)
  reportDate.value = d.toISOString().split('T')[0]
  loadReport()
}

function nextDate() {
  const d = new Date(reportDate.value)
  if (reportType.value === 'daily') d.setDate(d.getDate() + 1)
  else if (reportType.value === 'weekly') d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + 1)
  reportDate.value = d.toISOString().split('T')[0]
  loadReport()
}

onMounted(() => loadReport())
</script>

<style scoped>
.report-page {
  min-height: 100vh;
  background: #f8fafc;
}

/* Header */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-back {
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

.header-back:active { background: #e2e8f0; }

.header-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

/* Tabs */
.tab-bar {
  display: flex;
  padding: 12px 16px 0;
  gap: 8px;
  background: white;
}

.tab-item {
  flex: 1;
  padding: 8px;
  border: none;
  background: #f1f5f9;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s;
}

.tab-item--active {
  background: #8A7BFE;
  color: white;
}

.tab-item:active { opacity: 0.8; }

/* Date nav */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 14px 16px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.date-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.date-btn:active { background: #e2e8f0; }

.date-label {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  min-width: 120px;
  text-align: center;
}

/* Loading */
.page-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

/* Score */
.score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 16px;
}

/* Doctor review badge */
.review-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 16px 0;
  padding: 10px 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
}

.review-badge-text {
  font-size: 13px;
  font-weight: 600;
  color: #059669;
}

.review-badge-date {
  font-size: 12px;
  color: #94a3b8;
  margin-left: auto;
}

/* Doctor comment card */
.doctor-comment-card {
  margin: 16px 16px 12px;
  background: white;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  border-left: 3px solid #8A7BFE;
}

.dc-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.dc-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8A7BFE, #A89AFE);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dc-doctor-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.dc-doctor-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.dc-doctor-title {
  font-size: 12px;
  color: #94a3b8;
}

.dc-label {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(138, 123, 254, 0.08);
  color: #8A7BFE;
  flex-shrink: 0;
}

.dc-content {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
}

.score-ring {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8A7BFE, #A89AFE);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(138, 123, 254, 0.25);
}

.score-num {
  font-size: 32px;
  font-weight: 900;
  color: white;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.score-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.score-label {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 8px;
  font-weight: 500;
}

/* Report sections */
.report-sections {
  padding: 0 16px;
}

.report-card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.rc-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.rc-content {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
}

/* AI Summary */
.ai-summary {
  display: flex;
  gap: 10px;
  margin: 0 16px 16px;
  padding: 14px;
  background: linear-gradient(135deg, #EAF8F1, #F4FCF8);
  border-radius: 14px;
  align-items: flex-start;
}

.ai-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.ai-text {
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 60px 0;
  font-size: 14px;
  color: #94a3b8;
}

.safe-bottom {
  height: calc(20px + env(safe-area-inset-bottom));
}
</style>
