<template>
  <div class="nav-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <van-loading type="spinner" size="36" color="#8A7BFE" />
    </div>

    <template v-else>
      <!-- ========== 顶部导航栏 ========== -->
      <div class="nav-bar">
        <button class="nav-btn" @click="router.push('/p/settings')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
        <span class="nav-title">健康领航</span>
        <button class="nav-btn nav-btn--bell" @click="handleBellClick">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span v-if="hasUnread" class="bell-badge"></span>
        </button>
      </div>

      <!-- 悬浮计划变更气泡 -->
      <div
        v-if="showReviewBubble && reviewBubbleText"
        class="review-bubble"
        @click="handleReviewBubbleClick"
      >
        <span class="review-bubble-icon">{{ homeData?.reviewStatus?.status === 'reviewing' ? '⏳' : '✅' }}</span>
        <span class="review-bubble-text">{{ reviewBubbleText }}</span>
        <button class="review-bubble-close" @click.stop="showReviewBubble = false">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- ========== 顶部：身份与风控雷达 ========== -->
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-top">
            <div class="hero-user">
              <div class="hero-info">
                <div class="hero-name-row">
                  <span class="hero-name">{{ currentName }}</span>
                  <span v-if="selectedMemberRelation" class="hero-role-tag">{{ selectedMemberRelation }}</span>
                  <span class="hero-meta">{{ genderLabel }} {{ homeData?.patient?.age || '' }}岁</span>
                </div>
                <div class="hero-sub-row">
                  <span class="hero-day">康复第 {{ recoveryDays }} 天</span>
                  <div class="hero-progress-bar">
                    <div class="hero-progress-fill" :style="{ width: stageProgressPct + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 无预警：普通切换按钮 -->
            <button v-if="alertedMembers.length === 0" class="family-safe-btn" @click="showMemberPicker = true">
              👥 切换成员 ⌄
            </button>
            <!-- 有预警：头像组 + 切换入口 -->
            <div v-else class="family-avatar-group">
              <div
                v-for="am in alertedMembers"
                :key="am.patientId"
                class="fag-avatar"
                :class="{
                  'fag-avatar--danger': !am.isHandled,
                  'fag-avatar--handled': am.isHandled && !am.hasReply,
                  'fag-avatar--replied': am.hasReply,
                }"
                @click="handleAlertSwitch(am)"
              >
                <span class="fag-initial">{{ am.name?.charAt(0) || '?' }}</span>
                <span v-if="!am.isHandled" class="fag-badge"></span>
                <span v-else-if="am.hasReply" class="fag-badge fag-badge--replied">✓</span>
              </div>
              <button class="fag-switch" @click="showMemberPicker = true">
                切换 ⌄
              </button>
            </div>
          </div>

          <!-- 生命资产铭牌 -->
          <div class="asset-bar">
            <div class="asset-col" @click="router.push('/p/life-asset')">
              <div class="asset-icon asset-icon--shield">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#aG1)" stroke="rgba(212,165,32,0.3)" stroke-width="0.8" />
                  <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <defs><linearGradient id="aG1" x1="4" y1="2" x2="20" y2="22"><stop offset="0%" stop-color="#D4A520" /><stop offset="100%" stop-color="#B8941A" /></linearGradient></defs>
                </svg>
              </div>
              <div class="asset-text">
                <span class="asset-desc">健康时光</span>
                <span class="asset-num">+{{ heartLifeYears }} <small>年</small></span>
              </div>
            </div>
            <div class="asset-divider"></div>
            <div class="asset-col" @click="router.push('/p/health-rank')">
              <div class="asset-icon asset-icon--star">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#aG2)" stroke="rgba(212,165,32,0.3)" stroke-width="0.8" />
                  <defs><linearGradient id="aG2" x1="2" y1="2" x2="22" y2="22"><stop offset="0%" stop-color="#D4A520" /><stop offset="100%" stop-color="#B8941A" /></linearGradient></defs>
                </svg>
              </div>
              <div class="asset-text">
                <span class="asset-desc">健康状态超越</span>
                <span class="asset-num">{{ healthPercentile }}% <small>同龄人</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 呦呦今日洞察 ========== -->
      <div class="section insight-section">
        <div class="insight-card">
          <div class="insight-header">
            <div class="insight-avatar">
              <img src="/images/logo.png" alt="呦呦" class="insight-logo" />
            </div>
            <span class="insight-label">呦呦今日洞察</span>
            <div class="insight-sparkle">✨</div>
          </div>
          <div class="insight-text">{{ insightText }}</div>
        </div>
      </div>

      <!-- ========== 家属防诈预警 ========== -->
      <Transition name="fraud-alert-slide">
        <div v-if="showFraudAlert" class="section fraud-alert-section">
          <div class="fraud-alert-card">
            <button class="fraud-alert-close" @click="dismissFraudAlert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div class="fraud-alert-header">
              <div class="fraud-alert-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div class="fraud-alert-title-group">
                <div class="fraud-alert-title-row">
                  <span class="fraud-alert-title">家属上当预警</span>
                  <span class="fraud-alert-blink-tag">紧急</span>
                </div>
                <span class="fraud-alert-time">{{ fraudAlertTime }}</span>
              </div>
            </div>
            <div class="fraud-alert-body">
              检测到爸爸手机在近30分钟内向陌生账户发起转账操作，对方账户涉嫌电信诈骗（已被公安机关标记），请立即联系家人核实并阻止转账！
            </div>
            <div class="fraud-alert-actions">
              <a class="fraud-alert-btn fraud-alert-btn--family" href="tel:13700137001" @click.stop>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                一键联系家属
              </a>
              <a class="fraud-alert-btn fraud-alert-btn--police" href="tel:110" @click.stop>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                一键报警
              </a>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ========== 健康巡航 ========== -->
      <div class="section cruise-section">
        <div class="section-header">
          <span class="section-title">健康巡航</span>
          <button class="section-link" @click="router.push('/p/health-monitor')">
            查看监测记录
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div class="vitals-grid">
          <!-- Heart Rate -->
          <div class="vital-card" :class="{ 'vital-card--warn': hrStatus === 'abnormal' }" @click="openVitalDetail('heartRate')">
            <div class="vital-top">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              <span class="vital-name">心率</span>
              <span class="vital-time">10:30</span>
            </div>
            <div class="vital-value-row">
              <span class="vital-big">{{ vitals.heartRate?.value ?? '--' }}</span>
              <span class="vital-unit">bpm</span>
              <span class="vital-risk-tag" :class="'vital-risk-tag--' + hrRiskTag.level">{{ hrRiskTag.text }}</span>
            </div>
          </div>

          <!-- Blood Pressure -->
          <div class="vital-card" :class="{ 'vital-card--warn': bpStatus === 'abnormal' }" @click="openVitalDetail('bloodPressure')">
            <div class="vital-top">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span class="vital-name">血压</span>
              <span class="vital-time">10:30</span>
            </div>
            <div class="vital-value-row">
              <span class="vital-big">{{ vitals.bloodPressure?.value ?? '--' }}</span>
              <span class="vital-unit">mmHg</span>
              <span class="vital-risk-tag" :class="'vital-risk-tag--' + bpRiskTag.level">{{ bpRiskTag.text }}</span>
            </div>
          </div>

          <!-- Blood Sugar -->
          <div class="vital-card" @click="openVitalDetail('bloodSugar')">
            <div class="vital-top">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5">
                <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
              </svg>
              <span class="vital-name">血糖</span>
              <span class="vital-time">08:00</span>
            </div>
            <div class="vital-value-row">
              <span class="vital-big">{{ bloodSugar }}</span>
              <span class="vital-unit">mmol/L</span>
              <span class="vital-risk-tag" :class="'vital-risk-tag--' + bsRiskTag.level">{{ bsRiskTag.text }}</span>
            </div>
          </div>

          <!-- Blood Oxygen -->
          <div class="vital-card" @click="openVitalDetail('bloodOxygen')">
            <div class="vital-top">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l2 1" />
              </svg>
              <span class="vital-name">血氧</span>
              <span class="vital-time">昨日</span>
            </div>
            <div class="vital-value-row">
              <span class="vital-big">{{ bloodOxygen }}</span>
              <span class="vital-unit">%</span>
              <span class="vital-risk-tag" :class="'vital-risk-tag--' + boRiskTag.level">{{ boRiskTag.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== 今日护航任务 ========== -->
      <div class="section timeline-section">
        <div class="section-header">
          <span class="section-title">今日护航任务</span>
          <button class="section-link" @click="router.push('/p/recovery-plan')">
            查看更多计划
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div class="timeline">
          <div
            v-for="(t, i) in timelineTasks"
            :key="i"
            class="tl-item"
            :class="'tl-item--' + t.state"
          >
            <!-- Timeline line -->
            <div class="tl-rail">
              <div class="tl-dot-wrap">
                <svg v-if="t.state === 'done'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <svg v-else-if="t.state === 'current'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                  <circle cx="12" cy="12" r="4" />
                </svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div v-if="i < timelineTasks.length - 1" class="tl-line" :class="{ 'tl-line--done': t.state === 'done' }"></div>
            </div>

            <!-- Content -->
            <div class="tl-content">
              <div class="tl-time">{{ t.time }}</div>
              <div class="tl-card" :class="{ 'tl-card--highlight': t.state === 'current', 'tl-card--overdue': t.state === 'overdue' }">
                <span class="tl-emoji">{{ t.icon }}</span>
                <div class="tl-info">
                  <div class="tl-name-row">
                    <span class="tl-name">{{ t.name }}</span>
                    <span v-if="t.state === 'overdue'" class="tl-overdue-tag">🔴 已超时</span>
                  </div>
                  <span class="tl-sub">{{ t.sub }}</span>
                </div>
                <button
                  v-if="t.state === 'done'"
                  class="tl-status-done"
                  disabled
                >
                  已完成
                </button>
                <button
                  v-else-if="selectedMemberId && (t.state === 'current' || t.state === 'overdue')"
                  class="tl-remind-btn"
                  @click="openRemindPopup(t)"
                >
                  提醒TA
                </button>
                <button
                  v-else-if="t.state === 'current' || t.state === 'overdue'"
                  class="tl-action-btn"
                  :class="{ 'tl-action-btn--overdue': t.state === 'overdue' }"
                  @click="handleTaskAction(t)"
                >
                  {{ t.action }}
                </button>
                <span v-else class="tl-status-done" style="color: #94a3b8;">待完成</span>
              </div>
              <!-- AI 总结气泡（已完成任务） -->
              <div v-if="t.state === 'done' && t.aiSummary" class="tl-ai-bubble">
                <span class="tl-ai-icon">✨</span>
                <span class="tl-ai-text">{{ t.aiSummary }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="safe-bottom"></div>
    </template>

    <!-- ========== Member Picker Popup ========== -->
    <van-popup v-model:show="showMemberPicker" position="bottom" round :style="{ maxHeight: '75%' }">
      <div class="member-popup">
        <div class="member-popup-title">切换家庭成员</div>
        <div
          class="member-item"
          :class="{ 'member-item--active': !selectedMemberId }"
          @click="selectSelf"
        >
          <div class="mi-avatar mi-avatar--self">{{ store.profile?.name?.charAt(0) || '?' }}</div>
          <div class="mi-info">
            <div class="mi-name-row">
              <span class="mi-name">{{ store.profile?.name || '--' }}</span>
              <span class="mi-tag mi-tag--self">本人</span>
            </div>
            <span class="mi-stage">{{ currentStageName }}</span>
          </div>
          <svg v-if="!selectedMemberId" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div
          v-for="m in familyMembers"
          :key="m.patientId"
          class="member-item"
          :class="{ 'member-item--active': selectedMemberId === m.patientId }"
          @click="selectMember(m)"
        >
          <div class="mi-avatar" :class="{ 'mi-avatar--alert': isMemberAlerted(m) }">{{ m.name?.charAt(0) || '?' }}</div>
          <div class="mi-info">
            <div class="mi-name-row">
              <span class="mi-name">{{ m.name }}</span>
              <span class="mi-tag">{{ m.relationship }}</span>
              <span v-if="isMemberAlerted(m)" class="mi-alert-tag" :class="getMemberAlertClass(m)">{{ getMemberAlertLabel(m) }}</span>
            </div>
            <span class="mi-stage">{{ m.recoveryStage?.label || '暂无康复计划' }}</span>
            <div class="mi-vitals">
              <span>心率 {{ m.vitals?.heartRate?.value ?? '--' }}</span>
              <span>·</span>
              <span>血压 {{ m.vitals?.bloodPressure?.value ?? '--' }}</span>
              <span>·</span>
              <span>任务 {{ m.taskProgress?.completed || 0 }}/{{ m.taskProgress?.total || 0 }}</span>
            </div>
            <div class="mi-detail-link" @click.stop="router.push(`/p/member/${m.patientId}`); showMemberPicker = false">查看详情 ></div>
          </div>
          <svg v-if="selectedMemberId === m.patientId" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
    </van-popup>

    <!-- ========== 指标详情弹窗 ========== -->
    <van-popup v-model:show="showVitalDetail" position="bottom" round :style="{ maxHeight: '70%' }">
      <div class="vital-detail-popup">
        <div class="vd-header">
          <span class="vd-title">{{ activeVitalLabel }} · 近7日趋势</span>
          <button class="vd-close" @click="showVitalDetail = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <van-loading v-if="vitalDetailLoading" type="spinner" size="28" color="#8A7BFE" class="vd-loading" />
        <template v-else-if="vitalHistoryData">
          <div class="vd-ai-card">
            <span class="vd-ai-icon">✨</span>
            <span class="vd-ai-text">{{ vitalHistoryData.aiSummary }}</span>
          </div>
          <div class="vd-list">
            <template v-for="(r, i) in vitalHistoryData.records" :key="i">
              <div v-if="i === 0 || r.date !== vitalHistoryData.records[i - 1].date" class="vd-date">{{ r.date }}</div>
              <div class="vd-record-row">
                <span class="vd-time">{{ r.time }}</span>
                <span class="vd-val">{{ r.value }} <small>{{ r.unit }}</small></span>
                <span class="vd-tag" :class="'vd-tag--' + r.riskLevel">{{ r.riskTag }}</span>
              </div>
            </template>
          </div>
        </template>
      </div>
    </van-popup>

    <!-- ========== 提醒方式弹窗（重点关注家属时） ========== -->
    <van-popup v-model:show="showRemindPicker" position="bottom" round :style="{ maxHeight: '50%' }">
      <div class="remind-popup">
        <div class="remind-popup-title">选择提醒方式</div>
        <div class="remind-popup-desc">提醒 {{ currentName }} 完成「{{ remindTaskName }}」</div>
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
        <div v-if="remindSending" class="remind-result-sending">
          <van-loading type="spinner" size="28" :color="remindMethod === 'wechat' ? '#07c160' : '#8A7BFE'" />
          <span class="remind-sending-text">正在发送提醒...</span>
        </div>
        <div v-else class="remind-result-success">
          <div class="remind-check" :class="'remind-check--' + remindMethod">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div class="remind-success-title">提醒已送达</div>
        </div>
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
              <span class="rmc-val">{{ remindTaskName }}</span>
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

    <!-- ========== 全屏预警覆盖层 ========== -->
    <Transition name="alert-overlay">
      <div v-if="showFullAlert" class="full-alert-overlay" :class="{ 'full-alert--collapsing': alertCollapsing }" @click="dismissFullAlert">
        <!-- 脉冲涟漪背景 -->
        <div class="fa-pulse fa-pulse--1"></div>
        <div class="fa-pulse fa-pulse--2"></div>
        <div class="fa-pulse fa-pulse--3"></div>
        <!-- 中央内容 -->
        <div class="fa-content" :class="{ 'fa-content--collapsing': alertCollapsing }">
          <div class="fa-icon-ring">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div class="fa-title">家人健康预警</div>
          <div class="fa-detail">{{ fullAlertText }}</div>
          <div class="fa-hint">点击任意处关闭</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getPatientHome, getFamilyMembers, checkInTask, getPatientProfile, getVitalHistory, getNotifications, getMemberDetail } from '@/api/patient'
import { usePatientStore } from '@/stores/patient'

const router = useRouter()
const store = usePatientStore()
const loading = ref(true)
const homeData = ref<any>(null)
const familyMembers = ref<any[]>([])
const showMemberPicker = ref(false)
const selectedMemberId = ref<number | null>(null)
const selectedMemberRelation = ref<string | null>(null)
const selfHomeData = ref<any>(null)

// Notification bell
const hasUnread = ref(false)
const notificationData = ref<any>(null)

// Review bubble
const showReviewBubble = ref(false)

// 全屏预警
const showFullAlert = ref(false)
const alertCollapsing = ref(false)
const fullAlertText = ref('')

// 防诈预警
const showFraudAlert = ref(false)
const fraudAlertTime = ref('')

function checkFraudAlertDismissed(): boolean {
  try {
    const raw = localStorage.getItem('fraud_alert_dismissed')
    if (!raw) return false
    const ts = JSON.parse(raw)
    // 24小时过期
    if (Date.now() - ts > 24 * 3600 * 1000) {
      localStorage.removeItem('fraud_alert_dismissed')
      return false
    }
    return true
  } catch {
    return false
  }
}

function dismissFraudAlert() {
  showFraudAlert.value = false
  localStorage.setItem('fraud_alert_dismissed', JSON.stringify(Date.now()))
}

function initFraudAlert() {
  if (checkFraudAlertDismissed()) return
  const now = new Date()
  fraudAlertTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  showFraudAlert.value = true
  playAlertSound()
}

function triggerFullAlert(text: string) {
  fullAlertText.value = text
  showFullAlert.value = true
  alertCollapsing.value = false
  // 2s 后开始收起动画
  setTimeout(() => {
    alertCollapsing.value = true
  }, 2000)
  // 3s 后完全关闭
  setTimeout(() => {
    showFullAlert.value = false
    alertCollapsing.value = false
  }, 3000)
}

function dismissFullAlert() {
  alertCollapsing.value = true
  setTimeout(() => {
    showFullAlert.value = false
    alertCollapsing.value = false
  }, 600)
}

const reviewBubbleText = computed(() => {
  const status = homeData.value?.reviewStatus?.status
  if (status === 'reviewing') return '康复计划变更审核中'
  if (status === 'approved') return '计划变更已通过，点击查看'
  return ''
})

const handleBellClick = () => {
  const hasReview = notificationData.value?.items?.some((n: any) => n.type === 'plan_review')
  if (hasReview) {
    router.push('/p/recovery-plan')
  } else {
    showToast('暂无新消息')
  }
}

const handleReviewBubbleClick = () => {
  router.push('/p/recovery-plan')
}

// 检查某个家人的预警是否已被处理（localStorage 持久化）
function getAlertHandledState(patientId: number, latestAlertTime?: string): { handled: boolean; type?: string; hasReply?: boolean } {
  try {
    const raw = localStorage.getItem(`alert_state_${patientId}`)
    if (!raw) return { handled: false }
    const state = JSON.parse(raw)
    // 超过24小时过期
    if (Date.now() - state.savedAt > 24 * 3600 * 1000) {
      localStorage.removeItem(`alert_state_${patientId}`)
      return { handled: false }
    }
    // 如果有比处理时间更新的预警，视为未处理
    if (latestAlertTime && new Date(latestAlertTime).getTime() > state.savedAt) {
      localStorage.removeItem(`alert_state_${patientId}`)
      return { handled: false }
    }
    return { handled: true, type: state.type, hasReply: !!state.hasReply }
  } catch {
    return { handled: false }
  }
}

// 提示音：使用 Web Audio API 生成急促求救声调
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const t = ctx.currentTime

    const playTone = (freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'square') => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(vol, t + start)
      gain.gain.setValueAtTime(vol, t + start + dur * 0.6)
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t + start)
      osc.stop(t + start + dur)
    }

    // 急促双音交替（类救护车 hi-lo siren）× 3 轮
    // 高音 → 低音 → 高音 → 低音 → 高音 → 低音，节奏越来越快
    playTone(1400, 0,    0.12, 0.35, 'square')
    playTone(900,  0.12, 0.12, 0.3,  'square')
    playTone(1400, 0.24, 0.10, 0.38, 'square')
    playTone(900,  0.34, 0.10, 0.32, 'square')
    playTone(1400, 0.44, 0.08, 0.4,  'square')
    playTone(900,  0.52, 0.08, 0.35, 'square')
    // 尾音：高频长衰减
    playTone(1600, 0.62, 0.25, 0.3, 'sawtooth')

    setTimeout(() => ctx.close(), 1500)
  } catch {
    // Audio not supported
  }
}

