<template>
  <div class="doctor-layout">
    <div class="layout-content">
      <router-view />
    </div>

    <!-- 3-Tab Bottom Bar -->
    <div class="tab-bar-wrapper">
      <div class="tab-bar">
        <button
          class="tab-item"
          :class="{ 'tab-active': activeTab === 'workspace' }"
          @click="switchTab('workspace')"
        >
          <div class="tab-icon-wrap">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <div v-if="reviewCount > 0" class="tab-badge">{{ reviewCount > 99 ? '99+' : reviewCount }}</div>
          </div>
          <span class="tab-label">工作台</span>
        </button>

        <button
          class="tab-item"
          :class="{ 'tab-active': activeTab === 'patients' }"
          @click="switchTab('patients')"
        >
          <div class="tab-icon-wrap">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <span class="tab-label">患者</span>
        </button>

        <button
          class="tab-item"
          :class="{ 'tab-active': activeTab === 'me' }"
          @click="switchTab('me')"
        >
          <div class="tab-icon-wrap">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span class="tab-label">我的</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getPendingReviews } from '@/api'

const router = useRouter()
const route = useRoute()

const activeTab = ref('workspace')
const reviewCount = ref(0)

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/d/patients')) activeTab.value = 'patients'
    else if (path.startsWith('/d/me')) activeTab.value = 'me'
    else activeTab.value = 'workspace'
  },
  { immediate: true },
)

const switchTab = (name: string) => {
  const routes: Record<string, string> = {
    workspace: '/d/workspace',
    patients: '/d/patients',
    me: '/d/me',
  }
  const target = routes[name]
  if (target && route.path !== target) {
    router.push(target)
  }
}

const loadBadges = async () => {
  try {
    const reviews = await getPendingReviews() as any
    reviewCount.value = reviews?.count || 0
  } catch {
    // ignore
  }
}

onMounted(loadBadges)
</script>

<style scoped>
.doctor-layout {
  min-height: 100vh;
  background: #F2F5FA;
}

.layout-content {
  padding-bottom: 64px;
}

/* ========== Tab Bar ========== */
.tab-bar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.02);
}

.tab-bar {
  display: flex;
  align-items: center;
  height: 56px;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 100%;
  border: none;
  background: none;
  cursor: pointer;
  color: #8A9AC3;
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.tab-active {
  color: #396CFF;
}

.tab-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #FF4C61;
  color: white;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
}

.tab-icon {
  width: 22px;
  height: 22px;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
  margin-top: 1px;
  line-height: 1;
}
</style>
