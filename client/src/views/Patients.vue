<template>
  <div class="patients-page">
    <!-- 顶部固定区域 -->
    <div class="sticky-top">
      <!-- 搜索框 -->
      <div class="search-box">
        <van-icon name="search" class="search-icon" />
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索患者姓名"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <van-icon v-if="keyword" name="clear" class="clear-icon" @click="keyword = ''; handleSearch()" />
      </div>

      <!-- 预警统计块：临床降噪版 -->
      <div v-if="dashboard" class="warning-tiles">
        <div class="tile tile-glucose" @click="router.push('/risk-detail/glucose')">
          <div class="tile-header">
            <span class="tile-icon">&#x1F4C8;</span>
            <span class="tile-title">血糖</span>
          </div>
          <span class="tile-num">{{ dashboard.glucose.todayCount }}</span>
          <span class="tile-sub">7日累计 {{ dashboard.glucose.weekCount }} 次</span>
        </div>
        <div class="tile tile-bp" @click="router.push('/risk-detail/bp')">
          <div class="tile-header">
            <span class="tile-icon">&#x1F4A2;</span>
            <span class="tile-title">血压</span>
          </div>
          <span class="tile-num">{{ dashboard.bp.todayCount }}</span>
          <span class="tile-sub">7日累计 {{ dashboard.bp.weekCount }} 次</span>
        </div>
        <div class="tile tile-hr" @click="router.push('/risk-detail/hr')">
          <div class="tile-header">
            <span class="tile-icon">&#x1F49C;</span>
            <span class="tile-title">心率</span>
          </div>
          <span class="tile-num">{{ dashboard.hr.todayCount }}</span>
          <span class="tile-sub">7日累计 {{ dashboard.hr.weekCount }} 次</span>
        </div>
      </div>

      <!-- 统计行 -->
      <div class="stats-bar">
        <span>管理 <b>{{ patients.length }}</b> 位患者</span>
        <div class="legend">
          <span class="dot urgent"></span>紧急
          <span class="dot attention"></span>关注
          <span class="dot stable"></span>平稳
          <span class="dot offline"></span>失联
        </div>
      </div>
    </div>

    <!-- 患者列表 -->
    <div class="list-container">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <!-- 骨架屏 -->
        <div v-if="loading && patients.length === 0" class="skeleton-list">
          <div v-for="i in 4" :key="i" class="skeleton-card">
            <div class="sk-avatar"></div>
            <div class="sk-content">
              <div class="sk-line w60"></div>
              <div class="sk-line w80"></div>
            </div>
          </div>
        </div>

        <!-- 真实列表 -->
        <div v-else class="patient-list">
          <div
            v-for="patient in patients"
            :key="patient.id"
            :class="['patient-card', `status-${patient.status}`]"
            @click="goToDetail(patient.id)"
          >
            <!-- 头像 -->
            <div :class="['avatar', `border-${patient.status}`]">
              <span class="avatar-text">{{ patient.name.charAt(0) }}</span>
              <div v-if="patient.status === 'urgent'" class="pulse-ring"></div>
            </div>

            <!-- 主内容 -->
            <div class="card-body">
              <div class="name-row">
                <span class="name">{{ patient.name }}</span>
                <span class="age">{{ patient.age }}岁</span>
              </div>

              <div class="info-row">
                <!-- 预警信息 -->
                <template v-if="patient.hasAlert && patient.alertTypes?.length">
                  <div class="alert-tags">
                    <span v-for="t in patient.alertTypes" :key="t" :class="['tag', `tag-${t}`]">
                      {{ alertLabel(t) }}
                    </span>
                  </div>
                  <span v-if="patient.latestAlert" class="alert-value">
                    <span class="value-num">{{ patient.latestAlert.value }}</span>
                    <span class="value-unit">{{ patient.latestAlert.unit }}</span>
                  </span>
                </template>

                <!-- 平稳状态 -->
                <template v-else-if="patient.status === 'stable'">
                  <div class="stable-badge">
                    <van-icon name="shield-o" class="shield-icon" />
                    <span>持续达标 {{ patient.stableDays || 0 }} 天</span>
                  </div>
                </template>

                <!-- 失联状态 -->
                <template v-else-if="patient.status === 'offline'">
                  <div class="offline-badge">
                    <van-icon name="clock-o" />
                    <span>{{ patient.statusText }}</span>
                  </div>
                </template>

                <!-- 时间 -->
                <span class="time">{{ formatTime(patient.lastMeasureTime || patient.createdAt) }}</span>
              </div>
            </div>

            <!-- 状态标签 -->
            <div :class="['status-indicator', `ind-${patient.status}`]">
              {{ statusLabel(patient.status) }}
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="patients.length === 0 && !loading" class="empty">
            <van-icon name="friends-o" class="empty-icon" />
            <p>暂无患者数据</p>
          </div>

          <div v-if="patients.length > 0" class="list-end">已显示全部</div>
        </div>
      </van-pull-refresh>
    </div>

    <!-- 底部导航 -->
    <van-tabbar v-model="activeNav" fixed class="bottom-nav">
      <van-tabbar-item name="card" icon="qr" @click="router.push('/card')">名片</van-tabbar-item>
      <van-tabbar-item name="patients" icon="friends">患者</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPatients, getRiskDashboard } from '@/api'
