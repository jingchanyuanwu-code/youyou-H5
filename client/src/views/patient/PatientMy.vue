<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="header-bar">
      <button class="header-back" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="header-title">设置</span>
      <div class="header-back" style="visibility: hidden;">
        <svg width="22" height="22" viewBox="0 0 24 24" />
      </div>
    </div>

    <!-- Profile card -->
    <div class="profile-card">
      <div class="profile-avatar">
        {{ profile?.name?.charAt(0) || '?' }}
      </div>
      <div class="profile-info">
        <span class="profile-name">{{ profile?.name || '加载中...' }}</span>
        <span class="profile-phone">{{ formatPhone(profile?.phone) }}</span>
      </div>
    </div>

    <!-- Section: 身份管理 -->
    <div class="section">
      <div class="section-label">身份管理</div>
      <div class="card-group">
        <button class="cell-item" @click="showFocusPicker = true">
          <div class="cell-icon cell-icon--blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <span class="cell-title">重点关注</span>
          <span class="cell-value">{{ focusLabel }}</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button class="cell-item" @click="showMemberMgr = true">
          <div class="cell-icon cell-icon--teal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <span class="cell-title">家庭成员管理</span>
          <span class="cell-value">{{ members.length }} 人</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Section: 健康记录 -->
    <div class="section">
      <div class="section-label">健康记录</div>
      <div class="card-group">
        <button class="cell-item" @click="router.push('/p/my-doctor')">
          <div class="cell-icon cell-icon--green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <span class="cell-title">我的医生</span>
          <span class="cell-value">{{ doctorName || '未绑定' }}</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button class="cell-item" @click="router.push('/p/recovery-report')">
          <div class="cell-icon cell-icon--sky">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <span class="cell-title">康复报告</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button class="cell-item" @click="router.push('/p/alert-history')">
          <div class="cell-icon cell-icon--orange">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <span class="cell-title">预警记录</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button class="cell-item" @click="router.push('/p/doctor-messages')">
          <div class="cell-icon cell-icon--purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <span class="cell-title">医生留言</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Section: 其他设置 -->
    <div class="section">
      <div class="section-label">其他设置</div>
      <div class="card-group">
        <button class="cell-item" @click="router.push('/p/account-settings')">
          <div class="cell-icon cell-icon--slate">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
          <span class="cell-title">账号设置</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button class="cell-item" @click="router.push('/p/help-center')">
          <div class="cell-icon cell-icon--slate">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <span class="cell-title">帮助中心</span>
          <svg class="cell-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Logout -->
    <div class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>

    <!-- Version -->
    <div class="version-text">呦呦·心康 v1.0.0</div>

    <!-- ========== 重点关注选择弹窗 ========== -->
    <van-popup v-model:show="showFocusPicker" position="bottom" round :style="{ maxHeight: '55%' }">
      <div class="popup-content">
        <div class="popup-title">选择重点关注</div>
        <div
          class="focus-item"
          :class="{ 'focus-item--active': !store.focusMemberId }"
          @click="selectFocus(null)"
        >
          <div class="focus-avatar focus-avatar--self">{{ profile?.name?.charAt(0) || '?' }}</div>
          <div class="focus-info">
            <span class="focus-name">{{ profile?.name || '--' }}</span>
            <span class="focus-tag focus-tag--self">本人</span>
          </div>
          <svg v-if="!store.focusMemberId" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div
          v-for="m in members"
          :key="m.patientId"
          class="focus-item"
          :class="{ 'focus-item--active': store.focusMemberId === m.patientId }"
          @click="selectFocus(m)"
        >
          <div class="focus-avatar">{{ m.name?.charAt(0) || '?' }}</div>
          <div class="focus-info">
            <span class="focus-name">{{ m.name }}</span>
            <span class="focus-tag">{{ m.relationship || '成员' }}</span>
          </div>
          <svg v-if="store.focusMemberId === m.patientId" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div v-if="!members.length" class="popup-empty">暂无家庭成员，请先添加</div>
      </div>
    </van-popup>

    <!-- ========== 家庭成员管理弹窗 ========== -->
    <van-popup v-model:show="showMemberMgr" position="bottom" round :style="{ maxHeight: '65%' }">
      <div class="popup-content">
        <div class="popup-title">家庭成员管理</div>
        <div v-for="m in members" :key="m.patientId" class="mgr-item">
          <div class="mgr-avatar">{{ m.name?.charAt(0) || '?' }}</div>
          <div class="mgr-info">
            <span class="mgr-name">{{ m.name }}</span>
            <span class="mgr-relation">{{ m.relationship || '成员' }}</span>
          </div>
          <button class="mgr-btn mgr-btn--edit" @click="editMember(m)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
          <button class="mgr-btn mgr-btn--delete" @click="deleteMember(m)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div v-if="!members.length" class="popup-empty">暂无家庭成员</div>
        <button class="add-member-btn" @click="startAddMember">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加成员
        </button>
      </div>
    </van-popup>

    <!-- ========== 关系选择弹窗 ========== -->
    <van-popup v-model:show="showRelPicker" position="bottom" round>
      <div class="popup-content">
        <div class="popup-title">选择与您的关系</div>
        <div class="rel-grid">
          <button
            v-for="r in relationships"
            :key="r"
            class="rel-btn"
            @click="pickRelation(r)"
          >
            {{ r }}
          </button>
        </div>
      </div>
    </van-popup>

    <!-- ========== 扫码模拟弹窗 ========== -->
    <van-popup v-model:show="showScanPopup" :close-on-click-overlay="false" round :style="{ width: '80%', borderRadius: '16px' }">
      <div class="scan-popup">
        <template v-if="!scanSuccess">
          <div class="scan-title">扫一扫</div>
          <div class="scan-frame">
            <div class="scan-line"></div>
            <div class="scan-corner scan-corner--tl"></div>
            <div class="scan-corner scan-corner--tr"></div>
            <div class="scan-corner scan-corner--bl"></div>
            <div class="scan-corner scan-corner--br"></div>
          </div>
          <div class="scan-hint">请让家属出示二维码</div>
        </template>
        <template v-else>
          <div class="scan-success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div class="scan-success-text">绑定成功</div>
          <div class="scan-success-sub">已添加{{ pendingRelation }}到家庭成员</div>
        </template>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { getPatientProfile, getFamilyMembers } from '@/api/patient'
