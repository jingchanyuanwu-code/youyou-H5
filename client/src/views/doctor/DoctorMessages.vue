<template>
  <div class="messages-page">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="page-title">患者沟通</h1>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-switcher">
      <div
        :class="['tab-btn', { active: activeTab === 'single' }]"
        @click="activeTab = 'single'"
      >
        单聊
        <span v-if="totalUnread > 0" class="tab-unread">{{ totalUnread }}</span>
      </div>
      <div
        :class="['tab-btn', { active: activeTab === 'message' }]"
        @click="activeTab = 'message'; loadMessages()"
      >
        留言
        <span v-if="unprocessedCount > 0" class="tab-unread">{{ unprocessedCount }}</span>
      </div>
      <div
        :class="['tab-btn', { active: activeTab === 'group' }]"
        @click="activeTab = 'group'; showGroupToast()"
      >
        群聊
      </div>
    </div>

    <!-- 单聊列表 -->
    <div v-if="activeTab === 'single'" class="conversation-list">
      <div v-if="loading" class="loading-box">
        <van-loading size="24" color="#396CFF" />
      </div>

      <div v-else-if="conversations.length === 0" class="empty-state">
        <van-icon name="chat-o" class="empty-icon" />
        <p>暂无患者消息</p>
      </div>

      <div
        v-for="conv in conversations"
        :key="conv.patientId"
        class="conv-card"
        @click="router.push('/d/chat/' + conv.patientId)"
      >
        <div class="conv-avatar">
          <span class="avatar-text">{{ conv.patientName?.charAt(0) }}</span>
        </div>
        <div class="conv-content">
          <div class="conv-top">
            <span class="conv-name">{{ conv.patientName }}</span>
            <span class="conv-time">{{ formatTime(conv.lastTime) }}</span>
          </div>
          <p class="conv-msg">{{ conv.lastMessage }}</p>
        </div>
        <div v-if="conv.unreadCount > 0" class="unread-badge">{{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}</div>
      </div>
    </div>

    <!-- 留言列表 -->
    <div v-else-if="activeTab === 'message'" class="message-list-wrap">
      <div v-if="msgLoading" class="loading-box">
        <van-loading size="24" color="#396CFF" />
      </div>

      <div v-else-if="leaveMessages.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <p>暂无留言</p>
      </div>

      <div v-else class="msg-list">
        <div
          v-for="msg in leaveMessages"
          :key="msg.id"
          :class="['msg-card', { 'msg-unprocessed': !msg.isProcessed }]"
          @click="openMessageDetail(msg)"
        >
          <div class="msg-card-top">
            <div class="msg-sender-info">
              <div :class="['msg-avatar', msg.senderType === 'family' ? 'av-family' : 'av-patient']">
                <span>{{ msg.senderName?.charAt(0) }}</span>
              </div>
              <div class="msg-sender-detail">
                <div class="msg-sender-row">
                  <span class="msg-sender-name">{{ msg.senderName }}</span>
                  <span :class="['msg-sender-tag', msg.senderType === 'family' ? 'tag-family' : 'tag-patient']">
                    {{ msg.senderType === 'family' ? '家属' : '患者' }}
                  </span>
                  <span v-if="!msg.isProcessed" class="msg-new-dot"></span>
                </div>
                <span class="msg-patient-name">患者: {{ msg.patientName }} · {{ msg.patientAge }}岁</span>
              </div>
            </div>
            <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
          </div>
          <p class="msg-content-preview">{{ msg.content }}</p>
          <div v-if="msg.doctorReply" class="msg-replied-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
            已回复
          </div>
        </div>
      </div>
    </div>

    <!-- 群聊占位 -->
    <div v-else class="group-placeholder">
      <van-icon name="friends-o" class="empty-icon" />
      <p>群聊功能开发中</p>
    </div>

    <!-- 留言详情弹窗 -->
    <van-popup
      v-model:show="showDetail"
      position="bottom"
      round
      :style="{ maxHeight: '90vh' }"
      closeable
    >
      <div v-if="currentMsg" class="detail-popup">
        <h3 class="detail-title">留言详情</h3>

        <!-- 留言信息 -->
        <div class="detail-section">
          <div class="detail-sender">
            <div :class="['msg-avatar', currentMsg.senderType === 'family' ? 'av-family' : 'av-patient']">
              <span>{{ currentMsg.senderName?.charAt(0) }}</span>
            </div>
            <div>
              <div class="detail-sender-row">
                <span class="detail-sender-name">{{ currentMsg.senderName }}</span>
                <span :class="['msg-sender-tag', currentMsg.senderType === 'family' ? 'tag-family' : 'tag-patient']">
                  {{ currentMsg.senderType === 'family' ? '家属' : '患者' }}
                </span>
              </div>
              <span class="detail-meta">患者: {{ currentMsg.patientName }} · {{ currentMsg.patientAge }}岁 · {{ formatTime(currentMsg.createdAt) }}</span>
            </div>
          </div>
          <div class="detail-msg-content">{{ currentMsg.content }}</div>
        </div>

        <!-- AI综合分析建议 -->
        <div class="detail-section">
          <div class="detail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>AI 综合分析建议</span>
          </div>
          <textarea
            v-model="editedSuggestion"
            class="detail-textarea"
            rows="4"
            placeholder="AI分析建议加载中..."
          ></textarea>
        </div>

        <!-- 已有回复 -->
        <div v-if="currentMsg.doctorReply" class="detail-section">
          <div class="detail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
            <span>已发送回复</span>
          </div>
          <div class="detail-reply-box">
            <p class="reply-text">{{ currentMsg.doctorReply }}</p>
            <span class="reply-time">{{ formatTime(currentMsg.doctorReplyTime || '') }}</span>
          </div>
          <!-- 追加回复列表 -->
          <div v-for="(r, idx) in currentMsg.additionalReplies || []" :key="idx" class="detail-reply-box append-reply">
            <p class="reply-text">{{ r.content }}</p>
            <span class="reply-time">追加 · {{ formatTime(r.createdAt) }}</span>
          </div>
        </div>

        <!-- 回复/追加回复输入 -->
        <div class="detail-section">
          <div class="detail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <span>{{ currentMsg.doctorReply ? '追加回复' : '下发回复' }}</span>
          </div>
          <textarea
            v-model="replyContent"
            class="detail-textarea"
            rows="3"
            :placeholder="currentMsg.doctorReply ? '输入追加回复内容...' : '输入回复内容...'"
          ></textarea>
        </div>

        <button
          class="detail-send-btn"
          :disabled="!replyContent.trim() || sending"
          @click="handleSendReply"
        >
          {{ sending ? '发送中...' : (currentMsg.doctorReply ? '追加回复' : '确认下发') }}
        </button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getConversations, getLeaveMessages, replyLeaveMessage, appendReply } from '@/api'