const stages = [
  { short: 'I期', name: 'I期（术后早期）', label: 'I期：术后早期康复' },
  { short: 'II期', name: 'II期（院外早期）', label: 'II期：院外早期康复 (1-3个月)' },
  { short: 'III期', name: 'III期（规律康复）', label: 'III期：规律康复 (3-6个月)' },
  { short: 'IV期', name: 'IV期（长期维持）', label: 'IV期：长期维持' },
]

onMounted(async () => {
  try {
    const profile = await getPatientProfile() as any
    store.setProfile(profile)
    const [home, members] = await Promise.all([
      getPatientHome() as any,
      getFamilyMembers() as any,
    ])
    homeData.value = home
    selfHomeData.value = home
    familyMembers.value = members
    // 如果有重点关注的家属，默认选中并加载其数据
    if (store.focusMemberId) {
      selectedMemberId.value = store.focusMemberId
      await loadMemberData(store.focusMemberId)
    }
    // 检测家人异常 → 全屏预警 + 播放提示音（仅在未处置时触发）
    const unhandledAlerts = members.filter((m: any) => {
      const v = m.vitals || {}
      const hasAlert = v.heartRate?.status === 'abnormal' || v.bloodPressure?.status === 'abnormal' || (m.alerts && m.alerts.length > 0)
      return hasAlert && !getAlertHandledState(m.patientId, m.latestAlertTime).handled
    })
    if (unhandledAlerts.length > 0) {
      const texts = unhandledAlerts.map((m: any) => {
        const v = m.vitals || {}
        if (v.bloodPressure?.status === 'abnormal')
          return `${m.relationship}${m.name}血压异常（${v.bloodPressure.value}mmHg）`
        if (v.heartRate?.status === 'abnormal')
          return `${m.relationship}${m.name}心率异常（${v.heartRate.value}bpm）`
        return `${m.relationship}${m.name}健康指标异常`
      })
      triggerFullAlert(texts.join('；') + '，请立即关注！')
      playAlertSound()
    }
    // Load notifications
    try {
      const notifs = await getNotifications() as any
      notificationData.value = notifs
      hasUnread.value = (notifs?.unreadCount || 0) > 0
    } catch { /* optional */ }
    // Show review bubble
    if (home?.reviewStatus) {
      showReviewBubble.value = true
      setTimeout(() => { showReviewBubble.value = false }, 8000)
    }
    // 防诈预警检测
    initFraudAlert()
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
})

const currentName = computed(() => homeData.value?.patient?.name || store.profile?.name || '--')

// 检测家庭成员是否有预警 — 返回所有预警成员
const alertedMembers = computed(() => {
  const result: any[] = []
  for (const m of familyMembers.value) {
    const v = m.vitals || {}
    const hasAlert = v.heartRate?.status === 'abnormal' || v.bloodPressure?.status === 'abnormal' || (m.alerts && m.alerts.length > 0)
    if (!hasAlert) continue
    const handled = getAlertHandledState(m.patientId, m.latestAlertTime)
    const alertText = handled.handled
      ? (handled.type === 'waiting_doctor'
        ? (handled.hasReply ? '医生已回复' : '已联系医生')
        : '预警已处理')
      : v.heartRate?.status === 'abnormal' ? '心率异常'
      : v.bloodPressure?.status === 'abnormal' ? '血压异常'
      : (m.alerts?.[0]?.message || '健康异常')
    result.push({ ...m, alertText, isHandled: handled.handled, handledType: handled.type, hasReply: handled.hasReply })
  }
  return result
})

// 成员选择器中的预警状态
function isMemberAlerted(m: any) {
  const v = m.vitals || {}
  return v.heartRate?.status === 'abnormal' || v.bloodPressure?.status === 'abnormal' || (m.alerts && m.alerts.length > 0)
}

function getMemberAlertLabel(m: any) {
  if (!isMemberAlerted(m)) return ''
  const handled = getAlertHandledState(m.patientId, m.latestAlertTime)
  if (handled.handled) {
    if (handled.type === 'waiting_doctor') return handled.hasReply ? '已回复' : '待回复'
    return '已处理'
  }
  return '预警'
}

function getMemberAlertClass(m: any) {
  const handled = getAlertHandledState(m.patientId, m.latestAlertTime)
  if (handled.handled) {
    if (handled.hasReply) return 'mi-alert-tag--replied'
    if (handled.type === 'waiting_doctor') return 'mi-alert-tag--waiting'
    return 'mi-alert-tag--handled'
  }
  return 'mi-alert-tag--danger'
}

const handleAlertSwitch = (member: any) => {
  router.push(`/p/member/${member.patientId}`)
}

const genderLabel = computed(() => {
  const g = homeData.value?.patient?.gender
  if (g === 'M' || g === 'male') return '男'
  if (g === 'F' || g === 'female') return '女'
  return ''
})

// Recovery
const recoveryDays = computed(() => {
  const sd = homeData.value?.recoveryStage?.surgeryDate
  if (!sd) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(sd).getTime()) / 86400000))
})