import { usePatientStore } from '@/stores/patient'

const store = usePatientStore()
const router = useRouter()
const profile = ref<any>(null)
const members = ref<any[]>([])
const doctorName = ref('')
// Popups
const showFocusPicker = ref(false)
const showMemberMgr = ref(false)
const showRelPicker = ref(false)
const showScanPopup = ref(false)
const scanSuccess = ref(false)
const pendingRelation = ref('')
const relationships = ['父亲', '母亲', '配偶', '子女', '其他']

onMounted(async () => {
  try {
    profile.value = (await getPatientProfile()) as any
  } catch { /* silent */ }
  try {
    members.value = (await getFamilyMembers()) as any
  } catch {
    members.value = []
  }
  // Load bound doctor
  const doc = localStorage.getItem('bound_doctor')
  if (doc) {
    try { doctorName.value = JSON.parse(doc).name } catch { /* ignore */ }
  }
})

const focusLabel = computed(() => {
  if (!store.focusMemberId) return '本人'
  return store.focusMemberName || '家属'
})

const formatPhone = (phone: string | undefined) => {
  if (!phone || phone.length !== 11) return phone || ''
  return phone.slice(0, 3) + ' **** ' + phone.slice(7)
}

// ========== Focus Selection ==========
const selectFocus = (member: any) => {
  if (!member) {
    store.setFocusMember(null)
    showFocusPicker.value = false
    showToast('已切换为关注本人')
  } else {
    store.setFocusMember(member.patientId, member.name)
    showFocusPicker.value = false
    showToast(`已重点关注 ${member.name}`)
  }
}

// ========== Member Management ==========
const editMember = (m: any) => {
  showDialog({
    title: '修改关系备注',
    message: `当前关系：${m.relationship || '未设置'}`,
    showCancelButton: true,
    confirmButtonColor: '#8A7BFE',
  }).then(() => {
    showToast('修改成功')
  }).catch(() => {})
}

const deleteMember = (m: any) => {
  showDialog({
    title: '删除成员',
    message: `确定要将「${m.name}」从家庭成员中移除吗？`,
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
  }).then(() => {
    members.value = members.value.filter(item => item.patientId !== m.patientId)
    if (store.focusMemberId === m.patientId) {
      store.setFocusMember(null)
    }
    showToast('已移除')
  }).catch(() => {})
}

const startAddMember = () => {
  showMemberMgr.value = false
  showRelPicker.value = true
}

const pickRelation = (relation: string) => {
  pendingRelation.value = relation
  showRelPicker.value = false
  scanSuccess.value = false
  showScanPopup.value = true
  // 模拟扫码：2秒后绑定成功
  setTimeout(() => {
    scanSuccess.value = true
    const mockId = 100 + Math.floor(Math.random() * 900)
    const mockName = relation === '父亲' ? '张大伯' : relation === '母亲' ? '张阿姨' : relation === '配偶' ? '李某某' : relation === '子女' ? '小明' : '亲属'
    members.value.push({
      patientId: mockId,
      name: mockName,
      relationship: relation,
    })
    setTimeout(() => {
      showScanPopup.value = false
    }, 1200)
  }, 2000)
}

// ========== Logout ==========
const handleLogout = () => {
  showDialog({
    title: '确认退出',
    message: '确定要退出登录吗？',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
  }).then(() => {
    store.logout()
    router.push('/p/login')
  }).catch(() => {})
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: calc(40px + env(safe-area-inset-bottom));
}

