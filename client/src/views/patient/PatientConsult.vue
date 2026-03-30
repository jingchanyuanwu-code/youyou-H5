<template>
  <div class="page">
    <!-- ========== 顶部导航栏 ========== -->
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="nav-title">健康咨询</span>
      <button class="nav-btn" @click="router.push('/p/settings')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>
    </div>

    <!-- ========== 置顶高危预警 ========== -->
    <Transition name="alert-slide">
      <div v-if="activeRedAlerts.length > 0" class="alert-bar">
        <div v-for="alert in activeRedAlerts" :key="alert.id" class="alert-item" @click="scrollToMsg(alert.sourceIndex)">
          <span class="alert-pulse"></span>
          <span class="alert-label">紧急:</span>
          <span class="alert-text">{{ alert.title }}</span>
          <button class="alert-cta" @click.stop="handleCallDoctor">一键连线医生</button>
          <button class="alert-x" @click.stop="dismissAlert(alert.id)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </Transition>

    <!-- ========== 对话流 ========== -->
    <div class="feed" ref="feedRef">
      <template v-for="(msg, i) in allMessages" :key="i">
        <div v-if="msg.showTime" class="ts">{{ formatTime(msg.time) }}</div>

        <!-- ===== AI 消息 ===== -->
        <div v-if="msg.type === 'ai'" class="row row--ai" :data-idx="i">
          <div v-if="msg.aiText" class="ai-text">{{ msg.aiText }}</div>

          <div v-if="msg.card" class="card" :class="{ 'card--danger': msg.priority === 'critical' }">
            <!-- 体征汇总 -->
            <template v-if="msg.card.type === 'vitals'">
              <div v-for="(v, vi) in msg.card.rows" :key="vi" class="v-row">
                <span class="v-label">
                  <svg v-if="v.icon === 'pulse'" class="ico ico--bp" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <svg v-if="v.icon === 'drop'" class="ico ico--sugar" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
                  {{ v.label }}
                </span>
                <span class="v-val" :class="{ 'v-val--warn': v.status === 'warn', 'v-val--danger': v.status === 'danger' }">
                  {{ v.value }} <small>{{ v.unit }}</small>
                  <i class="dot" :class="'dot--' + v.status"></i>
                </span>
              </div>
            </template>

            <!-- 心率预警 -->
            <template v-if="msg.card.type === 'heart-alert'">
              <div class="v-row">
                <span class="v-label">
                  <svg class="ico ico--danger" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  静息心率
                </span>
                <span class="v-val v-val--danger">{{ msg.card.value }} <small>{{ msg.card.unit }}</small> <em class="dur">持续15分</em></span>
              </div>
              <div class="advice">{{ msg.card.detail }}</div>
            </template>

            <!-- 用药记录 -->
            <template v-if="msg.card.type === 'medication'">
              <div v-for="(d, di) in msg.card.items" :key="di" class="med-row">
                <span class="med-name">
                  <svg class="ico ico--sm ico--med" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  {{ d.name }} {{ d.dose }}
                </span>
                <span class="med-ok">✓ {{ d.time }}</span>
              </div>
            </template>

            <!-- 康复处方 -->
            <template v-if="msg.card.type === 'training-rx'">
              <div class="rx-head">
                <svg class="ico ico--brand" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {{ msg.card.name }}（{{ msg.card.duration }}）
              </div>
              <div class="rx-thumb" @click="router.push('/p/training')">
                <div class="rx-thumb-play">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="8 5 20 12 8 19"/></svg>
                </div>
                <span class="rx-thumb-dur">{{ msg.card.duration }}</span>
              </div>
              <div v-if="msg.card.note" class="rx-note">
                <svg class="ico ico--sm" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                {{ msg.card.note }}
              </div>
              <button class="rx-btn" @click="router.push('/p/training')">开始训练</button>
            </template>

            <!-- 每日简报 -->
            <template v-if="msg.card.type === 'daily-summary'">
              <div class="sum-head">
                <span>{{ msg.card.name }}的今日数据</span>
                <span class="sum-score">{{ msg.card.score }}分</span>
              </div>
              <div class="sum-grid">
                <div v-for="(s, si) in msg.card.items" :key="si" class="sum-cell">
                  <span class="sum-lbl">{{ s.label }}</span>
                  <span class="sum-num">{{ s.value }}<small>{{ s.unit }}</small></span>
                </div>
              </div>
            </template>

            <!-- 训练报告 -->
            <template v-if="msg.card.type === 'training-summary'">
              <div class="sum-grid">
                <div class="sum-cell"><span class="sum-lbl">训练时长</span><span class="sum-num">{{ msg.card.duration }}</span></div>
                <div class="sum-cell"><span class="sum-lbl">平均心率</span><span class="sum-num">{{ msg.card.avgHR }}<small>bpm</small></span></div>
                <div class="sum-cell"><span class="sum-lbl">最大心率</span><span class="sum-num">{{ msg.card.maxHR }}<small>bpm</small></span></div>
                <div class="sum-cell"><span class="sum-lbl">消耗热量</span><span class="sum-num">{{ msg.card.calories }}<small>kcal</small></span></div>
              </div>
            </template>

            <!-- 康复计划审核通知 -->
            <template v-if="msg.card.type === 'plan-review'">
              <div class="notify-head">
                <svg class="ico ico--brand" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <span class="notify-title-text">医生已审核您的康复计划</span>
              </div>
              <div class="notify-body">
                <div class="notify-row">
                  <span class="notify-label">审核医生</span>
                  <span class="notify-val">{{ msg.card.doctorName }}</span>
                </div>
                <div class="notify-row">
                  <span class="notify-label">审核结果</span>
                  <span class="notify-val" :class="msg.card.result === 'approved' ? 'notify-val--ok' : 'notify-val--adjust'">
                    {{ msg.card.result === 'approved' ? '审核通过' : '已调整方案' }}
                  </span>
                </div>
                <div v-if="msg.card.comment" class="notify-comment">{{ msg.card.comment }}</div>
              </div>
            </template>

            <!-- 康复报告审核通知 -->
            <template v-if="msg.card.type === 'report-review'">
              <div class="notify-head">
                <svg class="ico ico--brand" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span class="notify-title-text">医生已审核康复报告</span>
              </div>
              <div class="notify-body">
                <div class="notify-row">
                  <span class="notify-label">报告类型</span>
                  <span class="notify-val">{{ msg.card.reportType === 'daily' ? '日报' : msg.card.reportType === 'weekly' ? '周报' : '月报' }}</span>
                </div>
                <div class="notify-row">
                  <span class="notify-label">综合评分</span>
                  <span class="notify-val notify-val--score">{{ msg.card.score }}分</span>
                </div>
                <div v-if="msg.card.doctorComment" class="notify-comment">
                  <span class="notify-comment-tag">医生点评</span>
                  {{ msg.card.doctorComment }}
                </div>
              </div>
            </template>

            <!-- 医生回复留言通知 -->
            <template v-if="msg.card.type === 'doctor-reply'">
              <div class="reply-head">
                <div class="reply-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div class="reply-info">
                  <span class="reply-doctor">{{ msg.card.doctorName }}</span>
                  <span class="reply-tag">回复了您的留言</span>
                </div>
              </div>
              <div class="reply-content">
                <div v-if="msg.card.originalMsg" class="reply-original">
                  <span class="reply-orig-label">您的留言：</span>{{ msg.card.originalMsg }}
                </div>
                <div class="reply-text">{{ msg.card.replyContent }}</div>
              </div>
            </template>

            <!-- 卡片内操作链接 -->
            <a v-if="msg.actionLink" class="card-link" @click="handleLink(msg.actionLink)">{{ msg.actionLink.label }} &gt;</a>
          </div>
        </div>

        <!-- ===== 用户消息 ===== -->
        <div v-if="msg.type === 'user'" class="row row--user" :data-idx="i">
          <div class="bubble">{{ msg.content }}</div>
        </div>
      </template>

      <!-- 分析中 -->
      <div v-if="sending" class="row row--ai">
        <div class="thinking"><i></i><i></i><i></i></div>
      </div>
    </div>

    <!-- ========== 底部输入 ========== -->
    <div class="dock">
      <div class="chips">
        <button v-for="chip in commandChips" :key="chip.label" class="chip" @click="handleChip(chip)">{{ chip.label }}</button>
      </div>
      <div v-if="inputMode === 'voice'" class="bar" @click="inputMode = 'text'">
        <span class="bar-ph">有什么不适，随时说...</span>
        <button class="bar-icon bar-icon--mic" @click.stop="showToast('语音功能开发中')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
        <button class="bar-icon bar-icon--kbd" @click.stop="inputMode = 'text'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="8" y1="12" x2="8.01" y2="12"/><line x1="12" y1="12" x2="12.01" y2="12"/><line x1="16" y1="12" x2="16.01" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>
        </button>
      </div>
      <div v-else class="bar bar--focus">
        <input v-model="inputText" class="bar-input" type="text" placeholder="有什么不适，随时说..." @keyup.enter="sendMessage()" autofocus />
        <button v-if="inputText.trim()" class="bar-icon bar-icon--send" :disabled="sending" @click="sendMessage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
        <button class="bar-icon bar-icon--mic" @click="inputMode = 'voice'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { sendConsultation, getPatientProfile, getConsultationHistory } from '@/api/patient'
