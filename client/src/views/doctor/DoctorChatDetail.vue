<template>
  <div class="chat-page">
    <!-- 顶部导航 -->
    <div class="chat-nav">
      <button class="back-btn" @click="router.back()">
        <van-icon name="arrow-left" />
      </button>
      <div class="nav-info">
        <span class="nav-name">{{ patientInfo?.name || '患者' }}</span>
        <span v-if="patientInfo?.age" class="nav-age">{{ patientInfo.age }}岁</span>
      </div>
      <a v-if="patientInfo?.phone" :href="'tel:' + patientInfo.phone" class="phone-btn">
        <van-icon name="phone-o" />
      </a>
    </div>

    <!-- 聊天区域 -->
    <div ref="chatAreaRef" class="chat-area">
      <div v-if="loading" class="loading-box">
        <van-loading size="24" color="#396CFF" />
      </div>

      <div v-else>
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['msg-row', msg.direction === 'doctor_to_patient' ? 'msg-right' : 'msg-left']"
        >
          <div class="msg-bubble">
            <p class="msg-text">{{ msg.content }}</p>
            <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷回复 -->
    <div class="quick-replies">
      <button
        v-for="reply in quickReplies"
        :key="reply"
        class="quick-btn"
        @click="handleSend(reply)"
      >
        {{ reply }}
      </button>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <input
        v-model="inputText"
        type="text"
        placeholder="输入消息..."
        class="msg-input"
        @keyup.enter="handleSend()"
      />
      <button class="send-btn" :disabled="!inputText.trim()" @click="handleSend()">
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getDoctorMessages, sendDoctorMessage } from '@/api'
import type { DoctorMessageItem } from '@/api'

const router = useRouter()
const route = useRoute()
const patientId = Number(route.params.patientId)

const messages = ref<DoctorMessageItem[]>([])
const patientInfo = ref<any>(null)
const loading = ref(true)
const inputText = ref('')
const chatAreaRef = ref<HTMLElement | null>(null)

const quickReplies = ['收到', '请继续观察', '建议来院复查', '注意休息']

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
    }
  })
}

const loadMessages = async () => {
  try {
    const res = await getDoctorMessages(patientId) as any
    patientInfo.value = res?.patient
    messages.value = res?.messages || []
  } catch { /* ignore */ }
  loading.value = false
  scrollToBottom()
}

const handleSend = async (text?: string) => {
  const content = text || inputText.value.trim()
  if (!content) return
  inputText.value = ''

  // 乐观更新
  messages.value.push({
    id: Date.now(),
    direction: 'doctor_to_patient',
    content,
    messageType: 'text',
    isRead: true,
    createdAt: new Date().toISOString(),
  })
  scrollToBottom()

  try {
    await sendDoctorMessage(patientId, content)
    // 1.5秒后轮询自动回复
    setTimeout(async () => {
      try {
        const res = await getDoctorMessages(patientId) as any
        messages.value = res?.messages || []
        scrollToBottom()
      } catch { /* ignore */ }
    }, 2000)
  } catch { /* ignore */ }
}

onMounted(loadMessages)
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F2F5FA;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
}

/* 导航 */
.chat-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
}
.back-btn {
  border: none;
  background: none;
  font-size: 20px;
  color: #8A9AC3;
  cursor: pointer;
  padding: 4px;
}
.nav-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.nav-name {
  font-size: 17px;
  font-weight: 800;
  color: #1A2238;
}
.nav-age {
  font-size: 13px;
  color: #8A9AC3;
}
.phone-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(57, 108, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #396CFF;
  font-size: 18px;
  text-decoration: none;
}

/* 聊天区域 */
.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}
.loading-box {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

/* 消息行 */
.msg-row {
  display: flex;
  margin-bottom: 12px;
}
.msg-left {
  justify-content: flex-start;
}
.msg-right {
  justify-content: flex-end;
}

.msg-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 18px;
  position: relative;
}
.msg-left .msg-bubble {
  background: #ffffff;
  border-bottom-left-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.msg-right .msg-bubble {
  background: #396CFF;
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 8px 20px rgba(57, 108, 255, 0.25);
}
.msg-text {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  word-break: break-all;
}
.msg-time {
  display: block;
  font-size: 10px;
  margin-top: 4px;
  text-align: right;
}
.msg-left .msg-time {
  color: #8A9AC3;
}
.msg-right .msg-time {
  color: rgba(255, 255, 255, 0.7);
}

/* 快捷回复 */
.quick-replies {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: #ffffff;
  overflow-x: auto;
  flex-shrink: 0;
  -webkit-overflow-scrolling: touch;
}
.quick-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  background: rgba(57, 108, 255, 0.06);
  border: none;
  border-radius: 16px;
  font-size: 12px;
  color: #396CFF;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.quick-btn:active {
  background: rgba(57, 108, 255, 0.15);
}

/* 输入区域 */
.input-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #ffffff;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  flex-shrink: 0;
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.04);
}
.msg-input {
  flex: 1;
  height: 40px;
  padding: 0 14px;
  background: #E8ECF4;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  color: #1A2238;
  outline: none;
}
.msg-input::placeholder {
  color: #8A9AC3;
}
.send-btn {
  height: 40px;
  padding: 0 18px;
  background: #396CFF;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  box-shadow: 0 8px 20px rgba(57, 108, 255, 0.3);
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
