<template>
  <div class="review-page">
    <!-- 导航 -->
    <div class="page-nav">
      <button class="back-btn" @click="router.back()">
        <van-icon name="arrow-left" />
      </button>
      <span class="nav-title">审核详情</span>
      <div class="nav-space"></div>
    </div>

    <div v-if="loading" class="loading-box">
      <van-loading size="32" color="#396CFF" />
    </div>

    <template v-else-if="detail">
      <!-- 优先级色带 -->
      <div :class="['priority-strip', 'priority-' + detail.priority]"></div>

      <!-- ========== 高危预警类型：干预处理布局 ========== -->
      <template v-if="detail.taskType === 'high_risk_alert' && detail.alertDetail">
        <!-- 预警级别横幅 -->
        <div :class="['level-banner', 'level-' + detail.alertDetail.level]">
          <span class="level-text">{{ detail.alertDetail.level === 'danger' ? '危急预警' : '预警提示' }}</span>
        </div>

        <!-- 患者信息 -->
        <div class="patient-card-alert">
          <div class="patient-avatar-alert">
            <span>{{ detail.patient.name.charAt(0) }}</span>
          </div>
          <div class="patient-info-alert">
            <div class="patient-name-row-alert">
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
        <div class="current-alert-display">
          <div class="alert-label">当前{{ alertTypeLabel(detail.alertDetail.alertType) }}</div>
          <div class="alert-value-big">
            <span class="big-value">{{ detail.alertDetail.value }}</span>
            <span class="big-unit">{{ detail.alertDetail.unit }}</span>
          </div>
          <div class="alert-time-text">{{ formatDateTime(detail.alertDetail.alertTime) }}</div>
        </div>

        <!-- 近期体征记录 -->
        <section class="section" v-if="detail.recentAlerts?.length">
          <h3 class="section-title">近期体征记录</h3>
          <div class="vitals-timeline">
            <div v-for="(a, i) in detail.recentAlerts" :key="i" class="vital-item">
              <div :class="['vital-dot', 'dot-' + a.level]"></div>
              <div class="vital-info">
                <span class="vital-type">{{ alertTypeLabel(a.alertType) }}</span>
                <span class="vital-val">{{ a.value }} {{ a.unit }}</span>
              </div>
              <span class="vital-time">{{ formatDateTime(a.alertTime) }}</span>
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

        <!-- 操作区 -->
        <div v-if="detail.status === 'pending'" class="action-area-intervention">
          <label class="check-option">
            <input v-model="pushToPatient" type="checkbox" class="check-input" />
            <span>推送给患者</span>
          </label>
          <label class="check-option">
            <input v-model="pushToFamily" type="checkbox" class="check-input" />
            <span>推送给家属</span>
          </label>
          <button class="push-btn" :disabled="submitting" @click="handleInterventionSubmit">
            <van-loading v-if="submitting" size="16" color="white" />
            <span v-else>确认推送</span>
          </button>
          <a :href="'tel:' + detail.patient.phone" class="call-btn">
            <van-icon name="phone-o" /> 直接拨打患者电话
          </a>
        </div>

        <!-- 已审核状态 -->
        <div v-else class="reviewed-banner">
          <div :class="['reviewed-status', detail.status]">
            {{ detail.status === 'approved' ? '已处理' : '已处理' }}
          </div>
          <p v-if="detail.reviewedAt" class="reviewed-time">处理于 {{ formatDateTime(detail.reviewedAt) }}</p>
          <p v-if="detail.reviewComment" class="reviewed-comment">{{ detail.reviewComment }}</p>
        </div>
      </template>

      <!-- ========== 入组审核 + 计划变更类型布局 ========== -->
      <template v-else-if="(detail.taskType === 'initial_plan' || detail.taskType === 'plan_adjustment') && detail.context?.patientInfo">
        <!-- 任务头部 -->
        <div class="task-card">
          <div class="task-header">
            <span :class="['type-tag', 'type-' + detail.taskType]">{{ taskTypeLabel(detail.taskType) }}</span>
            <span class="submit-time">提交于 {{ formatDateTime(detail.createdAt) }}</span>
          </div>
          <h2 class="task-title">{{ detail.title }}</h2>
          <p v-if="detail.description" class="task-desc">{{ detail.description }}</p>
        </div>

        <!-- 变更依据（仅 plan_adjustment） -->
        <section v-if="detail.taskType === 'plan_adjustment' && detail.context?.changeBasis" class="section change-basis-section">
          <h3 class="section-title">
            <span class="change-basis-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </span>
            变更依据
          </h3>
          <div class="change-basis-content">
            <p class="trigger-desc">{{ detail.context.changeBasis.triggerDescription }}</p>

            <!-- 调整项目对比 -->
            <div v-if="detail.context.changeBasis.proposedChanges?.length" class="proposed-changes">
              <h4 class="sub-title">调整项目</h4>
              <div v-for="(change, i) in detail.context.changeBasis.proposedChanges" :key="i" class="change-item">
                <span class="change-field">{{ change.field }}</span>
                <div class="change-diff">
                  <span class="change-from">{{ change.from }}</span>
                  <span class="change-arrow">→</span>
                  <span class="change-to">{{ change.to }}</span>
                </div>
              </div>
            </div>

            <!-- 数据支撑 -->
            <div v-if="detail.context.changeBasis.supportingData" class="supporting-data">
              <h4 class="sub-title">数据支撑</h4>
              <div class="data-grid">
                <div v-for="(val, key) in detail.context.changeBasis.supportingData" :key="key" class="data-item">
                  <span class="data-label">{{ supportingDataLabel(String(key)) }}</span>
                  <span class="data-value">{{ val }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 患者个人信息 -->
        <section class="section">
          <h3 class="section-title">患者信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ detail.patient.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">性别</span>
              <span class="info-value">{{ detail.patient.gender === 'male' ? '男' : '女' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">年龄</span>
              <span class="info-value">{{ detail.patient.age }}岁</span>
            </div>
            <div class="info-item">
              <span class="info-label">身高</span>
              <span class="info-value">{{ detail.context.patientInfo.height }}cm</span>
            </div>
            <div class="info-item">
              <span class="info-label">体重</span>
              <span class="info-value">{{ detail.context.patientInfo.weight }}kg</span>
            </div>
            <div class="info-item">
              <span class="info-label">职业</span>
              <span class="info-value">{{ detail.context.patientInfo.occupation }}</span>
            </div>
          </div>
          <div v-if="detail.context.patientInfo.healthHistory" class="health-history">
            <span class="info-label">健康史</span>
            <p class="history-text">{{ detail.context.patientInfo.healthHistory }}</p>
          </div>
        </section>

        <!-- 出院诊断 -->
        <section class="section" v-if="detail.context.dischargeDiagnosis">
          <h3 class="section-title">出院诊断</h3>
          <div class="diag-items">
            <div class="diag-row">
              <span class="diag-label">入院时间</span>
              <span class="diag-value">{{ detail.context.dischargeDiagnosis.admissionTime }}</span>
            </div>
            <div class="diag-row">
              <span class="diag-label">出院时间</span>
              <span class="diag-value">{{ detail.context.dischargeDiagnosis.dischargeTime }}</span>
            </div>
            <div class="diag-row full">
              <span class="diag-label">诊断</span>
              <span class="diag-value">{{ detail.context.dischargeDiagnosis.diagnosis }}</span>
            </div>
            <div class="diag-row full">
              <span class="diag-label">手术方式</span>
              <span class="diag-value">{{ detail.context.dischargeDiagnosis.surgeryMethod }}</span>
            </div>
          </div>
        </section>

        <!-- 出院医嘱（可编辑） -->
        <section class="section" v-if="detail.context.dischargeOrders">
          <div class="section-title-row">
            <h3 class="section-title">出院医嘱</h3>
            <span class="edit-hint">可修改后下发</span>
          </div>

          <!-- 用药医嘱 -->
          <div class="order-group">
            <div class="order-group-header">
              <div class="order-icon med-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 9h6m-6 3h3" /></svg>
              </div>
              <span class="order-group-title">用药方案</span>
              <button class="add-btn" @click="addOrderItem('medication')">+ 添加</button>
            </div>
            <div class="order-items">
              <div v-for="(item, i) in orders.medication" :key="'med-' + i" class="order-item">
                <div class="order-item-header">
                  <input v-model="item.title" class="order-input title-input" placeholder="药品名称" />
                  <button class="del-btn" @click="removeOrderItem('medication', i)">
                    <van-icon name="cross" />
                  </button>
                </div>
                <textarea v-model="item.content" class="order-input content-input" rows="1" placeholder="用法用量" @input="autoResize"></textarea>
              </div>
            </div>
          </div>

          <!-- 运动医嘱 -->
          <div class="order-group">
            <div class="order-group-header">
              <div class="order-icon exercise-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="2" /><path d="M4 21l3-3 2 2 3-3 2 2 3-3 2 2" /><path d="M12 7v6" /></svg>
              </div>
              <span class="order-group-title">运动处方</span>
              <button class="add-btn" @click="addOrderItem('exercise')">+ 添加</button>
            </div>
            <div class="order-items">
              <div v-for="(item, i) in orders.exercise" :key="'ex-' + i" class="order-item">
                <div class="order-item-header">
                  <input v-model="item.title" class="order-input title-input" placeholder="运动项目" />
                  <button class="del-btn" @click="removeOrderItem('exercise', i)">
                    <van-icon name="cross" />
                  </button>
                </div>
                <textarea v-model="item.content" class="order-input content-input" rows="1" placeholder="频次和注意事项" @input="autoResize"></textarea>
              </div>
            </div>
          </div>

          <!-- 监测医嘱 -->
          <div class="order-group">
            <div class="order-group-header">
              <div class="order-icon monitor-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              </div>
              <span class="order-group-title">监测计划</span>
              <button class="add-btn" @click="addOrderItem('monitoring')">+ 添加</button>
            </div>
            <div class="order-items">
              <div v-for="(item, i) in orders.monitoring" :key="'mon-' + i" class="order-item">
                <div class="order-item-header">
                  <input v-model="item.title" class="order-input title-input" placeholder="监测项目" />
                  <button class="del-btn" @click="removeOrderItem('monitoring', i)">
                    <van-icon name="cross" />
                  </button>
                </div>
                <textarea v-model="item.content" class="order-input content-input" rows="1" placeholder="监测频次和要求" @input="autoResize"></textarea>
              </div>
            </div>
          </div>

          <!-- 饮食医嘱 -->
          <div class="order-group">
            <div class="order-group-header">
              <div class="order-icon diet-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" /></svg>
              </div>
              <span class="order-group-title">饮食管理</span>
              <button class="add-btn" @click="addOrderItem('diet')">+ 添加</button>
            </div>
            <div class="order-items">
              <div v-for="(item, i) in orders.diet" :key="'diet-' + i" class="order-item">
                <div class="order-item-header">
                  <input v-model="item.title" class="order-input title-input" placeholder="饮食类型" />
                  <button class="del-btn" @click="removeOrderItem('diet', i)">
                    <van-icon name="cross" />
                  </button>
                </div>
                <textarea v-model="item.content" class="order-input content-input" rows="1" placeholder="具体要求" @input="autoResize"></textarea>
              </div>
            </div>
          </div>

          <!-- 复诊医嘱 -->
          <div class="order-group">
            <div class="order-group-header">
              <div class="order-icon followup-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              </div>
              <span class="order-group-title">复诊安排</span>
              <button class="add-btn" @click="addOrderItem('followUp')">+ 添加</button>
            </div>
            <div class="order-items">
              <div v-for="(item, i) in orders.followUp" :key="'fu-' + i" class="order-item">
                <div class="order-item-header">
                  <input v-model="item.title" class="order-input title-input" placeholder="复诊科室" />
                  <button class="del-btn" @click="removeOrderItem('followUp', i)">
                    <van-icon name="cross" />
                  </button>
                </div>
                <textarea v-model="item.content" class="order-input content-input" rows="1" placeholder="时间和注意事项" @input="autoResize"></textarea>
              </div>
            </div>
          </div>
        </section>

        <!-- 审核意见 -->
        <section class="section">
          <h3 class="section-title">审核意见</h3>
          <textarea
            v-model="comment"
            class="comment-textarea"
            rows="3"
            placeholder="请输入审核意见（可选）"
          ></textarea>
        </section>

        <!-- 操作按钮 -->
        <div v-if="detail.status === 'pending'" class="action-area">
          <button class="approve-btn full-width" :disabled="submitting" @click="handleSubmit('approve')">
            <van-loading v-if="submitting" size="16" color="white" />
            <span v-else>审核通过并下发</span>
          </button>
        </div>

        <!-- 已审核状态 -->
        <div v-else class="reviewed-banner">
          <div class="reviewed-status approved">已下发</div>
          <p v-if="detail.reviewedAt" class="reviewed-time">下发于 {{ formatDateTime(detail.reviewedAt) }}</p>
          <p v-if="detail.reviewComment" class="reviewed-comment">{{ detail.reviewComment }}</p>
        </div>
      </template>

      <!-- ========== 周期报告类型：康复报告审核布局 ========== -->
      <template v-else-if="detail.taskType === 'monthly_report'">
        <!-- 报告头部 -->
        <div class="task-card">
          <div class="task-header">
            <span class="type-tag type-monthly_report">周期报告</span>
            <span class="submit-time">提交于 {{ formatDateTime(detail.createdAt) }}</span>
          </div>
          <h2 class="task-title">{{ detail.title }}</h2>
          <div v-if="detail.context?.cycleInfo" class="cycle-info">
            <span class="cycle-badge">{{ detail.context.cycleInfo.cycleName }} / 共{{ detail.context.cycleInfo.totalCycles }}周期</span>
            <span class="cycle-range">{{ detail.context.cycleInfo.cycleRange }}</span>
          </div>
        </div>

        <!-- 患者基础信息 -->
        <section class="section">
          <h3 class="section-title">患者信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ detail.patient.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">性别</span>
              <span class="info-value">{{ detail.patient.gender === 'male' ? '男' : '女' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">年龄</span>
              <span class="info-value">{{ detail.patient.age }}岁</span>
            </div>
            <div v-if="detail.context?.patientInfo?.height" class="info-item">
              <span class="info-label">身高</span>
              <span class="info-value">{{ detail.context.patientInfo.height }}cm</span>
            </div>
            <div v-if="detail.context?.patientInfo?.weight" class="info-item">
              <span class="info-label">体重</span>
              <span class="info-value">{{ detail.context.patientInfo.weight }}kg</span>
            </div>
            <div v-if="detail.context?.patientInfo?.occupation" class="info-item">
              <span class="info-label">职业</span>
              <span class="info-value">{{ detail.context.patientInfo.occupation }}</span>
            </div>
          </div>
          <div v-if="detail.context?.patientInfo?.healthHistory" class="health-history">
            <span class="info-label">健康史</span>
            <p class="history-text">{{ detail.context.patientInfo.healthHistory }}</p>
          </div>
        </section>

        <!-- 周期康复数据 -->
        <section class="section" v-if="detail.context?.recoveryData">
          <h3 class="section-title">康复数据</h3>
          <div class="recovery-grid">
            <div v-for="(val, key) in detail.context.recoveryData" :key="key" class="recovery-item">
              <span class="recovery-label">{{ recoveryDataLabel(String(key)) }}</span>
              <span class="recovery-value">{{ val }}</span>
            </div>
          </div>
        </section>

        <!-- 康复总结（可编辑） -->
        <section class="section">
          <div class="section-title-row">
            <h3 class="section-title">康复总结</h3>
            <span class="ai-badge">AI 生成 · 可修改</span>
          </div>
          <textarea
            v-model="recoverySummary"
            class="ai-textarea"
            rows="6"
            placeholder="AI 生成的康复总结..."
            @input="autoResize"
          ></textarea>
        </section>

        <!-- 下周期计划调整策略（可编辑） -->
        <section class="section">
          <div class="section-title-row">
            <h3 class="section-title">下周期计划调整</h3>
            <span class="ai-badge">AI 生成 · 可修改</span>
          </div>
          <textarea
            v-model="nextCyclePlan"
            class="ai-textarea"
            rows="8"
            placeholder="AI 生成的下周期计划..."
            @input="autoResize"
          ></textarea>
        </section>

        <!-- 操作按钮 -->
        <div v-if="detail.status === 'pending'" class="action-area">
          <button class="approve-btn full-width" :disabled="submitting" @click="handleReportSubmit">
            <van-loading v-if="submitting" size="16" color="white" />
            <span v-else>确认并下发到患者端</span>
          </button>
        </div>

        <!-- 已审核状态 -->
        <div v-else class="reviewed-banner">
          <div class="reviewed-status approved">已下发</div>
          <p v-if="detail.reviewedAt" class="reviewed-time">下发于 {{ formatDateTime(detail.reviewedAt) }}</p>
        </div>
      </template>

      <!-- ========== 其他任务类型通用布局 ========== -->
      <template v-else>
        <!-- 任务头部 -->
        <div class="task-card">
          <div class="task-header">
            <span :class="['type-tag', 'type-' + detail.taskType]">{{ taskTypeLabel(detail.taskType) }}</span>
            <span class="submit-time">提交于 {{ formatDateTime(detail.createdAt) }}</span>
          </div>
          <h2 class="task-title">{{ detail.title }}</h2>
          <p v-if="detail.description" class="task-desc">{{ detail.description }}</p>
        </div>

        <!-- 患者信息 -->
        <div class="task-card">
          <div class="task-patient">
            <span class="patient-label">患者：</span>
            <span class="patient-name">{{ detail.patient.name }}</span>
            <span class="patient-detail">{{ detail.patient.age }}岁 {{ detail.patient.gender === 'male' ? '男' : '女' }}</span>
          </div>
        </div>

        <!-- 患者上下文 -->
        <section class="section" v-if="detail.context && Object.keys(detail.context).length > 0">
          <h3 class="section-title">患者上下文</h3>
          <div class="context-items">
            <div v-for="(val, key) in detail.context" :key="key" class="context-item">
              <span class="ctx-label">{{ contextLabel(String(key)) }}</span>
              <span class="ctx-value">{{ Array.isArray(val) ? val.join(', ') : val }}</span>
            </div>
          </div>
        </section>

        <!-- 近期预警 -->
        <section class="section" v-if="detail.recentAlerts?.length">
          <h3 class="section-title">近期预警记录</h3>
          <div class="alert-list">
            <div v-for="(a, i) in detail.recentAlerts" :key="i" class="alert-item">
              <div :class="['alert-dot', 'dot-' + a.level]"></div>
              <span class="alert-type">{{ alertTypeLabel(a.alertType) }}</span>
              <span class="alert-val">{{ a.value }} {{ a.unit }}</span>
              <span class="alert-time">{{ formatDateTime(a.alertTime) }}</span>
            </div>
          </div>
        </section>

        <!-- 审核意见 -->
        <section class="section">
          <h3 class="section-title">审核意见</h3>
          <textarea
            v-model="comment"
            class="comment-textarea"
            rows="3"
            placeholder="请输入审核意见（可选）"
          ></textarea>
        </section>

        <!-- 操作按钮 -->
        <div v-if="detail.status === 'pending'" class="action-area">
          <button class="approve-btn full-width" :disabled="submitting" @click="handleSubmit('approve')">
            <van-loading v-if="submitting" size="16" color="white" />
            <span v-else>审核通过并下发</span>
          </button>
        </div>

        <!-- 已审核状态 -->
        <div v-else class="reviewed-banner">
          <div class="reviewed-status approved">已下发</div>
          <p v-if="detail.reviewedAt" class="reviewed-time">下发于 {{ formatDateTime(detail.reviewedAt) }}</p>
          <p v-if="detail.reviewComment" class="reviewed-comment">{{ detail.reviewComment }}</p>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getReviewDetail, submitReview, submitReviewIntervention } from '@/api'

const router = useRouter()
const route = useRoute()
const reviewId = Number(route.params.id)

const detail = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)
const comment = ref('')
const action = ref('')

// 干预处理相关
const suggestion = ref('')
const pushToPatient = ref(true)
const pushToFamily = ref(false)

// 周期报告相关
const recoverySummary = ref('')
const nextCyclePlan = ref('')

interface OrderItem { title: string; content: string }

const orders = reactive<Record<string, OrderItem[]>>({
  medication: [],
  exercise: [],
  monitoring: [],
  diet: [],
  followUp: [],
})

const taskTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    high_risk_alert: '紧急预警',
    plan_adjustment: '计划变更',
    initial_plan: '患者入组',
    monthly_report: '周期报告',
  }
  return map[type] || type
}

const alertTypeLabel = (type: string) => {
  const map: Record<string, string> = { glucose: '血糖', bp: '血压', hr: '心率' }
  return map[type] || type
}

const contextLabel = (key: string) => {
  const map: Record<string, string> = {
    recentBP: '近期血压',
    recentHR: '近期心率',
    currentMeds: '当前用药',
    recoveryStage: '康复阶段',
    currentStage: '当前阶段',
    proposedChanges: '建议调整',
    surgeryDate: '手术日期',
    diagnosis: '诊断',
    proposedStage: '建议阶段',
    month: '报告月份',
    compliance: '依从率',
    exerciseCompletion: '运动完成率',
    avgBP: '平均血压',
  }
  return map[key] || key
}

const supportingDataLabel = (key: string) => {
  const map: Record<string, string> = {
    recentAvgHR: '近期平均心率',
    exerciseCompletionRate: '运动完成率',
    recentBPAvg: '近期平均血压',
    stableDays: '连续达标天数',
    compliance: '依从率',
  }
  return map[key] || key
}

const recoveryDataLabel = (key: string) => {
  const map: Record<string, string> = {
    compliance: '依从率',
    exerciseCompletion: '运动完成率',
    avgBP: '平均血压',
    avgHR: '平均心率',
    avgGlucose: '平均血糖',
    medicationAdherence: '用药依从性',
    sleepQuality: '睡眠质量',
    weightChange: '体重变化',
    sixMinWalkDistance: '6分钟步行',
    phq9Score: 'PHQ-9评分',
  }
  return map[key] || key
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const addOrderItem = (category: string) => {
  if (orders[category]) {
    orders[category].push({ title: '', content: '' })
  }
}

const removeOrderItem = (category: string, index: number) => {
  if (orders[category] && orders[category].length > 0) {
    orders[category].splice(index, 1)
  }
}

const autoResize = (e: Event) => {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

const initOrders = (dischargeOrders: any) => {
  if (!dischargeOrders) return
  const copy = (arr: any[]) => (arr || []).map((item: any) => ({ title: item.title || '', content: item.content || '' }))
  orders.medication = copy(dischargeOrders.medication)
  orders.exercise = copy(dischargeOrders.exercise)
  orders.monitoring = copy(dischargeOrders.monitoring)
  orders.diet = copy(dischargeOrders.diet)
  orders.followUp = copy(dischargeOrders.followUp)
}

const loadDetail = async () => {
  try {
    const res = await getReviewDetail(reviewId) as any
    detail.value = res
    if (res?.context?.dischargeOrders) {
      initOrders(res.context.dischargeOrders)
    }
    // 初始化 AI 建议
    if (res?.aiSuggestion) {
      suggestion.value = res.aiSuggestion
    }
    // 初始化周期报告内容
    if (res?.recoverySummary) {
      recoverySummary.value = res.recoverySummary
    }
    if (res?.nextCyclePlan) {
      nextCyclePlan.value = res.nextCyclePlan
    }
  } catch { /* ignore */ }
  loading.value = false
}

const handleSubmit = async (act: string) => {
  action.value = act
  submitting.value = true
  try {
    await submitReview(reviewId, { action: act, comment: comment.value })
    showToast('已下发')
    setTimeout(() => router.back(), 500)
  } catch {
    showToast('操作失败')
  }
  submitting.value = false
}

const handleReportSubmit = async () => {
  submitting.value = true
  try {
    const reportComment = `【康复总结】\n${recoverySummary.value}\n\n【下周期计划】\n${nextCyclePlan.value}`
    await submitReview(reviewId, { action: 'approve', comment: reportComment })
    showToast('已下发到患者端')
    setTimeout(() => router.back(), 500)
  } catch {
    showToast('操作失败')
  }
  submitting.value = false
}

const handleInterventionSubmit = async () => {
  if (!suggestion.value.trim()) {
    showToast('请填写建议内容')
    return
  }
  submitting.value = true
  try {
    await submitReviewIntervention(reviewId, {
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
.review-page {
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

/* 优先级色带 */
.priority-strip {
  height: 4px;
}
.priority-1 { background: linear-gradient(90deg, #FF4C61, #FF7A8A); }
.priority-2 { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
.priority-3 { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
.priority-4 { background: linear-gradient(90deg, #8A9AC3, #B4C0DC); }

/* ========== 高危预警干预布局 ========== */

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

/* 患者信息卡 */
.patient-card-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  margin: 12px 16px;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.patient-avatar-alert {
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
.patient-info-alert { flex: 1; }
.patient-name-row-alert {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
}
.name { font-size: 16px; font-weight: 800; color: #1A2238; }
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
.current-alert-display {
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
.big-value {
  font-size: 36px;
  font-weight: 800;
  color: #FF4C61;
  font-family: 'SF Mono', Monaco, monospace;
}
.big-unit {
  font-size: 14px;
  color: #8A9AC3;
}
.alert-time-text {
  font-size: 12px;
  color: #8A9AC3;
  margin-top: 6px;
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
  font-family: inherit;
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

/* 干预操作区 */
.action-area-intervention {
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
  border-radius: 24px;
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
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  color: #396CFF;
  text-decoration: none;
}

/* ========== 变更依据 ========== */
.change-basis-section {
  border-left: 3px solid #F59E0B;
}
.change-basis-icon {
  display: inline-flex;
  color: #F59E0B;
  margin-right: 4px;
  vertical-align: middle;
}
.change-basis-content {
  margin-top: 4px;
}
.trigger-desc {
  font-size: 13px;
  color: #1A2238;
  line-height: 1.6;
  margin: 0 0 12px;
}
.proposed-changes {
  margin-bottom: 12px;
}
.sub-title {
  font-size: 13px;
  font-weight: 600;
  color: #8A9AC3;
  margin: 0 0 8px;
}
.change-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #F2F5FA;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
  border-radius: 8px;
  margin-bottom: 6px;
}
.change-field {
  font-size: 13px;
  color: #1A2238;
  font-weight: 500;
}
.change-diff {
  display: flex;
  align-items: center;
  gap: 6px;
}
.change-from {
  font-size: 12px;
  color: #8A9AC3;
  text-decoration: line-through;
}
.change-arrow {
  font-size: 12px;
  color: #F59E0B;
}
.change-to {
  font-size: 13px;
  color: #059669;
  font-weight: 600;
}
.supporting-data {
  margin-top: 12px;
}
.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.data-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: #F2F5FA;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
  border-radius: 8px;
}
.data-label {
  font-size: 11px;
  color: #8A9AC3;
}
.data-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A2238;
}

/* ========== 通用布局 ========== */

/* 任务卡片 */
.task-card {
  margin: 12px 16px;
  background: white;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.type-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.type-high_risk_alert { background: rgba(255,76,97,0.1); color: #FF4C61; }
.type-plan_adjustment { background: rgba(245,158,11,0.1); color: #B45309; }
.type-initial_plan { background: rgba(57, 108, 255, 0.1); color: #396CFF; }
.type-monthly_report { background: rgba(138,154,195,0.1); color: #8A9AC3; }

.submit-time {
  font-size: 12px;
  color: #8A9AC3;
}
.task-title {
  font-size: 17px;
  font-weight: 800;
  color: #1A2238;
  margin: 0 0 6px;
}
.task-desc {
  font-size: 13px;
  color: #8A9AC3;
  margin: 0;
  line-height: 1.5;
}
.task-patient {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 13px;
}
.patient-label { color: #8A9AC3; }
.patient-name { font-weight: 600; color: #1A2238; }
.patient-detail { color: #8A9AC3; }

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
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title-row .section-title {
  margin: 0;
}
.edit-hint {
  font-size: 11px;
  color: #396CFF;
  font-weight: 500;
}

/* 患者信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-label {
  font-size: 11px;
  color: #8A9AC3;
}
.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A2238;
}
.health-history {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E8ECF4;
}
.history-text {
  font-size: 13px;
  color: #1A2238;
  margin: 4px 0 0;
  line-height: 1.5;
}

/* 出院诊断 */
.diag-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.diag-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.diag-row.full {
  flex-direction: column;
  gap: 4px;
}
.diag-label {
  font-size: 12px;
  color: #8A9AC3;
  flex-shrink: 0;
  min-width: 60px;
}
.diag-value {
  font-size: 13px;
  color: #1A2238;
  font-weight: 500;
  line-height: 1.5;
}

/* 出院医嘱 - 分组 */
.order-group {
  margin-bottom: 16px;
}
.order-group:last-child {
  margin-bottom: 0;
}
.order-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.order-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.order-icon svg {
  width: 16px;
  height: 16px;
}
.med-icon { background: rgba(255,76,97,0.1); color: #FF4C61; }
.exercise-icon { background: rgba(16,185,129,0.1); color: #059669; }
.monitor-icon { background: rgba(57, 108, 255, 0.1); color: #396CFF; }
.diet-icon { background: rgba(245,158,11,0.1); color: #B45309; }
.followup-icon { background: rgba(139,92,246,0.1); color: #7C3AED; }

.order-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A2238;
  flex: 1;
}
.add-btn {
  font-size: 12px;
  color: #396CFF;
  border: 1px dashed #396CFF;
  background: none;
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s;
}
.add-btn:active {
  background: rgba(125,189,232,0.1);
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.order-item {
  background: #F2F5FA;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid #E8ECF4;
  transition: border-color 0.2s;
}
.order-item:focus-within {
  border-color: #396CFF;
  background: #FAFBFF;
}
.order-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.order-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #1A2238;
  outline: none;
  resize: none;
  font-family: inherit;
  padding: 0;
}
.title-input {
  font-weight: 600;
  font-size: 14px;
}
.content-input {
  margin-top: 4px;
  color: #8A9AC3;
  line-height: 1.5;
  overflow: hidden;
}
.del-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #B4C0DC;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.del-btn:active {
  background: rgba(239,68,68,0.1);
  color: #FF4C61;
}

/* 上下文 */
.context-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.context-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.ctx-label {
  font-size: 13px;
  color: #8A9AC3;
  flex-shrink: 0;
}
.ctx-value {
  font-size: 13px;
  color: #1A2238;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

/* 预警列表 */
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.alert-type { font-size: 12px; color: #8A9AC3; flex-shrink: 0; }
.alert-val { font-size: 13px; font-weight: 600; color: #1A2238; flex: 1; }
.alert-time { font-size: 11px; color: #8A9AC3; }

/* 审核表单 */
.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E8ECF4;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #1A2238;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}
.comment-textarea:focus {
  border-color: #396CFF;
  box-shadow: 0 0 0 3px rgba(57, 108, 255, 0.15);
}

/* 操作区 */
.action-area {
  padding: 16px;
}
.approve-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
}
.approve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 已审核状态 */
.reviewed-banner {
  margin: 0 16px 12px;
  background: white;
  border-radius: 24px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.reviewed-status {
  display: inline-block;
  font-size: 14px;
  font-weight: 800;
  padding: 4px 16px;
  border-radius: 24px;
}
.reviewed-status.approved {
  background: rgba(16,185,129,0.1);
  color: #059669;
}
.reviewed-time {
  font-size: 12px;
  color: #8A9AC3;
  margin: 8px 0 0;
}
.reviewed-comment {
  font-size: 13px;
  color: #8A9AC3;
  margin: 6px 0 0;
  line-height: 1.5;
}

/* ========== 周期报告样式 ========== */
.cycle-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.cycle-badge {
  font-size: 12px;
  font-weight: 800;
  color: #396CFF;
  background: rgba(57, 108, 255, 0.1);
  padding: 3px 10px;
  border-radius: 6px;
}
.cycle-range {
  font-size: 12px;
  color: #8A9AC3;
}

/* 康复数据网格 */
.recovery-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.recovery-item {
  background: #F2F5FA;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.recovery-label {
  font-size: 11px;
  color: #8A9AC3;
  font-weight: 500;
}
.recovery-value {
  font-size: 15px;
  font-weight: 800;
  color: #1A2238;
}

/* AI 可编辑区域 */
.ai-badge {
  font-size: 10px;
  color: #396CFF;
  background: rgba(57, 108, 255, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.ai-textarea {
  width: 100%;
  border: 1px solid #E8ECF4;
  border-radius: 12px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: #1A2238;
  background: #fafbfc;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.ai-textarea:focus {
  border-color: #396CFF;
  background: white;
}
</style>
