<template>
  <div class="training-page">
    <!-- Nav bar -->
    <div class="t-nav">
      <button class="t-nav-btn" @click="handleBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="t-nav-title">康复训练</span>
      <span class="t-nav-timer" v-if="state !== 'ready' && state !== 'device-check'">{{ formatTime(elapsed) }}</span>
      <span v-else class="t-nav-timer" style="visibility:hidden">00:00</span>
    </div>

    <!-- ========== READY ========== -->
    <div v-if="state === 'ready'" class="t-ready">
      <div class="t-cover">
        <div class="t-cover-icon">🏃‍♂️</div>
        <div class="t-cover-label">心脏康复训练</div>
      </div>
      <div class="t-info-card">
        <div class="t-info-title">有氧康复训练 · II期</div>
        <div class="t-info-row">
          <div class="t-info-item"><span class="t-info-val">15</span><span class="t-info-unit">分钟</span></div>
          <div class="t-info-divider"></div>
          <div class="t-info-item"><span class="t-info-val">90-110</span><span class="t-info-unit">靶心率</span></div>
          <div class="t-info-divider"></div>
          <div class="t-info-item"><span class="t-info-val">3</span><span class="t-info-unit">阶段</span></div>
        </div>
        <div class="t-phases">
          <div class="t-phase"><span class="t-phase-dot t-phase-dot--warmup"></span>热身（2分钟）· 缓步行走</div>
          <div class="t-phase"><span class="t-phase-dot t-phase-dot--core"></span>核心（10分钟）· 快走/慢跑</div>
          <div class="t-phase"><span class="t-phase-dot t-phase-dot--cool"></span>放松（3分钟）· 拉伸放松</div>
        </div>
      </div>
      <button class="t-start-btn" @click="startTraining">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        开始训练
      </button>
    </div>

    <!-- ========== DEVICE CHECK ========== -->
    <div v-if="state === 'device-check'" class="t-devcheck">
      <div class="t-dc-icon">⌚</div>
      <div class="t-dc-title">设备佩戴确认</div>
      <div class="t-dc-sub">开始训练前，请确认以下事项</div>

      <div class="t-dc-list">
        <div
          v-for="(item, idx) in deviceChecks"
          :key="idx"
          :class="['t-dc-item', { 't-dc-item--checked': item.checked }]"
          @click="item.checked = !item.checked"
        >
          <div :class="['t-dc-check', { 't-dc-check--on': item.checked }]">
            <svg v-if="item.checked" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span class="t-dc-label">{{ item.label }}</span>
        </div>
      </div>

      <button class="t-dc-btn" :disabled="!allDeviceChecked" @click="confirmDevice">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        确认并开始训练
      </button>
      <button class="t-dc-skip" @click="state = 'ready'">暂不训练</button>
    </div>

    <!-- ========== PLAYING / PAUSED ========== -->
    <div v-if="state === 'playing' || state === 'paused'" class="t-active">
      <!-- Video area (full-width, large) with embedded overlays -->
      <div class="t-video">
        <div class="t-video-phase" :class="'t-vp--' + currentPhase">{{ phaseLabel }}</div>
        <div class="t-figure" :class="{ 't-figure--paused': state === 'paused' }">
          <div class="t-stick-head"></div>
          <div class="t-stick-body"></div>
          <div class="t-stick-larm"></div>
          <div class="t-stick-rarm"></div>
          <div class="t-stick-lleg"></div>
          <div class="t-stick-rleg"></div>
        </div>

        <!-- HR overlay (bottom-left inside video) -->
        <div class="t-hr-overlay" :class="{ 't-hr-overlay--warn': currentHR >= 110 }">
          <span class="t-hr-beat" :class="{ 't-hr-beat--warn': currentHR >= 110 }">❤️</span>
          <span class="t-hr-num">{{ currentHR }}</span>
          <span class="t-hr-bpm">bpm</span>
          <span class="t-hr-zone-tag" :class="'t-zt--' + hrZone">{{ hrZoneLabel }}</span>
        </div>

        <!-- Stats overlay (bottom-right inside video) -->
        <div class="t-stats-overlay">
          <div class="t-so-item"><span class="t-so-val">{{ formatTime(elapsed) }}</span><span class="t-so-label">时长</span></div>
          <div class="t-so-item"><span class="t-so-val">{{ calories }}</span><span class="t-so-label">kcal</span></div>
        </div>

        <!-- Progress bar (bottom edge of video) -->
        <div class="t-vprog"><div class="t-vprog-fill" :style="{ width: progressPct + '%' }"></div></div>

        <!-- Paused overlay -->
        <div v-if="state === 'paused'" class="t-pause-overlay">
          <div class="t-pause-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
              <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            <div class="t-pause-text">已暂停</div>
          </div>
          <div class="t-pause-actions">
            <button class="t-pa-btn t-pa-btn--end" @click="confirmStop">结束</button>
            <button class="t-pa-btn t-pa-btn--resume" @click="togglePause">继续训练</button>
          </div>
        </div>
      </div>

      <!-- Yellow line warning (non-blocking) -->
      <Transition name="t-yw-fade">
        <div v-if="showYellowWarning && state === 'playing'" class="t-yellow-warn">
          <div class="t-yw-icon">⚠️</div>
          <div class="t-yw-text">
            <div class="t-yw-title">心率偏高（{{ currentHR }} bpm）</div>
            <div class="t-yw-sub">建议减缓动作幅度，注意呼吸节奏</div>
          </div>
          <div class="t-yw-btns">
            <button class="t-yw-btn t-yw-btn--pause" @click="yellowPause">暂停休息</button>
            <button class="t-yw-btn t-yw-btn--cont" @click="yellowContinue">继续</button>
          </div>
        </div>
      </Transition>

      <!-- Floating pause button (playing state only) -->
      <button v-if="state === 'playing'" class="t-fab-pause" @click="togglePause">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
      </button>
    </div>

    <!-- ========== ALERT ========== -->
    <div v-if="state === 'alert'" class="t-alert-overlay">
      <div class="t-alert-hr">
        <div class="t-alert-hr-icon">❤️</div>
        <div class="t-alert-hr-val">{{ currentHR }}</div>
        <div class="t-alert-hr-tag">心率异常</div>
      </div>
      <div class="t-voice-area">
        <div class="t-voice-bars">
          <span class="t-vbar"></span><span class="t-vbar"></span><span class="t-vbar"></span>
          <span class="t-vbar"></span><span class="t-vbar"></span>
        </div>
        <div class="t-voice-text">请问您现在感觉如何？</div>
      </div>
      <div class="t-alert-btns">
        <button class="t-feel-btn t-feel--ok" @click="handleFeel('ok')">
          <span class="t-feel-emoji">😊</span>
          <span>感觉正常</span>
        </button>
        <button class="t-feel-btn t-feel--mid" @click="handleFeel('mid')">
          <span class="t-feel-emoji">😐</span>
          <span>有些不适</span>
        </button>
        <button class="t-feel-btn t-feel--bad" @click="handleFeel('bad')">
          <span class="t-feel-emoji">😰</span>
          <span>非常不适</span>
        </button>
      </div>
      <div class="t-alert-countdown">
        <div class="t-alert-cd-bar"><div class="t-alert-cd-fill" :style="{ width: (alertCountdown / 10 * 100) + '%' }"></div></div>
        <div class="t-alert-cd-text">{{ alertCountdown }}秒后将自动发送预警</div>
      </div>
    </div>

    <!-- ========== COUNTDOWN ========== -->
    <div v-if="state === 'countdown'" class="t-cd-overlay">
      <div class="t-cd-num">{{ resumeCount }}</div>
      <div class="t-cd-text">即将恢复训练</div>
    </div>

    <!-- ========== EMERGENCY ========== -->
    <div v-if="state === 'emergency'" class="t-emg-overlay">
      <div class="t-emg-icon">🚨</div>
      <div class="t-emg-title">紧急警报已发送</div>
      <div class="t-emg-desc">已通知紧急联系人和主治医生</div>
      <div class="t-emg-detail">
        <div class="t-emg-row"><span>📞</span>紧急联系人：王芳（女儿）</div>
        <div class="t-emg-row"><span>👨‍⚕️</span>主治医生：张伟</div>
        <div class="t-emg-row"><span>❤️</span>当前心率：{{ currentHR }} bpm</div>
      </div>
      <button class="t-emg-btn" @click="endTraining">结束训练</button>
    </div>

    <!-- ========== COMPLETED ========== -->
    <div v-if="state === 'completed'" class="t-done-overlay">
      <div class="t-done-check">✓</div>
      <div class="t-done-title">训练完成</div>
      <div class="t-done-card">
        <div class="t-done-grid">
          <div class="t-done-item">
            <div class="t-done-val">{{ formatTime(totalDuration) }}</div>
            <div class="t-done-label">训练时长</div>
          </div>
          <div class="t-done-item">
            <div class="t-done-val">{{ avgHR }}</div>
            <div class="t-done-label">平均心率</div>
          </div>
          <div class="t-done-item">
            <div class="t-done-val">{{ maxHR }}</div>
            <div class="t-done-label">最大心率</div>
          </div>
          <div class="t-done-item">
            <div class="t-done-val">{{ calories }}</div>
            <div class="t-done-label">消耗热量(kcal)</div>
          </div>
        </div>
      </div>
      <button class="t-done-btn" @click="endTraining">返回首页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'

