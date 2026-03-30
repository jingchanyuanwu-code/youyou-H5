<template>
  <div class="life-asset-page">
    <!-- Nav bar -->
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="nav-title">生命资产</span>
      <div class="nav-btn" style="visibility: hidden;">
        <svg width="20" height="20" viewBox="0 0 24 24" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <van-loading type="spinner" size="36" color="#D4A373" />
    </div>

    <template v-else>
      <!-- ========== 1. 核心红利卡片区 ========== -->
      <div class="dividend-card" :class="{ 'dividend-card--risk': data?.isHighRisk }">
        <!-- 高风险熔断态 -->
        <template v-if="data?.isHighRisk">
          <div class="risk-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div class="risk-text">当前存在体征风险，资产评估已暂停</div>
          <div class="risk-sub">请立即处置异常</div>
        </template>
        <!-- 正常态 -->
        <template v-else>
          <div class="dividend-label">当前资产估值</div>
          <div class="dividend-main">
            <span class="dividend-prefix">生命红利：</span>
            <span class="dividend-number" ref="numberRef">+{{ animatedValue }}</span>
            <span class="dividend-unit">年</span>
          </div>
          <div class="dividend-progress">
            <div class="dp-bar">
              <div class="dp-fill" :style="{ width: animatedProgress + '%' }">
                <div class="dp-glow"></div>
              </div>
            </div>
            <div class="dp-text">
              距离下一阶段增值目标({{ data?.dividend?.nextTarget }}年)还需持续康复
              <strong>{{ data?.dividend?.nextMilestoneDays }}</strong> 天
            </div>
          </div>
        </template>
      </div>

      <!-- ========== 2. 资产增值说明区 ========== -->
      <div class="section explain-card">
        <div class="explain-title">
          <div class="explain-bar"></div>
          资产增值说明
        </div>
        <div class="explain-body">
          <p class="explain-intro">资产增值是通过以下五个维度进行实时算力评估：</p>
          <div class="explain-item" v-for="d in dimensions" :key="d.key">
            <div class="explain-dot" :style="{ background: d.color }"></div>
            <div>
              <span class="explain-name">{{ d.label }}</span>
              <span class="explain-desc">{{ d.desc }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 3. 资产评估雷达区 ========== -->
      <div class="section radar-card">
        <div class="radar-title">资产评估雷达</div>
        <div class="radar-score-row">
          <span class="radar-score-label">综合评分</span>
          <span class="radar-score-value">{{ data?.dailyScore ?? '--' }}</span>
          <span class="radar-score-unit">/ 100</span>
        </div>
        <div class="radar-wrap">
          <svg viewBox="0 0 300 280" class="radar-svg">
            <!-- 背景层：3层正五边形网格 -->
            <polygon v-for="(s, si) in [1, 0.66, 0.33]" :key="'grid-'+si"
              :points="gridPoints(s)"
              fill="none" stroke="#e2e8f0" stroke-width="1" />
            <!-- 连接线 -->
            <line v-for="(_, i) in 5" :key="'ax-'+i"
              :x1="150" :y1="140"
              :x2="axisPoint(i, 1).x" :y2="axisPoint(i, 1).y"
              stroke="#e2e8f0" stroke-width="1" />
            <!-- 数据多边形（橙金渐变填充 + 呼吸动画） -->
            <defs>
              <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8A7BFE" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#D4A373" stop-opacity="0.15" />
              </linearGradient>
            </defs>
            <polygon
              :points="dataPoints"
              fill="url(#radarGrad)"
              stroke="#8A7BFE"
              stroke-width="2"
              class="radar-polygon"
            />
            <!-- 顶点 -->
            <circle v-for="(d, i) in radarDims" :key="'dot-'+i"
              :cx="dataPoint(i).x" :cy="dataPoint(i).y"
              r="5" :fill="d.color" stroke="white" stroke-width="2"
              class="radar-vertex"
              @click="showDimDetail(d)"
            />
            <!-- 标签 -->
            <text v-for="(d, i) in radarDims" :key="'label-'+i"
              :x="labelPoint(i).x" :y="labelPoint(i).y"
              text-anchor="middle" font-size="12" font-weight="600" :fill="d.color"
            >{{ d.label }}</text>
            <!-- 分数 -->
            <text v-for="(d, i) in radarDims" :key="'score-'+i"
              :x="labelPoint(i).x" :y="labelPoint(i).y + 15"
              text-anchor="middle" font-size="11" fill="#94a3b8"
            >{{ d.score }}/{{ d.max }}</text>
          </svg>
        </div>
      </div>

      <!-- ========== 4. 健康建议 ========== -->
      <div class="section tips-card" :class="{ 'tips-card--risk': data?.isHighRisk }">
        <div class="tips-title">
          <div class="tips-bar" :class="{ 'tips-bar--risk': data?.isHighRisk }"></div>
          {{ data?.isHighRisk ? '风险提示' : '健康建议' }}
        </div>
        <div class="tips-list">
          <template v-if="data?.isHighRisk">
            <div class="tip-item tip-item--risk" v-for="(tip, i) in riskTips" :key="i">
              <span class="tip-icon">{{ tip.icon }}</span>
              <span class="tip-text">{{ tip.text }}</span>
            </div>
          </template>
          <template v-else>
            <div class="tip-item tip-item--safe" v-for="(tip, i) in safeTips" :key="i">
              <span class="tip-icon">{{ tip.icon }}</span>
              <span class="tip-text">{{ tip.text }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- ========== 免责声明 ========== -->
      <div class="disclaimer">
        <strong>声明：</strong>"生命红利"与资产估值系基于中华医学会心康指南及同类患者康复大数据库通过算法推演的预期模型，仅作为督促康复的参考指标，不代表对实际寿命或临床预后的医疗承诺。如有不适，请以主治医生诊断为准。
      </div>

      <div class="safe-bottom"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getLifeAsset } from '@/api/patient'

const router = useRouter()
const loading = ref(true)
const data = ref<any>(null)

// 数字滚动动画
const animatedValue = ref('0.0')
const animatedProgress = ref(0)

let animTimer: number | undefined

onMounted(async () => {
  try {
    data.value = await getLifeAsset() as any
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }

  // 进入页面后启动动画
  if (data.value && !data.value.isHighRisk) {
    const targetValue = data.value.dividend?.value ?? 0
    const targetProgress = data.value.dividend?.progressPct ?? 0
    animateNumber(targetValue, 1200)
    animateProgress(targetProgress, 800)
  }
})

onUnmounted(() => {
  if (animTimer) cancelAnimationFrame(animTimer)
})

function animateNumber(target: number, duration: number) {
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
    const current = target * eased
    animatedValue.value = current.toFixed(1)
    if (t < 1) {
      animTimer = requestAnimationFrame(tick)
    }
  }
  animTimer = requestAnimationFrame(tick)
}

