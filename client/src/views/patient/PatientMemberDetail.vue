<template>
  <div class="member-detail-page">
    <!-- Nav bar -->
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="nav-title">{{ detail?.patient?.name || '家人详情' }}</span>
      <div class="nav-btn" style="visibility: hidden;">
        <svg width="20" height="20" viewBox="0 0 24 24" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <van-loading type="spinner" size="36" color="#8A7BFE" />
    </div>

    <template v-else-if="detail">
      <!-- ========== 1. 个人信息卡 ========== -->
      <div class="profile-card" :class="{ 'profile-card--danger': isDanger && !isAlertCleared }">
        <div class="profile-top">
          <div class="profile-avatar" :class="{ 'avatar--danger': isDanger && !isAlertCleared }">
            {{ detail.patient.name?.charAt(0) || '?' }}
          </div>
          <div class="profile-info">
            <div class="profile-name-row">
              <span class="profile-name">{{ detail.patient.name }}</span>
              <span class="profile-tag">{{ detail.relationship }}</span>
            </div>
            <div class="profile-meta">
              {{ detail.patient.gender === 'male' ? '男' : '女' }} · {{ detail.patient.age }}岁
            </div>
          </div>
        </div>
        <div class="profile-bottom">
          <div class="profile-stat">
            <span class="stat-value">{{ detail.recoveryDays }}</span>
            <span class="stat-label">康复天数</span>
          </div>
          <div class="profile-divider"></div>
          <div class="profile-stat">
            <span class="stat-value">{{ detail.recoveryStage?.label || '--' }}</span>
            <span class="stat-label">当前阶段</span>
          </div>
          <div class="profile-divider"></div>
          <div class="profile-stat">
            <span class="stat-value alert-level-badge" :class="'level--' + (isAlertCleared ? (isWaitingDoctor ? (doctorReply ? 'replied' : 'waiting') : 'none') : detail.alertLevel)">
              {{ isAlertCleared ? (isWaitingDoctor ? (doctorReply ? '已回复' : '待回复') : '已处理') : alertLevelText }}
            </span>
            <span class="stat-label">风险等级</span>
          </div>
        </div>
      </div>

      <!-- ========== 2. 体征巡航 ========== -->
      <div class="section">
        <div class="section-title">
          <div class="section-bar"></div>
          体征巡航
        </div>
        <div class="vitals-grid">
          <div v-for="v in vitalsList" :key="v.key"
            class="vital-card" :class="{ 'vital-card--abnormal': v.status === 'abnormal' && !isAlertCleared }">
            <div class="vital-header">
              <span class="vital-icon">{{ v.icon }}</span>
              <span class="vital-name">{{ v.label }}</span>
              <span class="vital-unit">{{ v.unit }}</span>
              <span v-if="v.status === 'abnormal' && !isAlertCleared" class="vital-risk-tag">异常</span>
            </div>
            <div class="vital-value">{{ v.value }}</div>
          </div>
        </div>
      </div>

      <!-- ========== 3. 紧急处置区 ========== -->
      <div v-if="isDanger" class="section emergency-section">
        <div class="section-title">
          <div class="section-bar" :class="isAlertCleared ? (isWaitingDoctor ? (doctorReply ? 'section-bar--replied' : 'section-bar--waiting') : 'section-bar--processed') : 'section-bar--danger'"></div>
          紧急处置
          <template v-if="isProcessed">
            <span class="processed-badge">已处理</span>
            <button v-if="canUndo" class="undo-btn" @click="handleUndo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              回撤 {{ undoCountdown }}
            </button>
          </template>
          <template v-else-if="isWaitingDoctor">
            <span class="waiting-badge" :class="{ 'waiting-badge--replied': !!doctorReply }">{{ doctorReply ? '医生已回复' : '等待回复中' }}</span>
          </template>
        </div>
        <template v-if="!isAlertCleared">
          <div class="emergency-hospital">
            🏥 就近医院：{{ detail.emergencyContacts.hospital }}
          </div>
          <div class="emergency-actions">
            <button class="emer-btn emer-btn--ambulance" @click="showAmbulancePopup = true">
              <span class="emer-icon">🚑</span>
              <span class="emer-label">急救车</span>
            </button>
            <button class="emer-btn emer-btn--doctor" @click="showDoctorPopup = true">
              <span class="emer-icon">📞</span>
              <span class="emer-label">联系医生</span>
            </button>
            <button class="emer-btn emer-btn--done" @click="showProcessedConfirm = true">
              <span class="emer-icon">✅</span>
              <span class="emer-label">已处理</span>
            </button>
          </div>
        </template>
        <!-- 等待医生回复态 / 已回复态 -->
        <div v-else-if="isWaitingDoctor" class="waiting-card" :class="{ 'waiting-card--replied': !!doctorReply }" @click="showDoctorReplyPopup = true">
          <div class="waiting-card-left">
            <span class="waiting-card-icon">{{ doctorReply ? '✅' : '💬' }}</span>
            <div class="waiting-card-info">
              <div class="waiting-card-title">{{ doctorReply ? '医生已回复，点击查看' : '已联系医生，等待回复' }}</div>
              <div class="waiting-card-sub">{{ doctorReply ? doctorReply.time + ' 回复' : (sentDoctorRecord ? formatSentTime(sentDoctorRecord.sentAt) + ' 发送' : '') }}</div>
            </div>
          </div>
          <div class="waiting-card-arrow">
            <template v-if="!doctorReply">
              <div class="waiting-dot-group">
                <span class="waiting-dot"></span>
                <span class="waiting-dot"></span>
                <span class="waiting-dot"></span>
              </div>
            </template>
            <template v-else>
              <span class="replied-new-tag">NEW</span>
            </template>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="doctorReply ? '#10b981' : '#94a3b8'" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
        <!-- 已处理态 -->
        <div v-else class="processed-card">
          <span class="processed-card-icon">✅</span>
          <span class="processed-card-text">预警已处理完毕，系统将继续监测</span>
        </div>
      </div>

      <!-- ========== 4. 预警记录 ========== -->
      <div v-if="!isAlertCleared" class="section">
        <div class="section-title">
          <div class="section-bar"></div>
          预警记录
          <span class="alert-count">{{ detail.alerts.length }} 条</span>
        </div>
        <div v-if="detail.alerts.length === 0" class="empty-tip">暂无预警记录，一切正常</div>
        <div v-else class="alert-list">
          <div v-for="alert in detail.alerts" :key="alert.id"
            class="alert-item" :class="'alert-item--' + alert.level">
            <div class="alert-icon-wrap" :class="'alert-icon--' + alert.level">
              {{ getAlertIcon(alert.alertType) }}
            </div>
            <div class="alert-content">
              <div class="alert-top">
                <span class="alert-desc">{{ alert.description }}</span>
                <span class="alert-level-chip" :class="'chip--' + alert.level">
                  {{ alert.level === 'danger' ? '危险' : alert.level === 'warning' ? '警告' : '提示' }}
                </span>
              </div>
              <div class="alert-bottom">
                <span class="alert-val">{{ alert.value }}{{ alert.unit }}</span>
                <span class="alert-time">{{ formatAlertTime(alert.alertTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 5. 今日健康计划 ========== -->
      <div v-if="detail.tasks && detail.tasks.length > 0" class="section">
        <div class="section-title">
          <div class="section-bar"></div>
          今日健康计划
          <span class="task-progress">{{ completedTaskCount }}/{{ detail.tasks.length }}</span>
        </div>
        <div class="task-list">
          <div v-for="(task, ti) in taskItems" :key="ti" class="task-item" :class="'task-item--' + task.state">
            <div class="task-icon-wrap" :class="'task-icon--' + task.state">
              <span v-if="task.state === 'done'">✓</span>
              <span v-else>{{ task.icon }}</span>
            </div>
            <div class="task-info">
              <div class="task-name">{{ task.title }}</div>
              <div class="task-sub">{{ task.sub }}</div>
            </div>
            <button
              v-if="task.state === 'done'"
              class="task-status-done"
              disabled
            >已完成</button>
            <button
              v-else
              class="task-remind-btn"
              @click="openRemindPopup(task)"
            >提醒TA</button>
          </div>
        </div>
      </div>

      <!-- ========== 6. 康复计划概要 ========== -->
      <div v-if="detail.planSummary" class="section">
        <div class="section-title">
          <div class="section-bar"></div>
          康复计划概要
        </div>
        <div class="plan-card">
          <div class="plan-row">
            <span class="plan-label">阶段</span>
            <span class="plan-val">
              <span class="plan-stage-tag">{{ detail.planSummary.stage }}期</span>
              {{ detail.planSummary.stageInfo?.label || '' }}
            </span>
          </div>
          <div class="plan-row">
            <span class="plan-label">时段</span>
            <span class="plan-val">{{ detail.planSummary.stageInfo?.period || '--' }}</span>
          </div>
          <div class="plan-row">
            <span class="plan-label">手术日</span>
            <span class="plan-val">{{ detail.planSummary.surgeryDate || '--' }}</span>
          </div>
          <div class="plan-row">
            <span class="plan-label">说明</span>
            <span class="plan-val plan-desc">{{ detail.planSummary.description || '--' }}</span>
          </div>
        </div>
      </div>

      <div class="safe-bottom"></div>
    </template>

    <!-- ========== 弹窗：呼叫急救车 ========== -->
    <van-popup v-model:show="showAmbulancePopup" position="bottom" round :style="{ maxHeight: '85vh' }">
      <div class="popup-content">
        <div class="popup-header">
          <span class="popup-title">🚑 呼叫急救车</span>
          <button class="popup-close" @click="showAmbulancePopup = false">✕</button>
        </div>
        <div class="popup-scroll">
          <!-- 患者情况摘要 -->
          <div class="ai-card">
            <div class="ai-card-header">
              <span class="ai-card-icon">📋</span>
              <span class="ai-card-title">患者情况摘要</span>
            </div>
            <div class="ai-card-body">{{ patientSummary }}</div>
          </div>
          <!-- 120 沟通话术 -->
          <div class="ai-card script-card">
            <div class="ai-card-header">
              <span class="ai-card-icon">💬</span>
              <span class="ai-card-title">120 沟通话术</span>
            </div>
            <div class="script-list">
              <div v-for="(line, i) in ambulanceScript" :key="i" class="script-item">
                <span class="script-num">{{ i + 1 }}</span>
                <span class="script-text">{{ line }}</span>
              </div>
            </div>
          </div>
          <div class="popup-tip">
            以上内容由 AI 根据患者实时数据生成，请在通话时据实沟通
          </div>
        </div>
        <a class="popup-action-btn popup-action-btn--red" href="tel:120">
          📞 立即拨打 120
        </a>
      </div>
    </van-popup>

    <!-- ========== 弹窗：联系医生 ========== -->
    <van-popup v-model:show="showDoctorPopup" position="bottom" round :style="{ maxHeight: '85vh' }">
      <div class="popup-content">
        <div class="popup-header">
          <span class="popup-title">📞 联系医生</span>
          <button class="popup-close" @click="showDoctorPopup = false">✕</button>
        </div>
        <div class="popup-scroll">
          <!-- AI 情况总结 -->
          <div class="ai-card">
            <div class="ai-card-header">
              <span class="ai-card-icon">✨</span>
              <span class="ai-card-title">AI 情况总结</span>
            </div>
            <div class="ai-card-body">{{ doctorAiSummary }}</div>
          </div>
          <!-- 留言板 -->
          <div class="msg-section">
            <div class="msg-label">补充说明（选填）</div>
            <div class="msg-input-wrap">
              <textarea
                v-model="doctorMessage"
                class="msg-textarea"
                placeholder="请描述您观察到的情况，如面色、精神状态、呼吸等..."
                rows="4"
              ></textarea>
              <button class="voice-btn" :class="{ 'voice-btn--active': isRecording }" @click="toggleVoiceInput">
                <span class="voice-icon">{{ isRecording ? '⏹️' : '🎙️' }}</span>
                <span class="voice-label">{{ isRecording ? '停止' : '语音' }}</span>
              </button>
            </div>
            <div v-if="isRecording" class="recording-hint">
              <span class="rec-dot"></span> 正在录音，请对着手机说话...
            </div>
          </div>
          <!-- 医生信息 -->
          <div class="doctor-info">
            <span class="doctor-info-icon">👨‍⚕️</span>
            <span class="doctor-info-text">{{ detail?.emergencyContacts?.doctor || '主治医生' }}</span>
          </div>
        </div>
        <button class="popup-action-btn popup-action-btn--orange" @click="sendDoctorMessage">
          发送给医生
        </button>
      </div>
    </van-popup>

    <!-- ========== 弹窗：确认已处理 ========== -->
    <van-popup v-model:show="showProcessedConfirm" round :style="{ width: '80%' }">
      <div class="confirm-content">
        <div class="confirm-icon">✅</div>
        <div class="confirm-title">确认已完成处理？</div>
        <div class="confirm-desc">确认后将清除当前所有预警提示，系统将继续监测并在下次异常时重新预警。</div>
        <div class="confirm-note">1 小时内可回撤此操作</div>
        <div class="confirm-btns">
          <button class="confirm-btn confirm-btn--cancel" @click="showProcessedConfirm = false">取消</button>
          <button class="confirm-btn confirm-btn--ok" @click="confirmProcessed">确认已处理</button>
        </div>
      </div>
    </van-popup>

    <!-- ========== 弹窗：查看医生回复 ========== -->
    <van-popup v-model:show="showDoctorReplyPopup" position="bottom" round :style="{ maxHeight: '85vh' }">
      <div class="popup-content">
        <div class="popup-header">
          <span class="popup-title">💬 医生沟通</span>
          <button class="popup-close" @click="showDoctorReplyPopup = false">✕</button>
        </div>
        <div class="popup-scroll">
          <!-- 发送记录 -->
          <div class="chat-section">
            <div class="chat-label">
              <span class="chat-label-dot chat-label-dot--me"></span>
              我的留言
              <span class="chat-label-time">{{ sentDoctorRecord ? formatSentTime(sentDoctorRecord.sentAt) : '' }}</span>
            </div>
            <div class="chat-bubble chat-bubble--me">
              <div class="chat-ai-tag">AI 情况总结</div>
              <p class="chat-ai-text">{{ sentDoctorRecord?.aiSummary || '' }}</p>
              <div v-if="sentDoctorRecord?.message" class="chat-user-msg">
                <div class="chat-user-label">补充说明</div>
                <p>{{ sentDoctorRecord.message }}</p>
              </div>
            </div>
          </div>
          <!-- 医生回复 -->
          <div class="chat-section">
            <div class="chat-label">
              <span class="chat-label-dot chat-label-dot--doctor"></span>
              {{ detail?.emergencyContacts?.doctor || '主治医生' }}
            </div>
            <div v-if="doctorReply" class="chat-bubble chat-bubble--doctor">
              <p>{{ doctorReply.text }}</p>
              <div class="chat-reply-time">{{ doctorReply.time }}</div>
            </div>
            <div v-else class="chat-waiting">
              <div class="chat-waiting-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="chat-waiting-text">医生正在查看中，请耐心等待...</span>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- ========== 弹窗：提醒方式选择 ========== -->
    <van-popup v-model:show="showRemindPicker" position="bottom" round :style="{ maxHeight: '50%' }">
      <div class="remind-popup">
        <div class="remind-popup-title">选择提醒方式</div>
        <div class="remind-popup-desc">提醒 {{ detail?.patient?.name }} 完成「{{ remindTaskTitle }}」</div>
        <div class="remind-options">
          <button class="remind-option" @click="sendRemind('wechat')">
            <div class="remind-option-icon remind-option-icon--wechat">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M8.5 11a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
                <path d="M21 12.5c0-4.14-4.03-7.5-9-7.5s-9 3.36-9 7.5c0 3.53 2.98 6.47 7 7.27v2.23l2.78-1.67c.73.1 1.47.17 2.22.17 4.97 0 9-3.36 9-7.5z" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </div>
            <span class="remind-option-label">微信提醒</span>
            <span class="remind-option-sub">发送微信消息卡片</span>
          </button>
          <button class="remind-option" @click="sendRemind('inapp')">
            <div class="remind-option-icon remind-option-icon--inapp">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <span class="remind-option-label">呦呦提醒</span>
            <span class="remind-option-sub">发送呦呦APP内推送</span>
          </button>
        </div>
      </div>
    </van-popup>

    <!-- ========== 提醒发送结果弹窗 ========== -->
    <van-popup v-model:show="showRemindResult" round :style="{ width: '82%' }" :close-on-click-overlay="!remindSending">
      <div class="remind-result">
        <!-- 发送中 -->
        <div v-if="remindSending" class="remind-result-sending">
          <van-loading type="spinner" size="28" :color="remindMethod === 'wechat' ? '#07c160' : '#8A7BFE'" />
          <span class="remind-sending-text">正在发送提醒...</span>
        </div>
        <!-- 成功 -->
        <div v-else class="remind-result-success">
          <div class="remind-check" :class="'remind-check--' + remindMethod">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div class="remind-success-title">提醒已送达</div>
        </div>
        <!-- 消息预览卡 -->
        <div class="remind-msg-card" :class="'remind-msg-card--' + remindMethod">
          <div class="rmc-header">
            <span class="rmc-icon">{{ remindMethod === 'wechat' ? '💬' : '🔔' }}</span>
            <span class="rmc-from">{{ remindMethod === 'wechat' ? '微信服务通知' : '呦呦·心康' }}</span>
            <span class="rmc-time">{{ remindSentTime }}</span>
          </div>
          <div class="rmc-body">
            <div class="rmc-title">{{ remindMethod === 'wechat' ? '康复任务提醒' : '家人提醒您完成任务' }}</div>
            <div class="rmc-row">
              <span class="rmc-label">提醒人</span>
              <span class="rmc-val">您的家人</span>
            </div>
            <div class="rmc-row">
              <span class="rmc-label">待办任务</span>
              <span class="rmc-val">{{ remindTaskTitle }}</span>
            </div>
            <div class="rmc-row">
              <span class="rmc-label">提醒时间</span>
              <span class="rmc-val">{{ remindSentTime }}</span>
            </div>
          </div>
          <div class="rmc-footer">
            {{ remindMethod === 'wechat' ? '点击查看详情 >' : '打开呦呦·心康查看 >' }}
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getMemberDetail } from '@/api/patient'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const detail = ref<any>(null)

// ========== 弹窗状态 ==========
const showAmbulancePopup = ref(false)
const showDoctorPopup = ref(false)
const showProcessedConfirm = ref(false)

// ========== 已处理 & 回撤状态 ==========
const isProcessed = ref(false)
const processedAt = ref(0)
const undoRemaining = ref(0) // 剩余秒数
let undoTimer: ReturnType<typeof setInterval> | undefined

// ========== 等待医生回复状态 ==========
const isWaitingDoctor = ref(false)
const sentDoctorRecord = ref<{ aiSummary: string; message: string; sentAt: number } | null>(null)
const showDoctorReplyPopup = ref(false)
const doctorReply = ref<{ text: string; time: string } | null>(null)
let replyTimer: ReturnType<typeof setTimeout> | undefined

// 统一清除判断：已处理 或 等待医生回复
const isAlertCleared = computed(() => isProcessed.value || isWaitingDoctor.value)

// ========== 持久化（localStorage） ==========
const STORAGE_EXPIRE = 24 * 3600 * 1000 // 24小时过期

function getStorageKey() {
  return `alert_state_${route.params.id}`
}

function saveAlertState() {
  const patientId = Number(route.params.id)
  if (!patientId) return
  if (!isProcessed.value && !isWaitingDoctor.value) {
    localStorage.removeItem(getStorageKey())
    return
  }
  const state = {
    type: isWaitingDoctor.value ? 'waiting_doctor' : 'processed',
    processedAt: processedAt.value,
    sentDoctorRecord: sentDoctorRecord.value,
    doctorReply: doctorReply.value,
    hasReply: !!doctorReply.value,
    savedAt: Date.now(),
  }
  localStorage.setItem(getStorageKey(), JSON.stringify(state))
}

function generateMockDoctorReply(replyTime: number) {
  const p = detail.value?.patient
  return {
    text: `收到${p?.name || '患者'}家属的反馈，已查看体征数据。血压偏高但仍在可控范围，建议：1）保持静卧休息；2）暂勿剧烈活动；3）若1小时内血压未回落至140/90以下，请及时来院就诊。我会持续关注监测数据。`,
    time: formatSentTime(replyTime),
  }
}

function loadAlertState() {
  const raw = localStorage.getItem(getStorageKey())
  if (!raw) return
  try {
    const state = JSON.parse(raw)
    if (Date.now() - state.savedAt > STORAGE_EXPIRE) {
      localStorage.removeItem(getStorageKey())
      return
    }
    if (state.type === 'processed') {
      isProcessed.value = true
      processedAt.value = state.processedAt || 0
      // 恢复回撤倒计时
      if (processedAt.value) {
        const elapsed = Math.floor((Date.now() - processedAt.value) / 1000)
        if (elapsed < 3600) {
          startUndoTimer()
        }
      }
    } else if (state.type === 'waiting_doctor') {
      isWaitingDoctor.value = true
      sentDoctorRecord.value = state.sentDoctorRecord
      doctorReply.value = state.doctorReply
      // 如果尚无回复，判断是否已超过模拟延迟（8秒）
      if (!doctorReply.value && state.sentDoctorRecord?.sentAt) {
        const elapsed = Date.now() - state.sentDoctorRecord.sentAt
        if (elapsed > 8000) {
          doctorReply.value = generateMockDoctorReply(state.sentDoctorRecord.sentAt + 8000)
          saveAlertState()
        } else {
          replyTimer = setTimeout(() => {
            doctorReply.value = generateMockDoctorReply(Date.now())
            showToast({ message: '收到医生回复', duration: 2000 })
            saveAlertState()
          }, 8000 - elapsed)
        }
      }
    }
  } catch {
    localStorage.removeItem(getStorageKey())
  }
}

const canUndo = computed(() => isProcessed.value && undoRemaining.value > 0)

const undoCountdown = computed(() => {
  const mins = Math.floor(undoRemaining.value / 60)
  const secs = undoRemaining.value % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

function startUndoTimer() {
  const UNDO_WINDOW = 3600 // 1小时 = 3600秒
  undoRemaining.value = UNDO_WINDOW
  undoTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - processedAt.value) / 1000)
    undoRemaining.value = Math.max(0, UNDO_WINDOW - elapsed)
    if (undoRemaining.value <= 0) {
      clearInterval(undoTimer)
      undoTimer = undefined
    }
  }, 1000)
}