const currentStageIndex = computed(() => {
  const s = homeData.value?.recoveryStage?.stage
  const map: Record<string, number> = { I: 0, II: 1, III: 2, IV: 3 }
  return map[s] ?? 0
})

const currentStageName = computed(() => stages[currentStageIndex.value]?.name || '康复中')

const currentStageLabel = computed(() => stages[currentStageIndex.value]?.label || '康复进行中')

const stageShortLabel = computed(() => {
  const s = stages[currentStageIndex.value]
  return s ? `${s.short}：${s.name.replace(/.*（/, '').replace('）', '')}` : '康复中'
})

const stageProgressPct = computed(() => {
  const base = currentStageIndex.value * 25
  const days = recoveryDays.value
  const inStage = Math.min(25, Math.floor(days % 30 / 30 * 25))
  return Math.min(100, base + inStage + 5)
})

// Health assets
const heartLifeYears = computed(() => {
  const days = recoveryDays.value
  return Math.min(5, (days * 0.04 + 0.5)).toFixed(1)
})

const healthPercentile = computed(() => {
  const days = recoveryDays.value
  return Math.min(95, Math.floor(50 + days * 0.5))
})

// Vitals
const vitals = computed(() => homeData.value?.vitals || {})

const hrStatus = computed(() => vitals.value.heartRate?.status || 'normal')
const bpStatus = computed(() => vitals.value.bloodPressure?.status || 'normal')

