<template>
  <div class="alert-page">
    <!-- 导航 -->
    <div class="page-nav">
      <button class="back-btn" @click="router.back()">
        <van-icon name="arrow-left" />
      </button>
      <span class="nav-title">紧急预警处理</span>
      <div class="nav-space"></div>
    </div>

    <div v-if="loading" class="loading-box">
      <van-loading size="32" color="#396CFF" />
    </div>

    <template v-else-if="detail">
      <!-- 预警级别横幅 -->
      <div :class="['level-banner', 'level-' + detail.level]">
        <span class="level-text">{{ detail.level === 'danger' ? '危急预警' : '预警提示' }}</span>
      </div>

      <!-- 患者信息 -->
      <div class="patient-card">
        <div class="patient-avatar">
          <span>{{ detail.patient.name.charAt(0) }}</span>
        </div>
        <div class="patient-info">
          <div class="patient-name-row">
            <span class="name">{{ detail.patient.name }}</span>
            <span class="age">{{ detail.patient.age }}岁</span>
            <span class="gender">{{ detail.patient.gender === 'male' ? '男' : '女' }}</span>
          </div>
          <a :href="'tel:' + detail.patient.phone" class="phone-link">
            <van-icon name="phone-o" /> {{ detail.patient.phone }}
          </a>
        </div>
      </div>

      <!-- 当前预警值 -->
      <div class="current-alert">
        <div class="alert-label">当前{{ alertTypeLabel(detail.alertType) }}</div>
        <div class="alert-value-big">
          <span class="value">{{ detail.value }}</span>
          <span class="unit">{{ detail.unit }}</span>
        </div>
        <div class="alert-time">{{ formatDateTime(detail.alertTime) }}</div>
      </div>

      <!-- 近期体征 -->
      <section class="section">
        <h3 class="section-title">近期体征记录</h3>
        <div class="vitals-timeline">
          <div v-for="(v, i) in detail.recentVitals" :key="i" class="vital-item">
            <div :class="['vital-dot', 'dot-' + v.level]"></div>
            <div class="vital-info">
              <span class="vital-type">{{ alertTypeLabel(v.alertType) }}</span>
              <span class="vital-val">{{ v.value }} {{ v.unit }}</span>
            </div>
            <span class="vital-time">{{ formatDateTime(v.alertTime) }}</span>
          </div>
        </div>
      </section>

      <!-- AI 建议 -->
      <section class="section">
        <h3 class="section-title">AI 建议</h3>
        <div class="ai-box">
          <textarea
            v-model="suggestion"
            class="ai-textarea"
            rows="6"
            placeholder="AI 建议内容..."
          ></textarea>
          <p class="disclaimer">以上建议由AI生成，仅供参考，最终决策请医生根据实际情况判断</p>
        </div>
      </section>

      <!-- 操作按钮 -->
      <div class="action-area">
        <label class="check-option">
          <input v-model="pushToPatient" type="checkbox" class="check-input" />
          <span>推送给患者</span>
        </label>
        <label class="check-option">
          <input v-model="pushToFamily" type="checkbox" class="check-input" />
          <span>推送给家属</span>
        </label>
        <button class="push-btn" :disabled="submitting" @click="handleSubmit">
          <van-loading v-if="submitting" size="16" color="white" />
          <span v-else>确认推送</span>
        </button>
        <a :href="'tel:' + detail.patient.phone" class="call-btn">
          <van-icon name="phone-o" /> 直接拨打电话
        </a>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getAlertDetail, submitIntervention } from '@/api'

const router = useRouter()
const route = useRoute()
const alertId = Number(route.params.id)

const detail = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)
const suggestion = ref('')
const pushToPatient = ref(true)
const pushToFamily = ref(false)