const router = useRouter()

type TrainState = 'ready' | 'device-check' | 'playing' | 'paused' | 'alert' | 'countdown' | 'emergency' | 'completed'
const state = ref<TrainState>('ready')

const elapsed = ref(0)          // seconds
const currentHR = ref(72)
const totalDuration = ref(0)
const hrHistory: number[] = []
const maxHR = ref(0)
const avgHR = ref(0)

const alertCountdown = ref(10)
const resumeCount = ref(3)

// Device check
const deviceChecks = ref([
  { label: '监测设备已连接', checked: false },
  { label: '手环/胸带已紧贴皮肤', checked: false },
  { label: '心率数据显示正常', checked: false },
])
const allDeviceChecked = computed(() => deviceChecks.value.every(c => c.checked))

// Yellow line warning (non-blocking)
const showYellowWarning = ref(false)
let yellowDismissed = false

let mainTimer: number | null = null
let hrTimer: number | null = null
let alertTimer: number | null = null
let resumeTimer: number | null = null
let audioCtx: AudioContext | null = null
let skipGuard = false

const TOTAL_SECONDS = 15 * 60  // 15 minutes

// Phase helpers
const currentPhase = computed(() => {
  const s = elapsed.value
  if (s < 120) return 'warmup'
  if (s < 720) return 'core'
  return 'cool'
})

