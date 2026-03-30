<template>
  <div class="alert-page">
    <div class="header-bar">
      <button class="header-back" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="header-title">预警记录</span>
      <div class="header-back" style="visibility: hidden;"><svg width="22" height="22" viewBox="0 0 24 24" /></div>
    </div>

    <!-- Member filter -->
    <div class="filter-bar">
      <div class="filter-scroll">
        <button
          class="filter-tag"
          :class="{ 'filter-tag--active': !filterMemberId }"
          @click="filterMemberId = null"
        >全部</button>
        <button
          v-for="m in memberList"
          :key="m.patientId"
          class="filter-tag"
          :class="{ 'filter-tag--active': filterMemberId === m.patientId }"
          @click="filterMemberId = m.patientId"
        >
          {{ m.relationship }}·{{ m.memberName }}
        </button>
      </div>
    </div>

    <van-loading v-if="loading" type="spinner" size="36" color="#8A7BFE" class="page-loading" />

    <template v-else>
      <div v-if="filteredAlerts.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>暂无预警记录，所有家人健康状况良好</span>
      </div>

      <div v-else class="timeline">
        <template v-for="(group, gi) in groupedAlerts" :key="gi">
          <div class="tl-date">{{ group.date }}</div>
          <div v-for="(a, ai) in group.items" :key="ai" class="tl-item">
            <div class="tl-rail">
              <div class="tl-dot" :class="'tl-dot--' + a.level"></div>
              <div v-if="ai < group.items.length - 1" class="tl-line"></div>
            </div>
            <div class="tl-card">
              <div class="tl-card-header">
                <span class="tl-member">{{ a.memberName }}</span>
                <span class="tl-relation">{{ a.relationship }}</span>
                <span class="tl-time">{{ formatTime(a.alertTime) }}</span>
              </div>
              <div class="tl-desc">{{ a.description }}</div>
              <div class="tl-value">{{ a.value }} {{ a.unit }}</div>
              <div class="tl-tags">
                <span class="tl-level" :class="'tl-level--' + a.level">{{ a.level === 'danger' ? '严重' : '警告' }}</span>
                <span v-if="getHandledLabel(a)" class="tl-handled">{{ getHandledLabel(a) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>

    <div class="safe-bottom"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllAlertHistory } from '@/api/patient'

const router = useRouter()
const loading = ref(true)
const alerts = ref<any[]>([])
const filterMemberId = ref<number | null>(null)

onMounted(async () => {
  try {
    alerts.value = (await getAllAlertHistory()) as any || []
  } catch { alerts.value = [] }
  finally { loading.value = false }
})

const memberList = computed(() => {
  const map = new Map<number, { patientId: number; memberName: string; relationship: string }>()
  for (const a of alerts.value) {
    if (!map.has(a.patientId)) {
      map.set(a.patientId, { patientId: a.patientId, memberName: a.memberName, relationship: a.relationship })
    }
  }
  return Array.from(map.values())
})

const filteredAlerts = computed(() => {
  if (!filterMemberId.value) return alerts.value
  return alerts.value.filter(a => a.patientId === filterMemberId.value)
})

const groupedAlerts = computed(() => {
  const groups: { date: string; items: any[] }[] = []
  let lastDate = ''
  for (const a of filteredAlerts.value) {
    const d = a.alertTime?.split('T')[0] || '未知日期'
    if (d !== lastDate) {
      groups.push({ date: d, items: [] })
      lastDate = d
    }
    groups[groups.length - 1].items.push(a)
  }
  return groups
})

function formatTime(t: string) {
  if (!t) return ''
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function getHandledLabel(a: any) {
  try {
    const raw = localStorage.getItem(`alert_state_${a.patientId}`)
    if (!raw) return ''
    const state = JSON.parse(raw)
    if (Date.now() - state.savedAt > 24 * 3600 * 1000) return ''
    if (state.hasReply) return '医生已回复'
    if (state.type === 'waiting_doctor') return '已联系医生'
    return '已处理'
  } catch { return '' }
}
</script>

<style scoped>
.alert-page {
  min-height: 100vh;
  background: #f8fafc;
}

/* Header */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-back {
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

.header-back:active { background: #e2e8f0; }

.header-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

/* Filter */
.filter-bar {
  background: white;
  padding: 10px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.filter-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-scroll::-webkit-scrollbar { display: none; }

.filter-tag {
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s;
}

.filter-tag--active {
  background: #8A7BFE;
  color: white;
  border-color: #8A7BFE;
}

.filter-tag:active { opacity: 0.8; }

/* Loading */
.page-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

/* Empty */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 32px;
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
}

/* Timeline */
.timeline {
  padding: 16px;
}

.tl-date {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  padding: 8px 0;
}

.tl-item {
  display: flex;
  gap: 12px;
}

.tl-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
}

.tl-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.tl-dot--danger {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.tl-dot--warning {
  background: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
}

.tl-line {
  flex: 1;
  width: 2px;
  background: #e2e8f0;
  min-height: 12px;
}

.tl-card {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.tl-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.tl-member {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.tl-relation {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(138, 123, 254, 0.08);
  color: #8A7BFE;
}

.tl-time {
  font-size: 12px;
  color: #94a3b8;
  margin-left: auto;
}

.tl-desc {
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 4px;
}

.tl-value {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  margin-bottom: 8px;
}

.tl-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.tl-level {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.tl-level--danger {
  color: #dc2626;
  background: #fef2f2;
}

.tl-level--warning {
  color: #ea580c;
  background: #fff7ed;
}

.tl-handled {
  font-size: 11px;
  font-weight: 500;
  color: #059669;
  background: #f0fdf4;
  padding: 2px 8px;
  border-radius: 6px;
}

.safe-bottom {
  height: calc(20px + env(safe-area-inset-bottom));
}
</style>
