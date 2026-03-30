<template>
  <div class="patients-page">
    <!-- 顶部固定区域 -->
    <div class="sticky-top">
      <!-- 搜索框 -->
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索患者姓名"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <svg v-if="keyword" class="clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" @click="keyword = ''; handleSearch()"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>

      <!-- 筛选标签 -->
      <div class="filter-row">
        <div
          v-for="f in filters"
          :key="f.value"
          :class="['filter-chip', { active: activeFilter === f.value }]"
          @click="activeFilter = f.value"
        >
          <span v-if="f.dot" :class="['chip-dot', f.dot]"></span>
          {{ f.label }}
          <span class="chip-count">{{ f.count }}</span>
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
            v-for="patient in sortedPatients"
            :key="patient.id"
            class="patient-card"
            @click="goToDetail(patient.id)"
          >
            <div class="card-inner">
              <!-- 左：头像 -->
              <div :class="['avatar', `av-${patient.status}`]">
                <span class="avatar-text">{{ patient.name.charAt(0) }}</span>
              </div>

              <!-- 中：信息 -->
              <div class="card-body">
                <div class="name-row">
                  <span class="name">{{ patient.name }}</span>
                  <span class="age">{{ patient.age }}岁</span>
                  <span :class="['status-dot', `dot-${patient.status}`]"></span>
                </div>

                <div class="metric-row">
                  <!-- 预警标签 -->
                  <template v-if="patient.hasAlert && patient.alertTypes?.length">
                    <span v-for="t in patient.alertTypes" :key="t" :class="['metric-tag', `mt-${t}`]">
                      {{ alertLabel(t) }}
                      <template v-if="patient.latestAlert && patient.latestAlert.alertType === t">
                        {{ patient.latestAlert.value }}
                      </template>
                    </span>
                  </template>
                  <!-- 平稳 -->
                  <template v-else-if="patient.status === 'stable'">
                    <span class="metric-stable">达标 {{ patient.stableDays || 0 }}天</span>
                  </template>
                  <!-- 失联 -->
                  <template v-else-if="patient.status === 'offline'">
                    <span class="metric-offline">{{ patient.statusText || '未监测' }}</span>
                  </template>
                </div>
              </div>

              <!-- 右：时间 -->
              <span class="card-time">{{ formatTime(patient.lastMeasureTime || patient.createdAt) }}</span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="sortedPatients.length === 0 && !loading" class="empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p>暂无患者数据</p>
          </div>

          <div v-if="sortedPatients.length > 0" class="list-end">已显示全部</div>
        </div>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPatients } from '@/api'
import type { Patient } from '@/api'

const router = useRouter()
const keyword = ref('')
const patients = ref<Patient[]>([])
const loading = ref(true)
const refreshing = ref(false)
const activeFilter = ref('all')

const alertLabel = (type: string) => {
  const map: Record<string, string> = { glucose: '血糖', bp: '血压', hr: '心率' }
  return map[type] || type
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

// 筛选标签
const filters = computed(() => {
  const all = patients.value
  return [
    { label: '全部', value: 'all', count: all.length, dot: '' },
    { label: '紧急', value: 'urgent', count: all.filter(p => p.status === 'urgent').length, dot: 'dot-urgent' },
    { label: '关注', value: 'attention', count: all.filter(p => p.status === 'attention').length, dot: 'dot-attention' },
    { label: '平稳', value: 'stable', count: all.filter(p => p.status === 'stable').length, dot: 'dot-stable' },
    { label: '失联', value: 'offline', count: all.filter(p => p.status === 'offline').length, dot: 'dot-offline' },
  ]
})

// 排序：紧急→关注→平稳→失联
const statusOrder: Record<string, number> = { urgent: 0, attention: 1, stable: 2, offline: 3 }

const sortedPatients = computed(() => {
  let list = patients.value
  if (activeFilter.value !== 'all') {
    list = list.filter(p => p.status === activeFilter.value)
  }
  return [...list].sort((a, b) => {
    const oa = statusOrder[a.status || 'offline'] ?? 9
    const ob = statusOrder[b.status || 'offline'] ?? 9
    return oa - ob
  })
})

const goToDetail = (id: number) => {
  router.push(`/patient/${id}`)
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
  await loadPatients()
  refreshing.value = false
}

onMounted(() => {
  loadPatients()
})
</script>

<style scoped>
.patients-page {
  min-height: 100vh;
  background: #F2F5FA;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
  padding-bottom: 10px;
}

/* ===== 顶部固定 ===== */
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #F2F5FA;
  padding: 12px 16px 8px;
}