function confirmProcessed() {
  showProcessedConfirm.value = false
  isProcessed.value = true
  processedAt.value = Date.now()
  startUndoTimer()
  saveAlertState()
  showToast({ message: '预警已标记为处理完成', duration: 1500 })
}

function handleUndo() {
  isProcessed.value = false
  processedAt.value = 0
  undoRemaining.value = 0
  if (undoTimer) {
    clearInterval(undoTimer)
    undoTimer = undefined
  }
  saveAlertState()
  showToast({ message: '已回撤，预警状态已恢复', duration: 1500 })
}

// ========== 医生留言 ==========
const doctorMessage = ref('')
const isRecording = ref(false)
let recognition: any = null

function toggleVoiceInput() {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

function startRecording() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    showToast({ message: '当前浏览器不支持语音输入', duration: 1500 })
    return
  }
  recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.continuous = true
  recognition.interimResults = true
  let finalTranscript = ''
  recognition.onresult = (event: any) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript
      } else {
        interim += event.results[i][0].transcript
      }
    }
    doctorMessage.value = (doctorMessage.value ? doctorMessage.value + '' : '') + finalTranscript + interim
    finalTranscript = ''
  }
  recognition.onerror = () => {
    isRecording.value = false
  }
  recognition.onend = () => {
    isRecording.value = false
  }
  recognition.start()
  isRecording.value = true
}