function animateProgress(target: number, duration: number) {
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)
    animatedProgress.value = Math.floor(target * eased)
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// 健康建议
const riskTips = [
  { icon: '⚠️', text: '检测到体征异常，生命资产计分已暂停，待体征恢复后自动恢复' },
  { icon: '📞', text: '建议尽快联系主治医生，反馈当前体征数据' },
  { icon: '🚫', text: '异常期间请减少剧烈运动，保持静卧休息' },
  { icon: '✅', text: '体征恢复正常后，资产估值将自动恢复并追补康复积分' },
]

const safeTips = [
  { icon: '🌙', text: '保持规律作息，每日23:00前入睡有助于心肌修复' },
  { icon: '📋', text: '按时完成康复打卡任务，提升依从性资产评分' },
  { icon: '🥗', text: '坚持低盐低脂饮食，每日钠摄入控制在2000mg以内' },
  { icon: '😴', text: '保持良好睡眠质量，深度睡眠占比≥20%最为理想' },
]

// 五维说明
const dimensions = [
  { key: 'physiological', label: '生理性资产', desc: '核心体征（心率、血压、血氧）的稳定性', color: '#ef4444' },
  { key: 'compliance', label: '依从性资产', desc: '用药、监测任务的按时打卡率', color: '#8A7BFE' },
  { key: 'behavioral', label: '行为性资产', desc: '有效康复运动量（靶心率区间）的累计', color: '#10b981' },
  { key: 'nutrition', label: '营养资产', desc: '低钠低脂饮食与血糖达标率', color: '#D4A373' },
  { key: 'emotional', label: '情绪资产', desc: '深度睡眠与心理舒缓状态', color: '#8b5cf6' },
]

// 雷达图维度数据
const radarDims = computed(() => {
  const r = data.value?.radar
  if (!r) return dimensions.map(d => ({ ...d, score: 0, max: 30 }))
  return [
    { ...dimensions[0], score: r.physiological.score, max: r.physiological.max, detail: r.physiological.desc },
    { ...dimensions[1], score: r.compliance.score, max: r.compliance.max, detail: r.compliance.desc },
    { ...dimensions[2], score: r.behavioral.score, max: r.behavioral.max, detail: r.behavioral.desc },
    { ...dimensions[3], score: r.nutrition.score, max: r.nutrition.max, detail: r.nutrition.desc },
    { ...dimensions[4], score: r.emotional.score, max: r.emotional.max, detail: r.emotional.desc },
  ]
})

// 雷达图几何计算 — 正五边形
const cx = 150, cy = 140, R = 100
const angleOffset = -Math.PI / 2 // 顶点朝上

function axisPoint(i: number, scale: number) {
  const angle = angleOffset + (2 * Math.PI / 5) * i
  return {
    x: cx + R * scale * Math.cos(angle),
    y: cy + R * scale * Math.sin(angle),
  }
}

function gridPoints(scale: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const p = axisPoint(i, scale)
    return `${p.x},${p.y}`
  }).join(' ')
}

function dataPoint(i: number) {
  const d = radarDims.value[i]
  const ratio = d ? d.score / d.max : 0
  return axisPoint(i, Math.max(0.08, ratio))
}

