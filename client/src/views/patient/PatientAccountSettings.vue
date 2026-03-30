<template>
  <div class="account-page">
    <div class="header-bar">
      <button class="header-back" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="header-title">账号设置</span>
      <div class="header-back" style="visibility: hidden;"><svg width="22" height="22" viewBox="0 0 24 24" /></div>
    </div>

    <!-- Info section -->
    <div class="info-section">
      <div class="info-row">
        <span class="info-label">当前手机号</span>
        <span class="info-value">{{ maskedPhone }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">注册时间</span>
        <span class="info-value">2026-01-15</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="section">
      <div class="card-group">
        <button class="cell-item" @click="changePhone">
          <div class="cell-icon cell-icon--blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <span class="cell-title">修改手机号</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button class="cell-item" @click="deactivateAccount">
          <div class="cell-icon cell-icon--red">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </div>
          <span class="cell-title cell-title--danger">注销账号</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <div class="safe-bottom"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { usePatientStore } from '@/stores/patient'

const router = useRouter()
const store = usePatientStore()

const maskedPhone = computed(() => {
  const p = store.profile?.phone || ''
  if (p.length !== 11) return p || '未绑定'
  return p.slice(0, 3) + '****' + p.slice(7)
})

const changePhone = () => {
  showDialog({
    title: '修改手机号',
    message: '请输入新手机号，系统将发送验证码进行验证。',
    showCancelButton: true,
    confirmButtonText: '发送验证码',
    confirmButtonColor: '#8A7BFE',
  }).then(() => {
    showToast('验证码已发送（模拟）')
    setTimeout(() => {
      showToast('手机号修改成功（模拟）')
    }, 1500)
  }).catch(() => {})
}

const deactivateAccount = () => {
  showDialog({
    title: '注销账号',
    message: '注销后您的所有数据将被清除，且无法恢复。确定要注销吗？',
    showCancelButton: true,
    confirmButtonText: '确认注销',
    confirmButtonColor: '#ef4444',
  }).then(() => {
    store.logout()
    showToast('账号已注销')
    router.push('/p/login')
  }).catch(() => {})
}
</script>

<style scoped>
.account-page {
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

/* Info */
.info-section {
  margin: 16px;
  background: white;
  border-radius: 14px;
  padding: 4px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.info-row + .info-row { border-top: 1px solid #f1f5f9; }

.info-label {
  font-size: 14px;
  color: #64748b;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

/* Section */
.section {
  padding: 0 16px;
}

.card-group {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.cell-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.cell-item:active { background: #f8fafc; }
.cell-item + .cell-item { border-top: 1px solid #f1f5f9; }

.cell-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cell-icon--blue { background: rgba(138, 123, 254, 0.08); color: #8A7BFE; }
.cell-icon--red { background: rgba(239, 68, 68, 0.08); color: #ef4444; }

.cell-title {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #334155;
}

.cell-title--danger { color: #ef4444; }
.cell-arrow { flex-shrink: 0; }

.safe-bottom {
  height: calc(20px + env(safe-area-inset-bottom));
}
</style>
