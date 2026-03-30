<template>
  <div class="monitor-page">
    <!-- Nav bar -->
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="nav-title">健康监测</span>
      <div class="nav-actions">
        <button class="nav-act" @click="showFullChart = true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        <button class="nav-act" @click="showToast('手动录入开发中')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tab bar -->
    <div class="tab-scroll">
      <button
        v-for="tab in vitalTabs"
        :key="tab.key"
        class="tab-chip"
        :class="{ 'tab-chip--active': activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <van-loading v-if="loading" type="spinner" size="32" color="#8A7BFE" class="page-loading" />

    <template v-else>
      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card stat-card--main">
          <div class="stat-label">最近测量</div>
          <div class="stat-val-row">
            <span class="stat-big">{{ currentReading.value }}</span>
            <span class="stat-unit">{{ currentReading.unit }}</span>
            <span v-if="currentReading.riskTag !== '正常'" class="stat-risk" :class="'stat-risk--' + currentReading.riskLevel">{{ currentReading.riskTag }}</span>
          </div>
          <div class="stat-time">{{ currentReading.timeLabel }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">上次测量</div>
          <div class="stat-val-row">
            <span class="stat-big stat-big--sub">{{ prevReading.value }}</span>
            <span class="stat-unit">{{ prevReading.unit }}</span>
          </div>
          <div class="stat-time">{{ prevReading.timeLabel }}</div>
        </div>
      </div>

      <!-- Trend chart -->
      <div class="chart-section">
        <svg class="trend-chart" :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(138,123,254,0.3)" />
              <stop offset="100%" stop-color="rgba(138,123,254,0.02)" />
            </linearGradient>
          </defs>
          <!-- Grid lines -->
          <line v-for="g in gridLines" :key="g" :x1="0" :y1="g" :x2="chartW" :y2="g" stroke="#f1f5f9" stroke-width="1" />
          <!-- Area -->
          <polygon v-if="areaPoints" :points="areaPoints" fill="url(#cFill)" />
          <!-- Line -->
          <polyline v-if="linePoints" :points="linePoints" fill="none" stroke="#8A7BFE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          <!-- Dots -->
          <circle v-for="(p, i) in chartDots" :key="i" :cx="p.x" :cy="p.y" r="3.5" fill="#8A7BFE" />
          <!-- Latest dot highlight -->
          <circle v-if="chartDots.length" :cx="chartDots[chartDots.length - 1].x" :cy="chartDots[chartDots.length - 1].y" r="6" fill="rgba(138,123,254,0.15)" />
        </svg>
        <div class="chart-x-labels">
          <span v-for="l in chartXLabels" :key="l">{{ l }}</span>
        </div>
      </div>

      <button class="trend-link" @click="showFullChart = true">
        查看波动机理及历史趋势
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <!-- Activity metrics -->
      <div class="section-label">活动指标</div>
      <div class="activity-grid">
        <!-- Steps -->
        <div class="act-card">
          <div class="act-top">
            <span class="act-name">每日步数</span>
          </div>
          <div class="act-big">{{ activities.steps.toLocaleString() }}</div>
          <div class="act-bar"><div class="act-bar-fill" :style="{ width: stepsPercent + '%' }"></div></div>
          <svg class="act-spark" viewBox="0 0 80 24">
            <polyline :points="stepsSpark" fill="none" stroke="#8A7BFE" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
        <!-- Sleep -->
        <div class="act-card">
          <div class="act-top">
            <span class="act-name">睡眠质量</span>
            <span class="act-badge act-badge--green">深度睡眠达标</span>
          </div>
          <div class="act-big">{{ activities.sleepH }}h {{ activities.sleepM }}m</div>
          <div class="sleep-bars">
            <div class="sleep-bar sleep-bar--deep" :style="{ flex: activities.deepPct }"></div>
            <div class="sleep-bar sleep-bar--light" :style="{ flex: activities.lightPct }"></div>
            <div class="sleep-bar sleep-bar--rem" :style="{ flex: activities.remPct }"></div>
          </div>
          <div class="sleep-legend">
            <span><i class="dot dot--deep"></i>深睡</span>
            <span><i class="dot dot--light"></i>浅睡</span>
            <span><i class="dot dot--rem"></i>REM</span>
          </div>
        </div>
        <!-- MET -->
        <div class="act-card">
          <div class="act-top">
            <span class="act-name">运动强度(MET)</span>
            <span class="act-badge" :class="activities.met > 150 ? 'act-badge--orange' : 'act-badge--blue'">{{ activities.metLabel }}</span>
          </div>
          <div class="act-big" :class="{ 'act-big--orange': activities.met > 150 }">{{ activities.met }}</div>
          <svg class="act-spark act-spark--orange" viewBox="0 0 80 24">
            <polyline :points="metSpark" fill="none" :stroke="activities.met > 150 ? '#f97316' : '#8A7BFE'" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
        <!-- Standing -->
        <div class="act-card">
          <div class="act-top">
            <span class="act-name">站立目标</span>
          </div>
          <div class="act-big">{{ activities.standDone }}/{{ activities.standTotal }} <small>次</small></div>
          <div class="stand-blocks">
            <span
              v-for="b in activities.standTotal"
              :key="b"
              class="stand-block"
              :class="{ 'stand-block--done': b <= activities.standDone }"
            ></span>
          </div>
        </div>
      </div>

      <!-- Health journal -->
      <div class="journal-section">
        <div class="journal-header">
          <span class="journal-title">健康日志</span>
          <div class="journal-actions">
            <button class="journal-link" @click="showToast('历史记录开发中')">历史记录</button>
            <button class="journal-add" @click="showToast('手动添加开发中')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="journal-timeline">
          <div v-for="(entry, i) in visibleJournal" :key="i" class="je-item">
            <div class="je-time-col">
              <span class="je-time">{{ entry.time }}</span>
              <div v-if="i < visibleJournal.length - 1" class="je-line"></div>
            </div>
            <div class="je-card">
              <div class="je-head">
                <span class="je-type" :class="'je-type--' + entry.type">{{ entry.typeLabel }}</span>
                <span class="je-tag">[{{ entry.tag }}]</span>
                <span v-if="entry.status" class="je-status">{{ entry.status }}</span>
              </div>
              <div class="je-body">
                <span class="je-icon">{{ entry.icon }}</span>
                <span class="je-text">{{ entry.content }}</span>
              </div>
              <div v-if="entry.ai" class="je-ai">
                <span class="je-ai-icon">✨</span>
                <span class="je-ai-text">AI分析: {{ entry.ai }}</span>
              </div>
            </div>
          </div>
        </div>
        <button v-if="!expandJournal && journalEntries.length > 3" class="journal-expand" @click="expandJournal = true">
          展开全天日志 ∨
        </button>
      </div>

      <div class="safe-bottom"></div>
    </template>

    <!-- Full screen chart popup -->
    <van-popup v-model:show="showFullChart" position="bottom" round :style="{ height: '85%' }">
      <div class="fc-popup">
        <div class="fc-header">
          <span class="fc-title">{{ activeTabLabel }} · 近7日趋势</span>
          <button class="fc-close" @click="showFullChart = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="fc-body">
          <svg class="fc-chart" :viewBox="`0 0 ${chartW} 180`" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fcFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(138,123,254,0.25)" />
                <stop offset="100%" stop-color="rgba(138,123,254,0.02)" />
              </linearGradient>
            </defs>
            <line v-for="g in fcGridLines" :key="g" :x1="0" :y1="g" :x2="chartW" :y2="g" stroke="#f1f5f9" stroke-width="1" />
            <polygon v-if="fcAreaPoints" :points="fcAreaPoints" fill="url(#fcFill)" />
            <polyline v-if="fcLinePoints" :points="fcLinePoints" fill="none" stroke="#8A7BFE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle v-for="(p, i) in fcDots" :key="i" :cx="p.x" :cy="p.y" r="4" fill="#8A7BFE" />
          </svg>
          <div class="chart-x-labels" style="margin-top:4px;">
            <span v-for="l in chartXLabels" :key="l">{{ l }}</span>
          </div>
          <div v-if="aiSummary" class="fc-ai">
            <span class="fc-ai-icon">✨</span>
            <span class="fc-ai-text">{{ aiSummary }}</span>
          </div>
          <div class="fc-records">
            <div v-for="(r, i) in vitalRecords" :key="i" class="fc-record">
              <span class="fc-r-time">{{ r.date }} {{ r.time }}</span>
              <span class="fc-r-val">{{ r.value }} <small>{{ r.unit }}</small></span>
              <span class="fc-r-tag" :class="'fc-r-tag--' + r.riskLevel">{{ r.riskTag }}</span>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getVitalHistory } from '@/api/patient'
