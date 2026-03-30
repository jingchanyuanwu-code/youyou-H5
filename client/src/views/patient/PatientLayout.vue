<template>
  <div class="patient-layout">
    <div class="layout-content">
      <router-view />
    </div>

    <!-- 2-Tab Bottom Bar -->
    <div class="tab-bar-wrapper">
      <div class="tab-bar">
        <button
          class="tab-item"
          :class="{ 'tab-active': activeTab === 'home' }"
          @click="switchTab('home')"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          <span class="tab-label">健康领航</span>
        </button>

        <button
          class="tab-item"
          :class="{ 'tab-active': activeTab === 'consult' }"
          @click="switchTab('consult')"
        >
          <div class="tab-icon-wrap">
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <div class="tab-dot"></div>
          </div>
          <span class="tab-label">健康咨询</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const activeTab = ref('home')

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/p/consult')) activeTab.value = 'consult'
    else activeTab.value = 'home'
  },
  { immediate: true },
)

const switchTab = (name: string) => {
  const routes: Record<string, string> = {
    home: '/p/home',
    consult: '/p/consult',
  }
  const target = routes[name]
  if (target && route.path !== target) {
    router.push(target)
  }
}
</script>

<style scoped>
.patient-layout {
  min-height: 100vh;
  background: #f8fafc;
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
}

.tab-bar {
  display: flex;
  align-items: center;
  height: 56px;
  border-top: 1px solid #f1f5f9;
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
  color: #94a3b8;
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.tab-active {
  color: #8A7BFE;
}

.tab-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-dot {
  position: absolute;
  top: -1px;
  right: -5px;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
}

.tab-icon {
  width: 22px;
  height: 22px;
}

.tab-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