const phaseLabel = computed(() => {
  const labels = { warmup: '热身阶段', core: '核心训练', cool: '放松阶段' }
  return labels[currentPhase.value]
})

const progressPct = computed(() => Math.min((elapsed.value / TOTAL_SECONDS) * 100, 100))

const calories = computed(() => Math.round(elapsed.value * 0.1))

const hrZone = computed(() => {
  if (currentHR.value < 80) return 'rest'
  if (currentHR.value < 90) return 'warmup'
  if (currentHR.value < 110) return 'aerobic'
  return 'warning'
})

const hrZoneLabel = computed(() => {
  const labels = { rest: '安静区', warmup: '热身区', aerobic: '有氧区', warning: '⚠️ 警告区' }
  return labels[hrZone.value]
})

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

// Heart rate simulation
function simulateHR(sec: number): number {
  const noise = (Math.random() - 0.5) * 3
  // Yellow-line zone: ~35-42s → HR 100-114
  if (sec >= 35 && sec <= 42) {
    return Math.round(105 + Math.random() * 8 + noise)
  }
  // Red-line anomaly injection at ~45s → HR >= 115
  if (sec >= 45 && sec <= 52) {
    return Math.round(118 + Math.random() * 7 + noise)
  }
  if (sec < 120) {
    // Warmup: 72 → 90
    return Math.round(72 + (sec / 120) * 18 + noise)
  }
  if (sec < 720) {
    // Core: 95-108 with sine wave
    const base = 101
    const wave = Math.sin((sec - 120) / 60) * 7
    return Math.round(base + wave + noise)
  }
  // Cooldown: 95 → 75
  const coolPct = (sec - 720) / 180
  return Math.round(95 - coolPct * 20 + noise)
}