const bloodSugar = computed(() => {
  const pid = homeData.value?.patient?.id
  if (!pid) return '--'
  return (4.5 + (pid * 3 % 30) / 10).toFixed(1)
})

const bloodOxygen = computed(() => {
  const pid = homeData.value?.patient?.id
  if (!pid) return '--'
  return 96 + (pid * 7 % 3)
})

// Risk tags
const hrRiskTag = computed(() => {
  const v = vitals.value.heartRate?.value
  if (!v) return { text: '--', level: 'normal' }
  if (v > 100) return { text: '偏高', level: 'high' }
  if (v < 60) return { text: '偏低', level: 'low' }
  return { text: '正常', level: 'normal' }
})

const bpRiskTag = computed(() => {
  const v = vitals.value.bloodPressure?.value
  if (!v) return { text: '--', level: 'normal' }
  const systolic = parseInt(String(v).split('/')[0])
  if (systolic > 140) return { text: '偏高', level: 'high' }
  return { text: '正常', level: 'normal' }
})

const bsRiskTag = computed(() => {
  const v = parseFloat(String(bloodSugar.value))
  if (isNaN(v)) return { text: '--', level: 'normal' }
  if (v > 6.1) return { text: '偏高', level: 'high' }
  if (v < 3.9) return { text: '偏低', level: 'low' }
  return { text: '正常', level: 'normal' }
})

