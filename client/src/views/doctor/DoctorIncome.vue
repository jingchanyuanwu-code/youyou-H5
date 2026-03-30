<template>
  <div class="income-page">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <div class="nav-back" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </div>
      <span class="nav-title">我的收入</span>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 收入概览 -->
    <div class="income-card">
      <div class="income-header">
        <span class="income-title">收入总览</span>
        <span class="income-total-label">累计总收入 <span class="income-total-value">¥{{ formatMoney(incomeOverview.totalIncome) }}</span></span>
      </div>
      <div class="income-main">
        <div class="income-monthly">
          <span class="income-amount">¥{{ formatMoney(incomeOverview.monthlyIncome) }}</span>
          <span class="income-period">本月收入</span>
        </div>
        <div :class="['income-change', incomeOverview.monthlyChange >= 0 ? 'up' : 'down']">
          {{ incomeOverview.monthlyChange >= 0 ? '+' : '' }}{{ incomeOverview.monthlyChange }}%
          <span class="change-label">较上月</span>
        </div>
      </div>
    </div>

    <!-- 收入构成 -->
    <div class="breakdown-card">
      <div class="breakdown-header">收入构成</div>
      <div class="breakdown-content">
        <div class="ring-chart-wrap">
          <RingChart :data="incomeBreakdown.categories" :size="140" :stroke-width="20" />
        </div>
        <div class="breakdown-legend">
          <div v-for="(cat, i) in incomeBreakdown.categories" :key="cat.category" class="legend-item">
            <span class="legend-dot" :style="{ background: categoryColors[i % categoryColors.length] }"></span>
            <span class="legend-label">{{ cat.label }}</span>
            <span class="legend-amount">¥{{ cat.amount }}</span>
            <span class="legend-pct">{{ cat.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 收入明细 -->
    <div class="detail-card">
      <div class="detail-header">
        <span>收入明细</span>
      </div>
      <div v-if="loading" class="detail-loading">
        <van-loading size="24" color="#396CFF" />
      </div>
      <div v-else-if="incomeDetails.length === 0" class="detail-empty">暂无收入明细</div>
      <div v-else class="detail-list">
        <div v-for="item in incomeDetails" :key="item.id" class="detail-item">
          <div class="detail-left">
            <div :class="['detail-icon', 'detail-icon-' + item.category]">
              <svg v-if="item.category === 'monitoring'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <svg v-else-if="item.category === 'consultation'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <svg v-else-if="item.category === 'plan_review'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
              <svg v-else-if="item.category === 'report_review'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div class="detail-info">
              <span class="detail-desc">{{ item.description }}</span>
              <span class="detail-date">{{ formatDate(item.date) }} · {{ item.patientName }}</span>
            </div>
          </div>
          <div class="detail-right">
            <span class="detail-amount">+¥{{ item.amount }}</span>
            <span :class="['detail-status', 'status-' + item.settlementStatus]">{{ statusLabel(item.settlementStatus) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getIncomeOverview, getIncomeBreakdown, getIncomeDetails } from '@/api'
import type { IncomeOverview, IncomeBreakdown, IncomeDetail } from '@/api'
import RingChart from '@/components/RingChart.vue'

const router = useRouter()
const categoryColors = ['#396CFF', '#20C997', '#F59E0B', '#FF4C61', '#3B82F6']

const loading = ref(true)
const incomeOverview = ref<IncomeOverview>({ monthlyIncome: 0, monthlyChange: 0, totalIncome: 0 })
const incomeBreakdown = ref<IncomeBreakdown>({ month: '', categories: [], total: 0 })
const incomeDetails = ref<IncomeDetail[]>([])

const formatMoney = (val: number) => {
  if (!val) return '0.00'
  return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { settled: '已到账', pending: '待结算', processing: '审核中' }
  return map[status] || status
}

onMounted(async () => {
  try {
    const [overview, breakdown, details] = await Promise.all([
      getIncomeOverview() as any,
      getIncomeBreakdown() as any,
      getIncomeDetails(1) as any,
    ])
    if (overview) incomeOverview.value = overview
    if (breakdown) incomeBreakdown.value = breakdown
    if (details?.list) incomeDetails.value = details.list
  } catch { /* ignore */ }
  loading.value = false
})
</script>

<style scoped>
.income-page {
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

/* ========== 收入概览 ========== */
.income-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  margin: 8px 16px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.income-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.income-title {
  font-size: 16px;
  font-weight: 800;
  color: #1A2238;
}
.income-total-label {
  font-size: 12px;
  color: #8A9AC3;
}
.income-total-value {
  color: #8A9AC3;
  font-weight: 600;
}
.income-main {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.income-monthly {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.income-amount {
  font-size: 32px;
  font-weight: 800;
  color: #1A2238;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -1px;
}
.income-period {
  font-size: 12px;
  color: #8A9AC3;
  font-weight: 500;
}
.income-change {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 16px;
  font-weight: 800;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
}
.income-change.up { color: #20C997; }
.income-change.down { color: #FF4C61; }
.change-label {
  font-size: 10px;
  color: #8A9AC3;
  font-weight: 500;
  font-family: 'PingFang SC', sans-serif;
}

/* ========== 收入构成 ========== */
.breakdown-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  margin: 0 16px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.breakdown-header {
  font-size: 16px;
  font-weight: 800;
  color: #1A2238;
  margin-bottom: 16px;
}
.breakdown-content {
  display: flex;
  align-items: center;
  gap: 20px;
}
.ring-chart-wrap {
  flex-shrink: 0;
}
.breakdown-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label {
  flex: 1;
  color: #8A9AC3;
  font-weight: 500;
  white-space: nowrap;
}
.legend-amount {
  color: #1A2238;
  font-weight: 600;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
  font-variant-numeric: tabular-nums;
}
.legend-pct {
  color: #8A9AC3;
  font-size: 11px;
  min-width: 28px;
  text-align: right;
}

/* ========== 收入明细 ========== */
.detail-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  margin: 0 16px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.detail-header {
  font-size: 16px;
  font-weight: 800;
  color: #1A2238;
  margin-bottom: 14px;
}
.detail-loading {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
.detail-empty {
  text-align: center;
  padding: 24px 0;
  color: #8A9AC3;
  font-size: 13px;
}
.detail-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.detail-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.detail-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.detail-icon svg {
  width: 18px;
  height: 18px;
}
.detail-icon-monitoring { background: rgba(57, 108, 255, 0.1); color: #396CFF; }
.detail-icon-consultation { background: rgba(32, 201, 151, 0.1); color: #20C997; }
.detail-icon-plan_review { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
.detail-icon-report_review { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
.detail-icon-referral_bonus { background: rgba(255, 76, 97, 0.1); color: #FF4C61; }
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.detail-desc {
  font-size: 13px;
  font-weight: 600;
  color: #1A2238;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.detail-date {
  font-size: 11px;
  color: #8A9AC3;
}
.detail-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
  margin-left: 8px;
}
.detail-amount {
  font-size: 14px;
  font-weight: 800;
  color: #20C997;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
}
.detail-status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}
.status-settled { background: rgba(32, 201, 151, 0.1); color: #20C997; }
.status-pending { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
.status-processing { background: rgba(57, 108, 255, 0.1); color: #396CFF; }
</style>
