<template>
  <div class="login-page">
    <!-- 背景装饰层 -->
    <div class="bg-layer">
      <!-- 径向渐变背景 - 蓝色主调 -->
      <div class="bg-gradient"></div>
      <!-- 科技感光晕 - 蓝色系 -->
      <div class="glow glow-top-right"></div>
      <div class="glow glow-bottom-left"></div>
      <!-- 底部网格纹理 -->
      <div class="grid-pattern"></div>
    </div>

    <!-- 主内容区 -->
    <div class="content-wrapper">
      <div class="content-container">
        <!-- Logo 与品牌标识 -->
        <div class="brand-section">
          <!-- Logo 光圈容器 -->
          <div class="logo-glow-wrapper">
            <div class="logo-glow"></div>
            <div class="logo-float">
              <img
                src="/images/logo.png"
                alt="呦呦心康"
                class="logo-image"
              />
            </div>
          </div>
          <h1 class="brand-title">呦呦 · 心康</h1>
          <p class="brand-subtitle">康复智能助手</p>
        </div>

        <!-- 毛玻璃登录卡片 -->
        <div class="glass-card">
          <form @submit.prevent="handleLogin" class="login-form">
            <!-- 手机号输入 -->
            <div class="input-group">
              <label class="input-label">手机号</label>
              <div class="input-wrapper" :class="{ 'input-focused': phoneFocused }">
                <input
                  v-model="phone"
                  type="tel"
                  maxlength="11"
                  placeholder="请输入手机号"
                  class="custom-input"
                  @focus="phoneFocused = true"
                  @blur="phoneFocused = false"
                />
              </div>
            </div>

            <!-- 验证码输入 -->
            <div class="input-group">
              <label class="input-label">验证码</label>
              <div class="input-wrapper input-with-btn" :class="{ 'input-focused': codeFocused }">
                <input
                  v-model="code"
                  type="text"
                  maxlength="6"
                  placeholder="请输入验证码"
                  class="custom-input"
                  @focus="codeFocused = true"
                  @blur="codeFocused = false"
                />
                <button
                  type="button"
                  class="code-btn"
                  :disabled="countdown > 0"
                  @click="handleSendCode"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </button>
              </div>
            </div>

            <!-- 登录按钮 -->
            <button
              type="submit"
              class="submit-btn"
              :disabled="loading"
            >
              <span v-if="loading" class="btn-loading"></span>
              <span v-else>登录</span>
            </button>
          </form>

          <!-- 科技背书 -->
          <div class="tech-badge">
            <div class="badge-line"></div>
            <span class="badge-text">AI 驱动的智慧康复</span>
            <div class="badge-line"></div>
          </div>
        </div>

        <!-- 底部信息 -->
        <div class="footer-section">
          <p class="footer-hint">患者/家属登录使用</p>
          <div class="footer-brand">
            <svg class="footer-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>泰心润达 技术支持</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { patientSendCode, patientLogin } from '@/api/patient'
import { usePatientStore } from '@/stores/patient'

const router = useRouter()
const patientStore = usePatientStore()

const phone = ref('')
const code = ref('')
const countdown = ref(0)
const loading = ref(false)
const phoneFocused = ref(false)
const codeFocused = ref(false)

let timer: number | null = null

const handleSendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('请输入正确的手机号')
    return
  }

  try {
    const res = await patientSendCode(phone.value) as any
    showToast('验证码已发送')
    if (res.code) {
      console.log('验证码:', res.code)
    }
    startCountdown()
  } catch {
    // 错误已在拦截器处理
  }
}