const boRiskTag = computed(() => {
  const v = typeof bloodOxygen.value === 'number' ? bloodOxygen.value : parseInt(String(bloodOxygen.value))
  if (isNaN(v)) return { text: '--', level: 'normal' }
  if (v < 95) return { text: '偏低', level: 'low' }
  return { text: '正常', level: 'normal' }
})

// Vital detail popup
const showVitalDetail = ref(false)
const activeVitalType = ref('')
const activeVitalLabel = ref('')
const vitalHistoryData = ref<any>(null)
const vitalDetailLoading = ref(false)

const openVitalDetail = async (type: string) => {
  const labels: Record<string, string> = { heartRate: '心率', bloodPressure: '血压', bloodSugar: '血糖', bloodOxygen: '血氧' }
  activeVitalType.value = type
  activeVitalLabel.value = labels[type] || type
  showVitalDetail.value = true
  vitalDetailLoading.value = true
  vitalHistoryData.value = null
  try {
    vitalHistoryData.value = await getVitalHistory(type) as any
  } catch { /* handled by interceptor */ }
  finally { vitalDetailLoading.value = false }
}

// AI insight
const insightText = computed(() => {
  const name = currentName.value
  const bp = vitals.value.bloodPressure?.value || '127/82'
  const hr = vitals.value.heartRate?.value || 75
  return `${name}早上好！您昨晚深度睡眠达标，早晨血压(${bp})平稳，心率${hr}bpm正常。今天下午的【心肺跟练】已准备就绪，继续保持！`
})

// Timeline tasks
const timelineTasks = computed(() => {
  const tasks = homeData.value?.tasks || []
  const findTask = (type: string) => tasks.find((t: any) => t.taskType === type)

  const monitoringDone = findTask('monitoring')?.status === 'completed'
  const exerciseDone = findTask('exercise')?.status === 'completed'
  const medicationDone = findTask('medication')?.status === 'completed'

  // Determine first incomplete task
  const nowHour = new Date().getHours()

  const items = [
    {
      key: 'monitoring',
      time: '08:00',
      icon: '📊',
      name: '录入监测指标',
      sub: monitoringDone ? '血压/心率已录' : '血压、心率、血糖',
      action: '去录入',
      state: monitoringDone ? 'done' : 'current',
      taskId: findTask('monitoring')?.id,
      scheduledHour: 8,
      aiSummary: monitoringDone ? 'AI分析：血压趋势平稳，心率在靶区内' : '',
    },
    {
      key: 'diet',
      time: '10:30',
      icon: '📷',
      name: '拍照饮食记录',
      sub: '今日三餐',
      action: '去记录',
      state: 'pending' as string,
      taskId: null as number | null,
      scheduledHour: 10,
      aiSummary: '',
    },
    {
      key: 'exercise',
      time: '15:00',
      icon: '🎬',
      name: '康复视频跟练',
      sub: exerciseDone ? '已完成跟练' : '靶心率100-110',
      action: '去跟练',
      state: exerciseDone ? 'done' : 'pending',
      taskId: findTask('exercise')?.id,
      scheduledHour: 15,
      aiSummary: exerciseDone ? 'AI分析：膳食纤维充足，运动量达标' : '',
    },
    {
      key: 'medication',
      time: '20:00',
      icon: '💊',
      name: '晚间用药确认',
      sub: medicationDone ? '已完成用药' : '阿司匹林等',
      action: '去打卡',
      state: medicationDone ? 'done' : 'pending',
      taskId: findTask('medication')?.id,
      scheduledHour: 20,
      aiSummary: medicationDone ? 'AI分析：用药时间规律，依从性良好' : '',
    },
  ]

  // Each task is independently actionable based on time
  for (const item of items) {
    if (item.state === 'done') continue
    if (nowHour > item.scheduledHour + 2) {
      item.state = 'overdue'
    } else {
      item.state = 'current'
    }
  }

  return items
})

const handleTaskAction = async (task: any) => {
  if (task.key === 'exercise') {
    router.push('/p/training')
    return
  }
  if (task.taskId) {
    await checkInTask(task.taskId)
    showToast('打卡成功')
    const home = await getPatientHome() as any
    selfHomeData.value = home
    // 如果当前不是重点关注家属模式，直接刷新
    if (!selectedMemberId.value) {
      homeData.value = home
    }
  } else {
    showToast('功能开发中')
  }
}