/* ========== Header ========== */
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

/* ========== Profile Card ========== */
.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 12px 16px 0;
  padding: 16px;
  background: linear-gradient(135deg, #8A7BFE, #7A6BEE);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(138, 123, 254, 0.2);
}

.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.profile-phone {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
}

/* ========== Sections ========== */
.section {
  padding: 0 16px;
  margin-top: 20px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 4px;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.card-group {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

/* ========== Cell Item ========== */
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

.cell-item + .cell-item {
  border-top: 1px solid #f1f5f9;
}

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
.cell-icon--teal { background: rgba(20, 184, 166, 0.08); color: #14b8a6; }
.cell-icon--green { background: rgba(16, 185, 129, 0.08); color: #10b981; }
.cell-icon--sky { background: rgba(138, 123, 254, 0.08); color: #A89AFE; }
.cell-icon--orange { background: rgba(249, 115, 22, 0.08); color: #f97316; }
.cell-icon--purple { background: rgba(138, 123, 254, 0.08); color: #8A7BFE; }
.cell-icon--slate { background: rgba(100, 116, 139, 0.08); color: #64748b; }

.cell-title {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #334155;
}

.cell-value {
  font-size: 13px;
  color: #94a3b8;
  margin-right: 4px;
}

.cell-arrow { flex-shrink: 0; }

/* ========== Logout ========== */
.logout-section {
  padding: 32px 16px 0;
}

.logout-btn {
  width: 100%;
  height: 48px;
  background: white;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.logout-btn:active { background: #fef2f2; }

/* Version */
.version-text {
  text-align: center;
  font-size: 11px;
  color: #cbd5e1;
  margin-top: 16px;
}

/* ========== Popup Base ========== */
.popup-content {
  padding: 20px 16px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.popup-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  margin-bottom: 16px;
}

.popup-empty {
  text-align: center;
  padding: 32px 0;
  font-size: 14px;
  color: #94a3b8;
}

/* ========== Focus Picker ========== */
.focus-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.focus-item + .focus-item { border-top: 1px solid #f1f5f9; }
.focus-item--active { background: #F3F1FB; }
.focus-item:active { background: #f8fafc; }

.focus-avatar {
  width: 40px;
  height: 40px;
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

.focus-avatar--self {
  background: linear-gradient(135deg, #8A7BFE, #6C5CE7);
  box-shadow: 0 2px 8px rgba(138, 123, 254, 0.25);
}

.focus-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.focus-name {
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

.focus-tag {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(138, 123, 254, 0.08);
  color: #8A7BFE;
}

.focus-tag--self {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
}

/* ========== Member Manager ========== */
.mgr-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
}

.mgr-item + .mgr-item {
  border-top: 1px solid #f1f5f9;
}

.mgr-avatar {
  width: 40px;
  height: 40px;
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

.mgr-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mgr-name {
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

.mgr-relation {
  font-size: 12px;
  color: #94a3b8;
}

.mgr-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.mgr-btn--edit {
  background: rgba(138, 123, 254, 0.08);
  color: #8A7BFE;
}

.mgr-btn--edit:active { background: rgba(138, 123, 254, 0.15); }

.mgr-btn--delete {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
}

.mgr-btn--delete:active { background: rgba(239, 68, 68, 0.15); }

.add-member-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 14px;
  margin-top: 12px;
  border: 2px dashed #e2e8f0;
  border-radius: 14px;
  background: none;
  color: #8A7BFE;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s;
}

.add-member-btn:active {
  background: #F3F1FB;
  border-color: #8A7BFE;
}

/* ========== Relation Picker ========== */
.rel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.rel-btn {
  padding: 14px 0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.15s;
}

.rel-btn:active {
  background: #8A7BFE;
  color: white;
  border-color: #8A7BFE;
}

/* ========== Scan Popup ========== */
.scan-popup {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.scan-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;
}

.scan-frame {
  width: 180px;
  height: 180px;
  position: relative;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #8A7BFE, transparent);
  animation: scan-sweep 2s ease-in-out infinite;
}

@keyframes scan-sweep {
  0% { top: 5%; }
  50% { top: 90%; }
  100% { top: 5%; }
}

.scan-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #8A7BFE;
  border-style: solid;
  border-width: 0;
}

.scan-corner--tl { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; border-top-left-radius: 6px; }
.scan-corner--tr { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; border-top-right-radius: 6px; }
.scan-corner--bl { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; border-bottom-left-radius: 6px; }
.scan-corner--br { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; border-bottom-right-radius: 6px; }

.scan-hint {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 16px;
}

.scan-success-icon {
  margin-bottom: 12px;
}

.scan-success-text {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 4px;
}

.scan-success-sub {
  font-size: 13px;
  color: #64748b;
}
</style>