const startCountdown = () => {
  countdown.value = 60
  timer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

const handleLogin = async () => {
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('请输入正确的手机号')
    return
  }
  if (!code.value) {
    showToast('请输入验证码')
    return
  }

  loading.value = true
  try {
    const res = await patientLogin(phone.value, code.value) as any
    patientStore.setToken(res.token)
    const account = res.account
    patientStore.setProfile({
      accountId: account.id,
      patientId: account.patientId,
      name: account.nickname || account.phone,
      phone: account.phone,
      nickname: account.nickname,
      gender: '',
      age: 0,
      currentIdentity: account.currentIdentity || 'patient',
    })
    showToast('登录成功')
    router.push('/p/home')
  } catch {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

/* ========== 背景层 - 蓝色主调 ========== */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 120% 100% at 50% 0%,
    #FFFFFF 0%,
    #F5F3FA 40%,
    #E8E5F0 70%,
    #DDD8EC 100%
  );
}

/* 科技感光晕 - 蓝色系 */
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.glow-top-right {
  top: -150px;
  right: -100px;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(138, 123, 254, 0.2) 0%, transparent 70%);
}

.glow-bottom-left {
  bottom: -100px;
  left: -80px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(138, 123, 254, 0.12) 0%, transparent 70%);
}

/* 底部网格纹理 */
.grid-pattern {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background-image:
    linear-gradient(rgba(138, 123, 254, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(138, 123, 254, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%);
}

/* ========== 内容区 ========== */
.content-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 96px 24px 40px;
}

.content-container {
  width: 100%;
  max-width: 380px;
}

/* ========== 品牌区域 ========== */
.brand-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-glow-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%);
  filter: blur(20px);
  pointer-events: none;
}

.logo-float {
  position: relative;
  z-index: 1;
  animation: float 3s ease-in-out infinite;
}

.logo-image {
  height: 96px;
  width: auto;
  filter: drop-shadow(0 8px 24px rgba(138, 123, 254, 0.3));
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.brand-title {
  font-size: 26px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: 0.12em;
  margin: 0 0 6px 0;
}

.brand-subtitle {
  font-size: 14px;
  color: #94A3B8;
  margin: 0;
  letter-spacing: 0.05em;
}

/* ========== 毛玻璃卡片 ========== */
.glass-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 24px;
  padding: 36px;
  box-shadow:
    0 4px 24px rgba(138, 123, 254, 0.08),
    0 20px 50px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ========== 输入组件 - 适老化字号 ========== */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  padding-left: 4px;
}

.input-wrapper {
  position: relative;
  background: rgba(241, 245, 249, 0.6);
  border-radius: 14px;
  transition: all 0.25s ease;
}

.input-wrapper.input-focused {
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(138, 123, 254, 0.15);
}

.custom-input {
  width: 100%;
  height: 52px;
  padding: 0 18px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #1E293B;
  outline: none;
}

.custom-input::placeholder {
  color: #A0AEC0;
  font-size: 15px;
}

.input-with-btn {
  display: flex;
  align-items: center;
  padding-right: 6px;
}

.input-with-btn .custom-input {
  flex: 1;
}

/* 验证码按钮 - 钛金紫主调 */
.code-btn {
  flex-shrink: 0;
  height: 36px;
  padding: 0 14px;
  background: #8A7BFE;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.code-btn:hover:not(:disabled) {
  background: #7A6BEE;
}

.code-btn:disabled {
  background: #CBD5E1;
  cursor: not-allowed;
}

/* ========== 登录按钮 - 钛金紫主调 ========== */
.submit-btn {
  width: 100%;
  height: 52px;
  margin-top: 6px;
  background: linear-gradient(135deg, #8A7BFE 0%, #7A6BEE 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 8px 24px rgba(138, 123, 254, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(138, 123, 254, 0.45);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-loading {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== 科技背书 ========== */
.tech-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
}

.badge-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #D8D0E8, transparent);
}

.badge-text {
  font-size: 11px;
  color: #A0B4C0;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

/* ========== 底部区域 ========== */
.footer-section {
  margin-top: 28px;
  text-align: center;
}

.footer-hint {
  font-size: 13px;
  color: #94A3B8;
  margin: 0 0 12px 0;
}

.footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: #B0C4D0;
}

.footer-icon {
  width: 12px;
  height: 12px;
  opacity: 0.5;
}
</style>