import { usePatientStore } from '@/stores/patient'

const router = useRouter()
const store = usePatientStore()

const inputMode = ref<'text' | 'voice'>('voice')
const inputText = ref('')
const sending = ref(false)
const feedRef = ref<HTMLElement>()
const currentMember = ref<any>(null)

function formatTime(t: string): string {
  const h = parseInt(t.split(':')[0])
  return `${h < 12 ? '上午' : '下午'} ${t}`
}

interface Chip { label: string; action: 'msg' | 'nav' | 'call'; payload: string }
const commandChips = ref<Chip[]>([
  { label: '心率为什么偏高？', action: 'msg', payload: '心率为什么偏高？' },
  { label: '推荐一份降压午餐', action: 'msg', payload: '推荐一份降压午餐' },
  { label: '呼叫医生', action: 'call', payload: '' },
])

interface Alert { id: string; sourceIndex: number; title: string; handled: boolean }
const redAlerts = reactive<Alert[]>([])
const activeRedAlerts = computed(() => redAlerts.filter(a => !a.handled))

const dynamicMsgs = reactive<any[]>([])

const nowTs = (() => {
  const t = new Date()
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
})()

const seedMsgs = reactive<any[]>([
  {
    type: 'ai', time: nowTs,
    aiText: '您好！我是您的 AI 健康助手，有什么我可以帮您的吗？',
    card: null,
  },
  {
    type: 'ai', time: '09:00',
    aiText: '您的康复计划已由医生审核完毕。',
    card: {
      type: 'plan-review',
      doctorName: '张伟',
      result: 'approved',
      comment: '恢复良好，同意进入III期康复训练，运动强度可适当增加。',
    },
    actionLink: { label: '查看计划详情', action: 'plan-review' },
  },
  {
    type: 'ai', time: '09:30',
    aiText: '今天下午有一次康复训练任务，请提前准备好穿戴设备。',
    card: { type: 'training-rx', name: '心肺康复呼吸操', duration: '15 min', note: '保持心率 < 110 bpm' },
  },
  {
    type: 'ai', time: '10:00',
    aiText: '您的康复报告已由医生审核。',
    card: {
      type: 'report-review',
      reportType: 'weekly',
      score: 85,
      doctorComment: '本周恢复情况良好，血压控制达标，建议继续保持运动频率。',
    },
    actionLink: { label: '查看报告详情', action: 'report-review' },
  },
  {
    type: 'ai', time: '10:35',
    aiText: '医生已回复您的留言。',
    card: {
      type: 'doctor-reply',
      doctorName: '张伟',
      originalMsg: '爸爸今天血压偏高怎么办？',
      replyContent: '血压偏高但仍在可控范围（145/92），建议保持静卧休息，暂勿剧烈活动。若持续超过160/100请及时就医。',
    },
  },
])

