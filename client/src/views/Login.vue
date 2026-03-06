<template>
  <div class="login-page">
    <!-- 背景装饰层 -->
    <div class="bg-layer">
      <!-- 径向渐变背景 - 与 Logo 天蓝色同步 -->
      <div class="bg-gradient"></div>
      <!-- 科技感光晕 - 使用 Logo 色系 -->
      <div class="glow glow-top-right"></div>
      <div class="glow glow-bottom-left"></div>
      <!-- 底部网格纹理 -->
      <div class="grid-pattern"></div>
    </div>

    <!-- 主内容区 -->
    <div class="content-wrapper">
      <div class="content-container">
        <!-- Logo 与品牌标识 - 紧凑品牌簇 -->
        <div class="brand-section">
          <!-- Logo 光圈容器 -->
          <div class="logo-glow-wrapper">
            <div class="logo-glow"></div>
            <div class="logo-float">
              <img
                src="/images/logo.png"
                alt="呦呦医生"
                class="logo-image"
              />
            </div>
          </div>
          <h1 class="brand-title">呦呦 · 医生端</h1>
          <p class="brand-subtitle">智慧医疗工作台</p>
        </div>

        <!-- 毛玻璃登录卡片 -->
        <div class="glass-card">
          <van-form @submit="handleLogin" class="login-form">
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

            <!-- 登录按钮 - 使用 Logo 主色 -->
            <button
              type="submit"
              class="submit-btn"
              :disabled="loading"
            >
              <span v-if="loading" class="btn-loading"></span>
              <span v-else>登录</span>
            </button>
          </van-form>

          <!-- 科技背书 -->
          <div class="tech-badge">
            <div class="badge-line"></div>
            <span class="badge-text">AI 驱动的智慧医疗</span>
            <div class="badge-line"></div>
          </div>
        </div>

        <!-- 底部信息 -->
        <div class="footer-section">
          <p class="footer-hint">仅限授权医生登录使用</p>
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
import { sendCode, login } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

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
    const res = await sendCode(phone.value) as any
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
    const res = await login(phone.value, code.value) as any
    userStore.setToken(res.token)
    userStore.setDoctor(res.doctor)
    showToast('登录成功')
    router.push('/card')
  } catch {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ========== Logo 主色定义 ========== */
:root {
  --logo-primary: #7DBDE8;      /* 柔和天蓝 */
  --logo-primary-dark: #5BA8D9; /* 深一度 */
  --logo-accent: #F0A0B8;       /* 粉色点缀 */
}

.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

/* ========== 背景层 - 与 Logo 色系同步 ========== */
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
    #F5FAFD 40%,
    #E8F4FA 70%,
    #DCF0F8 100%
  );
}

/* 科技感光晕 - Logo 色系 */
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
  background: radial-gradient(circle, rgba(125, 189, 232, 0.25) 0%, transparent 70%);
}

.glow-bottom-left {
  bottom: -100px;
  left: -80px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(240, 160, 184, 0.2) 0%, transparent 70%);
}

/* 底部网格纹理 - 增加空间深度 */
.grid-pattern {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background-image:
    linear-gradient(rgba(125, 189, 232, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 189, 232, 0.03) 1px, transparent 1px);
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
  padding: 96px 24px 40px; /* pt-24 = 96px */
}

.content-container {
  width: 100%;
  max-width: 380px;
}

/* ========== 品牌区域 - 紧凑品牌簇 ========== */
.brand-section {
  text-align: center;
  margin-bottom: 32px;
}

/* Logo 光圈容器 */
.logo-glow-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 16px; /* 缩小与标题间距 */
}

/* 白色半透明光圈 */
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
  height: 96px; /* h-24 */
  width: auto;
  filter: drop-shadow(0 8px 24px rgba(125, 189, 232, 0.3));
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
  font-size: 24px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: 0.12em;
  margin: 0 0 6px 0;
}

.brand-subtitle {
  font-size: 13px;
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
    0 4px 24px rgba(125, 189, 232, 0.08),
    0 20px 50px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ========== 输入组件 ========== */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 13px;
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
  box-shadow: 0 0 0 3px rgba(125, 189, 232, 0.15);
}

.custom-input {
  width: 100%;
  height: 50px;
  padding: 0 18px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #1E293B;
  outline: none;
}

.custom-input::placeholder {
  color: #A0AEC0;
}

.input-with-btn {
  display: flex;
  align-items: center;
  padding-right: 6px;
}

.input-with-btn .custom-input {
  flex: 1;
}

/* 验证码按钮 - Logo 主色 */
.code-btn {
  flex-shrink: 0;
  height: 34px;
  padding: 0 14px;
  background: #7DBDE8;
  color: white;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.code-btn:hover:not(:disabled) {
  background: #5BA8D9;
}

.code-btn:disabled {
  background: #CBD5E1;
  cursor: not-allowed;
}

/* ========== 登录按钮 - Logo 主色 ========== */
.submit-btn {
  width: 100%;
  height: 50px;
  margin-top: 6px;
  background: linear-gradient(135deg, #7DBDE8 0%, #5BA8D9 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 8px 24px rgba(125, 189, 232, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(125, 189, 232, 0.45);
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
  background: linear-gradient(90deg, transparent, #D4E5F0, transparent);
}

.badge-text {
  font-size: 10px;
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
  font-size: 12px;
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