async function loadMemberData(patientId: number) {
  try {
    const detail = await getMemberDetail(patientId) as any
    if (detail) {
      selectedMemberRelation.value = detail.relationship || '家属'
      homeData.value = {
        patient: detail.patient,
        recoveryStage: detail.recoveryStage,
        vitals: detail.vitals,
        alertLevel: detail.alertLevel,
        alerts: detail.alerts,
        tasks: detail.tasks,
        completedCount: detail.tasks?.filter((t: any) => t.status === 'completed').length || 0,
        totalCount: detail.tasks?.length || 0,
        reviewStatus: null,
      }
    }
  } catch { /* silent */ }
}

const selectSelf = () => {
  selectedMemberId.value = null
  selectedMemberRelation.value = null
  homeData.value = selfHomeData.value
  showMemberPicker.value = false
}

const selectMember = (m: any) => {
  showMemberPicker.value = false
  router.push(`/p/member/${m.patientId}`)
}

// Remind popup (重点关注家属时)
const showRemindPicker = ref(false)
const remindTaskName = ref('')

function openRemindPopup(task: any) {
  remindTaskName.value = task.name
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
</script>

<style scoped>
.nav-page {
  min-height: 100vh;
  background: #F8F9FA;
}

.safe-bottom { height: 20px; }

/* ========== Loading ========== */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

/* ========== Nav Bar ========== */
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

/* ========== Hero Section ========== */
.hero-section {
  background: linear-gradient(160deg, #FAFAFC 0%, #F3F1FB 50%, #EBE8F4 100%);
}

.hero-content {
  padding: 16px 16px 14px;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-user {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.hero-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hero-name {
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
}

.hero-meta {
  font-size: 13px;
  color: #64748b;
}

/* 进度子行 */
.hero-sub-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-day {
  font-size: 12px;
  font-weight: 600;
  color: #8A7BFE;
  white-space: nowrap;
}

.hero-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(138, 123, 254, 0.12);
  border-radius: 2px;
  min-width: 40px;
  overflow: hidden;
}

.hero-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8A7BFE, #A89AFE);
  border-radius: 2px;
  transition: width 0.8s ease;
}

/* 场景A：全家平安 */
.family-safe-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.6);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
  white-space: nowrap;
}

.family-safe-btn:active { background: rgba(255, 255, 255, 0.9); }

/* ========== 家人预警头像组 ========== */
.family-avatar-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.fag-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
  transition: transform 0.15s;
}

.fag-avatar:active { transform: scale(0.9); }

/* 未处理 — 红色脉冲 */
.fag-avatar--danger {
  background: #fef2f2;
  border: 2px solid #ef4444;
  animation: fag-pulse 2s ease-in-out infinite;
}

.fag-avatar--danger .fag-initial {
  color: #dc2626;
  font-size: 14px;
  font-weight: 700;
}

@keyframes fag-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.35); }
  50% { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
}

/* 已处理（待回复） — 橙色静态 */
.fag-avatar--handled {
  background: #fff7ed;
  border: 2px solid #ea580c;
}

.fag-avatar--handled .fag-initial {
  color: #ea580c;
  font-size: 14px;
  font-weight: 700;
}

/* 已回复 — 绿色静态 */
.fag-avatar--replied {
  background: #f0fdf4;
  border: 2px solid #10b981;
}

.fag-avatar--replied .fag-initial {
  color: #059669;
  font-size: 14px;
  font-weight: 700;
}

.fag-initial {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  line-height: 1;
}

/* 右上角红点 */
.fag-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ef4444;
  border: 2px solid white;
  animation: fag-dot-blink 1s ease-in-out infinite;
}

@keyframes fag-dot-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 已回复绿色勾 */
.fag-badge--replied {
  background: #10b981;
  animation: none;
  font-size: 6px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}

/* 切换按钮 */
.fag-switch {
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.6);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  margin-left: 2px;
}

.fag-switch:active { background: rgba(255, 255, 255, 0.9); }

/* ====== 生命资产铭牌 ====== */
.asset-bar {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding: 14px 16px;
  background: #FFFFFF;
  border-radius: 14px;
  border: 1px solid #D4A520;
  box-shadow: 0 4px 16px rgba(212, 165, 32, 0.15), 0 1px 3px rgba(212, 165, 32, 0.1);
  position: relative;
  overflow: visible;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.asset-bar:active { opacity: 0.9; }

/* 玫瑰金流光扫过 */
.asset-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: -80%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(212, 165, 32, 0.1), transparent);
  animation: asset-shimmer 3.5s ease-in-out infinite;
}

@keyframes asset-shimmer {
  0% { left: -50%; }
  100% { left: 130%; }
}

.asset-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  z-index: 1;
}

.asset-col:active { opacity: 0.85; }

.asset-divider {
  width: 1px;
  background: rgba(212, 165, 32, 0.2);
  margin: 0 12px;
  align-self: stretch;
  flex-shrink: 0;
}

.asset-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.asset-icon--shield {
  background: rgba(212, 165, 32, 0.1);
}

.asset-icon--star {
  background: rgba(212, 165, 32, 0.1);
}