function stopRecording() {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
  isRecording.value = false
}

function sendDoctorMessage() {
  // 保存发送记录
  sentDoctorRecord.value = {
    aiSummary: doctorAiSummary.value,
    message: doctorMessage.value,
    sentAt: Date.now(),
  }
  // 清除预警状态（与已处理一致，但不启动回撤计时）
  isWaitingDoctor.value = true
  showDoctorPopup.value = false
  showToast({ message: '已发送给医生，请等待回复', duration: 2000 })
  doctorMessage.value = ''
  saveAlertState()

  // 模拟医生回复（演示用，8秒后收到回复）
  replyTimer = setTimeout(() => {
    doctorReply.value = generateMockDoctorReply(Date.now())
    showToast({ message: '收到医生回复', duration: 2000 })
    saveAlertState()
  }, 8000)
}

// ========== AI 生成内容 ==========
const patientSummary = computed(() => {
  if (!detail.value) return ''
  const p = detail.value.patient
  const v = detail.value.vitals
  const stage = detail.value.recoveryStage
  const gender = p.gender === 'male' ? '男' : '女'

  const abnormals: string[] = []
  if (v.heartRate?.status === 'abnormal') abnormals.push(`心率 ${v.heartRate.value}${v.heartRate.unit}`)
  if (v.bloodPressure?.status === 'abnormal') abnormals.push(`血压 ${v.bloodPressure.value}${v.bloodPressure.unit}`)
  if (v.bloodSugar?.status === 'abnormal') abnormals.push(`血糖 ${v.bloodSugar.value}${v.bloodSugar.unit}`)
  if (v.bloodOxygen?.status === 'abnormal') abnormals.push(`血氧 ${v.bloodOxygen.value}${v.bloodOxygen.unit}`)

  const lines = [
    `患者${p.name}，${gender}，${p.age}岁。`,
    stage ? `当前处于心脏康复${stage.label || stage.stage + '期'}，已康复${detail.value.recoveryDays}天。` : '',
    abnormals.length > 0 ? `当前异常指标：${abnormals.join('、')}。` : '',
    `正常指标：心率${v.heartRate?.value ?? '--'}${v.heartRate?.unit || 'bpm'}、血压${v.bloodPressure?.value ?? '--'}${v.bloodPressure?.unit || 'mmHg'}、血氧${v.bloodOxygen?.value ?? '--'}${v.bloodOxygen?.unit || '%'}。`,
    detail.value.planSummary?.surgeryDate ? `手术日期：${detail.value.planSummary.surgeryDate}。` : '',
  ]
  return lines.filter(Boolean).join('')
})

