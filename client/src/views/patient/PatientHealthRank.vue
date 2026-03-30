<template>
  <div class="health-rank-page">
    <!-- Nav bar -->
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="nav-title">健康状态对比</span>
      <div class="nav-btn" style="visibility: hidden;">
        <svg width="20" height="20" viewBox="0 0 24 24" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <van-loading type="spinner" size="36" color="#8A7BFE" />
    </div>

    <template v-else-if="data">
      <!-- ========== 1. 排名英雄卡 ========== -->
      <div class="hero-card">
        <div class="hero-label">健康状态排名</div>
        <div class="hero-pct">
          <span class="hero-prefix">超越</span>
          <span class="hero-number">{{ data.overallPercentile }}</span>
          <span class="hero-suffix">%</span>
        </div>
        <div class="hero-sub">同龄康复患者</div>
        <div class="hero-peer">
          对标群体：{{ data.peerGroup }}
        </div>
        <div class="hero-days">
          已康复 <strong>{{ data.recoveryDays }}</strong> 天
        </div>
      </div>

      <!-- ========== 2. AI 综合评价 ========== -->
      <div class="section ai-card">
        <div class="ai-header">
          <span class="ai-icon">✨</span>
          <span class="ai-title">AI 综合评价</span>
        </div>
        <p class="ai-body">{{ data.aiSummary }}</p>
      </div>

      <!-- ========== 3. 评估维度明细 ========== -->
      <div class="section">
        <div class="section-title">
          <div class="section-bar"></div>
          评估维度明细
        </div>
        <div class="criteria-list">
          <div v-for="c in data.criteria" :key="c.key" class="criteria-card">
            <div class="cri-header">
              <span class="cri-label">{{ c.label }}</span>
              <span class="cri-score">{{ c.myScore }}<small>{{ c.unit }}</small></span>
            </div>
            <p class="cri-desc">{{ c.desc }}</p>
            <!-- 双对比条形图 -->
            <div class="cri-bars">
              <div class="cri-bar-row">
                <span class="cri-bar-label">我的</span>
                <div class="cri-bar-track">
                  <div class="cri-bar-fill cri-bar--mine" :style="{ width: barWidth(c.myScore) }"></div>
                </div>
                <span class="cri-bar-val">{{ c.myScore }}{{ c.unit }}</span>
              </div>
              <div class="cri-bar-row">
                <span class="cri-bar-label">同龄</span>
                <div class="cri-bar-track">
                  <div class="cri-bar-fill cri-bar--peer" :style="{ width: barWidth(c.peerAvg) }"></div>
                </div>
                <span class="cri-bar-val">{{ c.peerAvg }}{{ c.unit }}</span>
              </div>
            </div>
            <div class="cri-tip">
              <span class="cri-tip-icon">💡</span>
              <span class="cri-tip-text">{{ c.tip }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="safe-bottom"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHealthRank } from '@/api/patient'

const router = useRouter()
const loading = ref(true)
const data = ref<any>(null)

function barWidth(val: number) {
  // 所有值都是百分制
  return Math.min(100, Math.max(0, val)) + '%'
}

onMounted(async () => {
  try {
    data.value = await getHealthRank() as any
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.health-rank-page {
  min-height: 100vh;
  background: #f8fafc;
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

/* ========== 1. 排名英雄卡 ========== */
.hero-card {
  margin: 12px 16px 0;
  padding: 32px 24px 24px;
  border-radius: 24px;
  background: linear-gradient(145deg, #8A7BFE 0%, #A89AFE 40%, #C4BAFF 80%);
  box-shadow: 0 8px 28px rgba(138, 123, 254, 0.3);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-card::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -20%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
}

.hero-card::after {
  content: '';
  position: absolute;
  bottom: -20%;
  left: -15%;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
}

.hero-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.hero-pct {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
}

.hero-prefix {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
}

.hero-number {
  font-size: 64px;
  font-weight: 900;
  color: white;
  text-shadow: 0 4px 12px rgba(0,0,0,0.12);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.hero-suffix {
  font-size: 24px;
  font-weight: 800;
  color: rgba(255,255,255,0.9);
}

.hero-sub {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
}

.hero-peer {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.12);
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.hero-days {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  position: relative;
  z-index: 1;
}

.hero-days strong {
  color: white;
  font-weight: 800;
}

/* ========== Section ========== */
.section {
  margin: 16px 16px 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}

.section-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #8A7BFE, #A89AFE);
  flex-shrink: 0;
}

/* ========== 2. AI 综合评价 ========== */
.ai-card {
  background: white;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ai-icon {
  font-size: 18px;
}

.ai-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.ai-body {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
  margin: 0;
}

/* ========== 3. 评估维度 ========== */
.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.criteria-card {
  background: white;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.cri-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.cri-label {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.cri-score {
  font-size: 20px;
  font-weight: 900;
  color: #8A7BFE;
  font-variant-numeric: tabular-nums;
}

.cri-score small {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  margin-left: 2px;
}

.cri-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 14px;
  line-height: 1.5;
}

/* 双对比条形图 */
.cri-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.cri-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cri-bar-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  width: 28px;
  flex-shrink: 0;
}

.cri-bar-track {
  flex: 1;
  height: 10px;
  background: #f1f5f9;
  border-radius: 5px;
  overflow: hidden;
}

.cri-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.cri-bar--mine {
  background: linear-gradient(90deg, #8A7BFE, #A89AFE);
}

.cri-bar--peer {
  background: #cbd5e1;
}

.cri-bar-val {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  width: 42px;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

/* 提升建议 */
.cri-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  background: #fefce8;
  border-radius: 10px;
}

.cri-tip-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.cri-tip-text {
  font-size: 13px;
  color: #854d0e;
  line-height: 1.5;
}
</style>