.asset-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.asset-desc {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

.asset-num {
  font-size: 18px;
  font-weight: 900;
  color: #D4A520;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace;
}

.asset-num small {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ========== Section base ========== */
.section {
  margin: 32px 16px 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.section-link {
  display: flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: none;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.section-link:active { color: #8A7BFE; }

/* ========== Insight — 薄荷绿渐变 ========== */
.insight-card {
  padding: 16px;
  background: linear-gradient(135deg, #EAF8F1 0%, #F4FCF8 100%);
  border-radius: 16px;
  border: 1px solid rgba(138, 123, 254, 0.08);
  position: relative;
  overflow: hidden;
}

.insight-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 50%, rgba(138, 123, 254, 0.04), transparent 60%),
              radial-gradient(ellipse at 70% 50%, rgba(16, 185, 129, 0.05), transparent 60%);
  animation: aurora-breathe 6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes aurora-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.insight-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.insight-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.insight-label {
  font-size: 13px;
  font-weight: 700;
  color: #8A7BFE;
}

.insight-sparkle {
  font-size: 14px;
}

.insight-text {
  font-size: 14px;
  line-height: 1.7;
  color: #333333;
  font-weight: 500;
}

/* ========== 防诈预警卡片 ========== */
.fraud-alert-section {
  background: transparent;
}

.fraud-alert-card {
  position: relative;
  padding: 18px 16px;
  background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 50%, #ffe4e6 100%);
  border-radius: 16px;
  border: 2px solid #fca5a5;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15), 0 1px 4px rgba(239, 68, 68, 0.1);
  animation: fraud-home-pulse 2.5s ease-in-out infinite;
}

@keyframes fraud-home-pulse {
  0%, 100% { border-color: #fca5a5; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15), 0 1px 4px rgba(239, 68, 68, 0.1); }
  50% { border-color: #ef4444; box-shadow: 0 4px 24px rgba(239, 68, 68, 0.25), 0 0 0 4px rgba(239, 68, 68, 0.06); }
}

.fraud-alert-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  z-index: 1;
}

.fraud-alert-close:active { background: rgba(255, 255, 255, 0.9); }

.fraud-alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.fraud-alert-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: fraud-icon-shake 1.5s ease-in-out infinite;
}

@keyframes fraud-icon-shake {
  0%, 100% { transform: rotate(0); }
  15% { transform: rotate(-8deg); }
  30% { transform: rotate(8deg); }
  45% { transform: rotate(-4deg); }
  60% { transform: rotate(4deg); }
  75% { transform: rotate(0); }
}

.fraud-alert-title-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.fraud-alert-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fraud-alert-title {
  font-size: 17px;
  font-weight: 800;
  color: #dc2626;
}

.fraud-alert-blink-tag {
  font-size: 11px;
  font-weight: 700;
  color: white;
  background: #ef4444;
  padding: 2px 8px;
  border-radius: 6px;
  animation: fraud-blink 1s ease-in-out infinite;
}

@keyframes fraud-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.fraud-alert-time {
  font-size: 12px;
  color: #94a3b8;
}

.fraud-alert-body {
  font-size: 14px;
  color: #991b1b;
  line-height: 1.7;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 10px;
  margin-bottom: 14px;
  font-weight: 500;
}

.fraud-alert-actions {
  display: flex;
  gap: 10px;
}

.fraud-alert-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}

.fraud-alert-btn:active { opacity: 0.8; transform: scale(0.98); }

.fraud-alert-btn--family {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  box-shadow: 0 3px 10px rgba(249, 115, 22, 0.3);
}

.fraud-alert-btn--police {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 3px 10px rgba(220, 38, 38, 0.3);
}

/* Fraud alert transition */
.fraud-alert-slide-enter-active {
  animation: fraud-slide-in 0.4s ease-out;
}

.fraud-alert-slide-leave-active {
  animation: fraud-slide-out 0.3s ease-in forwards;
}

@keyframes fraud-slide-in {
  from { opacity: 0; transform: translateY(-12px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes fraud-slide-out {
  to { opacity: 0; transform: translateY(-8px) scale(0.96); height: 0; margin: 0; padding: 0; overflow: hidden; }
}

/* ========== Cruise / Vitals — 极限压缩2x2 ========== */
.cruise-section {
  background: #F5F6F8;
  border-radius: 16px;
  padding: 16px;
}

.vitals-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.vital-card {
  padding: 12px 14px;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s;
  border: none;
  border-radius: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.vital-card:active {
  background: rgba(0, 0, 0, 0.03);
}

/* 白色分割线 — 右边和底边 */
.vital-card:nth-child(1) { border-right: 1px solid #FFFFFF; border-bottom: 1px solid #FFFFFF; }
.vital-card:nth-child(2) { border-bottom: 1px solid #FFFFFF; }
.vital-card:nth-child(3) { border-right: 1px solid #FFFFFF; }

.vital-card--warn {
  background: rgba(239, 68, 68, 0.04);
}

.vital-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vital-name {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  flex: 1;
}

.vital-time {
  font-size: 11px;
  color: #cbd5e1;
  flex-shrink: 0;
}

.vital-value-row {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.vital-big {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace;
}

.vital-unit {
  font-size: 11px;
  color: #94a3b8;
  margin-right: auto;
}

.vital-risk-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 8px;
  flex-shrink: 0;
  align-self: center;
}

.vital-risk-tag--normal {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.vital-risk-tag--high {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.vital-risk-tag--low {
  color: #D46B08;
  background: rgba(212, 107, 8, 0.1);
}

/* ========== 指标详情弹窗 ========== */
.vital-detail-popup {
  padding: 20px 16px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.vd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.vd-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.vd-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.vd-close:active { background: #e2e8f0; }

.vd-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.vd-ai-card {
  display: flex;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, #EAF8F1, #F4FCF8);
  border-radius: 14px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.vd-ai-icon {
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1.5;
}

.vd-ai-text {
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
}

.vd-list {
  max-height: 320px;
  overflow-y: auto;
}

.vd-date {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  padding: 10px 0 6px;
  border-bottom: 1px solid #f1f5f9;
}

.vd-date:first-child {
  padding-top: 0;
}

.vd-record-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f8fafc;
}

.vd-time {
  font-size: 13px;
  color: #94a3b8;
  width: 50px;
  flex-shrink: 0;
}

.vd-val {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace;
}

.vd-val small {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 2px;
}

.vd-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.vd-tag--normal {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.vd-tag--high {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.vd-tag--low {
  color: #D46B08;
  background: rgba(212, 107, 8, 0.1);
}

/* ========== Timeline Tasks ========== */
.timeline-section {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.timeline {
  display: flex;
  flex-direction: column;
}

.tl-item {
  display: flex;
  gap: 12px;
  min-height: 72px;
}

/* 已完成任务高度收缩 */
.tl-item--done {
  min-height: 56px;
}

.tl-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}

.tl-dot-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tl-item--done .tl-dot-wrap {
  background: #10b981;
}

.tl-item--current .tl-dot-wrap {
  background: #8A7BFE;
  box-shadow: 0 0 0 4px rgba(138, 123, 254, 0.15);
}

.tl-item--future .tl-dot-wrap {
  background: #cbd5e1;
}

.tl-item--overdue .tl-dot-wrap {
  background: #D46B08;
  box-shadow: 0 0 0 4px rgba(212, 107, 8, 0.15);
}

.tl-line {
  flex: 1;
  width: 2px;
  background: #8A7BFE;
  margin: 2px 0;
  min-height: 20px;
  opacity: 0.2;
}

.tl-line--done {
  background: #10b981;
  opacity: 1;
}

.tl-content {
  flex: 1;
  padding-bottom: 12px;
  min-width: 0;
}

.tl-time {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
  font-variant-numeric: tabular-nums;
}

.tl-item--current .tl-time {
  color: #8A7BFE;
}

.tl-item--overdue .tl-time {
  color: #D46B08;
}

.tl-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s;
}

.tl-card--highlight {
  background: rgba(138, 123, 254, 0.04);
  border: 1px solid rgba(138, 123, 254, 0.12);
}

.tl-card--overdue {
  background: rgba(212, 107, 8, 0.04);
  border: 1px solid rgba(212, 107, 8, 0.15);
}

.tl-emoji {
  font-size: 22px;
  flex-shrink: 0;
}

.tl-info {
  flex: 1;
  min-width: 0;
}

.tl-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tl-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.tl-overdue-tag {
  font-size: 10px;
  font-weight: 600;
  color: #CF1322;
  background: rgba(207, 19, 34, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.tl-sub {
  font-size: 12px;
  color: #94a3b8;
}

.tl-item--done .tl-name {
  color: #94a3b8;
  text-decoration: line-through;
}

.tl-item--future .tl-name {
  color: #94a3b8;
}

.tl-action-btn {
  padding: 7px 16px;
  background: #8A7BFE;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.tl-action-btn:active { opacity: 0.8; }

.tl-action-btn--overdue {
  background: #D46B08;
}

.tl-status-done {
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
  background: none;
  border: none;
  flex-shrink: 0;
}

.tl-locked {
  font-size: 12px;
  color: #cbd5e1;
  font-weight: 500;
  flex-shrink: 0;
}

/* AI 总结气泡 */
.tl-ai-bubble {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 6px;
  padding: 8px 10px;
  background: linear-gradient(135deg, #F3F1FB 0%, #EBE8F4 100%);
  border-radius: 10px;
  border: 1px solid rgba(138, 123, 254, 0.1);
}

.tl-ai-icon {
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tl-ai-text {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

/* ========== Member Popup ========== */
.member-popup {
  padding: 20px 16px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.member-popup-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  margin-bottom: 16px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.member-item + .member-item { border-top: 1px solid #f1f5f9; }
.member-item--active { background: #F3F1FB; }
.member-item:active { background: #f8fafc; }

.mi-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8A7BFE, #A89AFE);
  color: white;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mi-avatar--self {
  background: linear-gradient(135deg, #8A7BFE, #6C5CE7);
  box-shadow: 0 2px 8px rgba(138, 123, 254, 0.25);
}

.mi-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mi-name-row { display: flex; align-items: center; gap: 6px; }
.mi-name { font-size: 15px; font-weight: 700; color: #0f172a; }

.mi-tag {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(138, 123, 254, 0.08);
  color: #8A7BFE;
}

.mi-tag--self { background: rgba(16, 185, 129, 0.08); color: #059669; }
.mi-stage { font-size: 12px; color: #94a3b8; }

.mi-vitals {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.mi-detail-link {
  font-size: 11px;
  color: #8A7BFE;
  font-weight: 600;
  margin-top: 4px;
  cursor: pointer;
}

/* 成员头像预警指示 */
.mi-avatar--alert {
  border: 2px solid #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

/* 成员预警标签 */
.mi-alert-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 6px;
  margin-left: 4px;
}

.mi-alert-tag--danger {
  color: #dc2626;
  background: #fef2f2;
}

.mi-alert-tag--waiting {
  color: #ea580c;
  background: #fff7ed;
}

.mi-alert-tag--handled {
  color: #166534;
  background: #f0fdf4;
}

.mi-alert-tag--replied {
  color: #166534;
  background: #f0fdf4;
}

/* ========== Bell Badge ========== */
.nav-btn--bell {
  position: relative;
}

.bell-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid #f1f5f9;
}

/* ========== Review Bubble ========== */
.review-bubble {
  position: fixed;
  top: 56px;
  right: 16px;
  z-index: 19;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(138, 123, 254, 0.15);
  max-width: 240px;
  cursor: pointer;
  animation: bubble-slide-in 0.3s ease;
}

@keyframes bubble-slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.review-bubble-icon { font-size: 16px; flex-shrink: 0; }

.review-bubble-text {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  line-height: 1.4;
}

.review-bubble-close {
  width: 20px;
  height: 20px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  flex-shrink: 0;
  cursor: pointer;
}

/* ========== 全屏预警覆盖层 ========== */
.full-alert-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: radial-gradient(ellipse at center, rgba(220, 38, 38, 0.92), rgba(127, 29, 29, 0.96));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
}

/* 收起态：缩到右上角家人提示按钮位置 */
.full-alert--collapsing {
  animation: fa-collapse 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fa-collapse {
  0% {
    opacity: 1;
    clip-path: inset(0 0 0 0 round 0);
  }
  100% {
    opacity: 0;
    clip-path: inset(6% 2% 86% 40% round 18px);
  }
}

/* Vue Transition 入场 */
.alert-overlay-enter-active {
  animation: fa-enter 0.4s ease-out;
}

@keyframes fa-enter {
  from {
    opacity: 0;
    transform: scale(1.1);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 脉冲涟漪 */
.fa-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  margin: -100px 0 0 -100px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: fa-ripple 2s ease-out infinite;
}

.fa-pulse--2 {
  animation-delay: 0.4s;
  width: 300px;
  height: 300px;
  margin: -150px 0 0 -150px;
}

.fa-pulse--3 {
  animation-delay: 0.8s;
  width: 400px;
  height: 400px;
  margin: -200px 0 0 -200px;
}

.full-alert--collapsing .fa-pulse {
  animation: none;
  opacity: 0;
}

@keyframes fa-ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

/* 中央内容 */
.fa-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 0 32px;
  position: relative;
  z-index: 1;
  animation: fa-content-in 0.5s ease-out 0.1s both;
}

@keyframes fa-content-in {
  from { opacity: 0; transform: translateY(20px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.fa-content--collapsing {
  animation: fa-content-out 0.4s ease-in forwards;
}

@keyframes fa-content-out {
  to { opacity: 0; transform: scale(0.6); }
}

.fa-icon-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fa-icon-pulse 1s ease-in-out infinite;
}

@keyframes fa-icon-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.2); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 16px rgba(255,255,255,0); }
}

.fa-title {
  font-size: 24px;
  font-weight: 900;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.fa-detail {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  line-height: 1.6;
  max-width: 280px;
}

.fa-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
}

/* Hero role tag */
.hero-role-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 6px;
  background: rgba(138, 123, 254, 0.1);
  color: #8A7BFE;
  margin-left: 2px;
}

/* Remind button in timeline (重点关注家属) */
.tl-remind-btn {
  padding: 6px 14px;
  border-radius: 18px;
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

.tl-remind-btn:active {
  background: rgba(138, 123, 254, 0.15);
}

/* Remind popup */
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