const ambulanceScript = computed(() => {
  if (!detail.value) return []
  const p = detail.value.patient
  const v = detail.value.vitals
  const gender = p.gender === 'male' ? '男' : '女'
  const hospital = detail.value.emergencyContacts?.hospital || '就近医院'

  const abnormalDesc = []
  if (v.bloodPressure?.status === 'abnormal') abnormalDesc.push(`血压达到${v.bloodPressure.value}mmHg`)
  if (v.heartRate?.status === 'abnormal') abnormalDesc.push(`心率${v.heartRate.value}bpm`)
  if (v.bloodOxygen?.status === 'abnormal') abnormalDesc.push(`血氧仅${v.bloodOxygen.value}%`)

  return [
    `您好，这里有一位${p.age}岁${gender}性心脏康复患者需要急救。`,
    `患者姓名${p.name}，${abnormalDesc.length > 0 ? '目前' + abnormalDesc.join('、') + '，情况紧急。' : '体征异常，需要急救。'}`,
    `患者有心脏手术史，目前处于术后康复阶段。`,
    `请派车到[您当前的地址]，目标送往${hospital}。`,
    `患者目前意识清醒/不清醒（请据实说明），正在等待救护车到来。`,
  ]
})

const doctorAiSummary = computed(() => {
  if (!detail.value) return ''
  const p = detail.value.patient
  const v = detail.value.vitals
  const alerts = detail.value.alerts || []
  const gender = p.gender === 'male' ? '男' : '女'

  const abnormals: string[] = []
  if (v.heartRate?.status === 'abnormal') abnormals.push(`心率 ${v.heartRate.value}${v.heartRate.unit}`)
  if (v.bloodPressure?.status === 'abnormal') abnormals.push(`血压 ${v.bloodPressure.value}${v.bloodPressure.unit}`)
  if (v.bloodSugar?.status === 'abnormal') abnormals.push(`血糖 ${v.bloodSugar.value}${v.bloodSugar.unit}`)
  if (v.bloodOxygen?.status === 'abnormal') abnormals.push(`血氧 ${v.bloodOxygen.value}${v.bloodOxygen.unit}`)

  const dangerAlerts = alerts.filter((a: any) => a.level === 'danger')

  return [
    `${p.name}，${gender}，${p.age}岁，心脏康复患者，已康复${detail.value.recoveryDays}天。`,
    abnormals.length > 0 ? `当前检测到异常：${abnormals.join('、')}。` : '',
    dangerAlerts.length > 0 ? `今日共触发${dangerAlerts.length}次危险级别预警。` : '',
    `正常体征：心率${v.heartRate?.status === 'normal' ? v.heartRate.value + v.heartRate.unit : '--'}、血氧${v.bloodOxygen?.status === 'normal' ? v.bloodOxygen.value + v.bloodOxygen.unit : '--'}。`,
    `请医生评估是否需要调整用药或安排就诊。`,
  ].filter(Boolean).join('')
})