function startTraining() {
  // Go to device check first
  state.value = 'device-check'
  deviceChecks.value.forEach(c => c.checked = false)
}

function confirmDevice() {
  state.value = 'playing'
  elapsed.value = 0
  currentHR.value = 72
  hrHistory.length = 0
  maxHR.value = 0
  showYellowWarning.value = false
  yellowDismissed = false

  mainTimer = window.setInterval(() => {
    if (state.value !== 'playing') return
    elapsed.value++
    if (elapsed.value >= TOTAL_SECONDS) {
      completeTraining()
    }
  }, 1000)

  hrTimer = window.setInterval(() => {
    if (state.value !== 'playing') return
    const hr = simulateHR(elapsed.value)
    currentHR.value = hr
    hrHistory.push(hr)
    if (hr > maxHR.value) maxHR.value = hr

    // Circuit breaker
    if (hr >= 115) {
      showYellowWarning.value = false
      triggerAlert()
    } else if (hr >= 100 && !yellowDismissed && !showYellowWarning.value) {
      showYellowWarning.value = true
    } else if (hr < 100) {
      showYellowWarning.value = false
    }
  }, 1000)
}

function togglePause() {
  if (state.value === 'playing') {
    state.value = 'paused'
  } else if (state.value === 'paused') {
    state.value = 'playing'
  }
}

// Yellow warning handlers
function yellowContinue() {
  showYellowWarning.value = false
  yellowDismissed = true
}

function yellowPause() {
  showYellowWarning.value = false
  yellowDismissed = true
  state.value = 'paused'
}

// Alert / circuit breaker
function triggerAlert() {
  state.value = 'alert'
  alertCountdown.value = 10
  playAlertSound()

  alertTimer = window.setInterval(() => {
    alertCountdown.value--
    if (alertCountdown.value <= 0) {
      clearAlertTimer()
      goEmergency()
    }
  }, 1000)
}

function clearAlertTimer() {
  if (alertTimer !== null) { clearInterval(alertTimer); alertTimer = null }
}

function handleFeel(feel: 'ok' | 'mid' | 'bad') {
  clearAlertTimer()
  if (feel === 'ok') {
    // Reset HR and do countdown
    currentHR.value = 88
    state.value = 'countdown'
    resumeCount.value = 3
    resumeTimer = window.setInterval(() => {
      resumeCount.value--
      if (resumeCount.value <= 0) {
        if (resumeTimer !== null) { clearInterval(resumeTimer); resumeTimer = null }
        state.value = 'playing'
      }
    }, 1000)
  } else {
    goEmergency()
  }
}

function goEmergency() {
  state.value = 'emergency'
  clearAllTimers()
  showToast('预警已发送')
}

function completeTraining() {
  state.value = 'completed'
  totalDuration.value = elapsed.value
  if (hrHistory.length > 0) {
    avgHR.value = Math.round(hrHistory.reduce((a, b) => a + b, 0) / hrHistory.length)
  }
  clearAllTimers()
}

function saveTrainingResult(reason: 'completed' | 'emergency' | 'stopped') {
  const dur = reason === 'completed' ? totalDuration.value : elapsed.value
  const avg = hrHistory.length > 0 ? Math.round(hrHistory.reduce((a, b) => a + b, 0) / hrHistory.length) : 0
  sessionStorage.setItem('training_result', JSON.stringify({
    reason,
    duration: dur,
    avgHR: avg,
    maxHR: maxHR.value,
    calories: Math.round(dur * 0.1),
  }))
}

async function confirmStop() {
  try {
    await showConfirmDialog({ title: '结束训练', message: '确定要结束本次训练吗？训练数据将被记录。', confirmButtonText: '结束', cancelButtonText: '取消' })
    stopTraining()
  } catch { /* cancelled */ }
}

function stopTraining() {
  totalDuration.value = elapsed.value
  if (hrHistory.length > 0) {
    avgHR.value = Math.round(hrHistory.reduce((a, b) => a + b, 0) / hrHistory.length)
  }
  clearAllTimers()
  saveTrainingResult('stopped')
  skipGuard = true
  router.replace('/p/consult')
}

function endTraining() {
  clearAllTimers()
  saveTrainingResult(state.value === 'emergency' ? 'emergency' : 'completed')
  skipGuard = true
  router.replace('/p/consult')
}