import { usePatientStore } from '@/stores/patient'

const router = useRouter()
const store = usePatientStore()
const loading = ref(true)
const showFullChart = ref(false)
const expandJournal = ref(false)

const vitalTabs = [
  { key: 'bloodPressure', label: '血压' },
  { key: 'bloodSugar', label: '血糖' },
  { key: 'heartRate', label: '心率' },
  { key: 'weight', label: '体重' },
  { key: 'bloodOxygen', label: '血氧' },
]
const activeTab = ref('bloodPressure')
const activeTabLabel = computed(() => vitalTabs.find(t => t.key === activeTab.value)?.label || '')

const vitalRecords = ref<any[]>([])
const aiSummary = ref('')

async function loadData() {
  loading.value = true
  try {
    const res = await getVitalHistory(activeTab.value) as any
    vitalRecords.value = res?.records || []
    aiSummary.value = res?.aiSummary || ''
  } catch { /* silent */ }
  finally { loading.value = false }
}

function switchTab(key: string) {
  activeTab.value = key
  loadData()
}

onMounted(() => loadData())

// Stats
const currentReading = computed(() => {
  const r = vitalRecords.value[0]
  if (!r) return { value: '--', unit: '', riskTag: '--', riskLevel: 'normal', timeLabel: '' }
  return { value: r.value, unit: r.unit, riskTag: r.riskTag, riskLevel: r.riskLevel, timeLabel: `今天 ${r.time}` }
})