// ========== 今日健康计划 ==========
const TASK_META: Record<string, { icon: string; sub: string }> = {
  monitoring: { icon: '📊', sub: '血压、心率、血糖' },
  exercise: { icon: '🎬', sub: '康复视频跟练' },
  medication: { icon: '💊', sub: '按时用药' },
  diet: { icon: '📷', sub: '拍照饮食记录' },
}

const completedTaskCount = computed(() => {
  return (detail.value?.tasks || []).filter((t: any) => t.status === 'completed').length
})

const taskItems = computed(() => {
  return (detail.value?.tasks || []).map((t: any) => ({
    ...t,
    icon: TASK_META[t.taskType]?.icon || '📋',
    sub: TASK_META[t.taskType]?.sub || t.taskType,
    state: t.status === 'completed' ? 'done' : 'pending',
  }))
})

const showRemindPicker = ref(false)
const remindTaskTitle = ref('')

function openRemindPopup(task: any) {
  remindTaskTitle.value = task.title
  showRemindPicker.value = true
}

const showRemindResult = ref(false)
const remindSending = ref(false)
const remindMethod = ref<'wechat' | 'inapp'>('wechat')
const remindSentTime = ref('')

function sendRemind(method: 'wechat' | 'inapp') {
  showRemindPicker.value = false
  remindMethod.value = method
  remindSending.value = true
  showRemindResult.value = true
  const now = new Date()
  remindSentTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  setTimeout(() => { remindSending.value = false }, 1500)
  setTimeout(() => { showRemindResult.value = false }, 4000)
}