const allMessages = computed(() => {
  const msgs = [...seedMsgs, ...dynamicMsgs]
  let prev = ''
  return msgs.map((m) => {
    const showTime = m.time !== prev
    if (showTime) prev = m.time
    return { ...m, showTime }
  })
})

onMounted(async () => {
  try {
    const p = await getPatientProfile() as any
    currentMember.value = { id: p.patientId, name: p.name }
  } catch {}

  const raw = sessionStorage.getItem('training_result')
  if (raw) { sessionStorage.removeItem('training_result'); try { injectTraining(JSON.parse(raw)) } catch {} }

  await nextTick(); scrollEnd()
})

function dismissAlert(id: string) { const a = redAlerts.find(x => x.id === id); if (a) { a.handled = true; showToast('预警已处置') } }
function handleCallDoctor() { showToast('正在连线值班医生...') }
function scrollToMsg(idx: number) { feedRef.value?.querySelector(`[data-idx="${idx}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

function handleLink(link: { label: string; action: string }) {
  if (link.action === 'diet') sendMessage('请给我饮食建议')
  else if (link.action === '查看详情') router.push('/p/health-monitor')
  else if (link.action === 'plan-review') router.push('/p/recovery-plan')
  else if (link.action === 'report-review') router.push('/p/recovery-report')
  else showToast(link.action)
}
function handleChip(c: Chip) {
  if (c.action === 'msg') sendMessage(c.payload)
  else if (c.action === 'nav') router.push(c.payload)
  else showToast('正在连接医生...')
}

async function sendMessage(text?: string) {
  const msg = text || inputText.value.trim()
  if (!msg || sending.value) return
  inputText.value = ''
  const t = new Date()
  const ts = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
  dynamicMsgs.push({ type: 'user', time: ts, content: msg })
  sending.value = true
  await nextTick(); scrollEnd()
  try {
    const res = (await sendConsultation({ patientId: currentMember.value?.id, message: msg, type: 'ai' })) as any
    dynamicMsgs.push({ type: 'ai', time: ts, aiText: res.reply, card: null })
  } catch {
    dynamicMsgs.push({ type: 'ai', time: ts, aiText: '抱歉，服务暂时不可用，请稍后重试。', card: null })
  } finally { sending.value = false; await nextTick(); scrollEnd() }
}

function injectTraining(r: any) {
  const t = new Date()
  const ts = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
  const dm = Math.floor(r.duration / 60), ds = r.duration % 60
  const dt = ds > 0 ? `${dm}分${ds}秒` : `${dm}分钟`
  if (r.reason === 'emergency') {
    dynamicMsgs.push({ type: 'user', time: ts, content: '训练过程中心率异常，训练被紧急终止' })
    dynamicMsgs.push({ type: 'ai', time: ts, aiText: `检测到心率峰值${r.maxHR}bpm，已紧急终止。训练时长${dt}。建议今日不再剧烈运动，保持静卧休息。若30分钟内心率未降至90bpm以下请就医。已通知张伟医生。`, card: null })
  } else if (r.reason === 'stopped') {
    const pct = Math.round((r.duration / 900) * 100)
    dynamicMsgs.push({ type: 'user', time: ts, content: `提前结束训练，练了${dt}` })
    dynamicMsgs.push({ type: 'ai', time: ts, aiText: `完成度${pct}%，平均心率${r.avgHR}bpm，最大心率${r.maxHR}bpm，消耗${r.calories}kcal。${pct >= 60 ? '已达基本要求，继续保持。' : '时间偏短，建议下次坚持更久。'}`, card: null })
  } else {
    dynamicMsgs.push({ type: 'user', time: ts, content: `康复训练完成，练了${dt}` })
    dynamicMsgs.push({ type: 'ai', time: ts, aiText: '训练圆满完成！全程心率控制良好。', card: { type: 'training-summary', duration: dt, avgHR: r.avgHR, maxHR: r.maxHR, calories: r.calories } })
  }
  commandChips.value = [
    { label: '查看今日总结', action: 'nav', payload: '/p/health-monitor' },
    { label: '呼叫医生', action: 'call', payload: '' },
    { label: '饮食建议', action: 'msg', payload: '请给我饮食建议' },
  ]
}

function scrollEnd() { if (feedRef.value) feedRef.value.scrollTop = feedRef.value.scrollHeight }
</script>

<style scoped>
/*
  Design Tokens — synced with PatientHome.vue
  ─────────────────────────────────────────
  Brand:   #8A7BFE
  Title:   #0f172a          Body:  #334155
  Label:   #64748b          Caption: #94a3b8
  Data:    26px / 800 / #0f172a / DIN Alternate
  Unit:    11px / #94a3b8
  Success: #10b981          Danger: #CF1322
  Card:    border-radius 16px, shadow 0 1px 4px rgba(0,0,0,.04)
*/

/* ========== Page ========== */
.page {
  display: flex; flex-direction: column; height: calc(100vh - 48px); background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Helvetica, Arial, "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ========== Nav Bar ========== */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.nav-btn {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: #f1f5f9; display: flex; align-items: center; justify-content: center;
  color: #475569; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.nav-btn:active { background: #e2e8f0; }
.nav-title { font-size: 17px; font-weight: 700; color: #0f172a; }

/* ========== Alert Bar ========== */
.alert-bar { flex-shrink: 0; background: rgba(207,19,34,0.05); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(207,19,34,0.08); }
.alert-item { display: flex; align-items: center; gap: 8px; padding: 10px 16px; cursor: pointer; }
.alert-pulse { width: 8px; height: 8px; border-radius: 50%; background: #CF1322; flex-shrink: 0; animation: ring 1.8s ease-out infinite; }
@keyframes ring { 0%{box-shadow:0 0 0 0 rgba(207,19,34,.45)} 70%{box-shadow:0 0 0 8px rgba(207,19,34,0)} 100%{box-shadow:0 0 0 0 rgba(207,19,34,0)} }
.alert-label { font-size: 13px; font-weight: 700; color: #CF1322; flex-shrink: 0; }
.alert-text { font-size: 13px; font-weight: 500; color: #CF1322; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.alert-cta { flex-shrink: 0; padding: 6px 14px; border: none; border-radius: 8px; background: #CF1322; color: white; font-size: 13px; font-weight: 600; cursor: pointer; }
.alert-cta:active { opacity: .85; }
.alert-x { flex-shrink: 0; width: 24px; height: 24px; border: none; background: none; color: #CF1322; opacity: .4; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.alert-x:active { opacity: 1; }
.alert-slide-enter-active,.alert-slide-leave-active { transition: all .3s ease; }
.alert-slide-enter-from,.alert-slide-leave-to { max-height: 0; opacity: 0; overflow: hidden; }

/* ========== Feed ========== */
.feed { flex: 1; overflow-y: auto; padding: 10px 16px 16px; -webkit-overflow-scrolling: touch; }

/* Timestamp */
.ts { text-align: center; font-size: 12px; color: #94a3b8; padding: 14px 0 10px; user-select: none; }

/* ========== Message Rows ========== */
.row { margin-bottom: 24px; }
.row--ai { display: flex; flex-direction: column; align-items: flex-start; max-width: 92%; }
.row--user { display: flex; flex-direction: column; align-items: flex-end; }

/* AI text — matches insight-text from Home */
.ai-text {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  line-height: 1.7;
  margin-bottom: 10px;
  padding: 0 2px;
}

/* ========== Card — unified container ========== */
.card {
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.04);
  overflow: hidden;
}
.card--danger {
  box-shadow: 0 1px 4px rgba(207,19,34,.06), 0 2px 12px rgba(207,19,34,.08);
}

/* ========== Card Action Link ========== */
.card-link {
  display: block;
  padding: 14px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #8A7BFE;
  border-top: 1px solid #f1f5f9;
  cursor: pointer;
}
.card-link:active { opacity: .6; }

/* ========== Icons — semantic per vital type ========== */
.ico {
  width: 16px; height: 16px; flex-shrink: 0;
  fill: none; stroke: #64748b; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
  vertical-align: -2px; margin-right: 6px;
}
.ico--sm { width: 14px; height: 14px; vertical-align: -2px; }
.ico--bp { stroke: #8A7BFE; }
.ico--sugar { stroke: #f59e0b; }
.ico--danger { stroke: #ef4444; }
.ico--med { stroke: #10b981; }
.ico--brand { stroke: #8A7BFE; }

/* ========== Vital Rows — unified data display ========== */
.v-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; }
.v-row + .v-row { border-top: 1px solid #f1f5f9; }
.v-label { font-size: 13px; font-weight: 500; color: #64748b; display: flex; align-items: center; }
.v-val {
  font-size: 26px; font-weight: 800; color: #0f172a;
  font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.v-val small { font-size: 11px; font-weight: 400; color: #94a3b8; margin-left: 4px; }
.v-val--warn { color: #D46B08; }
.v-val--danger { color: #CF1322; }
.dur { font-size: 11px; font-weight: 600; font-style: normal; color: #CF1322; margin-left: 6px; }

/* Status dot */
.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-left: 8px; vertical-align: middle; font-style: normal; }
.dot--ok { background: #10b981; }
.dot--warn { background: #D46B08; }
.dot--danger { background: #ef4444; }

/* Advice/alert text */
.advice { padding: 14px 18px 16px; font-size: 14px; font-weight: 500; color: #CF1322; line-height: 1.7; border-top: 1px solid rgba(207,19,34,.06); background: rgba(207,19,34,.02); }

/* ========== Medication Rows ========== */
.med-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; font-size: 14px; }
.med-row + .med-row { border-top: 1px solid #f1f5f9; }
.med-name { color: #0f172a; font-weight: 500; display: flex; align-items: center; }
.med-ok { color: #10b981; font-weight: 600; font-size: 13px; }

/* ========== Training Rx ========== */
.rx-head { padding: 16px 18px 10px; font-size: 14px; font-weight: 600; color: #0f172a; display: flex; align-items: center; }
.rx-thumb {
  position: relative; margin: 8px 18px 0; height: 140px; border-radius: 12px; overflow: hidden;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #ddd6fe 100%);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.rx-thumb:active { opacity: 0.9; }
.rx-thumb-play {
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(138, 123, 254, 0.85); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 12px rgba(138, 123, 254, 0.3);
}
.rx-thumb-play svg { margin-left: 2px; }
.rx-thumb-dur {
  position: absolute; bottom: 8px; right: 10px;
  padding: 2px 8px; border-radius: 6px;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
  font-size: 11px; font-weight: 600; color: white;
}
.rx-note {
  display: flex; align-items: center; padding: 8px 18px 0;
  font-size: 12px; font-weight: 500; color: #94a3b8;
}
.rx-btn {
  display: block; width: calc(100% - 36px); margin: 12px 18px 18px;
  padding: 10px 0; border: none; border-radius: 8px;
  background: #8A7BFE; color: white; font-size: 13px; font-weight: 600;
  cursor: pointer; -webkit-tap-highlight-color: transparent; transition: all .15s;
}
.rx-btn:active { opacity: 0.8; transform: scale(.98); }

/* ========== Summary Grid ========== */
.sum-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px 12px; font-size: 14px; font-weight: 600; color: #0f172a; }
.sum-score { font-size: 17px; font-weight: 800; color: #8A7BFE; font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace; }
.sum-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 4px 18px 18px; }
.sum-cell { display: flex; flex-direction: column; gap: 4px; padding: 10px 0; }
.sum-lbl { font-size: 13px; font-weight: 500; color: #64748b; }
.sum-num { font-size: 26px; font-weight: 800; color: #0f172a; font-family: 'DIN Alternate', 'Roboto Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
.sum-num small { font-size: 11px; font-weight: 400; color: #94a3b8; margin-left: 2px; }

/* ========== User Bubble ========== */
.bubble {
  display: inline-block;
  max-width: 80%;
  padding: 12px 18px;
  background: #F2F4F7;
  color: #0f172a;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.7;
  border-radius: 18px;
}

/* ========== Thinking Dots ========== */
.thinking { display: flex; gap: 5px; padding: 8px 2px; }
.thinking i { display: block; width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; animation: bounce 1.4s infinite; }
.thinking i:nth-child(2) { animation-delay: .2s; }
.thinking i:nth-child(3) { animation-delay: .4s; }
@keyframes bounce { 0%,80%,100%{opacity:.3;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }

/* ========== Bottom Dock ========== */
.dock { flex-shrink: 0; background: #ffffff; box-shadow: 0 -1px 0 rgba(0,0,0,.04); padding-bottom: env(safe-area-inset-bottom); }
.chips { display: flex; gap: 8px; padding: 10px 16px 6px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.chips::-webkit-scrollbar { display: none; }
.chip { white-space: nowrap; padding: 7px 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; font-size: 13px; font-weight: 500; color: #334155; cursor: pointer; flex-shrink: 0; -webkit-tap-highlight-color: transparent; transition: all .15s; }
.chip:active { background: #f8fafc; border-color: #8A7BFE; color: #8A7BFE; }

.bar { display: flex; align-items: center; gap: 8px; margin: 6px 16px 12px; padding: 0 6px 0 14px; height: 48px; background: #F2F4F7; border-radius: 24px; border: 1px solid transparent; cursor: text; transition: all .2s; }
.bar--focus { background: #fff; border-color: #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.bar-ph { flex: 1; font-size: 14px; color: #94a3b8; user-select: none; }
.bar-input { flex: 1; height: 100%; border: none; background: none; font-size: 14px; color: #0f172a; outline: none; }
.bar-input::placeholder { color: #94a3b8; }
.bar-icon { width: 36px; height: 36px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; -webkit-tap-highlight-color: transparent; transition: all .15s; }
.bar-icon--mic { background: none; color: #94a3b8; }
.bar-icon--mic:active { transform: scale(.9); color: #0f172a; }
.bar-icon--kbd { background: none; color: #94a3b8; }
.bar-icon--kbd:active { color: #0f172a; }
.bar-icon--send { background: #8A7BFE; }
.bar-icon--send:active { transform: scale(.9); }
.bar-icon--send:disabled { background: #cbd5e1; }

/* ========== Notification Cards (plan-review, report-review, doctor-reply) ========== */
.notify-head {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 18px 10px; font-size: 15px; font-weight: 700; color: #0f172a;
}
.notify-title-text { flex: 1; }
.notify-body { padding: 0 18px 16px; }
.notify-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; font-size: 14px;
}
.notify-row + .notify-row { border-top: 1px solid #f1f5f9; }
.notify-label { color: #64748b; font-weight: 500; }
.notify-val { color: #0f172a; font-weight: 600; }
.notify-val--ok { color: #10b981; }
.notify-val--adjust { color: #f59e0b; }
.notify-val--score { color: #8A7BFE; font-weight: 800; font-family: 'DIN Alternate', 'Roboto Mono', monospace; }
.notify-comment {
  margin-top: 10px; padding: 10px 12px; background: #f8fafc;
  border-radius: 10px; border-left: 3px solid #8A7BFE;
  font-size: 13px; color: #334155; line-height: 1.6;
}
.notify-comment-tag {
  display: block; font-size: 11px; font-weight: 700;
  color: #8A7BFE; margin-bottom: 4px;
}

/* Doctor Reply Card */
.reply-head {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 18px 10px;
}
.reply-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: #f0eeff; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
}
.reply-info { display: flex; align-items: baseline; gap: 6px; }
.reply-doctor { font-size: 15px; font-weight: 700; color: #0f172a; }
.reply-tag { font-size: 12px; color: #64748b; font-weight: 500; }
.reply-content { padding: 0 18px 16px; }
.reply-original {
  padding: 10px 12px; margin-bottom: 10px;
  background: #f8fafc; border-radius: 8px;
  font-size: 13px; color: #64748b; line-height: 1.5;
}
.reply-orig-label { font-weight: 600; color: #94a3b8; }
.reply-text { font-size: 14px; color: #334155; line-height: 1.7; font-weight: 500; }
</style>