const prevReading = computed(() => {
  const r = vitalRecords.value[1]
  if (!r) return { value: '--', unit: '', timeLabel: '' }
  return { value: r.value, unit: r.unit, timeLabel: `${r.date} ${r.time}` }
})

// Chart
const chartW = 320
const chartH = 120

function parseValue(val: string): number {
  if (activeTab.value === 'bloodPressure') return parseInt(val.split('/')[0]) || 0
  return parseFloat(val) || 0
}

const chartData = computed(() => {
  return [...vitalRecords.value].reverse().map(r => ({ ...r, num: parseValue(r.value) }))
})

const chartDots = computed(() => {
  const data = chartData.value
  if (data.length < 2) return []
  const vals = data.map(d => d.num)
  const min = Math.min(...vals) - 5
  const max = Math.max(...vals) + 5
  const range = max - min || 1
  const padX = 15, padY = 10, cW = chartW - 30, cH = chartH - 30
  return data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * cW,
    y: padY + (1 - (d.num - min) / range) * cH,
  }))
})

const linePoints = computed(() => chartDots.value.map(p => `${p.x},${p.y}`).join(' '))
const areaPoints = computed(() => {
  const d = chartDots.value
  if (d.length < 2) return ''
  const bottom = chartH - 15
  return `${d[0].x},${bottom} ${linePoints.value} ${d[d.length - 1].x},${bottom}`
})

const gridLines = computed(() => {
  const cH = chartH - 30
  return [10 + cH * 0.25, 10 + cH * 0.5, 10 + cH * 0.75]
})

const chartXLabels = computed(() => {
  const data = chartData.value
  if (data.length < 2) return []
  const step = Math.max(1, Math.floor(data.length / 4))
  const labels: string[] = []
  for (let i = 0; i < data.length; i += step) {
    labels.push(data[i].date || '')
  }
  if (labels.length < 5 && data.length > 0) {
    labels.push(data[data.length - 1].date || '')
  }
  return labels
})

// Full chart
const fcDots = computed(() => {
  const data = chartData.value
  if (data.length < 2) return []
  const vals = data.map(d => d.num)
  const min = Math.min(...vals) - 5
  const max = Math.max(...vals) + 5
  const range = max - min || 1
  const padX = 15, padY = 15, cW = chartW - 30, cH = 150
  return data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * cW,
    y: padY + (1 - (d.num - min) / range) * cH,
  }))
})

const fcLinePoints = computed(() => fcDots.value.map(p => `${p.x},${p.y}`).join(' '))
const fcAreaPoints = computed(() => {
  const d = fcDots.value
  if (d.length < 2) return ''
  return `${d[0].x},170 ${fcLinePoints.value} ${d[d.length - 1].x},170`
})
const fcGridLines = computed(() => [37.5, 75, 112.5, 150])

// Activities (mock data based on patient seed)
const seed = computed(() => store.profile?.id || 1)

const activities = computed(() => {
  const s = seed.value
  const steps = 8000 + (s * 137) % 7000
  const sleepH = 6 + (s * 3) % 3
  const sleepM = 15 + (s * 7) % 45
  const met = 100 + (s * 11) % 80
  return {
    steps,
    sleepH,
    sleepM,
    deepPct: 30 + (s * 3) % 20,
    lightPct: 35 + (s * 5) % 15,
    remPct: 15 + (s * 2) % 10,
    met,
    metLabel: met > 150 ? '高' : met > 120 ? '中' : '低',
    standDone: 7 + (s * 5) % 6,
    standTotal: 12,
  }
})

const stepsPercent = computed(() => Math.min(100, Math.floor(activities.value.steps / 10000 * 100)))

