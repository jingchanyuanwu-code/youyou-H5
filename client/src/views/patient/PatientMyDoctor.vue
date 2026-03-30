<template>
  <div class="doc-page">
    <!-- Nav bar -->
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="nav-title">我的医生</span>
      <div class="nav-btn" style="visibility: hidden;"><svg width="20" height="20" viewBox="0 0 24 24" /></div>
    </div>

    <!-- Bound doctor view -->
    <template v-if="doctor">
      <div class="doc-card">
        <div class="doc-avatar">
          <img src="/images/logo.png" alt="医生" class="doc-avatar-img" />
        </div>
        <div class="doc-info">
          <div class="doc-name">{{ doctor.name }} <span class="doc-title-tag">{{ doctor.title }}</span></div>
          <div class="doc-org">{{ doctor.hospital }} · {{ doctor.department }}</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-label">基本信息</div>
        <div class="detail-card">
          <div class="detail-row">
            <span class="detail-key">姓名</span>
            <span class="detail-val">{{ doctor.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-key">职称</span>
            <span class="detail-val">{{ doctor.title }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-key">医院</span>
            <span class="detail-val">{{ doctor.hospital }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-key">科室</span>
            <span class="detail-val">{{ doctor.department }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-key">执业编号</span>
            <span class="detail-val">{{ doctor.licenseNo }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-label">擅长领域</div>
        <div class="detail-card">
          <div class="spec-tags">
            <span v-for="(s, i) in doctor.specialties" :key="i" class="spec-tag">{{ s }}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-label">服务信息</div>
        <div class="detail-card">
          <div class="detail-row">
            <span class="detail-key">绑定时间</span>
            <span class="detail-val">{{ doctor.bindTime }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-key">服务状态</span>
            <span class="detail-val detail-val--active">服务中</span>
          </div>
        </div>
      </div>

      <div class="doc-actions">
        <button class="doc-action-btn doc-action-btn--msg" @click="router.push('/p/doctor-messages')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          医生留言
        </button>
        <button class="doc-action-btn doc-action-btn--unbind" @click="handleUnbind">
          解除绑定
        </button>
      </div>
    </template>

    <!-- Unbound view -->
    <template v-else>
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </div>
        <div class="empty-title">暂未绑定医生</div>
        <div class="empty-desc">扫描医生二维码即可绑定您的主治医生，获取专业康复指导</div>
        <button class="scan-bind-btn" @click="startScan">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          扫一扫绑定医生
        </button>
      </div>
    </template>

    <!-- Scan popup -->
    <van-popup v-model:show="showScan" :close-on-click-overlay="false" round :style="{ width: '80%', borderRadius: '16px' }">
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
          <div class="scan-hint">请扫描医生出示的二维码</div>
          <button class="scan-cancel" @click="showScan = false">取消</button>
        </template>
        <template v-else>
          <div class="scan-ok-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div class="scan-ok-text">绑定成功</div>
          <div class="scan-ok-sub">已绑定 {{ mockDoctor.name }} 医生</div>
        </template>
      </div>
    </van-popup>

    <div class="safe-bottom"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()

const doctor = ref<any>(null)
const showScan = ref(false)
const scanSuccess = ref(false)

const mockDoctor = {
  name: '张伟',
  title: '主任医师',
  hospital: '兰州大学第一医院',
  department: '心内科',
  licenseNo: '110108199003121234',
  specialties: ['冠心病', '心力衰竭', '心脏康复', '心律失常', '高血压管理'],
  bindTime: '2025-01-15',
}

onMounted(() => {
  const raw = localStorage.getItem('bound_doctor')
  if (raw) {
    try { doctor.value = JSON.parse(raw) } catch { /* ignore */ }
  }
})

function startScan() {
  scanSuccess.value = false
  showScan.value = true
  setTimeout(() => {
    scanSuccess.value = true
    doctor.value = { ...mockDoctor }
    localStorage.setItem('bound_doctor', JSON.stringify(mockDoctor))
    setTimeout(() => {
      showScan.value = false
    }, 1200)
  }, 2000)
}

async function handleUnbind() {
  try {
    await showConfirmDialog({
      title: '解除绑定',
      message: `确定要解除与${doctor.value.name}医生的绑定吗？解除后将无法接收医生的康复指导。`,
      confirmButtonText: '解除',
      cancelButtonText: '取消',
      confirmButtonColor: '#ef4444',
    })
    doctor.value = null
    localStorage.removeItem('bound_doctor')
    showToast('已解除绑定')
  } catch { /* cancelled */ }
}
</script>

<style scoped>
.doc-page {
  min-height: 100vh;
  background: #f8fafc;
}

.safe-bottom { height: calc(20px + env(safe-area-inset-bottom)); }

/* Nav */
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

/* Doctor card */
.doc-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 12px 16px 0;
  padding: 20px;
  background: linear-gradient(145deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
}

.doc-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.doc-avatar-img {
  width: 52px;
  height: 52px;
  object-fit: cover;
}

.doc-name {
  font-size: 18px;
  font-weight: 800;
  color: white;
}

.doc-title-tag {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 6px;
  margin-left: 6px;
}

.doc-org {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
}

/* Detail sections */
.detail-section {
  padding: 0 16px;
  margin-top: 20px;
}

.detail-label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 4px;
  margin-bottom: 8px;
}

.detail-card {
  background: white;
  border-radius: 16px;
  padding: 4px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
}

.detail-row + .detail-row {
  border-top: 1px solid #f1f5f9;
}

.detail-key {
  font-size: 14px;
  color: #94a3b8;
}

.detail-val {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.detail-val--active {
  color: #10b981;
  font-weight: 600;
}

/* Specialty tags */
.spec-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0;
}

.spec-tag {
  font-size: 13px;
  font-weight: 500;
  color: #10b981;
  background: rgba(16, 185, 129, 0.08);
  padding: 6px 14px;
  border-radius: 20px;
}

/* Actions */
.doc-actions {
  padding: 24px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-action-btn {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  -webkit-tap-highlight-color: transparent;
}

.doc-action-btn--msg {
  background: #10b981;
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.doc-action-btn--msg:active { background: #059669; }

.doc-action-btn--unbind {
  background: white;
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.doc-action-btn--unbind:active { background: #fef2f2; }

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 32px 0;
}

.empty-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.6;
  max-width: 260px;
  margin-bottom: 32px;
}

.scan-bind-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 260px;
  height: 48px;
  border-radius: 14px;
  border: none;
  background: #8A7BFE;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(138, 123, 254, 0.3);
  -webkit-tap-highlight-color: transparent;
}

.scan-bind-btn:active { background: #7A6BEE; }

/* Scan popup */
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

.scan-cancel {
  margin-top: 16px;
  padding: 8px 24px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.scan-cancel:active { background: #f8fafc; }

.scan-ok-icon { margin-bottom: 12px; }

.scan-ok-text {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 4px;
}

.scan-ok-sub {
  font-size: 13px;
  color: #64748b;
}
</style>