/* ===== 搜索框 ===== */
.search-box {
  display: flex;
  align-items: center;
  height: 40px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 0 14px;
  margin-bottom: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.search-icon {
  width: 16px;
  height: 16px;
  color: #8A9AC3;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 10px;
  font-size: 14px;
  color: #1A2238;
  outline: none;
}
.search-input::placeholder { color: #8A9AC3; }
.clear-icon {
  width: 16px;
  height: 16px;
  color: #8A9AC3;
  cursor: pointer;
  flex-shrink: 0;
}

/* ===== 筛选标签 ===== */
.filter-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}
.filter-row::-webkit-scrollbar { display: none; }
.filter-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #8A9AC3;
  background: #FFFFFF;
  border-radius: 20px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.filter-chip.active {
  background: #396CFF;
  color: #fff;
  box-shadow: 0 8px 20px rgba(57, 108, 255, 0.3);
}
.filter-chip.active .chip-dot {
  background: rgba(255, 255, 255, 0.6) !important;
}
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.chip-dot.dot-urgent { background: #FF4C61; }
.chip-dot.dot-attention { background: #F59E0B; }
.chip-dot.dot-stable { background: #10B981; }
.chip-dot.dot-offline { background: #B4C0DC; }
.chip-count {
  font-size: 11px;
  opacity: 0.6;
}

/* ===== 列表 ===== */
.list-container {
  padding: 8px 16px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #FFF;
  border-radius: 24px;
}
.sk-avatar {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(90deg, #E8ECF4 25%, #DDE2ED 50%, #E8ECF4 75%);
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
  border-radius: 6px;
  background: linear-gradient(90deg, #E8ECF4 25%, #DDE2ED 50%, #E8ECF4 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.sk-line.w60 { width: 60%; }
.sk-line.w80 { width: 80%; }
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== 患者卡片 ===== */
.patient-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.patient-card {
  background: #FFFFFF;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.15s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
}
.patient-card:active {
  transform: scale(0.98);
}

.card-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}

/* 头像 */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-text {
  font-size: 14px;
  font-weight: 700;
  color: #FFF;
}
.av-urgent { background: linear-gradient(135deg, #FF4C61, #E8364A); }
.av-attention { background: linear-gradient(135deg, #F59E0B, #D97706); }
.av-stable { background: linear-gradient(135deg, #10B981, #059669); }
.av-offline { background: linear-gradient(135deg, #B4C0DC, #8A9AC3); }

/* 内容区 */
.card-body {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}
.name {
  font-size: 14px;
  font-weight: 700;
  color: #1A2238;
}
.age {
  font-size: 11px;
  color: #8A9AC3;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-left: 2px;
}
.dot-urgent { background: #FF4C61; }
.dot-attention { background: #F59E0B; }
.dot-stable { background: #10B981; }
.dot-offline { background: #B4C0DC; }

/* 指标行 */
.metric-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.metric-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.mt-bp { background: rgba(255, 76, 97, 0.08); color: #FF4C61; }
.mt-glucose { background: rgba(245, 158, 11, 0.08); color: #D97706; }
.mt-hr { background: rgba(139, 92, 246, 0.08); color: #8B5CF6; }

.metric-stable {
  font-size: 11px;
  color: #059669;
  font-weight: 500;
}
.metric-offline {
  font-size: 11px;
  color: #8A9AC3;
  font-weight: 500;
}

/* 右侧时间 */
.card-time {
  flex-shrink: 0;
  font-size: 10px;
  color: #B4C0DC;
  text-align: right;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 60px 0;
  color: #8A9AC3;
}
.empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  display: block;
  color: #B4C0DC;
}
.empty p {
  font-size: 14px;
  margin: 0;
}

.list-end {
  text-align: center;
  padding: 16px;
  font-size: 12px;
  color: #B4C0DC;
}
</style>