// Mini sparkline data
const stepsSpark = computed(() => {
  const s = seed.value
  const pts = Array.from({ length: 8 }, (_, i) => {
    const y = 6 + ((s * (i + 1) * 7) % 12)
    return `${i * 11.4},${y}`
  })
  return pts.join(' ')
})

const metSpark = computed(() => {
  const s = seed.value
  const pts = Array.from({ length: 8 }, (_, i) => {
    const y = 4 + ((s * (i + 2) * 5) % 16)
    return `${i * 11.4},${y}`
  })
  return pts.join(' ')
})

// Journal entries
const journalEntries = computed(() => [
  {
    time: '08:00', type: 'medication', typeLabel: '用药确认', tag: '降压药', status: '已执行',
    icon: '💊', content: '厄贝沙坦片 150mg',
    ai: '用药后请静坐15分钟，观察是否有头晕感',
  },
  {
    time: '08:45', type: 'diet', typeLabel: '早餐记录', tag: '低盐', status: '',
    icon: '🥣', content: '燕麦粥1碗 + 煮鸡蛋1个 + 青菜少许',
    ai: '膳食纤维充足，有助于餐后血糖平稳',
  },
  {
    time: '10:30', type: 'exercise', typeLabel: '运动记录', tag: '有氧', status: '已完成',
    icon: '🏃', content: '步行30分钟，平均心率102bpm',
    ai: '心率在靶区内，运动强度适中，建议继续保持',
  },
  {
    time: '12:00', type: 'diet', typeLabel: '午餐记录', tag: '均衡', status: '',
    icon: '🍱', content: '糙米饭 + 清蒸鱼 + 西兰花',
    ai: '蛋白质和膳食纤维均衡，控盐良好',
  },
  {
    time: '15:00', type: 'monitoring', typeLabel: '体征监测', tag: '血压', status: '已录入',
    icon: '📊', content: '血压 135/85mmHg，心率 78bpm',
    ai: '午后血压略有上升，属正常波动范围',
  },
  {
    time: '18:30', type: 'diet', typeLabel: '晚餐记录', tag: '低脂', status: '',
    icon: '🥗', content: '蒸南瓜 + 鸡胸肉沙拉 + 杂粮粥',
    ai: '晚餐热量控制良好，建议餐后适当散步',
  },
  {
    time: '20:00', type: 'medication', typeLabel: '用药确认', tag: '晚间药', status: '已执行',
    icon: '💊', content: '阿司匹林 100mg + 阿托伐他汀 20mg',
    ai: '用药时间规律，依从性良好',
  },
])

const visibleJournal = computed(() => expandJournal.value ? journalEntries.value : journalEntries.value.slice(0, 3))
</script>

<style scoped>
.monitor-page {
  min-height: 100vh;
  background: #f8fafc;
}

.safe-bottom { height: calc(20px + env(safe-area-inset-bottom)); }

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

.nav-actions {
  display: flex;
  gap: 6px;
}