function clearAllTimers() {
  if (mainTimer !== null) { clearInterval(mainTimer); mainTimer = null }
  if (hrTimer !== null) { clearInterval(hrTimer); hrTimer = null }
  clearAlertTimer()
  if (resumeTimer !== null) { clearInterval(resumeTimer); resumeTimer = null }
}

function playAlertSound() {
  try {
    audioCtx = audioCtx || new AudioContext()
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.connect(g)
    g.connect(audioCtx.destination)
    o.frequency.value = 880
    g.gain.value = 0.15
    o.start()
    o.stop(audioCtx.currentTime + 0.5)
  } catch { /* silent */ }
}

async function handleBack() {
  if (state.value === 'device-check') {
    state.value = 'ready'
    return
  }
  if (state.value === 'playing' || state.value === 'paused' || state.value === 'alert' || state.value === 'countdown') {
    try {
      await showConfirmDialog({ title: '提示', message: '训练进行中，确定要退出吗？', confirmButtonText: '退出', cancelButtonText: '继续' })
      clearAllTimers()
      skipGuard = true
      router.back()
    } catch { /* cancelled */ }
  } else {
    router.back()
  }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (skipGuard) {
    skipGuard = false
    next()
    return
  }
  if (state.value === 'playing' || state.value === 'paused' || state.value === 'alert' || state.value === 'countdown') {
    showConfirmDialog({ title: '提示', message: '训练进行中，确定要退出吗？', confirmButtonText: '退出', cancelButtonText: '继续' })
      .then(() => { clearAllTimers(); next() })
      .catch(() => next(false))
  } else {
    next()
  }
})

onUnmounted(() => {
  clearAllTimers()
})
</script>