const dataPoints = computed(() => {
  return Array.from({ length: 5 }, (_, i) => {
    const p = dataPoint(i)
    return `${p.x},${p.y}`
  }).join(' ')
})

function labelPoint(i: number) {
  const p = axisPoint(i, 1.22)
  return { x: p.x, y: p.y + 2 }
}

function showDimDetail(d: any) {
  showToast({
    message: `${d.label}：${d.detail || d.desc}，得${d.score}分`,
    duration: 2500,
  })
}
</script>

<style scoped>
.life-asset-page {
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

/* ========== 1. 核心红利卡片 ========== */
.dividend-card {
  margin: 12px 16px 0;
  padding: 28px 24px 22px;
  border-radius: 20px;
  background: linear-gradient(145deg, #D4A373 0%, #E5B8AE 40%, #F0CFC4 70%, #F5DDD5 100%);
  box-shadow: 0 8px 24px rgba(212, 163, 115, 0.25);
  position: relative;
  overflow: hidden;
}

/* 流光 */
.dividend-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -80%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  animation: card-shimmer 4s ease-in-out infinite;
}

@keyframes card-shimmer {
  0% { left: -50%; }
  100% { left: 150%; }
}

/* 高风险灰色态 */
.dividend-card--risk {
  background: linear-gradient(145deg, #64748b 0%, #94a3b8 50%, #64748b 100%);
  box-shadow: 0 4px 16px rgba(100, 116, 139, 0.2);
  text-align: center;
  padding: 36px 24px;
}

.dividend-card--risk::before {
  display: none;
}

.risk-icon {
  margin-bottom: 12px;
  opacity: 0.7;
}

.risk-text {
  font-size: 16px;
  font-weight: 700;
  color: white;
  margin-bottom: 6px;
}

.risk-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}

.dividend-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.dividend-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.dividend-prefix {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
}

.dividend-number {
  font-size: 42px;
  font-weight: 900;
  color: white;
  text-shadow: 0 2px 6px rgba(0,0,0,0.15);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.dividend-unit {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  margin-left: 2px;
}

/* 进度条 */
.dividend-progress {
  position: relative;
  z-index: 1;
}

.dp-bar {
  height: 10px;
  background: rgba(0,0,0,0.12);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 10px;
}

.dp-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.7), white);
  border-radius: 5px;
  position: relative;
  transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.dp-glow {
  position: absolute;
  right: -2px;
  top: -3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 8px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.4);
  animation: glow-pulse 1.5s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.7); }
}

.dp-text {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  line-height: 1.5;
}

.dp-text strong {
  color: white;
  font-weight: 800;
}

/* ========== Section ========== */
.section {
  margin: 12px 16px 0;
}

/* ========== 2. 资产增值说明 ========== */
.explain-card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.explain-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}

.explain-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #8A7BFE, #A89AFE);
  flex-shrink: 0;
}

.explain-body {
  padding-left: 14px;
}

.explain-intro {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 12px;
}

.explain-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
}

.explain-item + .explain-item {
  border-top: 1px solid #f8fafc;
}

.explain-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

.explain-name {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  margin-right: 4px;
}

.explain-desc {
  font-size: 13px;
  color: #94a3b8;
}

/* ========== 3. 雷达图 ========== */
.radar-card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.radar-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.radar-score-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.radar-score-label {
  font-size: 13px;
  color: #94a3b8;
}

.radar-score-value {
  font-size: 28px;
  font-weight: 900;
  color: #8A7BFE;
  font-variant-numeric: tabular-nums;
}

.radar-score-unit {
  font-size: 13px;
  color: #cbd5e1;
}

.radar-wrap {
  display: flex;
  justify-content: center;
  padding: 0 8px;
}

.radar-svg {
  width: 100%;
  max-width: 320px;
}

.radar-polygon {
  animation: radar-breathe 4s ease-in-out infinite;
  transform-origin: 150px 140px;
}

@keyframes radar-breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.85; }
}

.radar-vertex {
  cursor: pointer;
  transition: r 0.2s;
}

.radar-vertex:hover {
  r: 7;
}

/* ========== 4. 健康建议 ========== */
.tips-card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.tips-card--risk {
  background: linear-gradient(145deg, #fff5f5, #ffffff);
  border: 1px solid #fecaca;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}

.tips-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #10b981, #34d399);
  flex-shrink: 0;
}

.tips-bar--risk {
  background: linear-gradient(180deg, #ef4444, #f87171);
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
}

.tip-item--risk {
  background: #fef2f2;
}

.tip-item--safe {
  background: #f0fdf4;
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tip-text {
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
}

.tip-item--risk .tip-text {
  color: #991b1b;
}

.tip-item--safe .tip-text {
  color: #166534;
}

/* ========== 免责声明 ========== */
.disclaimer {
  margin: 20px 16px 0;
  padding: 16px;
  font-size: 12px;
  color: #999;
  line-height: 1.7;
}

.disclaimer strong {
  color: #888;
}
</style>