import type { Patient, RiskDashboard, PatientStatus } from '@/api'

const router = useRouter()
const keyword = ref('')
const patients = ref<Patient[]>([])
const loading = ref(true)
const refreshing = ref(false)
const activeNav = ref('patients')
const dashboard = ref<RiskDashboard | null>(null)

const alertLabel = (type: string) => {
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

const goToDetail = (id: number) => {
  router.push(`/patient/${id}`)
}

const loadDashboard = async () => {
  try {
    dashboard.value = await getRiskDashboard() as unknown as RiskDashboard
  } catch { /* ignore */ }
}

const loadPatients = async () => {
  loading.value = true
  try {
    patients.value = await getPatients(keyword.value || undefined) as unknown as Patient[]
  } catch { /* ignore */ }
  loading.value = false
}

const handleSearch = () => {
  loadPatients()
}

const onRefresh = async () => {
  await Promise.all([loadPatients(), loadDashboard()])
  refreshing.value = false
}

onMounted(() => {
  loadDashboard()
  loadPatients()
})
</script>

<style scoped>
/* ===== 页面基础 ===== */
.patients-page {
  min-height: 100vh;
  background: #F0F2F5;
  padding-bottom: 60px;
}

/* ===== 顶部固定区域 ===== */
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #FFFFFF;
  padding: 12px 16px 10px;
  border-bottom: 1px solid #E2E8F0;
}