<style scoped>
.training-page {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #0f172a;
  color: white;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Nav */
.t-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 10;
}
.t-nav-btn {
  width: 36px; height: 36px; border-radius: 10px;
  border: none; background: rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  color: white; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.t-nav-btn:active { background: rgba(255,255,255,0.2); }
.t-nav-title { font-size: 17px; font-weight: 700; }
.t-nav-timer { font-size: 15px; font-weight: 600; color: #8A7BFE; font-variant-numeric: tabular-nums; }

/* ===== READY ===== */
.t-ready { flex: 1; display: flex; flex-direction: column; padding: 20px 16px; }
.t-cover {
  flex: 1; min-height: 200px; max-height: 300px;
  background: linear-gradient(160deg, #1e293b 0%, #334155 100%);
  border-radius: 20px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
}
.t-cover-icon { font-size: 56px; }
.t-cover-label { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.8); }

.t-info-card {
  background: rgba(255,255,255,0.06); border-radius: 16px;
  padding: 20px; margin-top: 16px;
}
.t-info-title { font-size: 17px; font-weight: 800; margin-bottom: 16px; }
.t-info-row { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 16px; }
.t-info-item { flex: 1; text-align: center; }
.t-info-val { font-size: 24px; font-weight: 800; color: #8A7BFE; }
.t-info-unit { font-size: 12px; color: rgba(255,255,255,0.5); margin-left: 4px; }
.t-info-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.1); }
.t-phases { display: flex; flex-direction: column; gap: 8px; }
.t-phase { font-size: 13px; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 8px; }
.t-phase-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.t-phase-dot--warmup { background: #facc15; }
.t-phase-dot--core { background: #ef4444; }
.t-phase-dot--cool { background: #10b981; }

.t-start-btn {
  margin-top: 20px; padding: 16px; border-radius: 16px; border: none;
  background: linear-gradient(135deg, #8A7BFE, #a89afe);
  font-size: 17px; font-weight: 700; color: white;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.t-start-btn:active { opacity: 0.85; }

/* ===== PLAYING / PAUSED ===== */
.t-active { flex: 1; display: flex; flex-direction: column; position: relative; }

.t-video {
  position: relative; background: linear-gradient(160deg, #1e293b, #334155);
  flex: 1; display: flex;
  align-items: center; justify-content: center; overflow: hidden;
}
.t-video-phase {
  position: absolute; top: 12px; left: 12px;
  padding: 4px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 700; z-index: 2;
}
.t-vp--warmup { background: rgba(250,204,21,0.2); color: #facc15; }
.t-vp--core { background: rgba(239,68,68,0.2); color: #ef4444; }
.t-vp--cool { background: rgba(16,185,129,0.2); color: #10b981; }

/* HR overlay (bottom-left in video) */
.t-hr-overlay {
  position: absolute; bottom: 16px; left: 12px; z-index: 2;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
  border-radius: 12px; padding: 8px 12px;
  display: flex; align-items: center; gap: 4px;
}
.t-hr-overlay--warn { background: rgba(127,29,29,0.7); }
.t-hr-beat { font-size: 16px; animation: heartbeat 1s ease-in-out infinite; }
.t-hr-beat--warn { animation: heartbeat 0.5s ease-in-out infinite; }
@keyframes heartbeat { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.t-hr-num { font-size: 24px; font-weight: 900; font-variant-numeric: tabular-nums; line-height: 1; }
.t-hr-bpm { font-size: 11px; color: rgba(255,255,255,0.5); margin-right: 4px; }
.t-hr-zone-tag { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.t-zt--rest { background: rgba(148,163,184,0.3); color: #cbd5e1; }
.t-zt--warmup { background: rgba(250,204,21,0.2); color: #facc15; }
.t-zt--aerobic { background: rgba(16,185,129,0.2); color: #10b981; }
.t-zt--warning { background: rgba(239,68,68,0.25); color: #fca5a5; }

/* Stats overlay (bottom-right in video) */
.t-stats-overlay {
  position: absolute; bottom: 16px; right: 12px; z-index: 2;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
  border-radius: 12px; padding: 8px 12px;
  display: flex; gap: 14px;
}
.t-so-item { display: flex; flex-direction: column; align-items: center; }
.t-so-val { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.t-so-label { font-size: 10px; color: rgba(255,255,255,0.45); }

/* Progress bar at bottom edge of video */
.t-vprog {
  position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
  background: rgba(255,255,255,0.1); z-index: 3;
}
.t-vprog-fill { height: 100%; background: #8A7BFE; transition: width 1s linear; }

/* Stick figure */
.t-figure { position: relative; width: 60px; height: 100px; }
.t-stick-head {
  width: 20px; height: 20px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.8);
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
}
.t-stick-body {
  width: 3px; height: 35px; background: rgba(255,255,255,0.8);
  position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
}
.t-stick-larm, .t-stick-rarm {
  width: 3px; height: 25px; background: rgba(255,255,255,0.8);
  position: absolute; top: 26px; transform-origin: top center;
}
.t-stick-larm { left: 18px; animation: armSwing 0.8s ease-in-out infinite alternate; }
.t-stick-rarm { left: 38px; animation: armSwing 0.8s ease-in-out infinite alternate-reverse; }
.t-stick-lleg, .t-stick-rleg {
  width: 3px; height: 30px; background: rgba(255,255,255,0.8);
  position: absolute; top: 57px; transform-origin: top center;
}
.t-stick-lleg { left: 22px; animation: legSwing 0.6s ease-in-out infinite alternate; }
.t-stick-rleg { left: 34px; animation: legSwing 0.6s ease-in-out infinite alternate-reverse; }

.t-figure--paused .t-stick-larm,
.t-figure--paused .t-stick-rarm,
.t-figure--paused .t-stick-lleg,
.t-figure--paused .t-stick-rleg { animation-play-state: paused; }

@keyframes armSwing { from { transform: rotate(-30deg); } to { transform: rotate(30deg); } }
@keyframes legSwing { from { transform: rotate(-25deg); } to { transform: rotate(25deg); } }

.t-pause-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.55); z-index: 5;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
}
.t-pause-center { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.t-pause-text { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.9); }
.t-pause-actions { display: flex; gap: 12px; }
.t-pa-btn {
  padding: 10px 24px; border-radius: 12px; border: none;
  font-size: 15px; font-weight: 700; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.t-pa-btn--end { background: rgba(239,68,68,0.25); color: #fca5a5; }
.t-pa-btn--end:active { background: rgba(239,68,68,0.4); }
.t-pa-btn--resume { background: linear-gradient(135deg, #8A7BFE, #a89afe); color: white; }
.t-pa-btn--resume:active { opacity: 0.85; }

/* Floating pause button */
.t-fab-pause {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 4;
  width: 52px; height: 52px; border-radius: 50%; border: none;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.t-fab-pause:active { background: rgba(0,0,0,0.7); }

/* ===== ALERT ===== */
.t-alert-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: linear-gradient(180deg, #991b1b 0%, #7f1d1d 50%, #450a0a 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 24px;
}
.t-alert-hr { text-align: center; margin-bottom: 32px; }
.t-alert-hr-icon { font-size: 40px; animation: heartbeat 0.4s ease-in-out infinite; }
.t-alert-hr-val { font-size: 64px; font-weight: 900; line-height: 1; margin: 8px 0; font-variant-numeric: tabular-nums; }
.t-alert-hr-tag {
  display: inline-block; padding: 4px 14px; border-radius: 8px;
  background: rgba(255,255,255,0.15); font-size: 14px; font-weight: 700; color: #fca5a5;
}

.t-voice-area { text-align: center; margin-bottom: 36px; }
.t-voice-bars { display: flex; align-items: center; justify-content: center; gap: 4px; height: 32px; margin-bottom: 12px; }
.t-vbar {
  width: 4px; border-radius: 2px; background: rgba(255,255,255,0.6);
  animation: vbar 0.8s ease-in-out infinite;
}
.t-vbar:nth-child(1) { height: 12px; animation-delay: 0s; }
.t-vbar:nth-child(2) { height: 20px; animation-delay: 0.15s; }
.t-vbar:nth-child(3) { height: 28px; animation-delay: 0.3s; }
.t-vbar:nth-child(4) { height: 20px; animation-delay: 0.45s; }
.t-vbar:nth-child(5) { height: 12px; animation-delay: 0.6s; }
@keyframes vbar { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(0.4); } }
.t-voice-text { font-size: 18px; font-weight: 700; }

.t-alert-btns { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-bottom: 32px; }
.t-feel-btn {
  padding: 14px 20px; border-radius: 14px; border: 2px solid;
  background: rgba(255,255,255,0.05); font-size: 16px; font-weight: 700;
  color: white; display: flex; align-items: center; gap: 10px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.t-feel--ok { border-color: #10b981; }
.t-feel--mid { border-color: #f59e0b; }
.t-feel--bad { border-color: #ef4444; }
.t-feel-btn:active { background: rgba(255,255,255,0.12); }
.t-feel-emoji { font-size: 22px; }

.t-alert-countdown { width: 100%; }
.t-alert-cd-bar { height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden; }
.t-alert-cd-fill { height: 100%; background: #fca5a5; border-radius: 2px; transition: width 1s linear; }
.t-alert-cd-text { text-align: center; font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 8px; }

/* ===== COUNTDOWN ===== */
.t-cd-overlay {
  position: fixed; inset: 0; z-index: 250;
  background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.t-cd-num {
  font-size: 96px; font-weight: 900; color: #8A7BFE;
  animation: cdPulse 1s ease-in-out infinite;
}
@keyframes cdPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }
.t-cd-text { font-size: 18px; color: rgba(255,255,255,0.7); margin-top: 16px; }

/* ===== EMERGENCY ===== */
.t-emg-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: linear-gradient(180deg, #7f1d1d, #450a0a);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 24px;
}
.t-emg-icon { font-size: 56px; animation: cdPulse 1.5s ease-in-out infinite; margin-bottom: 16px; }
.t-emg-title { font-size: 24px; font-weight: 900; margin-bottom: 8px; }
.t-emg-desc { font-size: 15px; color: rgba(255,255,255,0.7); margin-bottom: 28px; }
.t-emg-detail {
  background: rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; width: 100%; margin-bottom: 32px;
}
.t-emg-row { font-size: 14px; padding: 8px 0; display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.85); }
.t-emg-row + .t-emg-row { border-top: 1px solid rgba(255,255,255,0.06); }
.t-emg-btn {
  padding: 14px 40px; border-radius: 14px; border: 2px solid rgba(255,255,255,0.3);
  background: transparent; font-size: 16px; font-weight: 700; color: white;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.t-emg-btn:active { background: rgba(255,255,255,0.1); }

/* ===== COMPLETED ===== */
.t-done-overlay {
  position: fixed; inset: 0; z-index: 250;
  background: linear-gradient(160deg, #1e1b4b, #312e81, #4338ca);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 24px;
}
.t-done-check {
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(16,185,129,0.2); border: 3px solid #10b981;
  display: flex; align-items: center; justify-content: center;
  font-size: 36px; font-weight: 900; color: #10b981; margin-bottom: 16px;
}
.t-done-title { font-size: 24px; font-weight: 900; margin-bottom: 24px; }
.t-done-card { background: white; border-radius: 16px; padding: 20px; width: 100%; margin-bottom: 28px; }
.t-done-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.t-done-item { text-align: center; }
.t-done-val { font-size: 24px; font-weight: 900; color: #1e1b4b; }
.t-done-label { font-size: 12px; color: #64748b; margin-top: 2px; }
.t-done-btn {
  padding: 14px 40px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #8A7BFE, #a89afe);
  font-size: 16px; font-weight: 700; color: white;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.t-done-btn:active { opacity: 0.85; }

/* ===== DEVICE CHECK ===== */
.t-devcheck {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; padding: 40px 24px 24px;
}
.t-dc-icon { font-size: 56px; margin-bottom: 16px; }
.t-dc-title { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
.t-dc-sub { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 32px; }
.t-dc-list {
  width: 100%; display: flex; flex-direction: column; gap: 12px;
  margin-bottom: 32px;
}
.t-dc-item {
  display: flex; align-items: center; gap: 14px;
  padding: 16px; border-radius: 14px;
  background: rgba(255,255,255,0.06);
  border: 2px solid rgba(255,255,255,0.08);
  cursor: pointer; transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.t-dc-item--checked {
  border-color: rgba(16,185,129,0.4);
  background: rgba(16,185,129,0.08);
}
.t-dc-check {
  width: 24px; height: 24px; border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.2s;
}
.t-dc-check--on {
  background: #10b981; border-color: #10b981;
}
.t-dc-label { font-size: 15px; font-weight: 600; }
.t-dc-btn {
  width: 100%; padding: 16px; border-radius: 16px; border: none;
  background: linear-gradient(135deg, #8A7BFE, #a89afe);
  font-size: 17px; font-weight: 700; color: white;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: opacity 0.2s;
}
.t-dc-btn:disabled {
  opacity: 0.35; cursor: not-allowed;
}
.t-dc-btn:not(:disabled):active { opacity: 0.85; }
.t-dc-skip {
  margin-top: 12px; padding: 12px; border: none;
  background: transparent; font-size: 14px; font-weight: 600;
  color: rgba(255,255,255,0.4); cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.t-dc-skip:active { color: rgba(255,255,255,0.6); }

/* ===== YELLOW LINE WARNING ===== */
.t-yellow-warn {
  position: absolute; top: 60px; left: 12px; right: 12px; z-index: 6;
  background: rgba(120, 80, 0, 0.92); backdrop-filter: blur(8px);
  border-radius: 16px; padding: 16px;
  border: 1px solid rgba(245,158,11,0.4);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.t-yw-icon { font-size: 28px; margin-bottom: 8px; }
.t-yw-text { margin-bottom: 14px; }
.t-yw-title { font-size: 16px; font-weight: 800; color: #fbbf24; }
.t-yw-sub { font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; }
.t-yw-btns { display: flex; gap: 10px; }
.t-yw-btn {
  flex: 1; padding: 10px; border-radius: 10px; border: none;
  font-size: 14px; font-weight: 700; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.t-yw-btn--pause {
  background: rgba(245,158,11,0.2); color: #fbbf24;
  border: 1px solid rgba(245,158,11,0.4);
}
.t-yw-btn--pause:active { background: rgba(245,158,11,0.35); }
.t-yw-btn--cont {
  background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.9);
}
.t-yw-btn--cont:active { background: rgba(255,255,255,0.2); }

/* Yellow warning transition */
.t-yw-fade-enter-active,
.t-yw-fade-leave-active { transition: all 0.3s ease; }
.t-yw-fade-enter-from,
.t-yw-fade-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