import type { Conversation, LeaveMessage } from '@/api'

const router = useRouter()
const activeTab = ref<'single' | 'message' | 'group'>('single')
const conversations = ref<Conversation[]>([])
const loading = ref(true)

// 留言相关
const leaveMessages = ref<LeaveMessage[]>([])
const msgLoading = ref(false)
const showDetail = ref(false)
const currentMsg = ref<LeaveMessage | null>(null)
const editedSuggestion = ref('')
const replyContent = ref('')
const sending = ref(false)

const totalUnread = computed(() =>
  conversations.value.reduce((sum, c) => sum + c.unreadCount, 0)
)

const unprocessedCount = computed(() =>
  leaveMessages.value.filter(m => !m.isProcessed).length
)

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 60) return `${mins}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const showGroupToast = () => {
  showToast('群聊功能开发中')
}

const loadConversations = async () => {
  try {
    const res = await getConversations() as any
    conversations.value = Array.isArray(res) ? res : []
  } catch { /* ignore */ }
  loading.value = false
}

const loadMessages = async () => {
  if (leaveMessages.value.length > 0) return
  msgLoading.value = true
  try {
    const res = await getLeaveMessages() as any
    leaveMessages.value = Array.isArray(res) ? res : []
  } catch { /* ignore */ }
  msgLoading.value = false
}

const openMessageDetail = (msg: LeaveMessage) => {
  currentMsg.value = msg
  editedSuggestion.value = msg.aiSuggestion || ''
  replyContent.value = ''
  showDetail.value = true
}

const handleSendReply = async () => {
  if (!currentMsg.value || !replyContent.value.trim()) return
  sending.value = true
  try {
    if (currentMsg.value.doctorReply) {
      await appendReply(currentMsg.value.id, { content: replyContent.value.trim() })
      if (!currentMsg.value.additionalReplies) currentMsg.value.additionalReplies = []
      currentMsg.value.additionalReplies.push({
        content: replyContent.value.trim(),
        createdAt: new Date().toISOString()
      })
    } else {
      await replyLeaveMessage(currentMsg.value.id, {
        reply: replyContent.value.trim(),
        aiSuggestion: editedSuggestion.value
      })
      currentMsg.value.doctorReply = replyContent.value.trim()
      currentMsg.value.doctorReplyTime = new Date().toISOString()
      currentMsg.value.isProcessed = true
    }
    replyContent.value = ''
    showToast('回复成功')
  } catch {
    showToast('发送失败，请重试')
  }
  sending.value = false
}

onMounted(loadConversations)
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background: #F2F5FA;
  font-family: 'Inter', 'SF Pro Display', 'PingFang SC', -apple-system, sans-serif;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 12px;
}
.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #1A2238;
  cursor: pointer;
  border-radius: 10px;
  flex-shrink: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}
.back-btn:active {
  background: rgba(0, 0, 0, 0.05);
}
.page-title {
  font-size: 18px;
  font-weight: 800;
  color: #1A2238;
  margin: 0;
}

/* Tab */
.tab-switcher {
  display: flex;
  margin: 0 16px 16px;
  background: #ffffff;
  border-radius: 16px;
  padding: 3px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.tab-btn {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #8A9AC3;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
}
.tab-btn.active {
  background: #396CFF;
  color: white;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(57, 108, 255, 0.3);
}
.tab-unread {
  position: absolute;
  top: 2px;
  right: 12%;
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

/* 列表 */
.conversation-list, .message-list-wrap {
  padding: 0 16px;
}
.loading-box {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.empty-state, .group-placeholder {
  text-align: center;
  padding: 60px 0;
  color: #8A9AC3;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #B4C0DC;
}
.empty-svg {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  display: block;
  color: #B4C0DC;
}

/* 会话卡片 */
.conv-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #ffffff;
  border-radius: 24px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}
.conv-card:active {
  transform: scale(0.98);
}
.conv-avatar {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(135deg, #396CFF, #6B8FFF);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-text {
  font-size: 17px;
  font-weight: 800;
  color: white;
}
.conv-content {
  flex: 1;
  min-width: 0;
}
.conv-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.conv-name {
  font-size: 15px;
  font-weight: 600;
  color: #1A2238;
}
.conv-time {
  font-size: 11px;
  color: #8A9AC3;
}
.conv-msg {
  font-size: 13px;
  color: #8A9AC3;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.unread-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #FF4C61;
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  line-height: 20px;
  text-align: center;
  flex-shrink: 0;
}

/* ===== 留言卡片 ===== */
.msg-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.msg-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 2px solid transparent;
}
.msg-card:active {
  transform: scale(0.98);
}
.msg-card.msg-unprocessed {
  border-color: rgba(255, 76, 97, 0.15);
}
.msg-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.msg-sender-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
.av-patient { background: linear-gradient(135deg, #396CFF, #6B8FFF); }
.av-family { background: linear-gradient(135deg, #F59E0B, #D97706); }
.msg-sender-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.msg-sender-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.msg-sender-name {
  font-size: 14px;
  font-weight: 700;
  color: #1A2238;
}
.msg-sender-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}
.tag-patient { background: rgba(57, 108, 255, 0.08); color: #396CFF; }
.tag-family { background: rgba(245, 158, 11, 0.1); color: #B45309; }
.msg-new-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF4C61;
}
.msg-patient-name {
  font-size: 11px;
  color: #8A9AC3;
}
.msg-time {
  font-size: 11px;
  color: #8A9AC3;
  white-space: nowrap;
  flex-shrink: 0;
}
.msg-content-preview {
  font-size: 13px;
  color: #5A6B94;
  margin: 8px 0 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.msg-replied-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: #10B981;
  font-weight: 600;
}

/* ===== 留言详情弹窗 ===== */
.detail-popup {
  padding: 24px 20px;
  max-height: 85vh;
  overflow-y: auto;
}
.detail-title {
  font-size: 18px;
  font-weight: 800;
  color: #1A2238;
  margin: 0 0 20px;
  text-align: center;
}
.detail-section {
  margin-bottom: 16px;
}
.detail-sender {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.detail-sender-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.detail-sender-name {
  font-size: 15px;
  font-weight: 700;
  color: #1A2238;
}
.detail-meta {
  font-size: 11px;
  color: #8A9AC3;
}
.detail-msg-content {
  background: #F8FAFC;
  border-radius: 16px;
  padding: 14px 16px;
  font-size: 14px;
  color: #1A2238;
  line-height: 1.6;
}
.detail-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1A2238;
}
.detail-section-header svg {
  color: #396CFF;
}
.detail-textarea {
  width: 100%;
  border: 1.5px solid #E8ECF4;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 14px;
  color: #1A2238;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}
.detail-textarea:focus {
  border-color: #396CFF;
}
.detail-reply-box {
  background: rgba(57, 108, 255, 0.04);
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 8px;
}
.detail-reply-box.append-reply {
  background: rgba(57, 108, 255, 0.02);
  border-left: 3px solid rgba(57, 108, 255, 0.2);
}
.reply-text {
  font-size: 13px;
  color: #1A2238;
  margin: 0 0 4px;
  line-height: 1.5;
}
.reply-time {
  font-size: 11px;
  color: #8A9AC3;
}
.detail-send-btn {
  width: 100%;
  padding: 14px;
  border: none;
  background: #396CFF;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 8px 20px rgba(57, 108, 255, 0.3);
  margin-top: 8px;
}
.detail-send-btn:active {
  transform: scale(0.97);
}
.detail-send-btn:disabled {
  background: #B4C0DC;
  box-shadow: none;
  cursor: not-allowed;
}
</style>