/* ===== 搜索框 ===== */
.search-box {
  display: flex;
  align-items: center;
  height: 40px;
  background: #F8FAFC;
  border-radius: 10px;
  padding: 0 14px;
  margin-bottom: 14px;
  border: 1px solid #E2E8F0;
}
.search-icon { color: #94A3B8; font-size: 16px; }
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 10px;
  font-size: 14px;
  color: #1E293B;
  outline: none;
}
.search-input::placeholder { color: #94A3B8; }
.clear-icon { color: #94A3B8; font-size: 14px; cursor: pointer; }

/* ===== 预警统计块：临床降噪版 ===== */
.warning-tiles {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.tile {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.15s ease;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
}
.tile:active {
  transform: scale(0.97);
  background: #F8FAFC;
}

.tile-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.tile-icon {
  font-size: 13px;
  line-height: 1;
  opacity: 0.9;
}

.tile-title {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  letter-spacing: 0.3px;
}

/* 数字保留业务色 */
.tile-num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 4px;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
}
.tile-glucose .tile-num { color: #B45309; }
.tile-bp .tile-num { color: #DC2626; }
.tile-hr .tile-num { color: #7C3AED; }

.tile-sub {
  font-size: 10px;
  font-weight: 400;
  color: #94A3B8;
  letter-spacing: 0.2px;
}

/* ===== 统计行 ===== */
.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6B7280;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}
.stats-bar b { color: #3B82F6; font-weight: 700; }

.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #9CA3AF;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-left: 8px;
}
.dot.urgent { background: #EF4444; }
.dot.attention { background: #F59E0B; }
.dot.stable { background: #10B981; }
.dot.offline { background: #9CA3AF; }

/* ===== 列表区域 ===== */
.list-container {
  padding: 10px 16px;
}

/* 骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: #FFF;
  border-radius: 12px;
}
.sk-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(90deg, #F3F4F6 25%, #E8E9EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.sk-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}
.sk-line {
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #F3F4F6 25%, #E8E9EB 50%, #F3F4F6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.sk-line.w60 { width: 60%; }
.sk-line.w80 { width: 80%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== 患者列表 ===== */
.patient-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.patient-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #FFFFFF;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background 0.15s ease;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}
.patient-card:active {
  transform: scale(0.98);
  background: #F8FAFC;
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
}

/* 头像 */
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  border: 2px solid transparent;
  transition: box-shadow 0.3s ease;
}
.avatar-text {
  font-size: 17px;
  font-weight: 700;
  color: #FFF;
}

.avatar.border-urgent {
  border-color: #EF4444;
  background: linear-gradient(135deg, #EF4444, #DC2626);
  animation: urgent-glow 2s ease-in-out infinite;
}
.avatar.border-attention {
  border-color: #FB923C;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  box-shadow: 0 0 0 0 rgba(251, 146, 60, 0);
}
.avatar.border-stable {
  border-color: #22C55E;
  background: linear-gradient(135deg, #10B981, #059669);
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
}
.avatar.border-offline {
  border-color: #9CA3AF;
  background: linear-gradient(135deg, #9CA3AF, #6B7280);
}

/* 紧急状态呼吸 box-shadow */
@keyframes urgent-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15); }
}

/* 呼吸灯环（保留） */
.pulse-ring {
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  border: 2px solid #EF4444;
  animation: pulse 1.5s ease-out infinite;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.25); opacity: 0; }
}

/* 卡片内容 */
.card-body {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}
.name {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
}
.age {
  font-size: 12px;
  color: #94A3B8;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 预警标签 - 半透明 rgba 背景 */
.alert-tags {
  display: flex;
  gap: 4px;
}
.tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.tag-glucose { background: rgba(245, 158, 11, 0.12); color: #92400E; }
.tag-bp { background: rgba(239, 68, 68, 0.1); color: #991B1B; }
.tag-hr { background: rgba(139, 92, 246, 0.1); color: #5B21B6; }

/* 预警数值 - 精密排版 */
.alert-value {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  font-family: 'SF Mono', Monaco, monospace;
}
.value-num {
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
}
.value-unit {
  font-size: 10px;
  font-weight: 400;
  color: #94A3B8;
}

/* 平稳状态徽章 */
.stable-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #059669;
  background: rgba(16, 185, 129, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
}
.shield-icon {
  font-size: 13px;
}

/* 失联徽章 */
.offline-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
}

.time {
  font-size: 11px;
  color: #CBD5E1;
  margin-left: auto;
}

/* 状态指示器 - 半透明背景 */
.status-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.ind-urgent { background: rgba(239, 68, 68, 0.1); color: #DC2626; }
.ind-attention { background: rgba(245, 158, 11, 0.1); color: #B45309; }
.ind-stable { background: rgba(16, 185, 129, 0.08); color: #059669; }
.ind-offline { background: rgba(100, 116, 139, 0.08); color: #64748B; }

/* 空状态 */
.empty {
  text-align: center;
  padding: 60px 0;
  color: #9CA3AF;
}
.empty-icon { font-size: 48px; margin-bottom: 12px; }

.list-end {
  text-align: center;
  padding: 16px;
  font-size: 12px;
  color: #C8C9CC;
}

/* 底部导航 */
.bottom-nav :deep(.van-tabbar) {
  border-top: 1px solid #EBEDF0;
}
.bottom-nav :deep(.van-tabbar-item--active) {
  color: #3B82F6;
}
</style>
