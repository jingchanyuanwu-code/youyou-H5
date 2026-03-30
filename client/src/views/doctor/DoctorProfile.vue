<template>
  <div class="profile-page">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <div class="nav-back" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </div>
      <span class="nav-title">个人信息</span>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 个人信息 -->
    <section class="info-section">
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">头像</span>
          <div class="info-value">
            <img :src="doctor?.avatar || defaultAvatar" class="info-avatar" />
            <van-icon name="arrow" color="#B4C0DC" />
          </div>
        </div>
        <div class="info-row">
          <span class="info-label">姓名</span>
          <div class="info-value">
            <span>{{ doctor?.name || '-' }}</span>
            <van-icon name="arrow" color="#B4C0DC" />
          </div>
        </div>
        <div class="info-row">
          <span class="info-label">职称</span>
          <div class="info-value">
            <span>{{ doctor?.title || '-' }}</span>
            <van-icon name="arrow" color="#B4C0DC" />
          </div>
        </div>
        <div class="info-row">
          <span class="info-label">医院</span>
          <div class="info-value">
            <span>{{ doctor?.hospital || '-' }}</span>
            <van-icon name="arrow" color="#B4C0DC" />
          </div>
        </div>
        <div class="info-row last">
          <span class="info-label">科室</span>
          <div class="info-value">
            <span>{{ doctor?.department || '-' }}</span>
            <van-icon name="arrow" color="#B4C0DC" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile } from '@/api'
import type { Doctor } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const defaultAvatar = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face'

const doctor = ref<Doctor | null>(null)

onMounted(async () => {
  if (userStore.doctor) {
    doctor.value = userStore.doctor as Doctor
  } else {
    try {
      const res = await getProfile() as unknown as Doctor
      doctor.value = res
      userStore.setDoctor(res)
    } catch { /* ignore */ }
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #F2F5FA;
  padding-bottom: env(safe-area-inset-bottom);
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #F2F5FA;
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1A2238;
  border-radius: 12px;
}
.nav-back:active {
  background: rgba(57, 108, 255, 0.08);
}
.nav-back svg {
  width: 20px;
  height: 20px;
}
.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #1A2238;
}
.nav-placeholder {
  width: 36px;
}

.info-section {
  padding: 8px 16px;
}
.info-card {
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  border-bottom: 1px solid #E8ECF4;
  cursor: pointer;
}
.info-row.last {
  border-bottom: none;
}
.info-row:active {
  background: #F9FAFB;
}
.info-label {
  font-size: 15px;
  color: #1A2238;
  font-weight: 500;
}
.info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8A9AC3;
  font-size: 14px;
}
.info-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  object-fit: cover;
}
</style>