// ========== 基础数据 ==========
const isDanger = computed(() => detail.value?.alertLevel === 'high')

const alertLevelText = computed(() => {
  const map: Record<string, string> = { none: '正常', low: '低', medium: '中', high: '高危' }
  return map[detail.value?.alertLevel] || '正常'
})

const doctorPhone = computed(() => {
  const doc = detail.value?.emergencyContacts?.doctor || ''
  const match = doc.match(/\d{11}/)
  return match ? match[0] : ''
})

const vitalsList = computed(() => {
  const v = detail.value?.vitals
  if (!v) return []
  return [
    { key: 'hr', icon: '❤️', label: '心率', value: v.heartRate?.value ?? '--', unit: v.heartRate?.unit || 'bpm', status: v.heartRate?.status },
    { key: 'bp', icon: '🩸', label: '血压', value: v.bloodPressure?.value ?? '--', unit: v.bloodPressure?.unit || 'mmHg', status: v.bloodPressure?.status },
    { key: 'bs', icon: '🍬', label: '血糖', value: v.bloodSugar?.value ?? '--', unit: v.bloodSugar?.unit || 'mmol/L', status: v.bloodSugar?.status },
    { key: 'bo', icon: '💨', label: '血氧', value: v.bloodOxygen?.value ?? '--', unit: v.bloodOxygen?.unit || '%', status: v.bloodOxygen?.status },
  ]
})

function getAlertIcon(type: string) {
  const map: Record<string, string> = {
    blood_pressure: '🩸', heart_rate: '❤️', blood_oxygen: '💨', blood_sugar: '🍬',
  }
  return map[type] || '⚠️'
}

function formatAlertTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  const mon = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${mon}-${day} ${h}:${m}`
}

function formatSentTime(ts: number) {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) { router.back(); return }
  try {
    detail.value = await getMemberDetail(id) as any
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
  // 恢复持久化的预警处置状态
  if (detail.value) {
    loadAlertState()
  }
})

onUnmounted(() => {
  if (undoTimer) clearInterval(undoTimer)
  if (replyTimer) clearTimeout(replyTimer)
  if (recognition) recognition.stop()
})
</script>

<style scoped>
.member-detail-page {
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

/* ========== 1. 个人信息卡 ========== */
.profile-card {
  margin: 12px 16px 0;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(145deg, #8A7BFE 0%, #A89AFE 50%, #C4BAFF 100%);
  box-shadow: 0 6px 20px rgba(138, 123, 254, 0.25);
}

.profile-card--danger {
  background: linear-gradient(145deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.profile-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}

.avatar--danger {
  animation: avatar-pulse 2s ease-in-out infinite;
}

@keyframes avatar-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.profile-name {
  font-size: 20px;
  font-weight: 800;
  color: white;
}

.profile-tag {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 6px;
}

.profile-meta {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
}

.profile-bottom {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.15);
  border-radius: 14px;
  padding: 14px 0;
}

.profile-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 800;
  color: white;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

.profile-divider {
  width: 1px;
  height: 28px;
  background: rgba(255,255,255,0.2);
}

.alert-level-badge {
  font-size: 14px !important;
  padding: 2px 10px;
  border-radius: 8px;
}

.level--none { background: rgba(16,185,129,0.3); }
.level--low { background: rgba(234,179,8,0.3); }
.level--medium { background: rgba(249,115,22,0.3); }
.level--high { background: rgba(239,68,68,0.4); }

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

.section-bar--danger {
  background: linear-gradient(180deg, #ef4444, #f87171);
}

.section-bar--processed {
  background: linear-gradient(180deg, #10b981, #34d399);
}

.alert-count {
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  margin-left: auto;
}

/* ========== 2. 体征巡航 ========== */
.vitals-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.vital-card {
  background: white;
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  border: 1.5px solid transparent;
}

.vital-card--abnormal {
  border-color: #fecaca;
  background: linear-gradient(145deg, #fff5f5, white);
}

.vital-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.vital-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.vital-name {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.vital-unit {
  font-size: 11px;
  font-weight: 400;
  color: #94a3b8;
}

.vital-risk-tag {
  font-size: 10px;
  font-weight: 700;
  color: #ef4444;
  background: #fef2f2;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.vital-value {
  font-size: 24px;
  font-weight: 900;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.vital-card--abnormal .vital-value {
  color: #dc2626;
}

/* ========== 3. 紧急处置 ========== */
.emergency-section {
  animation: emer-appear 0.4s ease-out;
}

@keyframes emer-appear {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.emergency-hospital {
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: 12px;
  font-size: 13px;
  color: #dc2626;
  font-weight: 600;
  margin-bottom: 10px;
}

.emergency-actions {
  display: flex;
  gap: 10px;
}

.emer-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s;
}

.emer-btn:active {
  transform: scale(0.95);
}

.emer-btn--ambulance {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.emer-btn--doctor {
  background: linear-gradient(135deg, #ea580c, #f97316);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}

.emer-btn--done {
  background: linear-gradient(135deg, #059669, #10b981);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.emer-icon {
  font-size: 24px;
}

.emer-label {
  font-size: 13px;
  font-weight: 700;
  color: white;
}

/* 已处理状态 */
.processed-badge {
  font-size: 12px;
  font-weight: 700;
  color: #10b981;
  background: #ecfdf5;
  padding: 3px 10px;
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.undo-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.15s;
}

.undo-btn:active {
  background: #f1f5f9;
}

.undo-btn svg {
  flex-shrink: 0;
}

.processed-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #ecfdf5;
  border-radius: 14px;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.processed-card-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.processed-card-text {
  font-size: 14px;
  font-weight: 600;
  color: #166534;
}

/* 等待医生回复 section-bar */
.section-bar--waiting {
  background: linear-gradient(180deg, #ea580c, #f97316);
}

.waiting-badge {
  font-size: 12px;
  font-weight: 700;
  color: #ea580c;
  background: #fff7ed;
  padding: 3px 10px;
  border-radius: 8px;
  border: 1px solid rgba(234, 88, 12, 0.2);
  animation: waiting-pulse 2s ease-in-out infinite;
}

@keyframes waiting-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.level--waiting { background: rgba(234, 88, 12, 0.25); }
.level--replied { background: rgba(16, 185, 129, 0.25); }

/* 已回复态 section-bar */
.section-bar--replied {
  background: linear-gradient(180deg, #10b981, #34d399);
}

/* 已回复态 badge */
.waiting-badge--replied {
  color: #166534;
  background: #f0fdf4;
  border-color: rgba(16, 185, 129, 0.2);
  animation: none;
}

/* 已回复态卡片 */
.waiting-card--replied {
  background: linear-gradient(145deg, #f0fdf4, #ffffff);
  border-color: rgba(16, 185, 129, 0.2);
}

.waiting-card--replied .waiting-card-title {
  color: #166534;
}

.waiting-card--replied .waiting-card-sub {
  color: #15803d;
}

.replied-new-tag {
  font-size: 10px;
  font-weight: 800;
  color: white;
  background: #10b981;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  animation: new-tag-pulse 2s ease-in-out infinite;
}

@keyframes new-tag-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.92); }
}

/* 等待医生回复卡片 */
.waiting-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(145deg, #fff7ed, #ffffff);
  border-radius: 14px;
  border: 1px solid rgba(234, 88, 12, 0.15);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s;
}

.waiting-card:active {
  transform: scale(0.98);
}

.waiting-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.waiting-card-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.waiting-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #9a3412;
  margin-bottom: 2px;
}

.waiting-card-sub {
  font-size: 12px;
  color: #c2410c;
  opacity: 0.7;
}

.waiting-card-arrow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.waiting-dot-group {
  display: flex;
  gap: 4px;
}

.waiting-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f97316;
  opacity: 0.4;
  animation: dot-bounce 1.4s ease-in-out infinite;
}

.waiting-dot:nth-child(2) { animation-delay: 0.16s; }
.waiting-dot:nth-child(3) { animation-delay: 0.32s; }

@keyframes dot-bounce {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}

/* ========== 医生回复弹窗 ========== */
.chat-section {
  margin-bottom: 20px;
}

.chat-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 10px;
}

.chat-label-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-label-dot--me { background: #8A7BFE; }
.chat-label-dot--doctor { background: #10b981; }

.chat-label-time {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  margin-left: auto;
}

.chat-bubble {
  padding: 14px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #334155;
}

.chat-bubble--me {
  background: #f0eeff;
  border: 1px solid rgba(138, 123, 254, 0.15);
  border-top-left-radius: 4px;
}

.chat-bubble--doctor {
  background: #ecfdf5;
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-top-left-radius: 4px;
}

.chat-bubble--doctor p {
  margin: 0;
}

.chat-ai-tag {
  font-size: 11px;
  font-weight: 700;
  color: #8A7BFE;
  background: rgba(138, 123, 254, 0.12);
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.chat-ai-text {
  margin: 0 0 8px;
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

.chat-user-msg {
  border-top: 1px solid rgba(138, 123, 254, 0.12);
  padding-top: 8px;
  margin-top: 4px;
}

.chat-user-label {
  font-size: 11px;
  font-weight: 600;
  color: #8A7BFE;
  margin-bottom: 4px;
}

.chat-user-msg p {
  margin: 0;
  font-size: 14px;
  color: #334155;
}

.chat-reply-time {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
  text-align: right;
}

.chat-waiting {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px dashed #e2e8f0;
}

.chat-waiting-dots {
  display: flex;
  gap: 4px;
}

.chat-waiting-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: chat-dot-typing 1.4s ease-in-out infinite;
}

.chat-waiting-dots span:nth-child(2) { animation-delay: 0.2s; }
.chat-waiting-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes chat-dot-typing {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-4px); }
}

.chat-waiting-text {
  font-size: 14px;
  color: #94a3b8;
}

/* ========== 4. 预警记录 ========== */
.empty-tip {
  text-align: center;
  padding: 32px 0;
  font-size: 14px;
  color: #94a3b8;
  background: white;
  border-radius: 16px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  border-left: 3px solid transparent;
}

.alert-item--danger {
  border-left-color: #ef4444;
  background: linear-gradient(90deg, #fff5f5, white);
}

.alert-item--warning {
  border-left-color: #f59e0b;
  background: linear-gradient(90deg, #fffbeb, white);
}

.alert-item--info {
  border-left-color: #3b82f6;
}

.alert-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.alert-icon--danger { background: #fef2f2; }
.alert-icon--warning { background: #fffbeb; }
.alert-icon--info { background: #eff6ff; }

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.alert-desc {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  line-height: 1.4;
}

.alert-level-chip {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.chip--danger {
  color: #dc2626;
  background: #fef2f2;
}

.chip--warning {
  color: #d97706;
  background: #fffbeb;
}

.chip--info {
  color: #2563eb;
  background: #eff6ff;
}

.alert-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alert-val {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.alert-time {
  font-size: 12px;
  color: #94a3b8;
}

/* ========== 5. 康复计划概要 ========== */
.plan-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.plan-row {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
}

.plan-row + .plan-row {
  border-top: 1px solid #f8fafc;
}

.plan-label {
  width: 56px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  flex-shrink: 0;
}

.plan-val {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  flex: 1;
}

.plan-desc {
  font-weight: 500;
  line-height: 1.6;
  color: #64748b;
}

.plan-stage-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: #8A7BFE;
  background: #f0eeff;
  padding: 2px 8px;
  border-radius: 6px;
  margin-right: 6px;
}

/* ========== 弹窗通用 ========== */
.popup-content {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
  flex-shrink: 0;
}

.popup-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.popup-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  font-size: 16px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.popup-close:active { background: #e2e8f0; }

.popup-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  -webkit-overflow-scrolling: touch;
}

.popup-tip {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
  margin-top: 4px;
}

/* AI 卡片 */
.ai-card {
  background: #f8fafc;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #f1f5f9;
}

.ai-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ai-card-icon {
  font-size: 16px;
}

.ai-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.ai-card-body {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
}

/* 话术列表 */
.script-card {
  background: linear-gradient(145deg, #fef2f2, #fefce8);
  border-color: #fef2f2;
}

.script-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.script-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.script-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 1px;
}

.script-text {
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
}

/* 底部操作按钮 */
.popup-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px 20px 20px;
  padding: 14px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 800;
  color: white;
  cursor: pointer;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}

.popup-action-btn:active { opacity: 0.85; }

.popup-action-btn--red {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.popup-action-btn--orange {
  background: linear-gradient(135deg, #ea580c, #f97316);
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.25);
}

/* 医生留言板 */
.msg-section {
  margin-bottom: 12px;
}

.msg-label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}

.msg-input-wrap {
  position: relative;
}

.msg-textarea {
  width: 100%;
  padding: 12px 14px;
  padding-right: 60px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  resize: none;
  background: white;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.msg-textarea:focus {
  outline: none;
  border-color: #8A7BFE;
}

.msg-textarea::placeholder {
  color: #94a3b8;
}

.voice-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 6px 8px;
  border-radius: 10px;
  border: none;
  background: #f1f5f9;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s;
}

.voice-btn:active { background: #e2e8f0; }

.voice-btn--active {
  background: #fef2f2;
  animation: voice-pulse 1s ease-in-out infinite;
}

@keyframes voice-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
}

.voice-icon {
  font-size: 18px;
}

.voice-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
}

.voice-btn--active .voice-label {
  color: #dc2626;
}

.recording-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: #dc2626;
  font-weight: 600;
}

.rec-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc2626;
  animation: rec-blink 1s ease-in-out infinite;
}

@keyframes rec-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.doctor-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.doctor-info-icon {
  font-size: 18px;
}

/* 确认弹窗 */
.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 24px 20px;
  text-align: center;
}

.confirm-icon {
  font-size: 42px;
  margin-bottom: 12px;
}

.confirm-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.confirm-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 6px;
}

.confirm-note {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 20px;
}

.confirm-btns {
  display: flex;
  gap: 12px;
  width: 100%;
}

.confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.confirm-btn:active { opacity: 0.85; }

.confirm-btn--cancel {
  background: #f1f5f9;
  color: #64748b;
}

.confirm-btn--ok {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

/* ========== 5. 今日健康计划 ========== */
.task-progress {
  font-size: 13px;
  font-weight: 600;
  color: #8A7BFE;
  margin-left: auto;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.task-item--done {
  opacity: 0.7;
}

.task-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.task-icon--done {
  background: #ecfdf5;
  color: #10b981;
  font-size: 14px;
  font-weight: 800;
}

.task-icon--pending {
  background: #f0eeff;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 2px;
}

.task-sub {
  font-size: 12px;
  color: #94a3b8;
}

.task-status-done {
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
  background: #ecfdf5;
  padding: 5px 12px;
  border-radius: 16px;
  border: none;
  flex-shrink: 0;
}

.task-remind-btn {
  padding: 5px 14px;
  border-radius: 16px;
  border: 1px solid #8A7BFE;
  background: rgba(138, 123, 254, 0.06);
  font-size: 12px;
  font-weight: 600;
  color: #8A7BFE;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.15s;
}

.task-remind-btn:active {
  background: rgba(138, 123, 254, 0.15);
}

/* ========== 提醒方式弹窗 ========== */
.remind-popup {
  padding: 24px 16px calc(20px + env(safe-area-inset-bottom));
}

.remind-popup-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
}

.remind-popup-desc {
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  margin-top: 6px;
  margin-bottom: 20px;
}

.remind-options {
  display: flex;
  gap: 12px;
}

.remind-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  background: #f8fafc;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.remind-option:active {
  background: #f1f5f9;
}

.remind-option-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remind-option-icon--wechat {
  background: #07c160;
  color: white;
}

.remind-option-icon--inapp {
  background: #8A7BFE;
  color: white;
}

.remind-option-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.remind-option-sub {
  font-size: 12px;
  color: #94a3b8;
}

/* ========== 提醒发送结果弹窗 ========== */
.remind-result {
  padding: 28px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.remind-result-sending {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.remind-sending-text {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.remind-result-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  animation: remind-success-in 0.4s ease-out;
}

@keyframes remind-success-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.remind-check {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remind-check--wechat {
  background: #07c160;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
}

.remind-check--inapp {
  background: #8A7BFE;
  box-shadow: 0 4px 12px rgba(138, 123, 254, 0.3);
}

.remind-success-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

/* 消息预览卡 */
.remind-msg-card {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.remind-msg-card--wechat {
  border-color: rgba(7, 193, 96, 0.2);
}

.remind-msg-card--inapp {
  border-color: rgba(138, 123, 254, 0.2);
}

.rmc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.remind-msg-card--wechat .rmc-header {
  background: #f0fdf4;
  border-bottom-color: rgba(7, 193, 96, 0.1);
}

.remind-msg-card--inapp .rmc-header {
  background: #f5f3ff;
  border-bottom-color: rgba(138, 123, 254, 0.1);
}

.rmc-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.rmc-from {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  flex: 1;
}

.rmc-time {
  font-size: 11px;
  color: #94a3b8;
}

.rmc-body {
  padding: 12px 14px;
  background: white;
}

.rmc-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 10px;
}

.rmc-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
}

.rmc-row + .rmc-row {
  border-top: 1px solid #f8fafc;
}

.rmc-label {
  font-size: 13px;
  color: #94a3b8;
  width: 64px;
  flex-shrink: 0;
}

.rmc-val {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.rmc-footer {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  border-top: 1px solid #f1f5f9;
  text-align: right;
}

.remind-msg-card--wechat .rmc-footer {
  color: #07c160;
  background: #fafffe;
}

.remind-msg-card--inapp .rmc-footer {
  color: #8A7BFE;
  background: #fdfcff;
}
</style>