const alertTypeLabel = (type: string) => {
  const map: Record<string, string> = { glucose: '血糖', bp: '血压', hr: '心率' }
  return map[type] || type
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const loadDetail = async () => {
  try {
    const res = await getAlertDetail(alertId) as any
    detail.value = res
    suggestion.value = res?.aiSuggestion || ''
  } catch { /* ignore */ }
  loading.value = false
}

const handleSubmit = async () => {
  if (!suggestion.value.trim()) {
    showToast('请填写建议内容')
    return
  }
  submitting.value = true
  try {
    await submitIntervention(alertId, {
      suggestion: suggestion.value,
      pushToPatient: pushToPatient.value,
      pushToFamily: pushToFamily.value,
    })
    showToast('推送成功')
    setTimeout(() => router.back(), 500)
  } catch {
    showToast('推送失败')
  }
  submitting.value = false
}

onMounted(loadDetail)
</script>

<style scoped>
.alert-page {
  min-height: 100vh;
  background: #F2F5FA;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
  padding-bottom: 32px;
}

/* 导航 */
.page-nav {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.back-btn {
  border: none;
  background: none;
  font-size: 20px;
  color: #8A9AC3;
  cursor: pointer;
  padding: 4px;
}
.nav-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  color: #1A2238;
}
.nav-space { width: 28px; }

.loading-box {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

/* 级别横幅 */
.level-banner {
  padding: 10px 16px;
  text-align: center;
  font-weight: 800;
  font-size: 14px;
}
.level-danger {
  background: linear-gradient(135deg, #FEE2E2, #FECACA);
  color: #FF4C61;
}
.level-warning {
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  color: #B45309;
}

/* 患者信息 */
.patient-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  margin: 12px 16px;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.patient-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #FF4C61, #E8364A);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 800;
  flex-shrink: 0;
}
.patient-info { flex: 1; }
.patient-name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
}
.name { font-size: 16px; font-weight: 700; color: #1A2238; }
.age { font-size: 13px; color: #8A9AC3; }
.gender { font-size: 12px; color: #8A9AC3; }
.phone-link {
  font-size: 13px;
  color: #396CFF;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 当前预警值 */
.current-alert {
  text-align: center;
  padding: 20px 16px;
  background: white;
  margin: 0 16px 12px;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.alert-label {
  font-size: 13px;
  color: #8A9AC3;
  margin-bottom: 8px;
}
.alert-value-big {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}
.value {
  font-size: 36px;
  font-weight: 800;
  color: #FF4C61;
  font-family: 'SF Mono', Monaco, monospace;
}
.unit {
  font-size: 14px;
  color: #8A9AC3;
}
.alert-time {
  font-size: 12px;
  color: #8A9AC3;
  margin-top: 6px;
}

/* Section */
.section {
  margin: 0 16px 12px;
  background: white;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.section-title {
  font-size: 15px;
  font-weight: 800;
  color: #1A2238;
  margin: 0 0 12px;
}

/* 体征时间线 */
.vitals-timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.vital-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.vital-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-danger { background: #FF4C61; }
.dot-warning { background: #F59E0B; }
.vital-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.vital-type { font-size: 12px; color: #8A9AC3; }
.vital-val { font-size: 14px; font-weight: 600; color: #1A2238; }
.vital-time { font-size: 11px; color: #8A9AC3; }

/* AI 建议 */
.ai-box { position: relative; }
.ai-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E8ECF4;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #1A2238;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}
.ai-textarea:focus {
  border-color: #396CFF;
  box-shadow: 0 0 0 3px rgba(57, 108, 255, 0.15);
}
.disclaimer {
  font-size: 11px;
  color: #8A9AC3;
  margin: 8px 0 0;
  font-style: italic;
}

/* 操作区 */
.action-area {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.check-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #1A2238;
  cursor: pointer;
}
.check-input {
  width: 18px;
  height: 18px;
  accent-color: #396CFF;
}
.push-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #FF4C61, #E8364A);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s;
}
.push-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.call-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 44px;
  background: white;
  border: 1px solid #E8ECF4;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #396CFF;
  text-decoration: none;
}
</style>