.nav-act {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.nav-act:active { background: #e2e8f0; }

/* ========== Tabs ========== */
.tab-scroll {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-scroll::-webkit-scrollbar { display: none; }

.tab-chip {
  padding: 8px 18px;
  border-radius: 20px;
  border: 1.5px solid #e2e8f0;
  background: white;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tab-chip--active {
  background: #8A7BFE;
  border-color: #8A7BFE;
  color: white;
  box-shadow: 0 2px 8px rgba(138, 123, 254, 0.3);
}

.tab-chip:active { opacity: 0.8; }

.page-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

/* ========== Stats ========== */
.stats-row {
  display: flex;
  gap: 10px;
  padding: 12px 16px 0;
}

.stat-card {
  flex: 1;
  background: white;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.stat-card--main {
  border: 1.5px solid rgba(138, 123, 254, 0.15);
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
}

.stat-val-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}

.stat-big {
  font-size: 24px;
  font-weight: 900;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace;
}

.stat-big--sub {
  font-size: 20px;
  color: #475569;
}

.stat-unit {
  font-size: 12px;
  color: #94a3b8;
}

.stat-risk {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  margin-left: 4px;
}

.stat-risk--high {
  color: #ef4444;
  background: #fef2f2;
}

.stat-risk--low {
  color: #D46B08;
  background: #fff7ed;
}

.stat-time {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* ========== Chart ========== */
.chart-section {
  margin: 12px 16px 0;
  background: white;
  border-radius: 14px;
  padding: 16px 12px 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.trend-chart {
  width: 100%;
  height: 120px;
}

.chart-x-labels {
  display: flex;
  justify-content: space-between;
  padding: 4px 15px 0;
  font-size: 11px;
  color: #94a3b8;
}

.trend-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 12px 16px 0;
  padding: 10px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: #8A7BFE;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.trend-link:active { opacity: 0.7; }

/* ========== Activity ========== */
.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  padding: 16px 20px 8px;
  letter-spacing: 0.05em;
}

.activity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 16px;
}

.act-card {
  background: white;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.act-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.act-name {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.act-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.act-badge--green {
  color: #059669;
  background: #ecfdf5;
}

.act-badge--orange {
  color: #ea580c;
  background: #fff7ed;
}

.act-badge--blue {
  color: #8A7BFE;
  background: #f0eeff;
}

.act-big {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace;
}

.act-big--orange {
  color: #ea580c;
}

.act-big small {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Steps bar */
.act-bar {
  height: 4px;
  background: #f1f5f9;
  border-radius: 2px;
  overflow: hidden;
}

.act-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8A7BFE, #A89AFE);
  border-radius: 2px;
  transition: width 0.6s ease;
}

/* Sparkline */
.act-spark {
  width: 100%;
  height: 24px;
  margin-top: 2px;
}

/* Sleep bars */
.sleep-bars {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  gap: 1px;
}

.sleep-bar {
  height: 100%;
  border-radius: 3px;
}

.sleep-bar--deep { background: #6366f1; }
.sleep-bar--light { background: #a5b4fc; }
.sleep-bar--rem { background: #c7d2fe; }

.sleep-legend {
  display: flex;
  gap: 10px;
  font-size: 10px;
  color: #94a3b8;
}

.sleep-legend .dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 3px;
  vertical-align: middle;
  font-style: normal;
}

.dot--deep { background: #6366f1; }
.dot--light { background: #a5b4fc; }
.dot--rem { background: #c7d2fe; }

/* Standing blocks */
.stand-blocks {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.stand-block {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: #f1f5f9;
}

.stand-block--done {
  background: #8A7BFE;
}

/* ========== Journal ========== */
.journal-section {
  margin: 16px 16px 0;
}

.journal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.journal-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.journal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.journal-link {
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: #8A7BFE;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.journal-add {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.journal-add:active { background: #f1f5f9; }

.journal-timeline {
  display: flex;
  flex-direction: column;
}

.je-item {
  display: flex;
  gap: 12px;
}

.je-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  flex-shrink: 0;
}

.je-time {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.je-line {
  width: 2px;
  flex: 1;
  background: #e2e8f0;
  min-height: 16px;
  margin: 4px 0;
}

.je-card {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  min-width: 0;
}

.je-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.je-type {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.je-type--medication { color: #8A7BFE; background: #f0eeff; }
.je-type--diet { color: #059669; background: #ecfdf5; }
.je-type--exercise { color: #ea580c; background: #fff7ed; }
.je-type--monitoring { color: #2563eb; background: #eff6ff; }

.je-tag {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.je-status {
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  margin-left: auto;
}

.je-body {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 6px;
}

.je-icon {
  font-size: 16px;
  flex-shrink: 0;
  line-height: 1.4;
}

.je-text {
  font-size: 14px;
  color: #334155;
  line-height: 1.5;
}

.je-ai {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(135deg, #EAF8F1, #F4FCF8);
  border-radius: 8px;
}

.je-ai-icon {
  font-size: 12px;
  flex-shrink: 0;
  line-height: 1.6;
}

.je-ai-text {
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

.journal-expand {
  display: block;
  width: 100%;
  padding: 12px;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-align: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  margin-top: 4px;
}

.journal-expand:active { background: #f8fafc; }

/* ========== Full Chart Popup ========== */
.fc-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.fc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  flex-shrink: 0;
}

.fc-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.fc-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.fc-close:active { background: #e2e8f0; }

.fc-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
  -webkit-overflow-scrolling: touch;
}

.fc-chart {
  width: 100%;
  height: 180px;
  margin-bottom: 4px;
}

.fc-ai {
  display: flex;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, #EAF8F1, #F4FCF8);
  border-radius: 14px;
  margin: 16px 0;
  align-items: flex-start;
}

.fc-ai-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.fc-ai-text {
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
}

.fc-records {
  display: flex;
  flex-direction: column;
}

.fc-record {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
}

.fc-r-time {
  font-size: 13px;
  color: #94a3b8;
  width: 90px;
  flex-shrink: 0;
}

.fc-r-val {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace;
}

.fc-r-val small {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 2px;
}

.fc-r-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.fc-r-tag--normal { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.fc-r-tag--high { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
.fc-r-tag--low { color: #D46B08; background: rgba(212, 107, 8, 0.1); }
</style>
