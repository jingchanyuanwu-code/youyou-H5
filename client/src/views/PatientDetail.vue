<template>
  <div class="patient-detail-page">
    <!-- 顶部导航：玻璃拟态 -->
    <div class="nav-bar">
      <div class="nav-back" @click="router.back()">
        <van-icon name="arrow-left" />
      </div>
      <div class="nav-title">患者详情</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 患者基本信息卡片 - Hero 动画容器 -->
    <div v-if="patient" class="patient-header hero-enter">
      <div :class="['avatar', `border-${patient.status}`]" :style="{ viewTransitionName: `avatar-${patient.id}` }">
        <span class="avatar-text">{{ patient.name.charAt(0) }}</span>
        <div v-if="patient.status === 'urgent'" class="pulse-ring"></div>
      </div>
      <div class="patient-info">
        <div class="name-row">
          <span class="name" :style="{ viewTransitionName: `name-${patient.id}` }">{{ patient.name }}</span>
          <span :class="['status-tag', `tag-${patient.status}`]">
            {{ statusLabel(patient.status) }}
          </span>
        </div>
        <div class="meta-row">
          <span class="meta-item">
            <van-icon name="user-o" />
            {{ patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '未知' }} · {{ patient.age }}岁
          </span>
          <span class="meta-item">
            <van-icon name="phone-o" />
            {{ maskPhone(patient.phone) }}
          </span>
        </div>
      </div>
      <a :href="`tel:${patient.phone}`" class="call-btn" @click.stop>
        <van-icon name="phone" />
      </a>
    </div>

    <!-- 骨架屏 -->
    <div v-else-if="loading" class="header-skeleton">
      <div class="sk-avatar"></div>
      <div class="sk-info">
        <div class="sk-line w50"></div>
        <div class="sk-line w70"></div>
      </div>
    </div>

    <!-- Tab 切换：玻璃拟态 -->
    <div class="tab-bar-glass">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        <van-icon :name="tab.icon" class="tab-icon" />
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </div>

    <!-- Tab 内容区域 -->
    <div class="tab-content">
      <!-- 健康档案 Tab（原临床档案） -->
      <div v-if="activeTab === 'profile'" class="content-panel">
        <!-- 健康评分卡片 - V3 重构版 -->
        <div class="section health-score-section-v3">
          <div class="score-header-v3">
            <div class="score-title-icon">
              <van-icon name="shield-o" />
            </div>
            <h3 class="score-title-text">健康评分</h3>
            <span class="score-trend" :class="healthScore.trendDir">
              {{ healthScore.trendDir === 'up' ? '↑' : '↓' }}{{ healthScore.trendValue }}分
            </span>
          </div>
          <div class="score-body-v3">
            <div class="score-left-v3">
              <div class="score-circle-v3" :class="healthScore.level">
                <span class="score-num-v3">{{ healthScore.value }}</span>
                <span class="score-label-v3">健康分</span>
              </div>
            </div>
            <div class="score-right-v3">
              <div class="risk-title-v3" :class="healthScore.level">
                <span class="risk-icon-v3">⚠️</span>
                <span>风险等级：</span>
                <strong>{{ healthScore.levelText }}</strong>
              </div>
              <div class="dimension-list-v3">
                <div class="dimension-item-v3">
                  <span class="dim-label-v3">血压控制</span>
                  <div class="dim-bar-v3">
                    <div class="dim-fill-v3" :class="healthScore.level" style="width: 65%"></div>
                  </div>
                </div>
                <div class="dimension-item-v3">
                  <span class="dim-label-v3">生活方式</span>
                  <div class="dim-bar-v3">
                    <div class="dim-fill-v3" :class="healthScore.level" style="width: 78%"></div>
                  </div>
                </div>
                <div class="dimension-item-v3">
                  <span class="dim-label-v3">服药依从</span>
                  <div class="dim-bar-v3">
                    <div class="dim-fill-v3" :class="healthScore.level" style="width: 85%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="score-advice-v3">
            <van-icon name="info-o" class="advice-icon-v3" />
            <span>{{ healthScore.advice }}</span>
          </div>
        </div>

        <!-- 最新体征快照 - V5 精修版 -->
        <div class="section vitals-section-v5">
          <div class="section-title-v3">
            <div class="title-icon-wrap icon-red">
              <van-icon name="chart-trending-o" />
            </div>
            <span>最新体征</span>
          </div>
          <!-- 血压/血糖/心率 一行三列 -->
          <div class="vitals-row-v5">
            <div class="vital-card-v5 clickable" @click="openVitalHistory('bp')">
              <div class="vital-header-v5">
                <div class="vital-left-v5">
                  <van-icon name="like-o" class="vital-icon-v5" />
                  <span class="vital-name-v5">血压</span>
                </div>
                <span :class="['vital-tag-v5', getVitalStatus('bp', latestVitals.bp.systolic).status]">
                  {{ getVitalStatus('bp', latestVitals.bp.systolic).label }}
                </span>
              </div>
              <div class="vital-value-v5">{{ latestVitals.bp.value }}</div>
              <div class="vital-time-v5">{{ latestVitals.bp.time }}</div>
            </div>
            <div class="vital-card-v5 clickable" @click="openVitalHistory('glucose')">
              <div class="vital-header-v5">
                <div class="vital-left-v5">
                  <van-icon name="tosend" class="vital-icon-v5" />
                  <span class="vital-name-v5">血糖</span>
                </div>
                <span :class="['vital-tag-v5', getVitalStatus('glucose', parseFloat(latestVitals.glucose.value)).status]">
                  {{ getVitalStatus('glucose', parseFloat(latestVitals.glucose.value)).label }}
                </span>
              </div>
              <div class="vital-value-v5">{{ latestVitals.glucose.value }}</div>
              <div class="vital-time-v5">{{ latestVitals.glucose.time }}</div>
            </div>
            <div class="vital-card-v5 clickable" @click="openVitalHistory('hr')">
              <div class="vital-header-v5">
                <div class="vital-left-v5">
                  <van-icon name="fire-o" class="vital-icon-v5" />
                  <span class="vital-name-v5">心率</span>
                </div>
                <span :class="['vital-tag-v5', getVitalStatus('hr', parseInt(latestVitals.hr.value)).status]">
                  {{ getVitalStatus('hr', parseInt(latestVitals.hr.value)).label }}
                </span>
              </div>
              <div class="vital-value-v5">{{ latestVitals.hr.value }}</div>
              <div class="vital-time-v5">{{ latestVitals.hr.time }}</div>
            </div>
          </div>
          <!-- BMI 独立行 -->
          <div class="bmi-row-v5 clickable" @click="openVitalHistory('bmi')">
            <div class="bmi-left-v5">
              <van-icon name="balance-o" class="vital-icon-v5" />
              <span class="vital-name-v5">BMI</span>
              <span :class="['vital-tag-v5', getVitalStatus('bmi', parseFloat(latestVitals.bmi.value)).status]">
                {{ getVitalStatus('bmi', parseFloat(latestVitals.bmi.value)).label }}
              </span>
            </div>
            <div class="bmi-right-v5">
              <span class="bmi-value-v5">{{ latestVitals.bmi.value }}</span>
              <span class="bmi-divider-v5">|</span>
              <span class="bmi-detail-v5">{{ latestVitals.bmi.height }}cm · {{ latestVitals.bmi.weight }}kg</span>
            </div>
          </div>
        </div>

        <!-- 咨询摘要 - 布局优化 -->
        <div class="section">
          <div class="section-title">
            <div class="title-icon-wrap icon-purple">
              <van-icon name="comment-o" />
            </div>
            咨询摘要
          </div>
          <div class="consult-card-v2">
            <div class="consult-row-v2">
              <span class="consult-label">主诉</span>
              <span class="consult-value">{{ consultSummary.chiefComplaint }}</span>
            </div>
            <div class="consult-row-v2">
              <span class="consult-label">印象诊断</span>
              <span class="consult-value">{{ consultSummary.diagnosis }}</span>
            </div>
            <div class="consult-row-v2">
              <span class="consult-label">健康建议</span>
              <div class="consult-value advice-value">
                <ul class="advice-list-v2">
                  <li v-for="(item, idx) in consultSummary.advices" :key="idx">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="section-footer" @click="showHistoryConsult = true">
            <span>查看历史咨询记录</span>
            <van-icon name="arrow" />
          </div>
        </div>

        <!-- 健康信息（五史） -->
        <div class="section">
          <div class="section-title">
            <div class="title-icon-wrap icon-green">
              <van-icon name="records" />
            </div>
            健康信息
          </div>
          <div class="history-grid">
            <div class="history-item">
              <span class="history-label">既往史</span>
              <span class="history-value">{{ healthHistory.pastHistory || '无' }}</span>
            </div>
            <div class="history-item">
              <span class="history-label">过敏史</span>
              <span :class="['history-value', { 'text-danger': healthHistory.allergyHistory }]">
                {{ healthHistory.allergyHistory || '无' }}
              </span>
            </div>
            <div class="history-item">
              <span class="history-label">用药史</span>
              <span class="history-value">{{ healthHistory.medicationHistory || '无' }}</span>
            </div>
            <div class="history-item">
              <span class="history-label">家族史</span>
              <span class="history-value">{{ healthHistory.familyHistory || '无' }}</span>
            </div>
            <div class="history-item full-width">
              <span class="history-label">个人史</span>
              <span class="history-value">{{ healthHistory.personalHistory || '无' }}</span>
            </div>
          </div>
        </div>

        <!-- 健康资料库 -->
        <div class="section">
          <div class="section-header">
            <div class="section-title" style="margin-bottom: 0;">
              <div class="title-icon-wrap icon-orange">
                <van-icon name="orders-o" />
              </div>
              健康资料
            </div>
            <div class="timeline-btn" @click="showHealthTimeline = true">
              <van-icon name="clock-o" />
              <span>时间轴</span>
            </div>
          </div>
          <div class="archive-grid">
            <div v-for="item in archiveTypes" :key="item.key" class="archive-item" @click="openArchive(item.key)">
              <div :class="['archive-icon', item.color]">
                <van-icon :name="item.icon" />
              </div>
              <span class="archive-label">{{ item.label }}</span>
              <span class="archive-count">{{ item.count }}份</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 指标数据 Tab - V5 心血管专科监控系统 -->
      <div v-else-if="activeTab === 'data'" class="content-panel cv-monitor-system">
        <!-- 0. AI健康领航 AI Health Navigator -->
        <div class="cv-card ai-health-navigator">
          <div class="ai-nav-header">
            <div class="ai-nav-title-row">
              <span class="ai-sparkle-icon">&#10024;</span>
              <span class="ai-nav-title">AI健康领航</span>
              <span class="ai-nav-badge">AI</span>
            </div>
            <span class="ai-nav-time">{{ aiHealthNavigator.generatedTime }}</span>
          </div>
          <div class="ai-nav-body">
            <!-- 异常提示 -->
            <div class="ai-nav-section" v-if="aiHealthNavigator.anomalies.length > 0">
              <div class="ai-nav-section-label">
                <span class="section-dot anomaly"></span>
                <span>异常提示</span>
              </div>
              <div class="ai-nav-items">
                <div
                  v-for="(item, idx) in aiHealthNavigator.anomalies"
                  :key="'anomaly-' + idx"
                  :class="['ai-nav-item', 'anomaly', item.level]"
                >
                  <span class="ai-nav-item-icon">{{ item.icon }}</span>
                  <span class="ai-nav-item-text">{{ item.text }}</span>
                </div>
              </div>
            </div>
            <!-- 健康干预提醒 -->
            <div class="ai-nav-section" v-if="aiHealthNavigator.interventions.length > 0">
              <div class="ai-nav-section-label">
                <span class="section-dot intervention"></span>
                <span>健康干预提醒</span>
              </div>
              <div class="ai-nav-items">
                <div
                  v-for="(item, idx) in aiHealthNavigator.interventions"
                  :key="'intervention-' + idx"
                  class="ai-nav-item intervention"
                >
                  <span class="ai-nav-item-icon">{{ item.icon }}</span>
                  <span class="ai-nav-item-text">{{ item.text }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 1. 临床简报中心 Briefing Center -->
        <div class="briefing-center">
          <div class="briefing-card alert-brief" @click="showAlertOverlay = true">
            <div class="brief-header">
              <span class="brief-indicator" :class="todayUrgentAlert ? 'critical' : 'stable'"></span>
              <span class="brief-label">今日预警</span>
            </div>
            <div class="brief-body">
              <span class="brief-value" v-if="todayUrgentAlert">{{ patient?.alertCount || 0 }}</span>
              <span class="brief-value stable" v-else>0</span>
              <span class="brief-unit">次</span>
            </div>
            <div class="brief-footer">
              <span v-if="todayUrgentAlert">最高 {{ todayUrgentAlert.value }}{{ todayUrgentAlert.unit }}</span>
              <span v-else>无异常记录</span>
            </div>
          </div>
          <div class="briefing-card report-brief" @click="showReportOverlay = true">
            <div class="brief-header">
              <span class="brief-indicator ai"></span>
              <span class="brief-label">趋势报告</span>
            </div>
            <div class="brief-body">
              <span class="brief-trend" :class="trendDirection">{{ trendDirection === 'improving' ? '↑' : trendDirection === 'declining' ? '↓' : '→' }}</span>
              <span class="brief-status">{{ trendStatusText }}</span>
            </div>
            <div class="brief-footer">
              <span>7日综合评估</span>
            </div>
          </div>
        </div>

        <!-- 2. 监测统计与趋势（合并） -->
        <div class="cv-card stats-chart-unified">
          <div class="cv-card-header">
            <div class="header-left">
              <span class="card-title">监测统计</span>
            </div>
            <div class="header-right">
              <span class="history-link" @click="showHistoryDetail = true">历史明细 ›</span>
            </div>
          </div>
          <div class="cv-card-body">
            <!-- 指标选择 Tabs -->
            <div class="metric-selector">
              <span
                v-for="tab in metricTabs"
                :key="tab.key"
                :class="['metric-btn', { active: currentMetric === tab.key }]"
                @click="switchMetric(tab.key)"
              >{{ tab.label }}</span>
            </div>
            <!-- 统计数据 -->
            <div class="stats-grid">
              <div class="stat-cell">
                <span class="stat-num">{{ metricAnalysis.average }}</span>
                <span class="stat-label">均值<small>{{ metricAnalysis.unit }}</small></span>
              </div>
              <div class="stat-cell">
                <span class="stat-num">{{ metricAnalysis.max }}</span>
                <span class="stat-label">最高值</span>
              </div>
              <div class="stat-cell">
                <span class="stat-num">{{ metricAnalysis.min }}</span>
                <span class="stat-label">最低值</span>
              </div>
              <div class="stat-cell">
                <span :class="['stat-num', metricAnalysis.complianceClass]">{{ metricAnalysis.complianceRate }}%</span>
                <span class="stat-label">达标率</span>
              </div>
            </div>
            <!-- 分隔线 -->
            <div class="stats-chart-divider"></div>
            <!-- 趋势图标题 + 图例 -->
            <div class="unified-chart-header">
              <span class="chart-subtitle">{{ currentMetricLabel }} 趋势</span>
              <div class="chart-legend">
                <span class="legend-item"><i class="dot normal"></i>正常</span>
                <span class="legend-item"><i class="dot abnormal"></i>异常</span>
              </div>
            </div>
            <!-- 趋势图区域 -->
            <div class="chart-area-unified">
              <!-- Y轴 -->
              <div class="chart-y-axis">
                <span>{{ metricAnalysis.yAxisMax }}</span>
                <span>{{ metricAnalysis.yAxisMid }}</span>
                <span>{{ metricAnalysis.yAxisMin }}</span>
              </div>
              <!-- 主图表区 -->
              <div class="chart-main">
                <svg class="chart-svg-clinical" viewBox="0 0 280 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" stroke-width="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="280" height="100" fill="url(#grid)" />
                  <rect :y="safeZoneChartY" :height="safeZoneChartHeight" width="280" class="safe-zone-rect" />
                  <polyline :points="chartPointsClinical" class="trend-line" fill="none" />
                  <g v-for="(point, idx) in chartDataPointsClinical" :key="idx">
                    <circle
                      :cx="point.x"
                      :cy="point.y"
                      :r="selectedChartPoint === idx ? 5 : 3.5"
                      :class="['data-point', { abnormal: point.isAbnormal, selected: selectedChartPoint === idx }]"
                      @click="selectChartPoint(idx)"
                    />
                  </g>
                </svg>
                <div class="chart-x-axis">
                  <span v-for="(label, idx) in chartXLabelsV3" :key="idx">{{ label }}</span>
                </div>
                <!-- 行为泳道 -->
                <div class="swimlanes">
                  <div class="swimlane" v-for="lane in swimlaneConfig" :key="lane.key">
                    <span class="lane-label">{{ lane.label }}</span>
                    <div class="lane-track">
                      <template v-for="(event, idx) in getLaneEvents(lane.key)" :key="idx">
                        <div
                          v-if="event.count === 1"
                          class="lane-dot"
                          :style="{ left: event.position + '%' }"
                          @click="showEventDetail(event)"
                        ></div>
                        <div
                          v-else
                          class="lane-bubble"
                          :style="{ left: event.position + '%' }"
                          @click="showEventListPopup(event)"
                        >{{ event.count }}</div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康活动卡片 2x2 -->
        <div class="activity-cards-grid">
          <div class="activity-card" v-for="card in activityCards" :key="card.key">
            <div class="activity-card-header">
              <span class="activity-card-title">{{ card.title }}</span>
              <span v-if="card.tag" :class="['activity-card-tag', card.tagClass]">{{ card.tag }}</span>
            </div>
            <div class="activity-card-value-row">
              <span class="activity-card-value">{{ card.value }}</span>
              <span class="activity-card-unit">{{ card.unit }}</span>
            </div>
            <div class="activity-card-chart">
              <!-- 步数/睡眠/运动: mini 折线图 -->
              <svg v-if="card.chartType === 'line'" class="mini-trend-svg" viewBox="0 0 100 32" preserveAspectRatio="none">
                <polyline :points="card.chartPoints" fill="none" :stroke="card.chartColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <circle :cx="card.lastPointX" :cy="card.lastPointY" r="2.5" :fill="card.chartColor" />
              </svg>
              <!-- 站立目标: 方块条 -->
              <div v-else-if="card.chartType === 'blocks'" class="standing-blocks">
                <div
                  v-for="(filled, bIdx) in card.blocks"
                  :key="bIdx"
                  :class="['standing-block', { filled }]"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 健康日志 Health Log -->
        <div class="cv-card health-log-card">
          <div class="cv-card-header">
            <span class="card-title">健康日志</span>
            <span class="log-date-label">{{ healthLogDateLabel }}</span>
          </div>
          <!-- 行为筛选 Tabs -->
          <div class="hlog-filter-bar">
            <span
              v-for="f in healthLogFilters"
              :key="f.key"
              :class="['hlog-filter-btn', { active: healthLogFilter === f.key }]"
              @click="healthLogFilter = f.key"
            >{{ f.label }}</span>
          </div>
          <div class="cv-card-body">
            <!-- 时间轴列表 -->
            <div class="hlog-timeline" v-if="filteredHealthLogs.length > 0">
              <div
                v-for="(log, idx) in filteredHealthLogs"
                :key="idx"
                class="hlog-item"
              >
                <!-- 时间轴左侧 -->
                <div class="hlog-time-col">
                  <span class="hlog-time">{{ log.time }}</span>
                  <div class="hlog-line" v-if="idx < filteredHealthLogs.length - 1"></div>
                </div>
                <!-- 内容卡片 -->
                <div class="hlog-content-card">
                  <div class="hlog-content-header">
                    <span :class="['hlog-type-icon', log.category]">{{ log.icon }}</span>
                    <span class="hlog-type-label">{{ log.typeLabel }}</span>
                    <span v-if="log.tag" :class="['hlog-tag', log.tagClass]">{{ log.tag }}</span>
                  </div>
                  <div class="hlog-content-body">{{ log.content }}</div>
                  <div v-if="log.aiAnalysis" class="hlog-ai-row">
                    <span class="hlog-ai-icon">&#10024;</span>
                    <span class="hlog-ai-text">{{ log.aiAnalysis }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="hlog-empty">
              <span>暂无健康日志记录</span>
            </div>
            <!-- 底部查看历史 -->
            <div class="hlog-footer" @click="showHealthLogHistory = true">
              <van-icon name="notes-o" />
              <span>查看历史记录</span>
            </div>
          </div>
        </div>

        <!-- 健康日志历史弹窗 -->
        <van-popup v-model:show="showHealthLogHistory" position="bottom" round :style="{ height: '75%' }">
          <div class="hlog-history-popup">
            <div class="hlog-popup-header">
              <span class="hlog-popup-title">历史健康日志</span>
              <van-icon name="cross" class="hlog-popup-close" @click="showHealthLogHistory = false" />
            </div>
            <!-- 日历选择 -->
            <div class="hlog-calendar-strip">
              <div
                v-for="(day, dIdx) in historyCalendarDays"
                :key="dIdx"
                :class="['hlog-cal-day', { active: historySelectedDate === day.date, today: day.isToday, hasData: day.hasData }]"
                @click="historySelectedDate = day.date"
              >
                <span class="cal-weekday">{{ day.weekday }}</span>
                <span class="cal-daynum">{{ day.dayNum }}</span>
                <span v-if="day.hasData" class="cal-dot"></span>
              </div>
            </div>
            <!-- 行为筛选 -->
            <div class="hlog-filter-bar popup-filter">
              <span
                v-for="f in healthLogFilters"
                :key="f.key"
                :class="['hlog-filter-btn', { active: historyLogFilter === f.key }]"
                @click="historyLogFilter = f.key"
              >{{ f.label }}</span>
            </div>
            <!-- 历史日志列表 -->
            <div class="hlog-history-list">
              <div
                v-for="(log, idx) in filteredHistoryLogs"
                :key="idx"
                class="hlog-item"
              >
                <div class="hlog-time-col">
                  <span class="hlog-time">{{ log.time }}</span>
                  <div class="hlog-line" v-if="idx < filteredHistoryLogs.length - 1"></div>
                </div>
                <div class="hlog-content-card">
                  <div class="hlog-content-header">
                    <span :class="['hlog-type-icon', log.category]">{{ log.icon }}</span>
                    <span class="hlog-type-label">{{ log.typeLabel }}</span>
                    <span v-if="log.tag" :class="['hlog-tag', log.tagClass]">{{ log.tag }}</span>
                  </div>
                  <div class="hlog-content-body">{{ log.content }}</div>
                  <div v-if="log.aiAnalysis" class="hlog-ai-row">
                    <span class="hlog-ai-icon">&#10024;</span>
                    <span class="hlog-ai-text">{{ log.aiAnalysis }}</span>
                  </div>
                </div>
              </div>
              <div v-if="filteredHistoryLogs.length === 0" class="hlog-empty">
                <span>该日期暂无记录</span>
              </div>
            </div>
          </div>
        </van-popup>
      </div>

      <!-- 干预计划 Tab - 临床干预系统 V3 -->
      <div v-else-if="activeTab === 'plan'" class="content-panel clinical-intervention-panel">

        <!-- 1. 顶部：方案基本信息（含周期与阶段提示） -->
        <div class="master-plan-card-v3">
          <div class="mp-header-v3">
            <div class="mp-title-section">
              <span class="mp-icon">📋</span>
              <div class="mp-title-info">
                <h3 class="mp-title">{{ interventionPlan.planName }}</h3>
                <span class="mp-version-tag">{{ interventionPlan.version }}</span>
              </div>
            </div>
            <button class="mp-goals-btn" @click="showGoalsModal = true">
              <van-icon name="notes-o" />
              汇总目标
            </button>
          </div>

          <!-- 方案周期明确化 -->
          <div class="mp-period-bar">
            <div class="period-info">
              <span class="period-label">方案周期</span>
              <span class="period-dates">{{ interventionPlan.startDate }} 至 {{ interventionPlan.endDate }}</span>
            </div>
            <div class="period-stage">
              <span class="stage-badge">执行中</span>
              <span class="stage-text">第 <strong>{{ interventionPlan.currentDay }}</strong> 天 / 共 {{ interventionPlan.totalDays }} 天</span>
            </div>
          </div>

          <!-- 紧凑型 Dashboard -->
          <div class="mp-dashboard">
            <div class="dash-item">
              <div class="dash-label">总进度</div>
              <div class="dash-value-row">
                <div class="dash-progress-mini">
                  <div class="dash-progress-fill" :style="{ width: interventionPlan.progress + '%' }"></div>
                </div>
                <span class="dash-value">{{ interventionPlan.progress }}%</span>
              </div>
            </div>
            <div class="dash-divider"></div>
            <div class="dash-item">
              <div class="dash-label">用药依从</div>
              <div class="dash-value" :class="interventionPlan.medicationCompliance >= 100 ? 'good' : 'warning'">
                {{ interventionPlan.medicationCompliance }}%
              </div>
            </div>
            <div class="dash-divider"></div>
            <div class="dash-item">
              <div class="dash-label">今日打卡</div>
              <div class="dash-value" :class="interventionPlan.checkInCompliance >= 80 ? 'good' : 'warning'">
                {{ interventionPlan.checkInCount }}/{{ interventionPlan.checkInTotal }}
              </div>
            </div>
          </div>
        </div>

        <!-- 2. AI 决策中心（置顶 Decision First） -->
        <div class="ai-decision-card-v2">
          <div class="ai-glow-effect"></div>
          <div class="ai-card-inner">
            <div class="ai-card-header-v2">
              <div class="ai-title-row">
                <span class="ai-icon-animated">✨</span>
                <span class="ai-title">AI 调优建议</span>
              </div>
              <span class="ai-badge-v2">智能分析</span>
            </div>
            <div class="ai-card-body-v2">
              <p class="ai-suggestion">{{ aiDecisionSupport.suggestion }}</p>
              <div v-if="aiDecisionSupport.metrics" class="ai-metrics-v2">
                <div class="ai-metric-v2" v-for="(metric, idx) in aiDecisionSupport.metrics" :key="idx">
                  <span class="metric-label">{{ metric.label }}</span>
                  <span :class="['metric-value', metric.status]">{{ metric.value }}</span>
                </div>
              </div>
            </div>
            <div class="ai-card-actions-v2">
              <button class="ai-action-btn secondary" @click="showAiDetailModal = true">查看详情</button>
              <button class="ai-action-btn primary" @click="openSchemaEdit('ai')">采纳建议</button>
            </div>
          </div>
        </div>

        <!-- 3. 执行追踪维度切换 -->
        <div class="tracking-section">
          <div class="tracking-header">
            <span class="tracking-title">执行追踪</span>
            <div class="tracking-tabs">
              <button
                v-for="tab in trackingTabs"
                :key="tab.key"
                :class="['tracking-tab', { active: currentTrackingView === tab.key }]"
                @click="currentTrackingView = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- 日视图：打卡流水 -->
          <div v-if="currentTrackingView === 'day'" class="tracking-day-view">
            <div class="day-header">
              <span class="day-date">{{ todayDateStr }}</span>
              <span class="day-summary">完成 {{ dailyCheckIns.filter(c => c.completed).length }}/{{ dailyCheckIns.length }} 项</span>
            </div>
            <div class="checkin-timeline">
              <div
                v-for="(item, idx) in dailyCheckIns"
                :key="idx"
                :class="['checkin-item', { completed: item.completed, missed: !item.completed && item.overdue }]"
              >
                <div class="checkin-time">{{ item.time }}</div>
                <div class="checkin-dot"></div>
                <div class="checkin-content">
                  <div class="checkin-header">
                    <span :class="['rx-tag', 'tag-' + item.type]">{{ item.typeLabel }}</span>
                    <span class="checkin-name">{{ item.name }}</span>
                  </div>
                  <span :class="['checkin-status', item.completed ? 'done' : (item.overdue ? 'missed' : 'pending')]">
                    {{ item.completed ? '✓ 已完成' : (item.overdue ? '✗ 未完成' : '待执行') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 周视图：依从性趋势 -->
          <div v-else-if="currentTrackingView === 'week'" class="tracking-week-view">
            <div class="trend-chart-container">
              <div class="trend-legend">
                <span class="legend-item"><span class="legend-dot medication"></span>用药</span>
                <span class="legend-item"><span class="legend-dot diet"></span>饮食</span>
                <span class="legend-item"><span class="legend-dot exercise"></span>运动</span>
              </div>
              <div class="trend-chart">
                <div class="chart-y-axis">
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>
                <div class="chart-bars">
                  <div v-for="(day, idx) in weeklyTrendData" :key="idx" class="chart-day">
                    <div class="bar-group">
                      <div class="bar medication" :style="{ height: day.medication + '%' }"></div>
                      <div class="bar diet" :style="{ height: day.diet + '%' }"></div>
                      <div class="bar exercise" :style="{ height: day.exercise + '%' }"></div>
                    </div>
                    <span class="day-label">{{ day.label }}</span>
                  </div>
                </div>
              </div>
              <div class="trend-insight">
                <van-icon name="bulb-o" />
                <span>{{ weeklyInsight }}</span>
              </div>
            </div>
          </div>

          <!-- 月视图：月度依从性总览 -->
          <div v-else-if="currentTrackingView === 'month'" class="tracking-month-view">
            <div class="month-calendar">
              <div class="calendar-header">
                <span v-for="d in ['一','二','三','四','五','六','日']" :key="d" class="cal-weekday">{{ d }}</span>
              </div>
              <div class="calendar-grid">
                <div
                  v-for="(day, idx) in monthCalendarData"
                  :key="idx"
                  :class="['cal-day', day.status, { today: day.isToday, future: day.isFuture }]"
                >
                  <span class="cal-date">{{ day.date }}</span>
                  <span v-if="!day.isFuture && day.status" class="cal-indicator"></span>
                </div>
              </div>
            </div>
            <div class="month-stats">
              <div class="stat-item">
                <span class="stat-value good">{{ monthStats.goodDays }}</span>
                <span class="stat-label">达标天数</span>
              </div>
              <div class="stat-item">
                <span class="stat-value warning">{{ monthStats.partialDays }}</span>
                <span class="stat-label">部分达标</span>
              </div>
              <div class="stat-item">
                <span class="stat-value danger">{{ monthStats.missedDays }}</span>
                <span class="stat-label">未达标</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. 药物处方模块 -->
        <div class="section clinical-section">
          <div class="clinical-section-header">
            <div class="csh-left">
              <span class="csh-icon">💊</span>
              <h4 class="csh-title">药物处方</h4>
            </div>
            <button class="adjust-btn" @click="openSchemaEdit('medication')">
              <van-icon name="edit" />
              调整方案
            </button>
          </div>

          <div class="medication-list">
            <div
              v-for="(med, idx) in interventionPlan.medications"
              :key="idx"
              class="medication-card"
            >
              <div class="med-left-border"></div>
              <div class="med-content">
                <div class="med-header">
                  <div class="med-name-row">
                    <span class="rx-tag tag-medication">用药</span>
                    <span class="med-name">{{ med.name }}</span>
                  </div>
                  <span :class="['med-status', med.todayTaken ? 'taken' : 'pending']">
                    {{ med.todayTaken ? '已服' : '待服' }}
                  </span>
                </div>
                <div class="med-details">
                  <span class="med-spec">{{ med.specification }}</span>
                  <span class="med-dot">·</span>
                  <span class="med-dose">{{ med.dosage }}</span>
                  <span class="med-dot">·</span>
                  <span class="med-freq">{{ med.frequency }}</span>
                </div>
                <div v-if="med.note" class="med-note">
                  <van-icon name="info-o" />
                  {{ med.note }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. 生活方式处方 -->
        <div class="section clinical-section">
          <div class="clinical-section-header">
            <div class="csh-left">
              <span class="csh-icon">🥗</span>
              <h4 class="csh-title">生活方式处方</h4>
            </div>
            <button class="adjust-btn" @click="openSchemaEdit('lifestyle')">
              <van-icon name="edit" />
              调整方案
            </button>
          </div>

          <div class="behavioral-card diet-card">
            <div class="bc-left-border diet"></div>
            <div class="bc-content">
              <div class="bc-header">
                <span class="rx-tag tag-diet">饮食</span>
                <span class="bc-title">饮食干预</span>
              </div>
              <div class="bc-targets">
                <div class="target-item">
                  <span class="target-label">限盐目标</span>
                  <span class="target-value">{{ interventionPlan.dietPlan.saltLimit }}</span>
                </div>
                <div class="target-item">
                  <span class="target-label">限酒目标</span>
                  <span class="target-value">{{ interventionPlan.dietPlan.alcoholLimit }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="behavioral-card exercise-card">
            <div class="bc-left-border exercise"></div>
            <div class="bc-content">
              <div class="bc-header">
                <span class="rx-tag tag-exercise">运动</span>
                <span class="bc-title">运动处方</span>
              </div>
              <div class="bc-targets">
                <div class="target-item">
                  <span class="target-label">目标心率</span>
                  <span class="target-value">{{ interventionPlan.exercisePlan.targetHeartRate }}</span>
                </div>
                <div class="target-item">
                  <span class="target-label">每周时长</span>
                  <span class="target-value">{{ interventionPlan.exercisePlan.weeklyDuration }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="behavioral-card monitor-card">
            <div class="bc-left-border monitor"></div>
            <div class="bc-content">
              <div class="bc-header">
                <span class="rx-tag tag-monitor">监测</span>
                <span class="bc-title">血压监测</span>
              </div>
              <div class="bc-targets">
                <div class="target-item">
                  <span class="target-label">监测频次</span>
                  <span class="target-value">{{ interventionPlan.monitorPlan.frequency }}</span>
                </div>
                <div class="target-item">
                  <span class="target-label">目标值</span>
                  <span class="target-value">{{ interventionPlan.monitorPlan.targetBP }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 统计收纳入口 -->
        <div class="stats-shortcut" @click="showHistoryDetail = true">
          <span class="stats-text">查看指标测量历史</span>
          <van-icon name="arrow" />
        </div>
      </div>

      <!-- 汇总目标 Modal -->
      <van-popup v-model:show="showGoalsModal" position="bottom" round :style="{ height: '55%' }">
        <div class="goals-modal">
          <div class="popup-header">
            <span class="popup-title">本周期量化目标</span>
            <van-icon name="cross" class="popup-close" @click="showGoalsModal = false" />
          </div>
          <div class="goals-content">
            <div class="goal-category">
              <div class="goal-cat-header">
                <span class="goal-cat-icon">💊</span>
                <span class="goal-cat-title">用药目标</span>
              </div>
              <div class="goal-items">
                <div class="goal-item">
                  <span class="goal-label">用药依从性</span>
                  <span class="goal-target">≥ 95%</span>
                  <span class="goal-current good">100%</span>
                </div>
              </div>
            </div>
            <div class="goal-category">
              <div class="goal-cat-header">
                <span class="goal-cat-icon">❤️</span>
                <span class="goal-cat-title">血压目标</span>
              </div>
              <div class="goal-items">
                <div class="goal-item">
                  <span class="goal-label">收缩压</span>
                  <span class="goal-target">＜140 mmHg</span>
                  <span class="goal-current warning">148 mmHg</span>
                </div>
                <div class="goal-item">
                  <span class="goal-label">舒张压</span>
                  <span class="goal-target">＜90 mmHg</span>
                  <span class="goal-current good">82 mmHg</span>
                </div>
              </div>
            </div>
            <div class="goal-category">
              <div class="goal-cat-header">
                <span class="goal-cat-icon">🏃</span>
                <span class="goal-cat-title">运动目标</span>
              </div>
              <div class="goal-items">
                <div class="goal-item">
                  <span class="goal-label">每周运动时长</span>
                  <span class="goal-target">≥ 150 分钟</span>
                  <span class="goal-current good">165 分钟</span>
                </div>
              </div>
            </div>
            <div class="goal-category">
              <div class="goal-cat-header">
                <span class="goal-cat-icon">🍽️</span>
                <span class="goal-cat-title">饮食目标</span>
              </div>
              <div class="goal-items">
                <div class="goal-item">
                  <span class="goal-label">每日限盐量</span>
                  <span class="goal-target">＜5g</span>
                  <span class="goal-current good">达标</span>
                </div>
              </div>
            </div>
            <div class="goal-category">
              <div class="goal-cat-header">
                <span class="goal-cat-icon">⚖️</span>
                <span class="goal-cat-title">体重目标</span>
              </div>
              <div class="goal-items">
                <div class="goal-item">
                  <span class="goal-label">目标体重</span>
                  <span class="goal-target">70 kg</span>
                  <span class="goal-current warning">72.5 kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-popup>

      <!-- 方案编辑二级页（支持新增/删除/AI预填） -->
      <van-popup v-model:show="showSchemaEdit" position="right" :style="{ width: '100%', height: '100%' }">
        <div class="schema-edit-page">
          <div class="se-header">
            <div class="se-back" @click="showSchemaEdit = false">
              <van-icon name="arrow-left" />
            </div>
            <span class="se-title">方案调整</span>
            <span class="se-subtitle">{{ schemaEditType }}</span>
          </div>

          <div class="se-content">
            <!-- AI 预填提示 -->
            <div v-if="isAiSuggestion" class="se-ai-banner">
              <span class="ai-banner-icon">✨</span>
              <span class="ai-banner-text">以下为 AI 建议的调整方案，所有字段均可手动修改</span>
            </div>

            <!-- 对比视图 -->
            <div class="se-compare-section">
              <div class="compare-header">
                <span class="compare-old">原方案</span>
                <span class="compare-arrow">→</span>
                <span class="compare-new">新方案</span>
              </div>
            </div>

            <!-- 编辑表单列表 -->
            <div class="se-form-list">
              <div
                v-for="(item, idx) in schemaEditItems"
                :key="idx"
                :class="['se-form-item', { modified: item.modified, deleted: item.deleted }]"
              >
                <div class="form-item-header">
                  <span :class="['rx-tag', 'tag-' + item.type]">{{ item.typeLabel }}</span>
                  <span class="form-item-name">{{ item.name }}</span>
                  <button v-if="!item.deleted" class="form-delete-btn" @click="markItemDeleted(idx)">
                    <van-icon name="delete-o" />
                  </button>
                  <button v-else class="form-restore-btn" @click="restoreItem(idx)">
                    <van-icon name="replay" />
                  </button>
                </div>

                <div v-if="!item.deleted" class="form-item-body">
                  <!-- 原值 vs 新值对比 -->
                  <div class="form-row">
                    <div class="form-old">
                      <span class="old-label">原值</span>
                      <span :class="['old-value', { strikethrough: item.modified }]">{{ item.oldValue }}</span>
                    </div>
                    <div class="form-new">
                      <span class="new-label">新值</span>
                      <input
                        v-model="item.newValue"
                        class="new-input"
                        :class="{ changed: item.newValue !== item.oldValue }"
                        @input="item.modified = item.newValue !== item.oldValue"
                      />
                    </div>
                  </div>

                  <!-- 详情字段 -->
                  <div v-if="item.detailField" class="form-row">
                    <div class="form-old">
                      <span class="old-label">{{ item.detailLabel }}</span>
                      <span :class="['old-value', { strikethrough: item.detailModified }]">{{ item.oldDetail }}</span>
                    </div>
                    <div class="form-new">
                      <span class="new-label">{{ item.detailLabel }}</span>
                      <input
                        v-model="item.newDetail"
                        class="new-input"
                        :class="{ changed: item.newDetail !== item.oldDetail }"
                        @input="item.detailModified = item.newDetail !== item.oldDetail"
                      />
                    </div>
                  </div>

                  <!-- 修改原因（AI建议时显示） -->
                  <div v-if="item.aiReason" class="form-reason">
                    <van-icon name="bulb-o" />
                    <span>{{ item.aiReason }}</span>
                  </div>
                </div>

                <div v-else class="form-item-deleted">
                  <span>此项将被删除</span>
                </div>
              </div>
            </div>

            <!-- 新增按钮 -->
            <div class="se-add-section">
              <button class="se-add-btn" @click="showAddItemModal = true">
                <van-icon name="plus" />
                新增处方项
              </button>
            </div>
          </div>

          <div class="se-footer">
            <button class="se-btn se-btn-cancel" @click="showSchemaEdit = false">取消</button>
            <button class="se-btn se-btn-confirm" @click="confirmSchemaEdit">
              <van-icon name="certificate" />
              确认下发医嘱
            </button>
          </div>
        </div>
      </van-popup>

      <!-- 新增处方项 Modal -->
      <van-popup v-model:show="showAddItemModal" position="bottom" round :style="{ height: '45%' }">
        <div class="add-item-modal">
          <div class="popup-header">
            <span class="popup-title">新增处方项</span>
            <van-icon name="cross" class="popup-close" @click="showAddItemModal = false" />
          </div>
          <div class="add-item-content">
            <div class="add-form-group">
              <label class="add-label">类型</label>
              <div class="add-type-options">
                <button
                  v-for="t in addItemTypes"
                  :key="t.key"
                  :class="['type-option', { active: newItemType === t.key }]"
                  @click="newItemType = t.key"
                >
                  <span :class="['rx-tag', 'tag-' + t.key]">{{ t.label }}</span>
                </button>
              </div>
            </div>
            <div class="add-form-group">
              <label class="add-label">名称</label>
              <input v-model="newItemName" class="add-input" placeholder="如：氢氯噻嗪" />
            </div>
            <div class="add-form-group">
              <label class="add-label">规格/目标</label>
              <input v-model="newItemValue" class="add-input" placeholder="如：25mg × 1片" />
            </div>
            <div class="add-form-group">
              <label class="add-label">频次/说明</label>
              <input v-model="newItemDetail" class="add-input" placeholder="如：1天1次" />
            </div>
            <button class="add-confirm-btn" @click="addNewItem">确认添加</button>
          </div>
        </div>
      </van-popup>
    </div>

    <!-- V5 预警分析全屏覆盖层 -->
    <van-overlay :show="showAlertOverlay" :z-index="2000" @click="showAlertOverlay = false">
      <div class="clinical-overlay" @click.stop>
        <div class="overlay-header">
          <span class="overlay-title">预警深度分析</span>
          <van-icon name="cross" class="overlay-close" @click="showAlertOverlay = false" />
        </div>
        <div class="overlay-content">
          <div class="analysis-section">
            <div class="section-label">AI 评估摘要</div>
            <div class="ai-summary-box">
              <p>{{ alertAnalysis.aiSummary }}</p>
            </div>
          </div>
          <div class="analysis-section">
            <div class="section-label">7日异常分布（环比上周）</div>
            <div class="distribution-chart">
              <div class="dist-row">
                <span class="dist-week">本周</span>
                <div class="dist-bars-container">
                  <div
                    v-for="(d, i) in alertDistribution.thisWeek"
                    :key="'tw'+i"
                    :class="['dist-bar-clinical', { active: d > 0, critical: d >= 2 }]"
                    :style="{ height: Math.min(d * 12 + 4, 40) + 'px' }"
                  >
                    <span v-if="d > 0" class="bar-num">{{ d }}</span>
                  </div>
                </div>
                <span class="dist-total">{{ alertDistribution.thisWeekTotal }}</span>
              </div>
              <div class="dist-row muted">
                <span class="dist-week">上周</span>
                <div class="dist-bars-container">
                  <div
                    v-for="(d, i) in alertDistribution.lastWeek"
                    :key="'lw'+i"
                    :class="['dist-bar-clinical', 'last-week', { active: d > 0 }]"
                    :style="{ height: Math.min(d * 12 + 4, 40) + 'px' }"
                  ></div>
                </div>
                <span class="dist-total">{{ alertDistribution.lastWeekTotal }}</span>
              </div>
              <div class="dist-labels">
                <span v-for="d in ['一','二','三','四','五','六','日']" :key="d">{{ d }}</span>
              </div>
            </div>
          </div>
          <div class="analysis-section">
            <div class="section-label">临床干预建议</div>
            <div class="intervention-list">
              <div v-for="(item, idx) in alertAnalysis.interventions" :key="idx" class="intervention-item">
                <span class="intervention-priority" :class="item.priority">{{ item.priorityLabel }}</span>
                <span class="intervention-text">{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-overlay>

    <!-- V5 趋势报告全屏覆盖层 -->
    <van-overlay :show="showReportOverlay" :z-index="2000" @click="showReportOverlay = false">
      <div class="clinical-overlay" @click.stop>
        <div class="overlay-header">
          <span class="overlay-title">7日趋势报告</span>
          <van-icon name="cross" class="overlay-close" @click="showReportOverlay = false" />
        </div>
        <div class="overlay-content">
          <div class="analysis-section">
            <div class="section-label">综合评估</div>
            <div class="ai-summary-box">
              <p>{{ trendReport.summary }}</p>
            </div>
          </div>
          <div class="analysis-section">
            <div class="section-label">各指标趋势</div>
            <div class="trend-indicators">
              <div v-for="ind in trendReport.indicators" :key="ind.key" class="trend-ind-item">
                <span class="ind-name">{{ ind.name }}</span>
                <span :class="['ind-trend', ind.trend]">{{ ind.trendText }}</span>
                <span class="ind-detail">{{ ind.detail }}</span>
              </div>
            </div>
          </div>
          <div class="analysis-section">
            <div class="section-label">重点关注</div>
            <div class="focus-points">
              <div v-for="(point, idx) in trendReport.focusPoints" :key="idx" class="focus-item">
                <span class="focus-icon">!</span>
                <span class="focus-text">{{ point }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-overlay>

    <!-- V5 事件列表弹窗 -->
    <van-popup v-model:show="showEventListModal" position="bottom" round :style="{ height: '40%' }">
      <div class="event-list-popup">
        <div class="popup-header">
          <span class="popup-title">{{ currentEventTime }} 事件详情</span>
          <van-icon name="cross" class="popup-close" @click="showEventListModal = false" />
        </div>
        <div class="event-list-content">
          <div v-for="(ev, idx) in currentEventList" :key="idx" class="event-detail-row">
            <span :class="['event-cat-icon', ev.category]"></span>
            <span class="event-desc">{{ ev.description }}</span>
            <span class="event-time-detail">{{ ev.exactTime }}</span>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- V5 历史明细弹窗 -->
    <van-popup v-model:show="showHistoryDetail" position="bottom" round :style="{ height: '75%' }">
      <div class="history-detail-popup">
        <div class="popup-header">
          <span class="popup-title">{{ currentMetricLabel }} 历史明细</span>
          <van-icon name="cross" class="popup-close" @click="showHistoryDetail = false" />
        </div>
        <div class="history-list">
          <div
            v-for="(record, idx) in metricHistoryData"
            :key="idx"
            :class="['history-row', { abnormal: record.isAbnormal, critical: record.isCritical }]"
          >
            <div class="history-datetime">
              <span class="h-date">{{ record.date }}</span>
              <span class="h-time">{{ record.time }}</span>
            </div>
            <div class="history-value">
              <span class="h-val">{{ record.value }}</span>
              <span class="h-unit">{{ metricAnalysis.unit }}</span>
            </div>
            <span :class="['history-tag', record.status]">{{ record.statusLabel }}</span>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 历史咨询记录弹窗 -->
    <van-popup v-model:show="showHistoryConsult" position="bottom" round :style="{ height: '75%' }">
      <div class="history-consult-popup">
        <div class="popup-header">
          <span class="popup-title">历史咨询记录</span>
          <van-icon name="cross" class="popup-close" @click="showHistoryConsult = false" />
        </div>
        <div class="consult-list">
          <div
            v-for="(record, idx) in historyConsultRecords"
            :key="idx"
            class="consult-record-card"
            @click="openConsultDetail(record)"
          >
            <div class="consult-record-header">
              <span class="consult-date">{{ record.date }}</span>
              <span :class="['consult-type-badge', record.typeColor]">{{ record.type }}</span>
            </div>
            <div class="consult-record-body">
              <div class="consult-summary-row">
                <span class="summary-label">主诉</span>
                <span class="summary-value">{{ record.chiefComplaint }}</span>
              </div>
              <div class="consult-summary-row">
                <span class="summary-label">诊断</span>
                <span class="summary-value">{{ record.diagnosis }}</span>
              </div>
            </div>
            <div class="consult-record-footer">
              <span class="consult-doctor">{{ record.doctor }}</span>
              <van-icon name="arrow" class="arrow-icon" />
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 咨询详情弹窗 -->
    <van-popup v-model:show="showConsultDetail" position="bottom" round :style="{ height: '80%' }">
      <div class="consult-detail-popup" v-if="currentConsultDetail">
        <div class="popup-header">
          <span class="popup-title">咨询详情</span>
          <van-icon name="cross" class="popup-close" @click="showConsultDetail = false" />
        </div>
        <div class="consult-detail-content">
          <div class="detail-meta">
            <span class="detail-date">{{ currentConsultDetail.date }}</span>
            <span :class="['consult-type-badge', currentConsultDetail.typeColor]">{{ currentConsultDetail.type }}</span>
          </div>
          <div class="detail-section">
            <h4>主诉</h4>
            <p>{{ currentConsultDetail.chiefComplaint }}</p>
          </div>
          <div class="detail-section">
            <h4>印象诊断</h4>
            <p>{{ currentConsultDetail.diagnosis }}</p>
          </div>
          <div class="detail-section">
            <h4>健康建议</h4>
            <ul class="detail-advice-list">
              <li v-for="(advice, i) in currentConsultDetail.advices" :key="i">{{ advice }}</li>
            </ul>
          </div>
          <div class="detail-section">
            <h4>就诊医生</h4>
            <p>{{ currentConsultDetail.doctor }}</p>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 健康资料全量时间轴弹窗 -->
    <van-popup v-model:show="showHealthTimeline" position="bottom" round :style="{ height: '80%' }">
      <div class="timeline-popup">
        <div class="popup-header">
          <span class="popup-title">健康资料时间轴</span>
          <van-icon name="cross" class="popup-close" @click="showHealthTimeline = false" />
        </div>
        <div class="timeline-container">
          <div class="timeline-line"></div>
          <div v-for="(item, idx) in healthTimelineData" :key="idx" class="timeline-node">
            <div class="timeline-dot-wrapper">
              <div :class="['timeline-node-dot', item.typeColor]"></div>
            </div>
            <div class="timeline-card">
              <div class="timeline-card-header">
                <span class="timeline-card-title">{{ item.title }}</span>
                <span :class="['timeline-type-badge', item.typeColor]">{{ item.typeLabel }}</span>
              </div>
              <p class="timeline-card-summary">{{ item.summary }}</p>
              <div class="timeline-card-footer">
                <span class="timeline-card-date">{{ item.date }}</span>
                <span class="timeline-card-dept">{{ item.department }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 体征历史趋势弹窗 -->
    <van-popup v-model:show="showVitalHistory" position="bottom" round :style="{ height: '85%' }">
      <div class="vital-history-popup">
        <div class="popup-header">
          <span class="popup-title">{{ currentVitalInfo.title }}</span>
          <van-icon name="cross" class="popup-close" @click="showVitalHistory = false" />
        </div>
        <div class="vital-history-content">
          <!-- AI 趋势分析卡片 -->
          <div class="ai-analysis-card">
            <div class="ai-header">
              <span class="ai-icon">&#10024;</span>
              <span class="ai-title">AI 趋势分析</span>
            </div>
            <p class="ai-content">{{ currentVitalInfo.aiAnalysis }}</p>
          </div>

          <!-- 历史记录时间轴 -->
          <div class="history-section">
            <div class="history-title">近期记录</div>
            <div class="vital-history-list">
              <div
                v-for="(record, idx) in vitalHistoryRecords"
                :key="idx"
                class="vital-history-item"
              >
                <div class="vh-time">{{ record.time }}</div>
                <div class="vh-body">
                  <span :class="['vh-value', { abnormal: record.isAbnormal }]">
                    {{ record.value }}
                  </span>
                  <span class="vh-unit">{{ record.unit }}</span>
                </div>
                <span :class="['vh-tag', record.status]">{{ record.statusLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 资料类型弹窗 -->
    <van-popup v-model:show="showArchivePopup" position="bottom" round :style="{ height: '70%' }">
      <div class="archive-popup">
        <div class="popup-header">
          <span class="popup-title">{{ currentArchive?.label }}</span>
          <van-icon name="cross" class="popup-close" @click="showArchivePopup = false" />
        </div>
        <div class="archive-timeline">
          <div v-for="(record, idx) in archiveRecords" :key="idx" class="archive-record">
            <div class="record-date">{{ record.date }}</div>
            <div class="record-dot"></div>
            <div class="record-content">
              <span class="record-type">{{ record.type }}</span>
              <span class="record-dept">{{ record.department }}</span>
            </div>
          </div>
          <div v-if="archiveRecords.length === 0" class="empty-hint">
            暂无{{ currentArchive?.label }}记录
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getPatients } from '@/api'
import type { Patient, PatientStatus } from '@/api'

const router = useRouter()
const route = useRoute()

const patientId = computed(() => Number(route.params.id))
const patient = ref<Patient | null>(null)
const loading = ref(true)
const activeTab = ref<'profile' | 'data' | 'plan'>('profile')
const showHistoryConsult = ref(false)
const showConsultDetail = ref(false)
const showHealthTimeline = ref(false)
const showArchivePopup = ref(false)
const currentArchive = ref<{ key: string; label: string } | null>(null)

// 体征历史相关
const showVitalHistory = ref(false)
const currentVitalType = ref<'bp' | 'glucose' | 'hr' | 'bmi'>('bp')
const vitalHistoryRecords = ref<Array<{
  time: string
  value: string
  unit: string
  isAbnormal: boolean
  status: string
  statusLabel: string
}>>([])

// 体征信息配置
const vitalInfoConfig = {
  bp: {
    title: '血压趋势与历史',
    unit: 'mmHg',
    aiAnalysis: '基于近 7 日数据分析，患者血压控制整体稳定，收缩压波动范围 125-142 mmHg。2月5日早晨出现一次峰值（142/95），可能与前夜睡眠质量相关。建议保持规律作息，避免情绪波动。',
  },
  glucose: {
    title: '血糖趋势与历史',
    unit: 'mmol/L',
    aiAnalysis: '基于近 7 日数据分析，患者空腹血糖控制尚不稳定，波动范围 5.8-9.2 mmol/L。主要异常集中在早餐后 2 小时，峰值达 9.2 mmol/L。建议排查早餐饮食结构，减少精制碳水摄入。',
  },
  hr: {
    title: '心率趋势与历史',
    unit: 'bpm',
    aiAnalysis: '基于近 7 日数据分析，患者静息心率整体正常，平均 74 bpm。2月3日下午出现一次心率偏快（98 bpm），持续约15分钟后恢复，可能与当时活动量增加有关。整体心律规整，无明显异常。',
  },
  bmi: {
    title: 'BMI 变化趋势',
    unit: 'kg/m²',
    aiAnalysis: '基于近 30 日数据分析，患者 BMI 呈轻微下降趋势，从 25.1 降至 24.5，减重约 1.2kg。当前处于超重边缘，建议继续保持运动习惯，目标 BMI 控制在 24 以下。',
  },
}

// 体征历史 Mock 数据
const vitalHistoryMock = {
  bp: [
    { time: '今日 08:30', value: '128/82', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '昨日 21:00', value: '135/88', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '昨日 08:15', value: '142/95', isAbnormal: true, status: 'high', statusLabel: '偏高' },
    { time: '02/04 20:30', value: '130/84', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '02/04 07:45', value: '138/90', isAbnormal: true, status: 'high', statusLabel: '偏高' },
    { time: '02/03 21:15', value: '126/80', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '02/03 08:00', value: '132/86', isAbnormal: false, status: 'normal', statusLabel: '正常' },
  ],
  glucose: [
    { time: '今日 07:15', value: '6.2', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '昨日 11:30', value: '9.2', isAbnormal: true, status: 'high', statusLabel: '偏高' },
    { time: '昨日 06:50', value: '5.8', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '02/04 12:00', value: '8.5', isAbnormal: true, status: 'high', statusLabel: '偏高' },
    { time: '02/04 07:00', value: '6.5', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '02/03 07:20', value: '6.8', isAbnormal: false, status: 'normal', statusLabel: '正常' },
  ],
  hr: [
    { time: '今日 08:30', value: '76', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '昨日 20:00', value: '72', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '昨日 08:00', value: '78', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '02/04 15:30', value: '85', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '02/03 16:45', value: '98', isAbnormal: true, status: 'high', statusLabel: '偏快' },
    { time: '02/03 08:15', value: '70', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    { time: '02/02 21:00', value: '68', isAbnormal: false, status: 'normal', statusLabel: '正常' },
  ],
  bmi: [
    { time: '02/06', value: '24.5', isAbnormal: false, status: 'warning', statusLabel: '偏高' },
    { time: '01/30', value: '24.8', isAbnormal: false, status: 'warning', statusLabel: '偏高' },
    { time: '01/23', value: '24.9', isAbnormal: false, status: 'warning', statusLabel: '偏高' },
    { time: '01/16', value: '25.1', isAbnormal: true, status: 'high', statusLabel: '超重' },
    { time: '01/09', value: '25.3', isAbnormal: true, status: 'high', statusLabel: '超重' },
  ],
}

// 当前体征信息
const currentVitalInfo = computed(() => {
  const config = vitalInfoConfig[currentVitalType.value]
  return {
    title: config.title,
    aiAnalysis: config.aiAnalysis,
  }
})

// 打开体征历史
const openVitalHistory = (type: 'bp' | 'glucose' | 'hr' | 'bmi') => {
  currentVitalType.value = type
  const config = vitalInfoConfig[type]
  vitalHistoryRecords.value = vitalHistoryMock[type].map(record => ({
    ...record,
    unit: config.unit,
  }))
  showVitalHistory.value = true
}

// ========== 指标数据 Tab 重构 ==========
const currentMetric = ref<'bp' | 'glucose' | 'hr' | 'weight'>('bp')
const currentTimePeriod = ref<'7d' | '30d'>('7d') // 固定为7d，已移除时间切换
const selectedChartPoint = ref<number | null>(null)

const metricTabs = [
  { key: 'bp' as const, label: '血压' },
  { key: 'glucose' as const, label: '血糖' },
  { key: 'hr' as const, label: '心率' },
  { key: 'weight' as const, label: '体重' },
]

// 指标分析配置
const metricAnalysisConfig = {
  bp: {
    unit: 'mmHg',
    yAxisMax: 180,
    yAxisMid: 140,
    yAxisMin: 100,
    safeMin: 90,
    safeMax: 140,
    aiSummary7d: '血压近7日波动加剧，收缩压最高达 158mmHg（02/04 早），平均 132mmHg。清晨时段血压偏高，建议关注晨起后1小时内测量数据。',
    aiSummary30d: '血压近30日整体呈下降趋势，从月初平均 142mmHg 降至 132mmHg。但仍有3次超过150mmHg的异常记录，需继续观察。',
    average7d: '132',
    average30d: '136',
    compliance7d: 71,
    compliance30d: 68,
    max7d: '158',
    max30d: '168',
    min7d: '118',
    min30d: '112',
  },
  glucose: {
    unit: 'mmol/L',
    yAxisMax: 12,
    yAxisMid: 8,
    yAxisMin: 4,
    safeMin: 3.9,
    safeMax: 7.0,
    aiSummary7d: '空腹血糖控制尚不稳定，波动范围 5.8-9.2 mmol/L。餐后2小时血糖普遍偏高，峰值达 9.2 mmol/L，建议调整早餐结构。',
    aiSummary30d: '血糖近30日有改善趋势，糖化血红蛋白估算值约 7.1%。但餐后血糖仍需加强管理，建议增加餐后运动。',
    average7d: '6.8',
    average30d: '7.2',
    compliance7d: 62,
    compliance30d: 55,
    max7d: '9.2',
    max30d: '10.5',
    min7d: '5.2',
    min30d: '4.8',
  },
  hr: {
    unit: 'bpm',
    yAxisMax: 120,
    yAxisMid: 90,
    yAxisMin: 60,
    safeMin: 60,
    safeMax: 100,
    aiSummary7d: '静息心率整体正常，平均 74 bpm。02/03下午出现一次心率偏快（98 bpm），持续约15分钟后恢复，可能与活动量增加有关。',
    aiSummary30d: '心率近30日保持稳定，平均 72 bpm，夜间心率平均 62 bpm。未发现明显心律不齐现象，心脏功能评估良好。',
    average7d: '74',
    average30d: '72',
    compliance7d: 92,
    compliance30d: 94,
    max7d: '98',
    max30d: '105',
    min7d: '62',
    min30d: '58',
  },
  weight: {
    unit: 'kg',
    yAxisMax: 85,
    yAxisMid: 75,
    yAxisMin: 65,
    safeMin: 60,
    safeMax: 75,
    aiSummary7d: '体重近7日保持平稳，均值 72.3kg，BMI 24.5。波动范围在 0.5kg 以内，提示饮食和运动控制良好。',
    aiSummary30d: '体重近30日呈缓慢下降趋势，从月初 73.8kg 降至 72.3kg，减重约 1.5kg，符合预期管理目标。',
    average7d: '72.3',
    average30d: '73.0',
    compliance7d: 85,
    compliance30d: 80,
    max7d: '72.8',
    max30d: '73.8',
    min7d: '71.9',
    min30d: '72.0',
  },
}

// 图表数据 Mock
const chartDataMock = {
  bp: {
    '7d': [
      { date: '02/01', time: '02/01 08:00', value: 128, displayValue: '128', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/02', time: '02/02 07:45', value: 135, displayValue: '135', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/03', time: '02/03 08:15', value: 142, displayValue: '142', isAbnormal: true, status: 'high', statusLabel: '偏高' },
      { date: '02/04', time: '02/04 07:30', value: 158, displayValue: '158', isAbnormal: true, status: 'critical', statusLabel: '极高' },
      { date: '02/05', time: '02/05 08:00', value: 138, displayValue: '138', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/06', time: '02/06 08:30', value: 128, displayValue: '128', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '今日', time: '今日 08:30', value: 126, displayValue: '126', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    ],
    '30d': [
      { date: '01/08', time: '01/08', value: 145, displayValue: '145', isAbnormal: true, status: 'high', statusLabel: '偏高' },
      { date: '01/15', time: '01/15', value: 168, displayValue: '168', isAbnormal: true, status: 'critical', statusLabel: '极高' },
      { date: '01/22', time: '01/22', value: 138, displayValue: '138', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '01/29', time: '01/29', value: 142, displayValue: '142', isAbnormal: true, status: 'high', statusLabel: '偏高' },
      { date: '02/03', time: '02/03', value: 135, displayValue: '135', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '今日', time: '今日', value: 128, displayValue: '128', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    ],
  },
  glucose: {
    '7d': [
      { date: '02/01', time: '02/01 07:00', value: 6.5, displayValue: '6.5', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/02', time: '02/02 07:15', value: 5.8, displayValue: '5.8', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/03', time: '02/03 07:20', value: 7.8, displayValue: '7.8', isAbnormal: true, status: 'high', statusLabel: '偏高' },
      { date: '02/04', time: '02/04 07:00', value: 9.2, displayValue: '9.2', isAbnormal: true, status: 'critical', statusLabel: '极高' },
      { date: '02/05', time: '02/05 06:50', value: 6.8, displayValue: '6.8', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/06', time: '02/06 07:10', value: 7.2, displayValue: '7.2', isAbnormal: true, status: 'high', statusLabel: '偏高' },
      { date: '今日', time: '今日 07:15', value: 6.2, displayValue: '6.2', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    ],
    '30d': [
      { date: '01/08', time: '01/08', value: 8.5, displayValue: '8.5', isAbnormal: true, status: 'high', statusLabel: '偏高' },
      { date: '01/15', time: '01/15', value: 10.5, displayValue: '10.5', isAbnormal: true, status: 'critical', statusLabel: '极高' },
      { date: '01/22', time: '01/22', value: 7.2, displayValue: '7.2', isAbnormal: true, status: 'high', statusLabel: '偏高' },
      { date: '01/29', time: '01/29', value: 6.8, displayValue: '6.8', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/03', time: '02/03', value: 7.5, displayValue: '7.5', isAbnormal: true, status: 'high', statusLabel: '偏高' },
      { date: '今日', time: '今日', value: 6.2, displayValue: '6.2', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    ],
  },
  hr: {
    '7d': [
      { date: '02/01', time: '02/01 08:00', value: 72, displayValue: '72', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/02', time: '02/02 08:15', value: 76, displayValue: '76', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/03', time: '02/03 16:45', value: 98, displayValue: '98', isAbnormal: true, status: 'high', statusLabel: '偏快' },
      { date: '02/04', time: '02/04 08:00', value: 74, displayValue: '74', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/05', time: '02/05 08:30', value: 70, displayValue: '70', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/06', time: '02/06 07:45', value: 68, displayValue: '68', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '今日', time: '今日 08:30', value: 76, displayValue: '76', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    ],
    '30d': [
      { date: '01/08', time: '01/08', value: 78, displayValue: '78', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '01/15', time: '01/15', value: 105, displayValue: '105', isAbnormal: true, status: 'critical', statusLabel: '过快' },
      { date: '01/22', time: '01/22', value: 72, displayValue: '72', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '01/29', time: '01/29', value: 68, displayValue: '68', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/03', time: '02/03', value: 74, displayValue: '74', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '今日', time: '今日', value: 76, displayValue: '76', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    ],
  },
  weight: {
    '7d': [
      { date: '02/01', time: '02/01 07:00', value: 72.5, displayValue: '72.5', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/02', time: '02/02 07:10', value: 72.8, displayValue: '72.8', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/03', time: '02/03 07:05', value: 72.3, displayValue: '72.3', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/04', time: '02/04 07:15', value: 72.6, displayValue: '72.6', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/05', time: '02/05 07:00', value: 72.1, displayValue: '72.1', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/06', time: '02/06 07:20', value: 71.9, displayValue: '71.9', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '今日', time: '今日 07:10', value: 72.2, displayValue: '72.2', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    ],
    '30d': [
      { date: '01/08', time: '01/08', value: 73.8, displayValue: '73.8', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '01/15', time: '01/15', value: 73.5, displayValue: '73.5', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '01/22', time: '01/22', value: 73.0, displayValue: '73.0', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '01/29', time: '01/29', value: 72.5, displayValue: '72.5', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '02/03', time: '02/03', value: 72.3, displayValue: '72.3', isAbnormal: false, status: 'normal', statusLabel: '正常' },
      { date: '今日', time: '今日', value: 72.2, displayValue: '72.2', isAbnormal: false, status: 'normal', statusLabel: '正常' },
    ],
  },
}

// 历史数据 Mock
const historyDataMock = {
  bp: [
    { date: '今日', time: '08:30', value: '128/82', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '昨日', time: '21:00', value: '135/88', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '昨日', time: '08:15', value: '142/95', isAbnormal: true, isCritical: false, status: 'high', statusLabel: '偏高' },
    { date: '02/04', time: '20:30', value: '130/84', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/04', time: '07:30', value: '158/102', isAbnormal: true, isCritical: true, status: 'critical', statusLabel: '极高' },
    { date: '02/03', time: '21:15', value: '126/80', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/03', time: '08:00', value: '132/86', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/02', time: '20:45', value: '128/82', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/02', time: '07:45', value: '138/90', isAbnormal: true, isCritical: false, status: 'high', statusLabel: '偏高' },
  ],
  glucose: [
    { date: '今日', time: '07:15', value: '6.2', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '昨日', time: '11:30', value: '9.2', isAbnormal: true, isCritical: true, status: 'critical', statusLabel: '极高' },
    { date: '昨日', time: '06:50', value: '5.8', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/04', time: '12:00', value: '8.5', isAbnormal: true, isCritical: false, status: 'high', statusLabel: '偏高' },
    { date: '02/04', time: '07:00', value: '6.5', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/03', time: '11:45', value: '7.8', isAbnormal: true, isCritical: false, status: 'high', statusLabel: '偏高' },
    { date: '02/03', time: '07:20', value: '6.8', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
  ],
  hr: [
    { date: '今日', time: '08:30', value: '76', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '昨日', time: '20:00', value: '72', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '昨日', time: '08:00', value: '78', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/04', time: '15:30', value: '85', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/03', time: '16:45', value: '98', isAbnormal: true, isCritical: false, status: 'high', statusLabel: '偏快' },
    { date: '02/03', time: '08:15', value: '70', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/02', time: '21:00', value: '68', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
  ],
  weight: [
    { date: '今日', time: '07:10', value: '72.2', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '昨日', time: '07:20', value: '71.9', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/05', time: '07:00', value: '72.1', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/04', time: '07:15', value: '72.6', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/03', time: '07:05', value: '72.3', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/02', time: '07:10', value: '72.8', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
    { date: '02/01', time: '07:00', value: '72.5', isAbnormal: false, isCritical: false, status: 'normal', statusLabel: '正常' },
  ],
}

// 计算属性：当前指标分析
const metricAnalysis = computed(() => {
  const config = metricAnalysisConfig[currentMetric.value]
  const period = currentTimePeriod.value
  return {
    unit: config.unit,
    yAxisMax: config.yAxisMax,
    yAxisMid: config.yAxisMid,
    yAxisMin: config.yAxisMin,
    safeMin: config.safeMin,
    safeMax: config.safeMax,
    aiSummary: period === '7d' ? config.aiSummary7d : config.aiSummary30d,
    average: period === '7d' ? config.average7d : config.average30d,
    complianceRate: period === '7d' ? config.compliance7d : config.compliance30d,
    complianceClass: (period === '7d' ? config.compliance7d : config.compliance30d) >= 80 ? 'good' : (period === '7d' ? config.compliance7d : config.compliance30d) >= 60 ? 'warning' : 'danger',
    max: period === '7d' ? config.max7d : config.max30d,
    min: period === '7d' ? config.min7d : config.min30d,
  }
})

// 计算图表安全区样式
const safeZoneStyle = computed(() => {
  const config = metricAnalysisConfig[currentMetric.value]
  const range = config.yAxisMax - config.yAxisMin
  const topPercent = ((config.yAxisMax - config.safeMax) / range) * 100
  const heightPercent = ((config.safeMax - config.safeMin) / range) * 100
  return {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
  }
})

// 计算图表数据点
const chartDataPoints = computed(() => {
  const data = chartDataMock[currentMetric.value][currentTimePeriod.value]
  const config = metricAnalysisConfig[currentMetric.value]
  const range = config.yAxisMax - config.yAxisMin
  const chartWidth = 300
  const chartHeight = 120
  const padding = 10

  return data.map((item, idx) => {
    const x = padding + (idx * (chartWidth - 2 * padding)) / (data.length - 1)
    const y = chartHeight - padding - ((item.value - config.yAxisMin) / range) * (chartHeight - 2 * padding)
    return {
      x,
      y,
      value: item.displayValue,
      time: item.time,
      isAbnormal: item.isAbnormal,
      status: item.status,
      statusLabel: item.statusLabel,
    }
  })
})

// 计算折线路径
const chartPoints = computed(() => {
  return chartDataPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

// X轴标签
const chartXLabels = computed(() => {
  const data = chartDataMock[currentMetric.value][currentTimePeriod.value]
  return data.map(item => item.date)
})

// 历史数据
const metricHistoryData = computed(() => {
  return historyDataMock[currentMetric.value]
})

// 选择图表点
const selectChartPoint = (idx: number) => {
  selectedChartPoint.value = selectedChartPoint.value === idx ? null : idx
}

// 切换指标时重置选中点
const switchMetric = (key: 'bp' | 'glucose' | 'hr' | 'weight') => {
  currentMetric.value = key
  selectedChartPoint.value = null
}

// ========== V3 指标数据整合版 ==========

// 今日紧急预警
const todayUrgentAlert = computed(() => {
  const alerts = patient.value?.todayAlerts
  if (!alerts || alerts.length === 0) return null
  // 找到最严重的预警
  const critical = alerts.find((a: { level: string }) => a.level === 'danger')
  const alert = critical || alerts[0]
  const typeLabels: Record<string, string> = { bp: '血压', glucose: '血糖', hr: '心率', weight: '体重' }
  return {
    value: alert.value,
    unit: alert.unit,
    typeLabel: typeLabels[alert.alertType] || alert.alertType,
    time: formatAlertTime(alert.alertTime),
  }
})

// 7日预警分布数据
const weekAlertData = computed(() => {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const result: Array<{ label: string; hasAlert: boolean; isCritical: boolean; height: number }> = []
  const chartData = chartDataMock[currentMetric.value]['7d']

  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayLabel = days[d.getDay()]

    // 检查对应日期是否有异常
    const dataPoint = chartData[i]
    const hasAlert = dataPoint?.isAbnormal || false
    const isCritical = dataPoint?.status === 'critical'

    result.push({
      label: dayLabel,
      hasAlert,
      isCritical,
      height: hasAlert ? (isCritical ? 100 : 60) : 10,
    })
  }
  return result
})

// V3 图表数据点（高度压缩版）
const chartDataPointsV3 = computed(() => {
  const data = chartDataMock[currentMetric.value][currentTimePeriod.value]
  const config = metricAnalysisConfig[currentMetric.value]
  const range = config.yAxisMax - config.yAxisMin
  const chartWidth = 300
  const chartHeight = 100
  const padding = 8

  return data.map((item, idx) => {
    const x = padding + (idx * (chartWidth - 2 * padding)) / (data.length - 1)
    const y = chartHeight - padding - ((item.value - config.yAxisMin) / range) * (chartHeight - 2 * padding)
    return {
      x,
      y,
      value: item.displayValue,
      time: item.time,
      isAbnormal: item.isAbnormal,
      status: item.status,
      statusLabel: item.statusLabel,
    }
  })
})

// V3 折线路径
const chartPointsV3 = computed(() => {
  return chartDataPointsV3.value.map(p => `${p.x},${p.y}`).join(' ')
})

// V3 X轴标签
const chartXLabelsV3 = computed(() => {
  const data = chartDataMock[currentMetric.value][currentTimePeriod.value]
  return data.map(item => item.date)
})

// V3 历史数据
const metricHistoryDataV3 = computed(() => {
  return historyDataMock[currentMetric.value]
})

// 最近异常记录
const latestAbnormalRecord = computed(() => {
  const data = historyDataMock[currentMetric.value]
  return data.find(r => r.isAbnormal || r.isCritical) || null
})

// 除去最近异常的其他记录
const normalHistoryRecords = computed(() => {
  const data = historyDataMock[currentMetric.value]
  const abnormal = latestAbnormalRecord.value
  if (!abnormal) return data
  return data.filter(r => r !== abnormal)
})

// ========== V4 行为关联版 数据 ==========

// V4 弹窗控制
const showWeeklyReport = ref(false)
const showAllRecords = ref(false)

// 行为 Tooltip 状态
const activeBehaviorTooltip = ref<{
  icon: string
  typeLabel: string
  detail: string
  time: string
} | null>(null)

const tooltipPosition = ref<{ left: string; top: string }>({ left: '0px', top: '0px' })

// 行为记录 Tab 切换
const currentBehaviorTab = ref<'medication' | 'diet' | 'exercise'>('medication')

// 行为事件标记数据（图表上的事件轴）
const behaviorEvents = ref([
  { icon: '💊', position: 14, typeLabel: '用药', detail: '服用氨氯地平 5mg', time: '08:00' },
  { icon: '🍱', position: 28, typeLabel: '饮食', detail: '早餐：燕麦粥+水煮蛋', time: '08:30' },
  { icon: '🏃', position: 57, typeLabel: '运动', detail: '快走 30 分钟', time: '17:00' },
  { icon: '💊', position: 71, typeLabel: '用药', detail: '服用二甲双胍 0.5g', time: '19:00' },
  { icon: '🍱', position: 85, typeLabel: '饮食', detail: '晚餐：清蒸鱼+蔬菜', time: '19:30' },
])

// 行为 Tab 定义
const behaviorTabs = [
  { key: 'medication' as const, icon: '💊', label: '用药' },
  { key: 'diet' as const, icon: '🍱', label: '饮食' },
  { key: 'exercise' as const, icon: '🏃', label: '运动' },
]

// 用药记录
const medicationRecords = ref([
  { name: '氨氯地平', dose: '5mg qd', time: '今日 08:00', taken: true },
  { name: '二甲双胍', dose: '0.5g bid', time: '今日 07:30', taken: true },
  { name: '二甲双胍', dose: '0.5g bid', time: '昨日 19:00', taken: false },
  { name: '氨氯地平', dose: '5mg qd', time: '昨日 08:15', taken: true },
])

// 饮食记录
const dietRecords = ref([
  { mealType: '早餐', description: '燕麦粥+水煮蛋', time: '今日 08:30', risk: 'low', riskLabel: '健康' },
  { mealType: '午餐', description: '米饭+清炒蔬菜', time: '今日 12:00', risk: 'low', riskLabel: '健康' },
  { mealType: '晚餐', description: '清蒸鱼+蔬菜汤', time: '昨日 19:30', risk: 'low', riskLabel: '健康' },
  { mealType: '加餐', description: '蛋糕+奶茶', time: '昨日 15:00', risk: 'high', riskLabel: '高糖' },
])

// 运动数据
const exerciseData = reactive({
  todaySteps: 6580,
  goal: 8000,
  progressPercent: 82,
  weekData: [
    { label: '一', percent: 65 },
    { label: '二', percent: 78 },
    { label: '三', percent: 52 },
    { label: '四', percent: 88 },
    { label: '五', percent: 45 },
    { label: '六', percent: 92 },
    { label: '日', percent: 82 },
  ],
})

// 最近测量记录（仅3条）
const recentRecords = computed(() => {
  const data = historyDataMock[currentMetric.value]
  return data.slice(0, 3).map(r => ({
    ...r,
    status: r.status,
    statusLabel: r.statusLabel,
  }))
})

// V4 图表数据点
const chartDataPointsV4 = computed(() => {
  const data = chartDataMock[currentMetric.value][currentTimePeriod.value]
  const config = metricAnalysisConfig[currentMetric.value]
  const range = config.yAxisMax - config.yAxisMin
  const chartWidth = 300
  const chartHeight = 80
  const padding = 6

  return data.map((item, idx) => {
    const x = padding + (idx * (chartWidth - 2 * padding)) / (data.length - 1)
    const y = chartHeight - padding - ((item.value - config.yAxisMin) / range) * (chartHeight - 2 * padding)
    return {
      x,
      y,
      value: item.displayValue,
      time: item.time,
      isAbnormal: item.isAbnormal,
      status: item.status,
      statusLabel: item.statusLabel,
    }
  })
})

// V4 折线路径
const chartPointsV4 = computed(() => {
  return chartDataPointsV4.value.map(p => `${p.x},${p.y}`).join(' ')
})

// 7日预警次数
const weekAlertCount = computed(() => {
  return weekAlertData.value.filter(d => d.hasAlert).length
})

// 显示行为 Tooltip
const showBehaviorTooltip = (event: { icon: string; typeLabel: string; detail: string; time: string }, e: MouseEvent) => {
  activeBehaviorTooltip.value = event
  const target = e.target as HTMLElement
  const rect = target.getBoundingClientRect()
  tooltipPosition.value = {
    left: `${rect.left - 40}px`,
    top: `${rect.bottom + 8}px`,
  }
  // 3秒后自动关闭
  setTimeout(() => {
    if (activeBehaviorTooltip.value === event) {
      activeBehaviorTooltip.value = null
    }
  }, 3000)
}

// ========== V5 心血管专科监控系统 ==========

// V5 覆盖层控制
const showAlertOverlay = ref(false)
const showReportOverlay = ref(false)
const showEventListModal = ref(false)
const showHistoryDetail = ref(false)

// 当前指标标签
const currentMetricLabel = computed(() => {
  const labels: Record<string, string> = { bp: '血压', glucose: '血糖', hr: '心率', weight: '体重' }
  return labels[currentMetric.value] || '血压'
})

// 趋势方向与状态
const trendDirection = computed(() => {
  const compliance = metricAnalysis.value.complianceRate
  if (compliance >= 80) return 'improving'
  if (compliance >= 60) return 'stable'
  return 'declining'
})

const trendStatusText = computed(() => {
  const dir = trendDirection.value
  if (dir === 'improving') return '改善中'
  if (dir === 'stable') return '平稳'
  return '需关注'
})

// 泳道配置
const swimlaneConfig = [
  { key: 'med', label: 'Med' },
  { key: 'diet', label: 'Diet' },
  { key: 'activity', label: 'Act' },
]

// 泳道事件数据（按类别聚合）
const swimlaneEventsData = ref([
  { category: 'med', position: 14, count: 1, events: [{ description: '服用氨氯地平 5mg', exactTime: '08:00' }] },
  { category: 'diet', position: 28, count: 1, events: [{ description: '早餐：燕麦粥+水煮蛋', exactTime: '08:30' }] },
  { category: 'activity', position: 50, count: 1, events: [{ description: '快走 30分钟', exactTime: '14:00' }] },
  { category: 'med', position: 71, count: 2, events: [
    { description: '服用二甲双胍 0.5g', exactTime: '19:00' },
    { description: '服用阿司匹林 100mg', exactTime: '19:05' },
  ]},
  { category: 'diet', position: 85, count: 1, events: [{ description: '晚餐：清蒸鱼+蔬菜', exactTime: '19:30' }] },
])

// 获取某泳道的事件
const getLaneEvents = (laneKey: string) => {
  return swimlaneEventsData.value.filter(e => e.category === laneKey)
}

// 当前事件列表弹窗数据
const currentEventTime = ref('')
const currentEventList = ref<Array<{ category: string; description: string; exactTime: string }>>([])

// 显示单个事件详情
const showEventDetail = (event: { category: string; events: Array<{ description: string; exactTime: string }> }) => {
  if (event.events.length === 1) {
    // 单个事件可以用 toast 提示
  }
}

// 显示事件列表弹窗
const showEventListPopup = (event: { position: number; count: number; events: Array<{ description: string; exactTime: string }>; category: string }) => {
  currentEventTime.value = `${Math.round(event.position / 100 * 24)}:00`
  currentEventList.value = event.events.map(e => ({
    category: event.category,
    description: e.description,
    exactTime: e.exactTime,
  }))
  showEventListModal.value = true
}

// ========== 健康日志 ==========
const showHealthLogHistory = ref(false)
const healthLogFilter = ref('all')
const historyLogFilter = ref('all')
const historySelectedDate = ref('')

const healthLogFilters = [
  { key: 'all', label: '全部' },
  { key: 'med', label: '用药' },
  { key: 'diet', label: '饮食' },
  { key: 'activity', label: '运动' },
]

interface HealthLogEntry {
  time: string
  category: string
  icon: string
  typeLabel: string
  tag: string
  tagClass: string
  content: string
  aiAnalysis: string
}

const todayHealthLogs = ref<HealthLogEntry[]>([
  {
    time: '19:00',
    category: 'med',
    icon: '💊',
    typeLabel: '用药',
    tag: '已服药',
    tagClass: 'tag-blue',
    content: '服用二甲双胍 0.5g（晚餐后）',
    aiAnalysis: '',
  },
  {
    time: '14:00',
    category: 'activity',
    icon: '🏃',
    typeLabel: '运动',
    tag: '达标',
    tagClass: 'tag-green',
    content: '快走 30 分钟，步数 4,200，心率峰值 108bpm',
    aiAnalysis: '运动强度适中，心率响应正常。建议维持当前运动方案，运动后30分钟监测血糖。',
  },
  {
    time: '12:00',
    category: 'diet',
    icon: '🍽',
    typeLabel: '饮食',
    tag: '',
    tagClass: '',
    content: '午餐：米饭150g + 清炒蔬菜 + 豆腐汤',
    aiAnalysis: '碳水摄入量适中，搭配蔬菜和植物蛋白，餐后血糖影响可控。',
  },
  {
    time: '08:30',
    category: 'diet',
    icon: '🍽',
    typeLabel: '饮食',
    tag: '低GI',
    tagClass: 'tag-green',
    content: '早餐：燕麦粥 + 水煮蛋 + 核桃3颗',
    aiAnalysis: '',
  },
  {
    time: '08:00',
    category: 'med',
    icon: '💊',
    typeLabel: '用药',
    tag: '已服药',
    tagClass: 'tag-blue',
    content: '服用氨氯地平 5mg + 缬沙坦 80mg（晨起）',
    aiAnalysis: '降压药按时服用，依从性良好。结合晨起血压正常，当前方案有效。',
  },
])

// 历史日志 mock（按日期）
const historyHealthLogs: Record<string, HealthLogEntry[]> = {
  '02/08': [
    { time: '17:00', category: 'activity', icon: '🏃', typeLabel: '运动', tag: '达标', tagClass: 'tag-green', content: '太极拳 40 分钟', aiAnalysis: '' },
    { time: '12:30', category: 'diet', icon: '🍽', typeLabel: '饮食', tag: '高钠', tagClass: 'tag-red', content: '午餐：外卖炒面 + 咸鸭蛋', aiAnalysis: '该餐钠摄入预估超过2g，建议调整为低盐饮食方案。' },
    { time: '08:00', category: 'med', icon: '💊', typeLabel: '用药', tag: '已服药', tagClass: 'tag-blue', content: '服用氨氯地平 5mg + 缬沙坦 80mg', aiAnalysis: '' },
  ],
  '02/07': [
    { time: '19:30', category: 'diet', icon: '🍽', typeLabel: '饮食', tag: '', tagClass: '', content: '晚餐：清蒸鱼 + 蔬菜汤 + 杂粮饭', aiAnalysis: '' },
    { time: '15:00', category: 'activity', icon: '🏃', typeLabel: '运动', tag: '未达标', tagClass: 'tag-yellow', content: '散步 15 分钟，步数 1,800', aiAnalysis: '运动量不足，建议每日至少30分钟中等强度运动。' },
    { time: '08:00', category: 'med', icon: '💊', typeLabel: '用药', tag: '已服药', tagClass: 'tag-blue', content: '服用氨氯地平 5mg + 缬沙坦 80mg', aiAnalysis: '' },
  ],
  '02/06': [
    { time: '12:00', category: 'diet', icon: '🍽', typeLabel: '饮食', tag: '高糖', tagClass: 'tag-red', content: '午餐后加餐：蛋糕1块 + 奶茶', aiAnalysis: '高糖加餐与餐后血糖偏高直接相关，建议用坚果或水果替代。' },
    { time: '08:00', category: 'med', icon: '💊', typeLabel: '用药', tag: '漏服', tagClass: 'tag-red', content: '二甲双胍 0.5g 未服（患者反馈胃部不适）', aiAnalysis: '该患者反馈胃肠不适，可能与二甲双胍副作用有关，建议评估是否调整为肠溶剂型。' },
  ],
}

// 日历条数据（近14天）
const historyCalendarDays = computed(() => {
  const days: Array<{ date: string; weekday: string; dayNum: string; isToday: boolean; hasData: boolean }> = []
  const weekLabels = ['日', '一', '二', '三', '四', '五', '六']
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const dateStr = `${mm}/${dd}`
    days.push({
      date: dateStr,
      weekday: weekLabels[d.getDay()],
      dayNum: dd,
      isToday: i === 0,
      hasData: i === 0 || !!historyHealthLogs[dateStr],
    })
  }
  // 默认选中最新有数据的历史日（非今日）
  if (!historySelectedDate.value) {
    const latestHistory = days.filter(d => !d.isToday && d.hasData).pop()
    if (latestHistory) historySelectedDate.value = latestHistory.date
    else historySelectedDate.value = days[days.length - 1].date
  }
  return days
})

const healthLogDateLabel = computed(() => '今日')

const filteredHealthLogs = computed(() => {
  if (healthLogFilter.value === 'all') return todayHealthLogs.value
  return todayHealthLogs.value.filter(l => l.category === healthLogFilter.value)
})

const filteredHistoryLogs = computed(() => {
  const date = historySelectedDate.value
  // 今日
  const todayDate = historyCalendarDays.value.find(d => d.isToday)?.date
  const logs = date === todayDate ? todayHealthLogs.value : (historyHealthLogs[date] || [])
  if (historyLogFilter.value === 'all') return logs
  return logs.filter(l => l.category === historyLogFilter.value)
})

// 预警分析数据
const alertAnalysis = computed(() => ({
  aiSummary: `患者${currentMetricLabel.value}在过去7日内出现${weekAlertCount.value}次异常波动。主要集中在清晨时段（6:00-9:00），峰值出现在02/04，达到${metricAnalysis.value.max}${metricAnalysis.value.unit}。综合分析显示，异常与睡眠质量及服药时间相关性较高，建议调整用药方案并加强晨起监测。`,
  interventions: [
    { priority: 'high', priorityLabel: '紧急', text: '调整降压药服用时间至晚间，以控制清晨血压峰值' },
    { priority: 'medium', priorityLabel: '建议', text: '增加每日清晨血压测量，记录起床后30分钟内数据' },
    { priority: 'low', priorityLabel: '参考', text: '关注睡眠质量，必要时进行睡眠呼吸监测' },
  ],
}))

// 预警分布数据
const alertDistribution = computed(() => {
  const thisWeek = [0, 1, 0, 2, 1, 0, 0]
  const lastWeek = [1, 0, 1, 0, 0, 1, 0]
  return {
    thisWeek,
    lastWeek,
    thisWeekTotal: thisWeek.reduce((a, b) => a + b, 0),
    lastWeekTotal: lastWeek.reduce((a, b) => a + b, 0),
  }
})

// 趋势报告数据
const trendReport = computed(() => ({
  summary: `综合评估：患者本周${currentMetricLabel.value}控制${trendStatusText.value}。达标率${metricAnalysis.value.complianceRate}%。建议继续维持当前治疗方案，重点关注清晨时段的监测数据。`,
  indicators: [
    { key: 'bp', name: '血压', trend: 'improving', trendText: '↓ 改善', detail: '平均收缩压下降 5mmHg' },
    { key: 'glucose', name: '血糖', trend: 'stable', trendText: '→ 平稳', detail: '空腹血糖维持在 6.2-6.8' },
    { key: 'hr', name: '心率', trend: 'stable', trendText: '→ 平稳', detail: '静息心率 72-78 bpm' },
  ],
  focusPoints: [
    '02/04 早晨血压峰值达 158mmHg，需排查诱因',
    '餐后血糖仍有波动，建议调整饮食结构',
    '运动量达标率 85%，继续保持',
  ],
}))

// ========== 健康活动卡片数据 ==========
function computeMiniChart(values: number[], color: string) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = 30 - ((v - min) / range) * 26
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const lastX = 100
  const lastY = 30 - ((values[values.length - 1] - min) / range) * 26
  return { chartPoints: points, lastPointX: lastX.toFixed(1), lastPointY: lastY.toFixed(1), chartColor: color }
}

const activityCards = computed(() => {
  const stepsData = [8200, 9500, 11000, 10200, 13100, 11800, 12480]
  const sleepData = [7.2, 6.8, 7.5, 7.0, 8.0, 7.3, 7.75]
  const metData = [105, 118, 130, 125, 148, 135, 142]
  const standingFilled = 10
  const standingTotal = 12

  const stepsChart = computeMiniChart(stepsData, '#3B82F6')
  const sleepChart = computeMiniChart(sleepData, '#10B981')
  const metChart = computeMiniChart(metData, '#F59E0B')

  const blocks: boolean[] = []
  for (let i = 0; i < standingTotal; i++) {
    blocks.push(i < standingFilled)
  }

  return [
    {
      key: 'steps',
      title: '每日步数',
      value: '12,480',
      unit: '步',
      tag: '',
      tagClass: '',
      chartType: 'line' as const,
      ...stepsChart,
      blocks: [] as boolean[],
    },
    {
      key: 'sleep',
      title: '睡眠质量',
      value: '7h 45m',
      unit: '',
      tag: '深度睡眠达标',
      tagClass: 'tag-green',
      chartType: 'line' as const,
      ...sleepChart,
      blocks: [] as boolean[],
    },
    {
      key: 'met',
      title: '运动强度(MET)',
      value: '142',
      unit: '高',
      tag: '',
      tagClass: '',
      chartType: 'line' as const,
      ...metChart,
      blocks: [] as boolean[],
    },
    {
      key: 'standing',
      title: '站立目标',
      value: '10/12',
      unit: '次',
      tag: '',
      tagClass: '',
      chartType: 'blocks' as const,
      chartPoints: '',
      lastPointX: '0',
      lastPointY: '0',
      chartColor: '',
      blocks,
    },
  ]
})

// ========== AI健康领航数据 ==========
const aiHealthNavigator = reactive({
  generatedTime: '今日 09:00 更新',
  anomalies: [
    {
      level: 'critical',
      icon: '🔴',
      text: '该患者今晨收缩压达 158mmHg，超出安全阈值（140mmHg），为近7日最高值，需警惕高血压急症风险。',
    },
    {
      level: 'warning',
      icon: '🟡',
      text: '其餐后2小时血糖近3日均值 8.6mmol/L，呈上升趋势，提示血糖控制方案可能需要调整。',
    },
    {
      level: 'info',
      icon: '🔵',
      text: '该患者静息心率稳定在72-78bpm，未见明显异常波动。体重近7日维持在72kg左右，波动＜0.5kg。',
    },
  ],
  interventions: [
    {
      icon: '💊',
      text: '建议将降压药（氨氯地平）服用时间调整至睡前，以改善其清晨血压峰值控制。',
    },
    {
      icon: '🍽',
      text: '该患者早餐碳水摄入偏高，建议调整为低GI食物组合，控制餐后血糖波动。',
    },
    {
      icon: '📋',
      text: '建议增加晨起后30分钟内血压监测频次，连续观察3日以评估用药调整效果。',
    },
  ],
})

// ========== 干预计划数据 V3 ==========

// 弹窗控制
const showAdjustModal = ref(false)
const showGoalsModal = ref(false)
const showSchemaEdit = ref(false)
const showAiDetailModal = ref(false)
const showAddItemModal = ref(false)
const schemaEditType = ref('')
const isAiSuggestion = ref(false)

// 执行追踪维度
const currentTrackingView = ref<'day' | 'week' | 'month'>('day')
const trackingTabs = [
  { key: 'day' as const, label: '日' },
  { key: 'week' as const, label: '周' },
  { key: 'month' as const, label: '月' },
]

// 今日日期字符串
const todayDateStr = '2026-02-09 周日'

// 干预计划主数据（含周期信息）
const interventionPlan = reactive({
  planName: '高血压 2 级管理方案',
  version: 'V3.2',
  doctor: '张主任',
  startDate: '2026-01-15',
  endDate: '2026-04-15',
  currentDay: 26,
  totalDays: 90,
  progress: 29,
  medicationCompliance: 100,
  checkInCount: 3,
  checkInTotal: 4,
  checkInCompliance: 75,

  // 药物处方
  medications: [
    { name: '氨氯地平', specification: '5mg', dosage: '1片', frequency: '1天1次（晨起）', todayTaken: true, note: '避免与葡萄柚同服' },
    { name: '缬沙坦', specification: '80mg', dosage: '1片', frequency: '1天1次（晨起）', todayTaken: true, note: '' },
    { name: '阿托伐他汀', specification: '10mg', dosage: '1片', frequency: '1天1次（睡前）', todayTaken: false, note: '定期复查肝功能' },
  ],

  // 饮食干预
  dietPlan: { saltLimit: '＜5g/日', alcoholLimit: '禁酒或≤25g酒精/日' },

  // 运动处方
  exercisePlan: { targetHeartRate: '100-130 bpm', weeklyDuration: '150分钟/周', recommendedTypes: ['快走', '游泳', '太极拳'] },

  // 血压监测
  monitorPlan: { frequency: '每日2次', targetBP: '＜140/90 mmHg' },
})

// 日视图：打卡流水数据
const dailyCheckIns = ref([
  { time: '07:00', type: 'medication', typeLabel: '用药', name: '氨氯地平 + 缬沙坦', completed: true, overdue: false },
  { time: '07:30', type: 'monitor', typeLabel: '监测', name: '晨起血压测量', completed: true, overdue: false },
  { time: '08:00', type: 'diet', typeLabel: '饮食', name: '早餐打卡', completed: true, overdue: false },
  { time: '12:30', type: 'diet', typeLabel: '饮食', name: '午餐打卡', completed: false, overdue: false },
  { time: '18:00', type: 'exercise', typeLabel: '运动', name: '快走30分钟', completed: false, overdue: false },
  { time: '19:00', type: 'monitor', typeLabel: '监测', name: '晚间血压测量', completed: false, overdue: false },
  { time: '21:00', type: 'medication', typeLabel: '用药', name: '阿托伐他汀', completed: false, overdue: false },
])

// 周视图：依从性趋势数据
const weeklyTrendData = ref([
  { label: '周一', medication: 100, diet: 80, exercise: 100 },
  { label: '周二', medication: 100, diet: 100, exercise: 50 },
  { label: '周三', medication: 100, diet: 60, exercise: 100 },
  { label: '周四', medication: 66, diet: 80, exercise: 0 },
  { label: '周五', medication: 100, diet: 100, exercise: 100 },
  { label: '周六', medication: 100, diet: 80, exercise: 100 },
  { label: '周日', medication: 66, diet: 50, exercise: 0 },
])

const weeklyInsight = '本周四、周日运动执行较差，周四有漏服药情况，建议关注患者周中疲劳状态'

// 月视图：日历数据
const monthCalendarData = ref([
  // 第一周（补齐）
  { date: '', status: '', isToday: false, isFuture: false },
  { date: '', status: '', isToday: false, isFuture: false },
  { date: '', status: '', isToday: false, isFuture: false },
  { date: '', status: '', isToday: false, isFuture: false },
  { date: '', status: '', isToday: false, isFuture: false },
  { date: '1', status: 'good', isToday: false, isFuture: false },
  { date: '2', status: 'good', isToday: false, isFuture: false },
  // 第二周
  { date: '3', status: 'good', isToday: false, isFuture: false },
  { date: '4', status: 'partial', isToday: false, isFuture: false },
  { date: '5', status: 'good', isToday: false, isFuture: false },
  { date: '6', status: 'missed', isToday: false, isFuture: false },
  { date: '7', status: 'good', isToday: false, isFuture: false },
  { date: '8', status: 'good', isToday: false, isFuture: false },
  { date: '9', status: 'partial', isToday: true, isFuture: false },
  // 剩余天数为未来
  ...Array.from({ length: 19 }, (_, i) => ({ date: String(10 + i), status: '', isToday: false, isFuture: true })),
])

const monthStats = { goodDays: 6, partialDays: 2, missedDays: 1 }

// 方案编辑数据
interface SchemaEditItem {
  type: string
  typeLabel: string
  name: string
  oldValue: string
  newValue: string
  oldDetail?: string
  newDetail?: string
  detailField?: boolean
  detailLabel?: string
  modified: boolean
  detailModified?: boolean
  deleted: boolean
  aiReason?: string
}

const schemaEditItems = ref<SchemaEditItem[]>([])

// 新增项表单
const newItemType = ref('medication')
const newItemName = ref('')
const newItemValue = ref('')
const newItemDetail = ref('')
const addItemTypes = [
  { key: 'medication', label: '用药' },
  { key: 'diet', label: '饮食' },
  { key: 'exercise', label: '运动' },
  { key: 'monitor', label: '监测' },
]

// 打开方案编辑页面
const openSchemaEdit = (type: string) => {
  isAiSuggestion.value = type === 'ai'
  schemaEditType.value = type === 'ai' ? 'AI 建议调整' : type === 'medication' ? '用药调整' : '生活方式调整'

  // 初始化编辑数据（AI建议时预填修改值）
  if (type === 'ai') {
    schemaEditItems.value = [
      { type: 'medication', typeLabel: '用药', name: '氨氯地平', oldValue: '5mg × 1片', newValue: '10mg × 1片', detailField: true, detailLabel: '频次', oldDetail: '1天1次（晨起）', newDetail: '1天1次（晨起）', modified: true, detailModified: false, deleted: false, aiReason: '增加剂量以加强血压控制' },
      { type: 'medication', typeLabel: '用药', name: '缬沙坦', oldValue: '80mg × 1片', newValue: '80mg × 1片', detailField: true, detailLabel: '频次', oldDetail: '1天1次（晨起）', newDetail: '1天1次（晨起）', modified: false, detailModified: false, deleted: false },
      { type: 'medication', typeLabel: '用药', name: '阿托伐他汀', oldValue: '10mg × 1片', newValue: '10mg × 1片', detailField: true, detailLabel: '频次', oldDetail: '1天1次（睡前）', newDetail: '1天1次（睡前）', modified: false, detailModified: false, deleted: false },
      { type: 'monitor', typeLabel: '监测', name: '血压监测', oldValue: '每日2次', newValue: '每日3次', detailField: true, detailLabel: '说明', oldDetail: '', newDetail: '增加午间监测', modified: true, detailModified: true, deleted: false, aiReason: '加强血压波动监控' },
    ]
  } else {
    schemaEditItems.value = [
      { type: 'medication', typeLabel: '用药', name: '氨氯地平', oldValue: '5mg × 1片', newValue: '5mg × 1片', detailField: true, detailLabel: '频次', oldDetail: '1天1次（晨起）', newDetail: '1天1次（晨起）', modified: false, detailModified: false, deleted: false },
      { type: 'medication', typeLabel: '用药', name: '缬沙坦', oldValue: '80mg × 1片', newValue: '80mg × 1片', detailField: true, detailLabel: '频次', oldDetail: '1天1次（晨起）', newDetail: '1天1次（晨起）', modified: false, detailModified: false, deleted: false },
      { type: 'medication', typeLabel: '用药', name: '阿托伐他汀', oldValue: '10mg × 1片', newValue: '10mg × 1片', detailField: true, detailLabel: '频次', oldDetail: '1天1次（睡前）', newDetail: '1天1次（睡前）', modified: false, detailModified: false, deleted: false },
      { type: 'diet', typeLabel: '饮食', name: '限盐目标', oldValue: '＜5g/日', newValue: '＜5g/日', modified: false, deleted: false },
      { type: 'exercise', typeLabel: '运动', name: '运动时长', oldValue: '150分钟/周', newValue: '150分钟/周', modified: false, deleted: false },
      { type: 'monitor', typeLabel: '监测', name: '血压监测', oldValue: '每日2次', newValue: '每日2次', modified: false, deleted: false },
    ]
  }

  showSchemaEdit.value = true
}

// 标记删除
const markItemDeleted = (idx: number) => {
  schemaEditItems.value[idx].deleted = true
}

// 恢复删除
const restoreItem = (idx: number) => {
  schemaEditItems.value[idx].deleted = false
}

// 新增处方项
const addNewItem = () => {
  if (!newItemName.value || !newItemValue.value) return
  schemaEditItems.value.push({
    type: newItemType.value,
    typeLabel: addItemTypes.find(t => t.key === newItemType.value)?.label || '',
    name: newItemName.value,
    oldValue: '（新增）',
    newValue: newItemValue.value,
    detailField: !!newItemDetail.value,
    detailLabel: '说明',
    oldDetail: '',
    newDetail: newItemDetail.value,
    modified: true,
    detailModified: !!newItemDetail.value,
    deleted: false,
  })
  // 重置表单
  newItemName.value = ''
  newItemValue.value = ''
  newItemDetail.value = ''
  showAddItemModal.value = false
}

// 确认编辑
const confirmSchemaEdit = () => {
  showSchemaEdit.value = false
}

// AI 决策支持

// AI 决策支持
const aiDecisionSupport = computed(() => {
  const bpControlGood = metricAnalysis.value.complianceRate >= 80
  const medicationCompliant = interventionPlan.medicationCompliance >= 100

  if (!bpControlGood && medicationCompliant) {
    return {
      suggestion: '检测到血压控制不佳且用药依从性100%，建议复核药物耐受性或考虑联合用药。可评估是否需要增加钙通道阻滞剂剂量或添加利尿剂。',
      metrics: [
        { label: '血压达标率', value: metricAnalysis.value.complianceRate + '%', status: 'warning' },
        { label: '用药依从性', value: '100%', status: 'good' },
        { label: '建议优先级', value: '中等', status: 'warning' },
      ],
    }
  } else if (!bpControlGood && !medicationCompliant) {
    return {
      suggestion: '检测到血压控制不佳且存在漏服药情况，建议首先加强用药提醒，评估患者依从性障碍原因后再考虑调整方案。',
      metrics: [
        { label: '血压达标率', value: metricAnalysis.value.complianceRate + '%', status: 'warning' },
        { label: '用药依从性', value: interventionPlan.medicationCompliance + '%', status: 'warning' },
        { label: '建议优先级', value: '高', status: 'danger' },
      ],
    }
  } else {
    return {
      suggestion: '当前干预方案执行良好，血压控制达标。建议维持现有治疗方案，继续定期监测，关注生活方式干预的持续性。',
      metrics: [
        { label: '血压达标率', value: metricAnalysis.value.complianceRate + '%', status: 'good' },
        { label: '用药依从性', value: '100%', status: 'good' },
        { label: '方案状态', value: '稳定', status: 'good' },
      ],
    }
  }
})

// 处理方案调整选项
const handleAdjustOption = (type: string) => {
  showAdjustModal.value = false
  // 实际应用中跳转到对应的调整页面
  console.log('调整类型:', type)
}

// 临床图表数据点
const chartDataPointsClinical = computed(() => {
  const data = chartDataMock[currentMetric.value][currentTimePeriod.value]
  const config = metricAnalysisConfig[currentMetric.value]
  const range = config.yAxisMax - config.yAxisMin
  const chartWidth = 280
  const chartHeight = 100
  const padding = 10

  return data.map((item, idx) => {
    const x = padding + (idx * (chartWidth - 2 * padding)) / (data.length - 1)
    const y = chartHeight - padding - ((item.value - config.yAxisMin) / range) * (chartHeight - 2 * padding)
    return {
      x,
      y,
      value: item.displayValue,
      time: item.time,
      isAbnormal: item.isAbnormal,
      status: item.status,
      statusLabel: item.statusLabel,
    }
  })
})

// 临床折线路径
const chartPointsClinical = computed(() => {
  return chartDataPointsClinical.value.map(p => `${p.x},${p.y}`).join(' ')
})

// 安全区域图表坐标
const safeZoneChartY = computed(() => {
  const config = metricAnalysisConfig[currentMetric.value]
  const range = config.yAxisMax - config.yAxisMin
  return ((config.yAxisMax - config.safeMax) / range) * 100
})

const safeZoneChartHeight = computed(() => {
  const config = metricAnalysisConfig[currentMetric.value]
  const range = config.yAxisMax - config.yAxisMin
  return ((config.safeMax - config.safeMin) / range) * 100
})

// 当前查看的咨询详情
const currentConsultDetail = ref<{
  date: string
  type: string
  typeColor: string
  chiefComplaint: string
  diagnosis: string
  advices: string[]
  doctor: string
} | null>(null)

const tabs = [
  { key: 'profile' as const, label: '健康档案', icon: 'idcard' },
  { key: 'data' as const, label: '指标数据', icon: 'chart-trending-o' },
  { key: 'plan' as const, label: '干预计划', icon: 'todo-list-o' },
]

// 健康评分（模拟数据）- 升级版含趋势
const healthScore = computed(() => {
  const status = patient.value?.status
  if (status === 'urgent') {
    return { value: 45, level: 'danger', levelText: '极高危', advice: '建议立即就医，严格控制血压血糖', trendDir: 'down', trendValue: 3 }
  } else if (status === 'attention') {
    return { value: 68, level: 'warning', levelText: '中高危', advice: '需密切关注指标变化，按时服药', trendDir: 'up', trendValue: 2 }
  } else if (status === 'stable') {
    return { value: 85, level: 'good', levelText: '低危', advice: '继续保持良好的生活习惯', trendDir: 'up', trendValue: 5 }
  }
  return { value: 72, level: 'warning', levelText: '待评估', advice: '请及时完成健康监测', trendDir: 'up', trendValue: 0 }
})

// 最新体征（模拟数据） - 升级版，包含BMI详细数据
const latestVitals = reactive({
  bp: { value: '128/82', unit: 'mmHg', time: '今日 08:30', systolic: 128, diastolic: 82 },
  glucose: { value: '6.2', unit: 'mmol/L', time: '今日 07:15' },
  hr: { value: '76', unit: 'bpm', time: '今日 08:30' },
  bmi: { value: '24.5', unit: 'kg/m²', time: '01/20', height: 172, weight: 72.5 },
})

// 体征判断逻辑
const getVitalStatus = (type: string, value: number): { status: string; label: string } => {
  switch (type) {
    case 'bp': // 血压收缩压
      if (value >= 140) return { status: 'high', label: '偏高' }
      if (value < 90) return { status: 'low', label: '偏低' }
      return { status: 'normal', label: '正常' }
    case 'glucose': // 空腹血糖
      if (value >= 7.0) return { status: 'high', label: '偏高' }
      if (value < 3.9) return { status: 'low', label: '偏低' }
      return { status: 'normal', label: '正常' }
    case 'hr': // 心率
      if (value > 100) return { status: 'high', label: '偏高' }
      if (value < 60) return { status: 'low', label: '偏低' }
      return { status: 'normal', label: '正常' }
    case 'bmi': // BMI
      if (value >= 28) return { status: 'high', label: '肥胖' }
      if (value >= 24) return { status: 'warning', label: '偏高' }
      if (value < 18.5) return { status: 'low', label: '偏低' }
      return { status: 'normal', label: '正常' }
    default:
      return { status: 'normal', label: '正常' }
  }
}

// 咨询摘要（模拟数据）
const consultSummary = reactive({
  chiefComplaint: '头晕、乏力3天，血压控制不佳',
  diagnosis: '高血压病2级（中危）；2型糖尿病',
  advices: [
    '调整降压药物剂量',
    '低盐低脂饮食',
    '每日监测血压2次',
    '适当有氧运动',
  ],
})

// 历史咨询记录（模拟数据）
const historyConsultRecords = ref([
  {
    date: '2026-02-05',
    type: '线上问诊',
    typeColor: 'blue',
    chiefComplaint: '头晕、乏力3天，血压控制不佳',
    diagnosis: '高血压病2级（中危）；2型糖尿病',
    advices: ['调整降压药物剂量', '低盐低脂饮食', '每日监测血压2次', '适当有氧运动'],
    doctor: '张医生 · 心内科',
  },
  {
    date: '2026-01-20',
    type: '门诊复诊',
    typeColor: 'green',
    chiefComplaint: '血糖波动，餐后血糖偏高',
    diagnosis: '2型糖尿病血糖控制欠佳',
    advices: ['调整胰岛素用量', '控制碳水摄入', '餐后适当活动'],
    doctor: '李医生 · 内分泌科',
  },
  {
    date: '2026-01-08',
    type: '线上问诊',
    typeColor: 'blue',
    chiefComplaint: '偶发心悸，持续约10分钟',
    diagnosis: '心律不齐待查',
    advices: ['佩戴动态心电监测', '避免剧烈运动', '保持情绪稳定'],
    doctor: '王医生 · 心内科',
  },
  {
    date: '2025-12-15',
    type: '住院',
    typeColor: 'red',
    chiefComplaint: '血压急剧升高，伴头痛恶心',
    diagnosis: '高血压急症',
    advices: ['静脉降压治疗', '严密监测生命体征', '卧床休息'],
    doctor: '张医生 · 心内科',
  },
])

// 打开咨询详情
const openConsultDetail = (record: typeof historyConsultRecords.value[0]) => {
  currentConsultDetail.value = record
  showConsultDetail.value = true
}

// 健康资料时间轴数据（聚合所有类型）
const healthTimelineData = ref([
  {
    date: '2026-02-05',
    title: '线上问诊记录',
    summary: '头晕乏力、血压控制不佳，调整降压方案',
    typeLabel: '门诊',
    typeColor: 'blue',
    department: '心内科',
  },
  {
    date: '2026-02-03',
    title: '血压监测报告',
    summary: '近7日血压趋势分析，平均收缩压135mmHg',
    typeLabel: '监测报告',
    typeColor: 'orange',
    department: '健康监测',
  },
  {
    date: '2026-01-28',
    title: '门诊复诊记录',
    summary: '糖化血红蛋白检测结果7.2%，调整用药',
    typeLabel: '门诊',
    typeColor: 'blue',
    department: '内分泌科',
  },
  {
    date: '2026-01-20',
    title: '血糖监测周报',
    summary: '空腹血糖波动范围5.8-7.5mmol/L',
    typeLabel: '监测报告',
    typeColor: 'orange',
    department: '健康监测',
  },
  {
    date: '2026-01-15',
    title: '心电图检查',
    summary: '窦性心律，偶发房性早搏',
    typeLabel: '体检',
    typeColor: 'green',
    department: '心电图室',
  },
  {
    date: '2025-12-20',
    title: '住院病历',
    summary: '高血压急症住院治疗，共住院5天',
    typeLabel: '住院',
    typeColor: 'red',
    department: '心内科',
  },
  {
    date: '2025-12-10',
    title: '胸部CT检查',
    summary: '心脏轻度增大，主动脉硬化',
    typeLabel: '影像资料',
    typeColor: 'purple',
    department: '影像科',
  },
  {
    date: '2025-11-25',
    title: '年度体检报告',
    summary: '血脂偏高，建议调整饮食结构',
    typeLabel: '体检',
    typeColor: 'green',
    department: '体检中心',
  },
])

// 健康信息五史（模拟数据）
const healthHistory = reactive({
  pastHistory: '高血压病史5年，2型糖尿病3年',
  allergyHistory: '青霉素过敏',
  medicationHistory: '氨氯地平 5mg qd，二甲双胍 0.5g bid',
  familyHistory: '父亲有高血压病史',
  personalHistory: '吸烟史10年，已戒烟2年',
})

// 健康资料类型
const archiveTypes = [
  { key: 'outpatient', label: '门诊', icon: 'service-o', color: 'blue', count: 12 },
  { key: 'inpatient', label: '住院', icon: 'hotel-o', color: 'red', count: 2 },
  { key: 'checkup', label: '体检', icon: 'todo-list-o', color: 'green', count: 5 },
  { key: 'monitor', label: '监测报告', icon: 'chart-trending-o', color: 'orange', count: 28 },
  { key: 'imaging', label: '影像资料', icon: 'photo-o', color: 'purple', count: 8 },
  { key: 'other', label: '其他', icon: 'orders-o', color: 'gray', count: 3 },
]

// 资料记录（模拟数据）
const archiveRecords = ref<Array<{ date: string; type: string; department: string }>>([])

const openArchive = (key: string) => {
  const item = archiveTypes.find(a => a.key === key)
  currentArchive.value = item ? { key: item.key, label: item.label } : null

  // 模拟数据
  archiveRecords.value = [
    { date: '2026-01-28', type: '门诊', department: '心内科' },
    { date: '2026-01-15', type: '门诊', department: '内分泌科' },
    { date: '2025-12-20', type: '门诊', department: '心内科' },
    { date: '2025-11-10', type: '门诊', department: '全科' },
  ]
  showArchivePopup.value = true
}

// 星期标签
const dayLabels = computed(() => {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const result: string[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    result.push(days[d.getDay()])
  }
  return result
})

const alertLabel = (type: string | undefined) => {
  if (!type) return ''
  const map: Record<string, string> = { glucose: '血糖', bp: '血压', hr: '心率' }
  return map[type] || type
}

const statusLabel = (status: PatientStatus | undefined) => {
  const map: Record<string, string> = {
    urgent: '紧急',
    attention: '关注',
    stable: '平稳',
    offline: '失联',
  }
  return map[status || ''] || ''
}

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 60) return `${mins}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatAlertTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadPatient = async () => {
  loading.value = true
  try {
    const patients = await getPatients() as unknown as Patient[]
    patient.value = patients.find(p => p.id === patientId.value) || null
  } catch { /* ignore */ }
  loading.value = false
}

onMounted(() => {
  loadPatient()
})
</script>

<style scoped>
.patient-detail-page {
  min-height: 100vh;
  background: #F0F2F5;
}

/* ===== Hero 入场动画 ===== */
.hero-enter {
  animation: hero-fade-in 0.4s ease-out;
}
@keyframes hero-fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 导航栏：玻璃拟态 ===== */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-back {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #323233;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s;
}
.nav-back:active { background: rgba(0, 0, 0, 0.05); }

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
}

.nav-placeholder { width: 32px; }

/* ===== 患者头部 ===== */
.patient-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  background: #FFF;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  border: 2.5px solid transparent;
}
.avatar-text {
  font-size: 22px;
  font-weight: 700;
  color: #FFF;
}

.avatar.border-urgent {
  border-color: #EF4444;
  background: linear-gradient(135deg, #EF4444, #DC2626);
}
.avatar.border-attention {
  border-color: #F59E0B;
  background: linear-gradient(135deg, #F59E0B, #D97706);
}
.avatar.border-stable {
  border-color: #10B981;
  background: linear-gradient(135deg, #10B981, #059669);
}
.avatar.border-offline {
  border-color: #9CA3AF;
  background: linear-gradient(135deg, #9CA3AF, #6B7280);
}

.pulse-ring {
  position: absolute;
  inset: -5px;
  border-radius: 18px;
  border: 2px solid #EF4444;
  animation: pulse 1.5s ease-out infinite;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.2); opacity: 0; }
}

.patient-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.name {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
}

.status-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.tag-urgent { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.tag-attention { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.tag-stable { background: rgba(16, 185, 129, 0.08); color: #059669; }
.tag-offline { background: rgba(100, 116, 139, 0.08); color: #6B7280; }

.meta-row {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748B;
}

.call-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
  font-size: 20px;
  text-decoration: none;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.call-btn:active {
  transform: scale(0.92);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

/* 骨架屏 */
.header-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  background: #FFF;
}
.sk-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(90deg, #F3F4F6 25%, #E8E9EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.sk-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sk-line {
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, #F3F4F6 25%, #E8E9EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.sk-line.w50 { width: 50%; }
.sk-line.w70 { width: 70%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== Tab 栏：玻璃拟态 ===== */
.tab-bar-glass {
  display: flex;
  padding: 6px;
  margin: 12px 16px 0;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 48px;
  z-index: 90;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 0;
  font-size: 13px;
  color: #64748B;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.tab-icon {
  font-size: 15px;
}

.tab-label {
  font-weight: 500;
}

.tab-item.active {
  background: #FFF;
  color: #3B82F6;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.12);
}

.tab-item.active .tab-icon {
  color: #3B82F6;
}

/* ===== 内容区域 ===== */
.tab-content {
  padding: 16px;
}

.content-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  background: #FFFFFF;
  border: 1px solid #F1F5F9;
  border-radius: 14px;
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 14px;
}

.section-header .section-title {
  margin-bottom: 0;
}

/* ===== 健康评分模块标题 ===== */
.section-main-title {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 14px 0;
}

/* ===== 健康评分卡片 V3 ===== */
.health-score-section-v3 {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
  padding: 14px;
}

.score-header-v3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.score-title-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFF;
  font-size: 14px;
}

.score-title-text {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
  margin: 0;
  flex: 1;
}

.score-trend {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}
.score-trend.up {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}
.score-trend.down {
  background: rgba(239, 68, 68, 0.12);
  color: #DC2626;
}

.score-body-v3 {
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
}

.score-left-v3 {
  flex-shrink: 0;
}

.score-circle-v3 {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px solid currentColor;
}
.score-circle-v3.danger { color: #EF4444; background: rgba(239, 68, 68, 0.08); }
.score-circle-v3.warning { color: #F59E0B; background: rgba(245, 158, 11, 0.08); }
.score-circle-v3.good { color: #10B981; background: rgba(16, 185, 129, 0.08); }

.score-num-v3 {
  font-size: 26px;
  font-weight: 800;
  font-family: 'SF Mono', Monaco, monospace;
  line-height: 1;
}

.score-label-v3 {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.85;
  margin-top: 2px;
}

.score-right-v3 {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-title-v3 {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 8px;
}
.risk-title-v3.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #DC2626;
}
.risk-title-v3.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #B45309;
}
.risk-title-v3.good {
  background: rgba(16, 185, 129, 0.1);
  color: #047857;
}

.risk-icon-v3 {
  font-size: 14px;
}

.risk-title-v3 strong {
  font-weight: 700;
}

.dimension-list-v3 {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dimension-item-v3 {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dim-label-v3 {
  font-size: 13px;
  color: #64748B;
  width: 56px;
  flex-shrink: 0;
}

.dim-bar-v3 {
  flex: 1;
  height: 7px;
  background: #E2E8F0;
  border-radius: 4px;
  overflow: hidden;
}

.dim-fill-v3 {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}
.dim-fill-v3.danger { background: linear-gradient(90deg, #EF4444, #F87171); }
.dim-fill-v3.warning { background: linear-gradient(90deg, #F59E0B, #FBBF24); }
.dim-fill-v3.good { background: linear-gradient(90deg, #10B981, #34D399); }

.score-advice-v3 {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 8px;
  border-left: 3px solid #3B82F6;
}

.advice-icon-v3 {
  font-size: 15px;
  color: #3B82F6;
  flex-shrink: 0;
  margin-top: 1px;
}

.score-advice-v3 span {
  font-size: 14px;
  color: #1E40AF;
  line-height: 1.5;
}

/* ===== 最新体征 V3 - 紧凑化版 ===== */
.vitals-section-v3 {
  padding: 12px;
}

.section-title-v3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 10px;
}

.vitals-grid-v3 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.vital-card-v3 {
  padding: 8px 10px;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vital-header-v3 {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vital-icon-v3 {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.vital-icon-v3.bp { background: rgba(239, 68, 68, 0.12); }
.vital-icon-v3.bp::before { content: '💓'; font-size: 10px; }
.vital-icon-v3.glucose { background: rgba(245, 158, 11, 0.12); }
.vital-icon-v3.glucose::before { content: '🩸'; font-size: 10px; }
.vital-icon-v3.hr { background: rgba(139, 92, 246, 0.12); }
.vital-icon-v3.hr::before { content: '💜'; font-size: 10px; }
.vital-icon-v3.bmi { background: rgba(59, 130, 246, 0.12); }
.vital-icon-v3.bmi::before { content: '⚖️'; font-size: 10px; }

.vital-name-v3 {
  font-size: 13px;
  color: #64748B;
  flex: 1;
}

.vital-tag-v3 {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.vital-tag-v3.normal { background: rgba(16, 185, 129, 0.12); color: #059669; }
.vital-tag-v3.high { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
.vital-tag-v3.low { background: rgba(59, 130, 246, 0.12); color: #2563EB; }
.vital-tag-v3.warning { background: rgba(245, 158, 11, 0.12); color: #D97706; }

.vital-data-v3 {
  display: flex;
  align-items: baseline;
  gap: 3px;
  padding-left: 24px;
}

.vital-value-v3 {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.vital-unit-v3 {
  font-size: 11px;
  color: #64748B;
}

.bmi-sub-v3 {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
  padding-left: 24px;
  font-family: 'SF Mono', Monaco, monospace;
}

.bmi-dot {
  color: #CBD5E1;
}

/* ===== 最新体征 V4 - 一行三列+BMI独立行 ===== */
.vitals-section-v4 {
  padding: 12px;
}

.vitals-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.vital-item-v4 {
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vital-top-v4 {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vital-icon-v4 {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.vital-icon-v4.bp { background: rgba(239, 68, 68, 0.12); }
.vital-icon-v4.bp::before { content: '💓'; font-size: 9px; }
.vital-icon-v4.glucose { background: rgba(245, 158, 11, 0.12); }
.vital-icon-v4.glucose::before { content: '🩸'; font-size: 9px; }
.vital-icon-v4.hr { background: rgba(139, 92, 246, 0.12); }
.vital-icon-v4.hr::before { content: '💜'; font-size: 9px; }
.vital-icon-v4.bmi { background: rgba(59, 130, 246, 0.12); }
.vital-icon-v4.bmi::before { content: '⚖️'; font-size: 9px; }

.vital-name-v4 {
  font-size: 12px;
  color: #64748B;
}

.vital-bottom-v4 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
}

.vital-value-v4 {
  font-size: 15px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.vital-tag-v4 {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
}
.vital-tag-v4.normal { background: rgba(16, 185, 129, 0.12); color: #059669; }
.vital-tag-v4.high { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
.vital-tag-v4.low { background: rgba(59, 130, 246, 0.12); color: #2563EB; }
.vital-tag-v4.warning { background: rgba(245, 158, 11, 0.12); color: #D97706; }

/* BMI 独立行 */
.bmi-row-v4 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
  padding: 10px 12px;
}

.bmi-left-v4 {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bmi-right-v4 {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.bmi-value-v4 {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.bmi-detail-v4 {
  font-size: 12px;
  color: #64748B;
  font-family: 'SF Mono', Monaco, monospace;
}

/* ===== 最新体征 V5 - 精修版 ===== */
.vitals-section-v5 {
  padding: 14px;
}

.vitals-row-v5 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.vital-card-v5 {
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vital-header-v5 {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.vital-left-v5 {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vital-icon-v5 {
  font-size: 14px;
  color: #94A3B8;
}

.vital-name-v5 {
  font-size: 12px;
  color: #64748B;
}

.vital-tag-v5 {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}
.vital-tag-v5.normal { background: rgba(16, 185, 129, 0.12); color: #059669; }
.vital-tag-v5.high { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
.vital-tag-v5.low { background: rgba(59, 130, 246, 0.12); color: #2563EB; }
.vital-tag-v5.warning { background: rgba(245, 158, 11, 0.12); color: #D97706; }

.vital-value-v5 {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
  line-height: 1.2;
}

.vital-time-v5 {
  font-size: 11px;
  font-weight: 300;
  color: #94A3B8;
}

/* BMI 独立行 V5 */
.bmi-row-v5 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
  padding: 12px 14px;
}

.bmi-left-v5 {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bmi-right-v5 {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bmi-value-v5 {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.bmi-divider-v5 {
  font-size: 14px;
  color: #CBD5E1;
  font-weight: 300;
}

.bmi-detail-v5 {
  font-size: 13px;
  color: #64748B;
  font-family: 'SF Mono', Monaco, monospace;
}

/* 旧版 V2 样式保留兼容 */
.health-score-section-v2 {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
  padding: 14px;
}

@keyframes risk-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.health-score-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
}

.title-icon-wrap {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.icon-blue { background: #EFF6FF; color: #3B82F6; }
.icon-green { background: #ECFDF5; color: #10B981; }
.icon-orange { background: #FFF7ED; color: #F59E0B; }
.icon-red { background: #FEF2F2; color: #EF4444; }
.icon-purple { background: #F5F3FF; color: #8B5CF6; }
.icon-gray { background: #F8FAFC; color: #64748B; }

/* 旧版健康评分样式已移除，使用 V2 版本 */

/* 旧版体征卡片样式已移除，使用紧凑版 vitals-grid-compact */

/* ===== 咨询摘要 - 布局优化 ===== */
.consult-card-v2 {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.consult-row-v2 {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 12px;
  align-items: start;
}

.consult-label {
  font-size: 13px;
  color: #64748B;
  padding-top: 2px;
  flex-shrink: 0;
}

.consult-value {
  font-size: 14px;
  color: #0F172A;
  line-height: 1.6;
}

.advice-value {
  padding: 0;
}

.advice-list-v2 {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  color: #0F172A;
  line-height: 1.8;
}

.advice-list-v2 li {
  margin-bottom: 4px;
}

.advice-list-v2 li:last-child {
  margin-bottom: 0;
}

.section-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
  font-size: 13px;
  color: #3B82F6;
  cursor: pointer;
}

/* 时间轴按钮 */
.timeline-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #3B82F6;
  padding: 4px 10px;
  background: #EFF6FF;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.timeline-btn:active {
  background: #DBEAFE;
}

/* ===== 健康信息五史 ===== */
.history-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.history-item.full-width {
  grid-column: span 2;
}

.history-label {
  font-size: 12px;
  color: #64748B;
}

.history-value {
  font-size: 14px;
  color: #0F172A;
  line-height: 1.5;
}

.history-value.text-danger {
  color: #DC2626;
  font-weight: 600;
}

/* ===== 健康资料库六宫格 ===== */
.archive-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.archive-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.archive-item:active {
  transform: scale(0.96);
  background: #F1F5F9;
}

.archive-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.archive-icon.blue { background: #EFF6FF; color: #3B82F6; }
.archive-icon.red { background: #FEF2F2; color: #EF4444; }
.archive-icon.green { background: #ECFDF5; color: #10B981; }
.archive-icon.orange { background: #FFF7ED; color: #F59E0B; }
.archive-icon.purple { background: #F5F3FF; color: #8B5CF6; }
.archive-icon.gray { background: #F8FAFC; color: #64748B; }

.archive-label {
  font-size: 13px;
  color: #0F172A;
  font-weight: 500;
}

.archive-count {
  font-size: 11px;
  color: #64748B;
}

/* ===== 历史咨询弹窗 ===== */
.history-consult-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
}

.popup-close {
  font-size: 20px;
  color: #94A3B8;
  cursor: pointer;
}

.consult-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.consult-record-card {
  background: #FFFFFF;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.consult-record-card:active {
  background: #F8FAFC;
  transform: scale(0.99);
}

.consult-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.consult-date {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.consult-type-badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.consult-type-badge.blue {
  background: #EFF6FF;
  color: #3B82F6;
}
.consult-type-badge.green {
  background: #ECFDF5;
  color: #10B981;
}
.consult-type-badge.red {
  background: #FEF2F2;
  color: #EF4444;
}
.consult-type-badge.orange {
  background: #FFF7ED;
  color: #F59E0B;
}
.consult-type-badge.purple {
  background: #F5F3FF;
  color: #8B5CF6;
}

.consult-record-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.consult-summary-row {
  display: flex;
  gap: 8px;
}

.summary-label {
  font-size: 13px;
  color: #64748B;
  flex-shrink: 0;
  width: 36px;
}

.summary-value {
  font-size: 14px;
  color: #0F172A;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.consult-record-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #F1F5F9;
}

.consult-doctor {
  font-size: 13px;
  color: #64748B;
}

.arrow-icon {
  font-size: 14px;
  color: #CBD5E1;
}

/* ===== 咨询详情弹窗 ===== */
.consult-detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.consult-detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.detail-date {
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  margin: 0 0 8px 0;
}

.detail-section p {
  font-size: 14px;
  color: #0F172A;
  line-height: 1.6;
  margin: 0;
}

.detail-advice-list {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  color: #0F172A;
  line-height: 1.8;
}

/* ===== 健康资料时间轴弹窗 ===== */
.timeline-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.timeline-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 16px 32px;
  position: relative;
}

.timeline-line {
  position: absolute;
  left: 22px;
  top: 24px;
  bottom: 24px;
  width: 2px;
  background: linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%);
  border-radius: 1px;
}

.timeline-node {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  position: relative;
}

.timeline-dot-wrapper {
  position: absolute;
  left: -26px;
  top: 16px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFF;
}

.timeline-node-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 3px solid #FFF;
  box-shadow: 0 0 0 2px currentColor;
}
.timeline-node-dot.blue { color: #3B82F6; background: #3B82F6; }
.timeline-node-dot.green { color: #10B981; background: #10B981; }
.timeline-node-dot.red { color: #EF4444; background: #EF4444; }
.timeline-node-dot.orange { color: #F59E0B; background: #F59E0B; }
.timeline-node-dot.purple { color: #8B5CF6; background: #8B5CF6; }

.timeline-card {
  flex: 1;
  background: #FFFFFF;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 14px;
}

.timeline-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.timeline-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.timeline-type-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.timeline-type-badge.blue { background: #EFF6FF; color: #3B82F6; }
.timeline-type-badge.green { background: #ECFDF5; color: #10B981; }
.timeline-type-badge.red { background: #FEF2F2; color: #EF4444; }
.timeline-type-badge.orange { background: #FFF7ED; color: #F59E0B; }
.timeline-type-badge.purple { background: #F5F3FF; color: #8B5CF6; }

.timeline-card-summary {
  font-size: 14px;
  color: #64748B;
  line-height: 1.5;
  margin: 0 0 10px 0;
}

.timeline-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #F1F5F9;
}

.timeline-card-date {
  font-size: 13px;
  color: #64748B;
  font-family: 'SF Mono', Monaco, monospace;
}

.timeline-card-dept {
  font-size: 12px;
  color: #64748B;
}

/* ===== 资料时间轴弹窗 ===== */
.archive-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.archive-timeline {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.archive-record {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  position: relative;
}
.archive-record:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 51px;
  top: 30px;
  bottom: -12px;
  width: 2px;
  background: #E2E8F0;
}

.record-date {
  width: 80px;
  flex-shrink: 0;
  font-size: 13px;
  color: #64748B;
  font-family: 'SF Mono', Monaco, monospace;
}

.record-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3B82F6;
  flex-shrink: 0;
  margin-top: 4px;
}

.record-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record-type {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.record-dept {
  font-size: 13px;
  color: #64748B;
}

/* ===== 监测概况（指标数据Tab） ===== */
.metric-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.metric-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #F8FAFC;
  border-radius: 10px;
  gap: 4px;
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}
.metric-value small {
  font-size: 11px;
  font-weight: 500;
  color: #64748B;
}
.metric-value.accent-green { color: #059669; }
.metric-value.accent-red { color: #DC2626; }

.metric-label {
  font-size: 12px;
  color: #64748B;
}

.current-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #F8FAFC;
  border-radius: 10px;
}

.cs-label {
  font-size: 13px;
  color: #64748B;
}

.cs-value {
  font-size: 13px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
}
.cs-urgent { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.cs-attention { background: rgba(245, 158, 11, 0.1); color: #D97706; }
.cs-stable { background: rgba(16, 185, 129, 0.08); color: #059669; }
.cs-offline { background: rgba(100, 116, 139, 0.08); color: #64748B; }

/* ===== 指标数据 - 预警时间线 ===== */
.alert-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding-left: 20px;
}
.alert-timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #E2E8F0;
  border-radius: 1px;
}

.alert-record {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 0;
  position: relative;
}

.timeline-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  position: absolute;
  left: -20px;
  top: 12px;
  border: 3px solid #FFF;
  box-shadow: 0 0 0 2px #E2E8F0;
}
.timeline-dot.danger {
  background: #EF4444;
  box-shadow: 0 0 0 2px #FECACA;
}
.timeline-dot.warning {
  background: #F59E0B;
  box-shadow: 0 0 0 2px #FEF3C7;
}

.alert-body {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8FAFC;
  border-radius: 10px;
  padding: 10px 14px;
}

.alert-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-val {
  font-size: 16px;
  font-weight: 700;
  font-family: 'SF Mono', Monaco, monospace;
}
.alert-val.danger { color: #DC2626; }
.alert-val.warning { color: #D97706; }

.alert-type-small {
  font-size: 12px;
  color: #64748B;
}

.alert-time-label {
  font-size: 13px;
  color: #64748B;
  font-family: 'SF Mono', Monaco, monospace;
}

/* 7日图表 */
.week-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 100px;
  padding: 12px 0 0;
}

.day-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.bar-track {
  width: 16px;
  height: 60px;
  border-radius: 8px;
  background: #F1F5F9;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 8px;
  background: linear-gradient(180deg, #EF4444, #F87171);
  transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.day-label {
  font-size: 11px;
  color: #94A3B8;
  font-weight: 500;
}

/* 最近异常 */
.latest-alert-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #FEF2F2, #FFF5F5);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #FECACA;
}

.lac-left {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.big-value {
  font-size: 30px;
  font-weight: 800;
  font-family: 'SF Mono', Monaco, monospace;
}
.big-value.danger { color: #DC2626; }
.big-value.warning { color: #D97706; }

.big-unit {
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
}

.lac-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.type-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 600;
}
.badge-glucose { background: rgba(245, 158, 11, 0.12); color: #92400E; }
.badge-bp { background: rgba(239, 68, 68, 0.1); color: #991B1B; }
.badge-hr { background: rgba(139, 92, 246, 0.1); color: #5B21B6; }

.lac-time {
  font-size: 12px;
  color: #94A3B8;
}

/* ===== 临床干预系统 V3 ===== */
.clinical-intervention-panel {
  padding-bottom: 20px;
}

/* Master Plan V3 含周期信息 */
.master-plan-card-v3 {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.mp-header-v3 {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.mp-title-section {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.mp-icon { font-size: 20px; margin-top: 2px; }

.mp-title-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mp-title {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.mp-version-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: #F1F5F9;
  color: #64748B;
  border-radius: 3px;
  font-weight: 500;
}

.mp-goals-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: #EFF6FF;
  color: #3B82F6;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.mp-goals-btn:active { background: #DBEAFE; }

/* 方案周期栏 */
.mp-period-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #FAFBFC;
  border: 1px solid #F1F5F9;
  border-radius: 8px;
  margin-bottom: 12px;
}

.period-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.period-label {
  font-size: 10px;
  color: #94A3B8;
}

.period-dates {
  font-size: 12px;
  color: #334155;
  font-weight: 500;
}

.period-stage {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stage-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #DBEAFE;
  color: #1D4ED8;
  border-radius: 4px;
  font-weight: 500;
}

.stage-text {
  font-size: 12px;
  color: #64748B;
}

.stage-text strong {
  color: #1D4ED8;
  font-weight: 600;
}

/* Dashboard */
.mp-dashboard {
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border-radius: 8px;
  padding: 10px 12px;
}

.dash-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.dash-label { font-size: 11px; color: #64748B; }

.dash-value-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dash-progress-mini {
  width: 40px;
  height: 4px;
  background: #E2E8F0;
  border-radius: 2px;
  overflow: hidden;
}

.dash-progress-fill {
  height: 100%;
  background: #3B82F6;
  border-radius: 2px;
}

.dash-value {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.dash-value.good { color: #10B981; }
.dash-value.warning { color: #F59E0B; }

.dash-divider {
  width: 1px;
  height: 28px;
  background: #E2E8F0;
  margin: 0 8px;
}

/* 执行追踪区域 */
.tracking-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tracking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.tracking-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.tracking-tabs {
  display: flex;
  background: #F1F5F9;
  border-radius: 6px;
  padding: 2px;
}

.tracking-tab {
  padding: 5px 14px;
  border: none;
  background: transparent;
  color: #64748B;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
}

.tracking-tab.active {
  background: #FFFFFF;
  color: #0F172A;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

/* 日视图 */
.tracking-day-view { }

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #F1F5F9;
}

.day-date {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
}

.day-summary {
  font-size: 12px;
  color: #64748B;
}

.checkin-timeline {
  position: relative;
  padding-left: 50px;
}

.checkin-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed #F1F5F9;
}

.checkin-item:last-child { border-bottom: none; }

.checkin-time {
  position: absolute;
  left: -50px;
  font-size: 11px;
  color: #94A3B8;
  width: 40px;
  text-align: right;
}

.checkin-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #CBD5E1;
  margin-top: 6px;
  flex-shrink: 0;
}

.checkin-item.completed .checkin-dot { background: #10B981; }
.checkin-item.missed .checkin-dot { background: #EF4444; }

.checkin-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkin-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.checkin-name {
  font-size: 13px;
  color: #334155;
}

.checkin-status {
  font-size: 11px;
  font-weight: 500;
}

.checkin-status.done { color: #10B981; }
.checkin-status.pending { color: #94A3B8; }
.checkin-status.missed { color: #EF4444; }

/* 周视图 */
.trend-chart-container { }

.trend-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748B;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.legend-dot.medication { background: #3B82F6; }
.legend-dot.diet { background: #F59E0B; }
.legend-dot.exercise { background: #10B981; }

.trend-chart {
  display: flex;
  gap: 8px;
  height: 100px;
  margin-bottom: 12px;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 9px;
  color: #94A3B8;
  width: 28px;
  text-align: right;
  padding-right: 4px;
}

.chart-bars {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  background: linear-gradient(180deg, transparent 0%, transparent 33%, #F8FAFC 33%, #F8FAFC 34%, transparent 34%, transparent 66%, #F8FAFC 66%, #F8FAFC 67%, transparent 67%);
}

.chart-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bar-group {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 80px;
}

.bar {
  width: 6px;
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}

.bar.medication { background: #3B82F6; }
.bar.diet { background: #F59E0B; }
.bar.exercise { background: #10B981; }

.day-label {
  font-size: 10px;
  color: #94A3B8;
}

.trend-insight {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px;
  background: #FEF3C7;
  border-radius: 6px;
  font-size: 11px;
  color: #92400E;
  line-height: 1.4;
}

.trend-insight .van-icon {
  color: #F59E0B;
  flex-shrink: 0;
  margin-top: 1px;
}

/* 月视图 */
.month-calendar { margin-bottom: 12px; }

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.cal-weekday {
  text-align: center;
  font-size: 10px;
  color: #94A3B8;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cal-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 6px;
  background: #F8FAFC;
}

.cal-day.today {
  background: #EFF6FF;
  border: 1px solid #3B82F6;
}

.cal-day.future {
  background: transparent;
  opacity: 0.4;
}

.cal-date {
  font-size: 11px;
  color: #334155;
}

.cal-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.cal-day.good .cal-indicator { background: #10B981; }
.cal-day.partial .cal-indicator { background: #F59E0B; }
.cal-day.missed .cal-indicator { background: #EF4444; }

.month-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-value.good { color: #10B981; }
.stat-value.warning { color: #F59E0B; }
.stat-value.danger { color: #EF4444; }

.stat-label {
  font-size: 11px;
  color: #64748B;
}

/* 统计收纳入口 */
.stats-shortcut {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 12px;
  color: #64748B;
  font-size: 13px;
  cursor: pointer;
}

.stats-shortcut:active { color: #3B82F6; }

/* AI 决策卡片 */
.ai-decision-card-v2 {
  position: relative;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.ai-glow-effect {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #818CF8, #6366F1, #818CF8);
  border-radius: 14px;
  opacity: 0.6;
  animation: ai-glow 3s ease-in-out infinite;
  z-index: 0;
}

@keyframes ai-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.01); }
}

.ai-card-inner {
  position: relative;
  background: #FFFFFF;
  border-radius: 12px;
  z-index: 1;
  border: 1px solid #E0E7FF;
}

.ai-card-header-v2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 100%);
  border-bottom: 1px solid #E0E7FF;
}

.ai-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-icon-animated {
  font-size: 16px;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.15); }
}

.ai-title {
  font-size: 14px;
  font-weight: 600;
  color: #4338CA;
}

.ai-badge-v2 {
  font-size: 10px;
  padding: 2px 8px;
  background: #4F46E5;
  color: #FFFFFF;
  border-radius: 10px;
  font-weight: 500;
}

.ai-card-body-v2 { padding: 14px; }

.ai-suggestion {
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.ai-metrics-v2 {
  display: flex;
  gap: 8px;
}

.ai-metric-v2 {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  background: #F8FAFC;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
}

.metric-label { font-size: 10px; color: #64748B; }
.metric-value { font-size: 13px; font-weight: 600; }
.metric-value.good { color: #10B981; }
.metric-value.warning { color: #F59E0B; }
.metric-value.danger { color: #EF4444; }

.ai-card-actions-v2 {
  display: flex;
  gap: 10px;
  padding: 0 14px 14px;
}

.ai-action-btn {
  flex: 1;
  padding: 9px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.ai-action-btn.secondary { background: #F1F5F9; color: #4F46E5; }
.ai-action-btn.primary { background: #4F46E5; color: #FFFFFF; }
.ai-action-btn:active { opacity: 0.9; }

/* 处方标签 */
.rx-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  flex-shrink: 0;
}

.tag-medication { background: #DBEAFE; color: #1D4ED8; }
.tag-diet { background: #FEF3C7; color: #92400E; }
.tag-exercise { background: #D1FAE5; color: #047857; }
.tag-monitor { background: #EDE9FE; color: #6D28D9; }
.tag-medical { background: #FCE7F3; color: #BE185D; }

/* 临床区块 */
.clinical-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.clinical-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.csh-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.csh-icon { font-size: 18px; }

.csh-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.adjust-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: #F8FAFC;
  color: #64748B;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.adjust-btn:active { background: #F1F5F9; }

/* 药物卡片 */
.medication-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.medication-card {
  display: flex;
  background: #FAFBFC;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #F1F5F9;
}

.med-left-border {
  width: 3px;
  background: #3B82F6;
  flex-shrink: 0;
}

.med-content {
  flex: 1;
  padding: 10px 12px;
}

.med-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.med-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.med-name {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.med-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.med-status.taken { background: #D1FAE5; color: #059669; }
.med-status.pending { background: #FEF3C7; color: #92400E; }

.med-details {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
}

.med-dot { color: #CBD5E1; }

.med-note {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94A3B8;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #E2E8F0;
}

.med-note .van-icon { font-size: 12px; }

/* 生活方式卡片 */
.behavioral-card {
  display: flex;
  background: #FAFBFC;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  border: 1px solid #F1F5F9;
}

.behavioral-card:last-child { margin-bottom: 0; }

.bc-left-border {
  width: 3px;
  flex-shrink: 0;
}

.bc-left-border.diet { background: #F59E0B; }
.bc-left-border.exercise { background: #10B981; }
.bc-left-border.monitor { background: #8B5CF6; }

.bc-content {
  flex: 1;
  padding: 10px 12px;
}

.bc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.bc-title {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
}

.bc-targets {
  display: flex;
  gap: 20px;
}

.target-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.target-label { font-size: 10px; color: #94A3B8; }
.target-value { font-size: 13px; font-weight: 500; color: #334155; }

/* 汇总目标 Modal */
.goals-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.goals-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.goal-category { margin-bottom: 20px; }
.goal-category:last-child { margin-bottom: 0; }

.goal-cat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.goal-cat-icon { font-size: 16px; }

.goal-cat-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.goal-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goal-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.goal-label {
  flex: 1;
  font-size: 13px;
  color: #334155;
}

.goal-target {
  font-size: 12px;
  color: #64748B;
  margin-right: 12px;
}

.goal-current {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.goal-current.good { background: #D1FAE5; color: #059669; }
.goal-current.warning { background: #FEF3C7; color: #92400E; }

/* 方案编辑页 */
.schema-edit-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F8FAFC;
}

.se-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
}

.se-back {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #F1F5F9;
}

.se-title {
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
}

.se-subtitle {
  font-size: 12px;
  color: #64748B;
  padding: 2px 8px;
  background: #EFF6FF;
  border-radius: 4px;
}

.se-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.se-ai-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  border: 1px solid #C7D2FE;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #4338CA;
}

.ai-banner-icon { font-size: 16px; }

.se-compare-section {
  margin-bottom: 12px;
}

.compare-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px;
  font-size: 12px;
  color: #64748B;
}

.compare-old { color: #94A3B8; }
.compare-arrow { color: #CBD5E1; }
.compare-new { color: #3B82F6; font-weight: 500; }

.se-form-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.se-form-item {
  background: #FFFFFF;
  border-radius: 10px;
  padding: 14px;
  border: 1px solid #E2E8F0;
}

.se-form-item.modified {
  border-color: #3B82F6;
  background: #FAFBFF;
}

.se-form-item.deleted {
  border-color: #FECACA;
  background: #FEF2F2;
  opacity: 0.7;
}

.form-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.form-item-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.form-delete-btn, .form-restore-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.form-delete-btn {
  background: #FEF2F2;
  color: #EF4444;
}

.form-restore-btn {
  background: #DBEAFE;
  color: #3B82F6;
}

.form-item-body { }

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.form-row:last-child { margin-bottom: 0; }

.form-old, .form-new {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.old-label, .new-label {
  font-size: 10px;
  color: #94A3B8;
}

.old-value {
  font-size: 13px;
  color: #64748B;
  padding: 8px;
  background: #F8FAFC;
  border-radius: 6px;
}

.old-value.strikethrough {
  text-decoration: line-through;
  color: #94A3B8;
}

.new-input {
  font-size: 13px;
  color: #0F172A;
  padding: 8px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  background: #FFFFFF;
}

.new-input.changed {
  border-color: #3B82F6;
  background: #EFF6FF;
}

.form-reason {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #E2E8F0;
  font-size: 11px;
  color: #6366F1;
}

.form-reason .van-icon { font-size: 14px; }

.form-item-deleted {
  text-align: center;
  padding: 12px;
  font-size: 12px;
  color: #EF4444;
}

.se-add-section {
  margin-top: 16px;
}

.se-add-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: #FFFFFF;
  border: 2px dashed #E2E8F0;
  border-radius: 10px;
  color: #64748B;
  font-size: 13px;
  cursor: pointer;
}

.se-add-btn:active {
  border-color: #3B82F6;
  color: #3B82F6;
}

.se-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #FFFFFF;
  border-top: 1px solid #E2E8F0;
}

.se-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.se-btn-cancel { background: #F1F5F9; color: #64748B; }
.se-btn-confirm { background: #4F46E5; color: #FFFFFF; }
.se-btn:active { opacity: 0.9; }

/* 新增项 Modal */
.add-item-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.add-item-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.add-form-group {
  margin-bottom: 16px;
}

.add-label {
  display: block;
  font-size: 12px;
  color: #64748B;
  margin-bottom: 8px;
}

.add-type-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-option {
  padding: 6px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  background: #FFFFFF;
  cursor: pointer;
}

.type-option.active {
  border-color: #3B82F6;
  background: #EFF6FF;
}

.add-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
}

.add-input:focus {
  outline: none;
  border-color: #3B82F6;
}

.add-confirm-btn {
  width: 100%;
  padding: 12px;
  background: #4F46E5;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.add-confirm-btn:active { opacity: 0.9; }

/* ===== 空状态 ===== */
.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  padding: 24px;
  color: #94A3B8;
  font-size: 13px;
}

.hint-icon {
  font-size: 28px;
  color: #CBD5E1;
}

.hint-icon.hint-green {
  color: #10B981;
}

/* ===== V3 追踪视图和临床样式 ===== */

.metric-value.good { color: #10B981; }
.metric-value.warning { color: #F59E0B; }
.metric-value.danger { color: #EF4444; }

.ai-card-actions-v2 {
  display: flex;
  gap: 10px;
  padding: 0 14px 14px;
}

.ai-action-btn {
  flex: 1;
  padding: 9px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.ai-action-btn.secondary {
  background: #F1F5F9;
  color: #4F46E5;
}

.ai-action-btn.primary {
  background: #4F46E5;
  color: #FFFFFF;
}

.ai-action-btn:active { opacity: 0.9; }

/* 处方标签系统 */
.rx-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  flex-shrink: 0;
}

.tag-medication { background: #DBEAFE; color: #1D4ED8; }
.tag-diet { background: #FEF3C7; color: #92400E; }
.tag-exercise { background: #D1FAE5; color: #047857; }
.tag-monitor { background: #EDE9FE; color: #6D28D9; }

/* 临床区块通用样式 */
.clinical-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.clinical-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.csh-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.csh-icon { font-size: 18px; }

.csh-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
}

.adjust-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: #F8FAFC;
  color: #64748B;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.adjust-btn:active { background: #F1F5F9; }

/* 药物处方卡片 */
.medication-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.medication-card {
  display: flex;
  background: #FAFBFC;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #F1F5F9;
}

.med-left-border {
  width: 3px;
  background: #3B82F6;
  flex-shrink: 0;
}

.med-content {
  flex: 1;
  padding: 10px 12px;
}

.med-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.med-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.med-name {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.med-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.med-status.taken { background: #D1FAE5; color: #059669; }
.med-status.pending { background: #FEF3C7; color: #92400E; }

.med-details {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
}

.med-dot { color: #CBD5E1; }

.med-note {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94A3B8;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #E2E8F0;
}

.med-note .van-icon { font-size: 12px; }

/* 生活方式处方卡片 */
.behavioral-card {
  display: flex;
  background: #FAFBFC;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
  border: 1px solid #F1F5F9;
}

.behavioral-card:last-child { margin-bottom: 0; }

.bc-left-border {
  width: 3px;
  flex-shrink: 0;
}

.bc-left-border.diet { background: #F59E0B; }
.bc-left-border.exercise { background: #10B981; }
.bc-left-border.monitor { background: #8B5CF6; }

.bc-content {
  flex: 1;
  padding: 10px 12px;
}

.bc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.bc-title {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
}

.bc-targets {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.target-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.target-label {
  font-size: 10px;
  color: #94A3B8;
}

.target-value {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.bc-exercise-types {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.exercise-type {
  font-size: 11px;
  padding: 3px 8px;
  background: #D1FAE5;
  color: #059669;
  border-radius: 10px;
}

.bc-feedback {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748B;
  padding-top: 8px;
  border-top: 1px dashed #E2E8F0;
}

.feedback-icon { font-size: 12px; }

/* 汇总目标 Modal */
.goals-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.goals-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.goal-category {
  margin-bottom: 20px;
}

.goal-category:last-child { margin-bottom: 0; }

.goal-cat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.goal-cat-icon { font-size: 16px; }

.goal-cat-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

.goal-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goal-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.goal-label {
  flex: 1;
  font-size: 13px;
  color: #334155;
}

.goal-target {
  font-size: 12px;
  color: #64748B;
  margin-right: 12px;
}

.goal-current {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.goal-current.good {
  background: #D1FAE5;
  color: #059669;
}

.goal-current.warning {
  background: #FEF3C7;
  color: #92400E;
}

/* 方案对比页面 */
.schema-compare-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F8FAFC;
}

.sc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
}

.sc-back {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #F1F5F9;
}

.sc-title {
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
}

.sc-subtitle {
  font-size: 12px;
  color: #64748B;
  padding: 2px 8px;
  background: #EFF6FF;
  border-radius: 4px;
}

.sc-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.sc-info-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #FEF3C7;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #92400E;
}

.sc-info-bar .van-icon {
  font-size: 16px;
  color: #F59E0B;
}

.sc-compare-container {
  display: flex;
  gap: 12px;
}

.sc-column {
  flex: 1;
  background: #FFFFFF;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #E2E8F0;
}

.sc-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
}

.sc-column-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.sc-column-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.sc-column-tag.old {
  background: #F1F5F9;
  color: #64748B;
}

.sc-column-tag.new {
  background: #DBEAFE;
  color: #1D4ED8;
}

.sc-items {
  padding: 8px;
}

.sc-item {
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #FAFBFC;
}

.sc-item:last-child { margin-bottom: 0; }

.sc-item.deprecated {
  background: #FEF2F2;
  border: 1px solid #FECACA;
}

.sc-item.highlighted {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
}

.sc-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.sc-item-name {
  font-size: 12px;
  font-weight: 600;
  color: #0F172A;
}

.change-badge {
  font-size: 9px;
  padding: 1px 5px;
  background: #3B82F6;
  color: #FFFFFF;
  border-radius: 3px;
  margin-left: auto;
}

.sc-item-value {
  font-size: 12px;
  color: #334155;
  margin-bottom: 2px;
}

.sc-item-value.strikethrough {
  text-decoration: line-through;
  color: #94A3B8;
}

.sc-item-value.value-changed {
  color: #1D4ED8;
  font-weight: 500;
}

.sc-item-detail {
  font-size: 11px;
  color: #64748B;
}

.sc-item-detail.strikethrough {
  text-decoration: line-through;
  color: #CBD5E1;
}

.sc-item-detail.detail-changed {
  color: #3B82F6;
}

.sc-item-reason {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #E2E8F0;
  font-size: 10px;
  color: #6366F1;
}

.sc-item-reason .van-icon {
  font-size: 12px;
}

.sc-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #FFFFFF;
  border-top: 1px solid #E2E8F0;
}

.sc-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.sc-btn-cancel {
  background: #F1F5F9;
  color: #64748B;
}

.sc-btn-confirm {
  background: #4F46E5;
  color: #FFFFFF;
}

.sc-btn:active { opacity: 0.9; }

/* ===== 体征历史弹窗 ===== */
.vital-history-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.vital-history-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* AI 分析卡片 */
.ai-analysis-card {
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  border: 1px solid #C7D2FE;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 20px;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.ai-icon {
  font-size: 16px;
  color: #6366F1;
}

.ai-title {
  font-size: 14px;
  font-weight: 600;
  color: #4338CA;
}

.ai-content {
  font-size: 14px;
  color: #3730A3;
  line-height: 1.7;
  margin: 0;
}

/* 历史记录部分 */
.history-section {
  background: #FFFFFF;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 12px;
  padding-left: 2px;
}

.vital-history-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.vital-history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #F1F5F9;
}

.vital-history-item:last-child {
  border-bottom: none;
}

.vh-time {
  width: 90px;
  flex-shrink: 0;
  font-size: 13px;
  color: #94A3B8;
}

.vh-body {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.vh-value {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.vh-value.abnormal {
  color: #DC2626;
}

.vh-unit {
  font-size: 12px;
  color: #64748B;
}

.vh-tag {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
}
.vh-tag.normal { background: rgba(16, 185, 129, 0.12); color: #059669; }
.vh-tag.high { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
.vh-tag.low { background: rgba(59, 130, 246, 0.12); color: #2563EB; }
.vh-tag.warning { background: rgba(245, 158, 11, 0.12); color: #D97706; }

/* 可点击卡片样式 */
.vital-card-v5.clickable,
.bmi-row-v5.clickable {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.vital-card-v5.clickable:active,
.bmi-row-v5.clickable:active {
  transform: scale(0.96);
}

.vital-card-v5.clickable:hover,
.bmi-row-v5.clickable:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ===== 指标数据 Tab V2 - 全量重构 ===== */
.data-panel-v2 {
  gap: 14px;
}

/* Decision Hub 智能摘要区 */
.decision-hub {
  padding: 16px;
}

.hub-controller {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.metric-tabs {
  display: flex;
  background: #F1F5F9;
  border-radius: 8px;
  padding: 3px;
}

.metric-tab {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.metric-tab.active {
  background: #FFFFFF;
  color: #0F172A;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.time-tabs {
  display: flex;
  gap: 4px;
}

.time-tab {
  padding: 5px 10px;
  font-size: 12px;
  color: #94A3B8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.time-tab.active {
  background: #EFF6FF;
  color: #3B82F6;
  font-weight: 600;
}

/* AI 趋势卡片 */
.ai-trend-card {
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  border: 1px solid #C7D2FE;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.ai-trend-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.ai-trend-icon {
  font-size: 16px;
  color: #6366F1;
}

.ai-trend-title {
  font-size: 14px;
  font-weight: 600;
  color: #4338CA;
}

.ai-trend-content {
  font-size: 14px;
  color: #3730A3;
  line-height: 1.65;
  margin: 0;
}

/* 核心数据看板 */
.core-metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.core-metric-card {
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 10px;
  padding: 12px 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.core-metric-value {
  font-size: 24px;
  font-weight: 800;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
  line-height: 1.1;
}

.core-metric-value.good { color: #059669; }
.core-metric-value.warning { color: #D97706; }
.core-metric-value.danger { color: #DC2626; }

.core-metric-unit {
  font-size: 11px;
  color: #64748B;
  margin-top: -2px;
}

.core-metric-label {
  font-size: 12px;
  color: #64748B;
}

.range-card .range-values {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.range-high {
  font-size: 18px;
  font-weight: 700;
  color: #DC2626;
  font-family: 'SF Mono', Monaco, monospace;
}

.range-divider {
  font-size: 14px;
  color: #CBD5E1;
  margin: 0 2px;
}

.range-low {
  font-size: 18px;
  font-weight: 700;
  color: #3B82F6;
  font-family: 'SF Mono', Monaco, monospace;
}

/* 图表区域 */
.chart-section {
  padding: 16px;
}

.section-title-v2 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 14px;
}

.section-icon-v2 {
  font-size: 16px;
  color: #94A3B8;
}

.chart-period-hint,
.history-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: #94A3B8;
}

.chart-container {
  position: relative;
  background: #FAFBFC;
  border-radius: 10px;
  padding: 12px 12px 8px 36px;
  height: 160px;
}

/* 安全区阴影 */
.safe-zone {
  position: absolute;
  left: 36px;
  right: 12px;
  background: rgba(16, 185, 129, 0.08);
  border-top: 1px dashed rgba(16, 185, 129, 0.3);
  border-bottom: 1px dashed rgba(16, 185, 129, 0.3);
  pointer-events: none;
}

/* Y轴 */
.y-axis {
  position: absolute;
  left: 4px;
  top: 12px;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.y-label {
  font-size: 10px;
  color: #94A3B8;
  font-family: 'SF Mono', Monaco, monospace;
}

/* SVG 图表 */
.chart-svg {
  width: 100%;
  height: 120px;
}

.grid-line {
  stroke: #E2E8F0;
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.chart-line {
  stroke: #3B82F6;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-point {
  fill: #3B82F6;
  stroke: #FFFFFF;
  stroke-width: 2;
  cursor: pointer;
  transition: r 0.15s ease;
}

.chart-point.abnormal {
  fill: #EF4444;
}

.chart-point.selected {
  fill: #1D4ED8;
  stroke-width: 3;
}

.chart-point.abnormal.selected {
  fill: #B91C1C;
}

/* X轴 */
.x-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 4px;
}

.x-label {
  font-size: 10px;
  color: #94A3B8;
}

/* 选中点详情卡片 */
.point-detail-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 14px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
}

.point-detail-time {
  font-size: 13px;
  color: #64748B;
}

.point-detail-value {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.point-detail-value .abnormal {
  color: #DC2626;
}

.point-detail-unit {
  font-size: 12px;
  color: #64748B;
  font-weight: 400;
  margin-left: 4px;
}

.point-detail-tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
}
.point-detail-tag.normal { background: rgba(16, 185, 129, 0.12); color: #059669; }
.point-detail-tag.high { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
.point-detail-tag.critical { background: rgba(220, 38, 38, 0.15); color: #991B1B; }

/* 历史追溯区 */
.history-section {
  padding: 16px;
}

.history-list-v2 {
  display: flex;
  flex-direction: column;
}

.history-item-v2 {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #F1F5F9;
}

.history-item-v2:last-child {
  border-bottom: none;
}

.hi-left {
  width: 72px;
  flex-shrink: 0;
}

.hi-datetime {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hi-date {
  font-size: 13px;
  color: #0F172A;
  font-weight: 500;
}

.hi-time {
  font-size: 11px;
  color: #94A3B8;
}

.hi-center {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.hi-value {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.hi-value.abnormal {
  color: #DC2626;
}

.hi-value.critical {
  color: #991B1B;
  font-size: 22px;
}

.hi-unit {
  font-size: 12px;
  color: #64748B;
}

.hi-tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.hi-tag.normal { background: rgba(16, 185, 129, 0.12); color: #059669; }
.hi-tag.high { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
.hi-tag.critical { background: rgba(220, 38, 38, 0.18); color: #991B1B; }
.hi-tag.warning { background: rgba(245, 158, 11, 0.12); color: #D97706; }

/* ===== 指标数据 Tab V3 - 整合业务版 ===== */
.data-panel-v3 {
  gap: 12px;
}

/* 紧急响应区 */
.urgent-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
  border: 1px solid #FECACA;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
}

.urgent-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #DC2626;
  font-size: 20px;
  flex-shrink: 0;
}

.urgent-content {
  flex: 1;
}

.urgent-title {
  font-size: 12px;
  color: #991B1B;
  font-weight: 600;
  margin-bottom: 4px;
}

.urgent-detail {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.urgent-value {
  font-size: 20px;
  font-weight: 800;
  color: #DC2626;
  font-family: 'SF Mono', Monaco, monospace;
}

.urgent-type {
  font-size: 12px;
  color: #991B1B;
  font-weight: 500;
}

.urgent-time {
  font-size: 11px;
  color: #B91C1C;
}

.urgent-arrow {
  color: #DC2626;
  font-size: 16px;
}

/* 决策中心 Summary Hub */
.summary-hub {
  padding: 16px;
}

/* AI + 监测概况 合并卡片 */
.ai-summary-card {
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  border: 1px solid #C7D2FE;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
  display: flex;
  gap: 16px;
}

.ai-summary-left {
  flex: 1;
}

.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(99, 102, 241, 0.15);
  padding: 3px 10px;
  border-radius: 12px;
  margin-bottom: 8px;
}

.ai-badge-icon {
  font-size: 12px;
}

.ai-badge span {
  font-size: 11px;
  font-weight: 600;
  color: #4338CA;
}

.ai-summary-text {
  font-size: 13px;
  color: #3730A3;
  line-height: 1.6;
  margin: 0;
}

.ai-summary-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 16px;
  border-left: 1px solid #C7D2FE;
  flex-shrink: 0;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.summary-stat .stat-value {
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.summary-stat .stat-value.accent-green { color: #059669; }
.summary-stat .stat-value.accent-red { color: #DC2626; }
.summary-stat .stat-value small { font-size: 10px; font-weight: 500; color: #64748B; }

.summary-stat .stat-label {
  font-size: 10px;
  color: #64748B;
}

/* 多维透视区 */
.analysis-section {
  padding: 16px;
}

.chart-block {
  margin-bottom: 16px;
}

.chart-label {
  font-size: 12px;
  color: #64748B;
  margin-bottom: 8px;
}

.chart-container-v3 {
  position: relative;
  background: #FAFBFC;
  border-radius: 8px;
  padding: 8px 8px 4px 32px;
  height: 110px;
}

/* 柱状图 */
.bar-chart-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 60px;
  padding: 0 4px;
  background: #FAFBFC;
  border-radius: 8px;
}

.bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.bar-wrapper {
  width: 14px;
  height: 40px;
  background: #E2E8F0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.bar-fill-v3 {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #E2E8F0;
  border-radius: 4px;
  transition: height 0.4s ease;
}

.bar-fill-v3.alert {
  background: linear-gradient(180deg, #F59E0B, #FBBF24);
}

.bar-fill-v3.critical {
  background: linear-gradient(180deg, #EF4444, #F87171);
}

.bar-label {
  font-size: 10px;
  color: #94A3B8;
}

/* 共享X轴 */
.shared-x-axis {
  display: flex;
  justify-content: space-between;
  padding: 8px 8px 0 40px;
}

.x-label-v3 {
  font-size: 10px;
  color: #94A3B8;
  text-align: center;
}

/* 选中点详情卡片 V3 */
.point-detail-card-v3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 10px 14px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
}

.point-detail-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.point-detail-time-v3 {
  font-size: 11px;
  color: #64748B;
}

.point-detail-value-v3 {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.point-detail-value-v3.abnormal {
  color: #DC2626;
}

.point-detail-value-v3 small {
  font-size: 12px;
  font-weight: 400;
  color: #64748B;
  margin-left: 4px;
}

.point-detail-tag-v3 {
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}
.point-detail-tag-v3.normal { background: rgba(16, 185, 129, 0.12); color: #059669; }
.point-detail-tag-v3.high { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
.point-detail-tag-v3.critical { background: rgba(220, 38, 38, 0.18); color: #991B1B; }

/* 详情溯源区 Records */
.records-section {
  padding: 16px;
}

.records-list {
  display: flex;
  flex-direction: column;
}

.record-item-v3 {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #F1F5F9;
  position: relative;
}

.record-item-v3:last-child {
  border-bottom: none;
}

.record-item-v3.highlighted {
  background: linear-gradient(90deg, rgba(254, 226, 226, 0.5) 0%, rgba(254, 242, 242, 0.3) 100%);
  margin: 0 -16px;
  padding: 12px 16px;
  border-radius: 8px;
  border-bottom: none;
  margin-bottom: 8px;
}

.record-highlight-badge {
  position: absolute;
  top: 4px;
  right: 16px;
  font-size: 9px;
  color: #DC2626;
  background: rgba(220, 38, 38, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.record-left {
  width: 64px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record-date {
  font-size: 13px;
  color: #0F172A;
  font-weight: 500;
}

.record-time {
  font-size: 11px;
  color: #94A3B8;
}

.record-center {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.record-value {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.record-value.abnormal {
  color: #DC2626;
}

.record-value.critical {
  color: #991B1B;
  font-size: 20px;
}

.record-unit {
  font-size: 12px;
  color: #64748B;
}

.record-tag {
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.record-tag.normal { background: rgba(16, 185, 129, 0.12); color: #059669; }
.record-tag.high { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
.record-tag.critical { background: rgba(220, 38, 38, 0.18); color: #991B1B; }
.record-tag.warning { background: rgba(245, 158, 11, 0.12); color: #D97706; }

/* ===== 指标数据 Tab V4 - 行为关联版 ===== */
.data-panel-v4 {
  gap: 12px;
}

/* 紧急响应区（压缩版） */
.urgent-banner-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(90deg, #FEF2F2 0%, #FEE2E2 100%);
  border: 1px solid #FECACA;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  cursor: pointer;
}

.urgent-icon-sm {
  color: #DC2626;
  font-size: 16px;
}

.urgent-text {
  font-size: 12px;
  color: #991B1B;
  font-weight: 500;
}

.urgent-value-sm {
  font-size: 14px;
  font-weight: 700;
  color: #DC2626;
  font-family: 'SF Mono', Monaco, monospace;
}

.urgent-type-sm {
  font-size: 11px;
  color: #B91C1C;
}

.urgent-arrow-sm {
  margin-left: auto;
  color: #DC2626;
  font-size: 12px;
}

/* AI 周期报告入口 */
.ai-report-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border: 1px solid #FDE68A;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  cursor: pointer;
}

.report-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-icon {
  font-size: 20px;
}

.report-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.report-title {
  font-size: 13px;
  font-weight: 600;
  color: #92400E;
}

.report-desc {
  font-size: 11px;
  color: #B45309;
}

.report-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.report-badge {
  background: rgba(217, 119, 6, 0.15);
  color: #B45309;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
}

/* 核心概览（紧凑版） */
.summary-compact {
  padding: 12px 14px !important;
}

.core-metrics-compact {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}

.metric-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.mini-value {
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.mini-value.range {
  font-size: 14px;
}

.mini-value.good { color: #059669; }
.mini-value.warning { color: #D97706; }
.mini-value.danger { color: #DC2626; }
.mini-value.accent-red { color: #DC2626; }

.mini-label {
  font-size: 10px;
  color: #64748B;
}

/* 行为关联趋势图区域 */
.behavior-chart-section {
  position: relative;
  padding-top: 20px !important;
}

/* 行为事件轴 */
.behavior-event-axis {
  position: relative;
  height: 24px;
  margin: 0 16px;
  border-bottom: 1px dashed #E2E8F0;
}

.event-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 5;
}

.event-icon {
  font-size: 16px;
  display: block;
  animation: eventPulse 2s ease-in-out infinite;
}

@keyframes eventPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* 趋势折线图 V4 */
.chart-container-v4 {
  position: relative;
  margin: 8px 16px 0;
  padding: 4px 0;
}

.chart-svg-v4 {
  width: 100%;
  height: 80px;
}

.chart-svg-v4 .chart-line {
  stroke: #3B82F6;
  stroke-width: 2;
  filter: drop-shadow(0 1px 2px rgba(59, 130, 246, 0.3));
}

.chart-svg-v4 .chart-point {
  fill: #3B82F6;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-svg-v4 .chart-point.abnormal {
  fill: #DC2626;
}

.chart-svg-v4 .chart-point.selected {
  fill: #6366F1;
  stroke: #C7D2FE;
  stroke-width: 2;
}

.y-axis-v4 {
  position: absolute;
  left: 0;
  top: 4px;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 0;
}

.y-axis-v4 span {
  font-size: 9px;
  color: #94A3B8;
  font-family: 'SF Mono', Monaco, monospace;
  width: 24px;
  text-align: right;
}

.x-axis-v4 {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px 0;
}

.x-axis-v4 span {
  font-size: 9px;
  color: #94A3B8;
}

/* 行为 Tooltip */
.behavior-tooltip {
  position: fixed;
  background: #1E293B;
  color: #F8FAFC;
  border-radius: 8px;
  padding: 10px 12px;
  z-index: 1000;
  min-width: 140px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  animation: tooltipFadeIn 0.2s ease;
}

@keyframes tooltipFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.tooltip-icon {
  font-size: 14px;
}

.tooltip-type {
  font-size: 12px;
  font-weight: 600;
}

.tooltip-content {
  font-size: 11px;
  color: #CBD5E1;
  line-height: 1.4;
  margin-bottom: 4px;
}

.tooltip-time {
  font-size: 10px;
  color: #64748B;
}

/* 7日预警分布（压缩版） */
.alert-dist-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px 0;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.dist-label {
  font-size: 11px;
  color: #64748B;
  flex-shrink: 0;
}

.dist-bars {
  flex: 1;
  display: flex;
  gap: 4px;
  height: 16px;
  align-items: flex-end;
}

.dist-bar {
  flex: 1;
  height: 4px;
  background: #E2E8F0;
  border-radius: 2px;
  transition: all 0.2s;
}

.dist-bar.alert {
  height: 10px;
  background: #FBBF24;
}

.dist-bar.critical {
  height: 16px;
  background: #EF4444;
}

.dist-count {
  font-size: 12px;
  font-weight: 600;
  color: #DC2626;
  flex-shrink: 0;
}

/* 行为记录模块 */
.behavior-records-section {
  padding-top: 0 !important;
}

.behavior-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.behavior-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #64748B;
}

.behavior-tab.active {
  background: #EFF6FF;
  border-color: #3B82F6;
  color: #1D4ED8;
  font-weight: 600;
}

.behavior-tab-icon {
  font-size: 14px;
}

/* 行为内容区 */
.behavior-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 用药记录 */
.med-record {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.med-icon {
  font-size: 16px;
}

.med-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.med-name {
  font-size: 13px;
  font-weight: 500;
  color: #0F172A;
}

.med-dose {
  font-size: 11px;
  color: #64748B;
}

.med-time {
  font-size: 11px;
  color: #94A3B8;
}

.med-status {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.med-status.taken {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.med-status.missed {
  background: rgba(239, 68, 68, 0.12);
  color: #DC2626;
}

/* 饮食记录 */
.diet-record {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.diet-icon {
  font-size: 16px;
}

.diet-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.diet-meal {
  font-size: 13px;
  font-weight: 500;
  color: #0F172A;
}

.diet-desc {
  font-size: 11px;
  color: #64748B;
}

.diet-tag {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.diet-tag.low {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.diet-tag.medium {
  background: rgba(245, 158, 11, 0.12);
  color: #D97706;
}

.diet-tag.high {
  background: rgba(239, 68, 68, 0.12);
  color: #DC2626;
}

/* 运动数据 */
.exercise-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
  border-radius: 10px;
  margin-bottom: 10px;
}

.exercise-main {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.exercise-steps {
  font-size: 24px;
  font-weight: 800;
  color: #059669;
  font-family: 'SF Mono', Monaco, monospace;
}

.exercise-unit {
  font-size: 12px;
  color: #047857;
}

.exercise-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar {
  height: 6px;
  background: rgba(16, 185, 129, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10B981;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 10px;
  color: #047857;
  text-align: right;
}

.exercise-week {
  display: flex;
  gap: 8px;
}

.exercise-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.day-bar-wrap {
  width: 100%;
  height: 40px;
  background: #F1F5F9;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.day-bar {
  width: 100%;
  background: linear-gradient(to top, #10B981 0%, #34D399 100%);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.day-label {
  font-size: 10px;
  color: #64748B;
}

/* 最近测量（压缩版） */
.records-compact {
  padding: 12px 14px !important;
}

.records-list-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.record-item-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.record-item-compact.abnormal {
  background: rgba(254, 226, 226, 0.5);
}

.rc-time {
  font-size: 11px;
  color: #64748B;
  width: 80px;
}

.rc-value {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.rc-value.critical {
  color: #DC2626;
}

.rc-tag {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.rc-tag.normal { background: rgba(16, 185, 129, 0.12); color: #059669; }
.rc-tag.high { background: rgba(239, 68, 68, 0.12); color: #DC2626; }
.rc-tag.critical { background: rgba(220, 38, 38, 0.18); color: #991B1B; }
.rc-tag.warning { background: rgba(245, 158, 11, 0.12); color: #D97706; }

/* 查看更多按钮 */
.view-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  background: #EFF6FF;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-more-btn span {
  font-size: 12px;
  color: #3B82F6;
  font-weight: 500;
}

.view-more-btn .van-icon {
  font-size: 12px;
  color: #3B82F6;
}

.view-more-btn:active {
  background: #DBEAFE;
}

/* ===== V5 心血管专科监控系统 Clinical Monitoring System ===== */
.cv-monitor-system {
  background: #F8FAFC;
  gap: 12px;
}

/* 通用卡片样式 */
.cv-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  overflow: hidden;
}

.cv-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #F1F5F9;
  background: #FAFBFC;
}

.cv-card-header .card-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  letter-spacing: 0.02em;
}

.cv-card-header .card-period {
  font-size: 11px;
  color: #64748B;
  margin-left: 8px;
}

.cv-card-body {
  padding: 14px;
}

/* AI健康领航 */
.ai-health-navigator {
  border: 1px solid #C7D2FE;
  background: linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%);
}

.ai-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #E0E7FF;
}

.ai-nav-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-sparkle-icon {
  font-size: 14px;
  color: #6366F1;
}

.ai-nav-title {
  font-size: 13px;
  font-weight: 600;
  color: #312E81;
  letter-spacing: 0.02em;
}

.ai-nav-badge {
  font-size: 9px;
  font-weight: 700;
  color: #FFFFFF;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.05em;
}

.ai-nav-time {
  font-size: 10px;
  color: #94A3B8;
}

.ai-nav-body {
  padding: 12px 14px;
}

.ai-nav-section {
  margin-bottom: 12px;
}

.ai-nav-section:last-child {
  margin-bottom: 0;
}

.ai-nav-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.section-dot.anomaly {
  background: #DC2626;
}

.section-dot.intervention {
  background: #2563EB;
}

.ai-nav-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-nav-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #334155;
}

.ai-nav-item.anomaly.critical {
  background: #FEF2F2;
  border-left: 2px solid #DC2626;
}

.ai-nav-item.anomaly.warning {
  background: #FFFBEB;
  border-left: 2px solid #D97706;
}

.ai-nav-item.anomaly.info {
  background: #EFF6FF;
  border-left: 2px solid #2563EB;
}

.ai-nav-item.intervention {
  background: #F8FAFC;
  border-left: 2px solid #6366F1;
}

.ai-nav-item-icon {
  flex-shrink: 0;
  font-size: 12px;
  margin-top: 1px;
}

.ai-nav-item-text {
  flex: 1;
}

/* 临床简报中心 */
.briefing-center {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.briefing-card {
  flex: 1;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.briefing-card:active {
  background: #F8FAFC;
  transform: scale(0.98);
}

.brief-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.brief-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64748B;
}

.brief-indicator.critical {
  background: #DC2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
  animation: pulse-critical 1.5s ease-in-out infinite;
}

.brief-indicator.stable {
  background: #10B981;
}

.brief-indicator.ai {
  background: #2563EB;
}

@keyframes pulse-critical {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.brief-label {
  font-size: 11px;
  color: #64748B;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.brief-body {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 6px;
}

.brief-value {
  font-size: 24px;
  font-weight: 700;
  color: #DC2626;
  font-family: 'SF Mono', Monaco, monospace;
}

.brief-value.stable {
  color: #10B981;
}

.brief-unit {
  font-size: 12px;
  color: #64748B;
}

.brief-trend {
  font-size: 20px;
  font-weight: 700;
}

.brief-trend.improving { color: #10B981; }
.brief-trend.stable { color: #64748B; }
.brief-trend.declining { color: #DC2626; }

.brief-status {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.brief-footer {
  font-size: 10px;
  color: #94A3B8;
}

/* 统计看板（合并版） */
.stats-chart-unified .header-left {
  display: flex;
  align-items: center;
}

.stats-chart-unified .header-right {
  display: flex;
  align-items: center;
}

.stats-chart-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 14px 0;
}

.unified-chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chart-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.chart-area-unified {
  display: flex;
  gap: 8px;
}

.history-link {
  font-size: 11px;
  color: #2563EB;
  cursor: pointer;
  font-weight: 500;
}

.history-link:active {
  opacity: 0.7;
}

.metric-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.metric-btn {
  flex: 1;
  padding: 8px;
  text-align: center;
  font-size: 12px;
  color: #64748B;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.metric-btn.active {
  background: #FFFFFF;
  border-color: #2563EB;
  color: #2563EB;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-cell {
  text-align: center;
  padding: 8px 4px;
  background: #FAFBFC;
  border-radius: 6px;
}

.stat-num {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
  margin-bottom: 4px;
}

.stat-num.good { color: #059669; }
.stat-num.warning { color: #D97706; }
.stat-num.danger { color: #DC2626; }

.stat-label {
  font-size: 10px;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-label small {
  text-transform: none;
  margin-left: 2px;
}

/* 临床泳道图 */
.chart-legend {
  display: flex;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #64748B;
}

.legend-item .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.legend-item .dot.normal { background: #2563EB; }
.legend-item .dot.abnormal { background: #DC2626; }

.chart-area-unified .chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 28px;
  padding: 10px 0 54px 0;
  text-align: right;
}

.chart-y-axis span {
  font-size: 9px;
  color: #94A3B8;
  font-family: 'SF Mono', Monaco, monospace;
}

.chart-main {
  flex: 1;
  position: relative;
}

.chart-svg-clinical {
  width: 100%;
  height: 100px;
  display: block;
}

.chart-svg-clinical .safe-zone-rect {
  fill: rgba(16, 185, 129, 0.06);
}

.chart-svg-clinical .trend-line {
  stroke: #2563EB;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-svg-clinical .data-point {
  fill: #2563EB;
  stroke: #FFFFFF;
  stroke-width: 1.5;
  cursor: pointer;
  transition: all 0.15s;
}

.chart-svg-clinical .data-point.abnormal {
  fill: #DC2626;
}

.chart-svg-clinical .data-point.selected {
  fill: #1D4ED8;
  stroke-width: 2;
  r: 5;
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px 0;
}

.chart-x-axis span {
  font-size: 9px;
  color: #94A3B8;
}

/* 行为泳道 */
.swimlanes {
  margin-top: 8px;
  border-top: 1px solid #E2E8F0;
  padding-top: 8px;
}

.swimlane {
  display: flex;
  align-items: center;
  height: 18px;
  margin-bottom: 2px;
}

.lane-label {
  width: 28px;
  font-size: 8px;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.lane-track {
  flex: 1;
  height: 12px;
  background: #F8FAFC;
  border-radius: 6px;
  position: relative;
  margin-left: 4px;
}

.lane-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #64748B;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
}

.lane-dot:hover {
  transform: translate(-50%, -50%) scale(1.3);
  background: #334155;
}

.lane-bubble {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  min-width: 14px;
  height: 14px;
  background: #334155;
  border-radius: 7px;
  color: #FFFFFF;
  font-size: 9px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0 4px;
}

.lane-bubble:hover {
  background: #1E293B;
}

/* 健康活动卡片 2x2 */
.activity-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.activity-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-card-title {
  font-size: 11px;
  color: #64748B;
  font-weight: 500;
}

.activity-card-tag {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.activity-card-tag.tag-green {
  background: #ECFDF5;
  color: #059669;
}

.activity-card-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.activity-card-value {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
  line-height: 1.2;
}

.activity-card-unit {
  font-size: 11px;
  color: #94A3B8;
  font-weight: 500;
}

.activity-card-chart {
  height: 32px;
  margin-top: 2px;
}

.mini-trend-svg {
  width: 100%;
  height: 32px;
  display: block;
}

.standing-blocks {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  height: 32px;
  padding-top: 10px;
}

.standing-block {
  flex: 1;
  height: 16px;
  border-radius: 2px;
  background: #E2E8F0;
  transition: background 0.2s;
}

.standing-block.filled {
  background: #3B82F6;
}

/* 健康日志 */
.health-log-card .cv-card-header {
  padding: 12px 14px;
}

.log-date-label {
  font-size: 11px;
  color: #94A3B8;
}

/* 行为筛选条 */
.hlog-filter-bar {
  display: flex;
  gap: 6px;
  padding: 0 14px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.hlog-filter-bar.popup-filter {
  padding: 12px 16px;
}

.hlog-filter-btn {
  padding: 5px 12px;
  font-size: 11px;
  color: #64748B;
  background: #F1F5F9;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  font-weight: 500;
}

.hlog-filter-btn.active {
  background: #2563EB;
  color: #FFFFFF;
}

.health-log-card .cv-card-body {
  padding: 0 14px 0;
}

/* 时间轴 */
.hlog-timeline {
  position: relative;
}

.hlog-item {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
}

.hlog-item:last-child {
  padding-bottom: 4px;
}

.hlog-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 38px;
  flex-shrink: 0;
}

.hlog-time {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  font-family: 'SF Mono', Monaco, monospace;
  white-space: nowrap;
}

.hlog-line {
  width: 1px;
  flex: 1;
  min-height: 16px;
  background: #E2E8F0;
  margin-top: 6px;
}

/* 内容卡片 */
.hlog-content-card {
  flex: 1;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
  border-radius: 8px;
  padding: 10px 12px;
  min-width: 0;
}

.hlog-content-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.hlog-type-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  font-size: 12px;
  flex-shrink: 0;
}

.hlog-type-icon.med { background: #EFF6FF; }
.hlog-type-icon.diet { background: #FEF3C7; }
.hlog-type-icon.activity { background: #ECFDF5; }
.hlog-type-icon.vital { background: #F1F5F9; }

.hlog-type-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.hlog-tag {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.hlog-tag.tag-green { background: #ECFDF5; color: #059669; }
.hlog-tag.tag-red { background: #FEF2F2; color: #DC2626; }
.hlog-tag.tag-blue { background: #EFF6FF; color: #2563EB; }
.hlog-tag.tag-yellow { background: #FFFBEB; color: #D97706; }

.hlog-content-body {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 4px;
}

/* AI 分析行 */
.hlog-ai-row {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  padding: 6px 8px;
  background: linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 100%);
  border-radius: 6px;
  margin-top: 6px;
}

.hlog-ai-icon {
  font-size: 11px;
  color: #6366F1;
  flex-shrink: 0;
  margin-top: 1px;
}

.hlog-ai-text {
  font-size: 11px;
  color: #4338CA;
  line-height: 1.5;
}

.hlog-empty {
  padding: 24px;
  text-align: center;
  color: #94A3B8;
  font-size: 12px;
}

/* 底部查看历史 */
.hlog-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
  margin-top: 4px;
  border-top: 1px solid #F1F5F9;
  font-size: 12px;
  color: #2563EB;
  font-weight: 500;
  cursor: pointer;
}

.hlog-footer:active {
  opacity: 0.7;
}

/* 历史弹窗 */
.hlog-history-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.hlog-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #F1F5F9;
}

.hlog-popup-title {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
}

.hlog-popup-close {
  font-size: 18px;
  color: #94A3B8;
  cursor: pointer;
}

/* 日历条 */
.hlog-calendar-strip {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-bottom: 1px solid #F1F5F9;
}

.hlog-cal-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 38px;
  padding: 6px 4px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}

.hlog-cal-day:active {
  transform: scale(0.95);
}

.hlog-cal-day.active {
  background: #2563EB;
}

.hlog-cal-day.active .cal-weekday,
.hlog-cal-day.active .cal-daynum {
  color: #FFFFFF;
}

.cal-weekday {
  font-size: 9px;
  color: #94A3B8;
  margin-bottom: 2px;
}

.cal-daynum {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.hlog-cal-day.today .cal-daynum {
  color: #2563EB;
}

.cal-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #2563EB;
  margin-top: 3px;
}

.hlog-cal-day.active .cal-dot {
  background: #FFFFFF;
}

/* 历史日志列表 */
.hlog-history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

/* 临床覆盖层 */
.clinical-overlay {
  position: absolute;
  top: 5%;
  left: 4%;
  right: 4%;
  bottom: 5%;
  background: #FFFFFF;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #E2E8F0;
  background: #FAFBFC;
}

.overlay-title {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
}

.overlay-close {
  font-size: 20px;
  color: #64748B;
  cursor: pointer;
}

.overlay-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.analysis-section {
  margin-bottom: 20px;
}

.analysis-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.ai-summary-box {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 14px;
}

.ai-summary-box p {
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
  margin: 0;
}

/* 分布图 */
.distribution-chart {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 14px;
}

.dist-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 10px;
}

.dist-row.muted {
  opacity: 0.6;
}

.dist-week {
  width: 32px;
  font-size: 10px;
  color: #64748B;
  flex-shrink: 0;
}

.dist-bars-container {
  flex: 1;
  display: flex;
  gap: 6px;
  height: 40px;
  align-items: flex-end;
}

.dist-bar-clinical {
  flex: 1;
  background: #E2E8F0;
  border-radius: 2px;
  min-height: 4px;
  position: relative;
  transition: all 0.2s;
}

.dist-bar-clinical.active {
  background: #FBBF24;
}

.dist-bar-clinical.critical {
  background: #DC2626;
}

.dist-bar-clinical.last-week {
  background: #CBD5E1;
}

.dist-bar-clinical.last-week.active {
  background: #94A3B8;
}

.bar-num {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  font-weight: 600;
  color: #334155;
}

.dist-total {
  width: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  text-align: right;
  flex-shrink: 0;
}

.dist-labels {
  display: flex;
  gap: 6px;
  margin-left: 40px;
  margin-right: 28px;
}

.dist-labels span {
  flex: 1;
  text-align: center;
  font-size: 9px;
  color: #94A3B8;
}

/* 干预建议 */
.intervention-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.intervention-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
}

.intervention-priority {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.intervention-priority.high {
  background: #FEE2E2;
  color: #DC2626;
}

.intervention-priority.medium {
  background: #FEF3C7;
  color: #D97706;
}

.intervention-priority.low {
  background: #F1F5F9;
  color: #64748B;
}

.intervention-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.5;
}

/* 趋势指标 */
.trend-indicators {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trend-ind-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
}

.ind-name {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  width: 40px;
}

.ind-trend {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.ind-trend.improving {
  background: #ECFDF5;
  color: #059669;
}

.ind-trend.stable {
  background: #F1F5F9;
  color: #64748B;
}

.ind-trend.declining {
  background: #FEE2E2;
  color: #DC2626;
}

.ind-detail {
  font-size: 12px;
  color: #64748B;
  flex: 1;
}

/* 重点关注 */
.focus-points {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.focus-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: 8px;
}

.focus-icon {
  width: 16px;
  height: 16px;
  background: #F59E0B;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.focus-text {
  font-size: 12px;
  color: #92400E;
  line-height: 1.5;
}

/* 事件列表弹窗 */
.event-list-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.event-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.event-detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 8px;
  margin-bottom: 8px;
}

.event-cat-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 12px;
}

.event-cat-icon.med { background: #EFF6FF; }
.event-cat-icon.diet { background: #FEF3C7; }
.event-cat-icon.activity { background: #ECFDF5; }

.event-cat-icon.med::before { content: '💊'; }
.event-cat-icon.diet::before { content: '🍽'; }
.event-cat-icon.activity::before { content: '🏃'; }

.event-desc {
  flex: 1;
  font-size: 13px;
  color: #334155;
}

.event-time-detail {
  font-size: 11px;
  color: #64748B;
  font-family: 'SF Mono', Monaco, monospace;
}

/* 历史明细弹窗 */
.history-detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.history-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #F1F5F9;
}

.history-row:last-child {
  border-bottom: none;
}

.history-row.abnormal {
  background: rgba(254, 243, 199, 0.3);
}

.history-row.critical {
  background: rgba(254, 226, 226, 0.4);
}

.history-datetime {
  width: 60px;
  flex-shrink: 0;
}

.h-date {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #334155;
}

.h-time {
  display: block;
  font-size: 10px;
  color: #94A3B8;
}

.history-value {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.h-val {
  font-size: 18px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'SF Mono', Monaco, monospace;
}

.history-row.abnormal .h-val,
.history-row.critical .h-val {
  color: #DC2626;
}

.h-unit {
  font-size: 11px;
  color: #64748B;
}

.history-tag {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}

.history-tag.normal { background: #ECFDF5; color: #059669; }
.history-tag.high { background: #FEF3C7; color: #D97706; }
.history-tag.critical { background: #FEE2E2; color: #DC2626; }
.history-tag.warning { background: #FEF3C7; color: #D97706; }
</style>
