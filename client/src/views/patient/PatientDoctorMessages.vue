<template>
  <div class="msg-page">
    <!-- Nav bar -->
    <div class="nav-bar">
      <button class="nav-btn" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="nav-title">医生留言</span>
      <div class="nav-btn" style="visibility: hidden;"><svg width="20" height="20" viewBox="0 0 24 24" /></div>
    </div>

    <!-- Doctor info -->
    <div class="doctor-card">
      <div class="doc-avatar">
        <img src="/images/logo.png" alt="医生" class="doc-avatar-img" />
      </div>
      <div class="doc-info">
        <div class="doc-name">张伟 <span class="doc-title">主任医师</span></div>
        <div class="doc-dept">兰州大学第一医院 · 心内科</div>
      </div>
    </div>

    <!-- Messages timeline -->
    <div class="msg-list">
      <div v-for="(group, gi) in messageGroups" :key="gi" class="msg-group">
        <div class="msg-date">{{ group.date }}</div>
        <div v-for="(msg, mi) in group.items" :key="mi" class="msg-item" :class="'msg-item--' + msg.type">
          <div class="msg-icon-col">
            <div class="msg-icon-wrap" :class="'msg-icon--' + msg.type">
              <span>{{ msg.icon }}</span>
            </div>
            <div v-if="mi < group.items.length - 1" class="msg-line"></div>
          </div>
          <div class="msg-card">
            <div class="msg-head">
              <span class="msg-type-tag" :class="'msg-tag--' + msg.type">{{ msg.typeLabel }}</span>
              <span class="msg-time">{{ msg.time }}</span>
            </div>
            <div class="msg-title">{{ msg.title }}</div>
            <div class="msg-content">{{ msg.content }}</div>
            <div v-if="msg.reply" class="msg-reply">
              <div class="msg-reply-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2.5">
                  <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 00-4-4H4" />
                </svg>
                医生回复
              </div>
              <div class="msg-reply-text">{{ msg.reply }}</div>
            </div>
            <div v-if="msg.action" class="msg-action">
              <button class="msg-action-btn" @click="handleAction(msg)">{{ msg.action }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="safe-bottom"></div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const messageGroups = reactive([
  {
    date: '今天',
    items: [
      {
        type: 'reply',
        icon: '💬',
        typeLabel: '紧急留言回复',
        time: '10:35',
        title: '张伟医生回复了您的紧急联系消息',
        content: '您反馈的家属血压异常情况已收到，已查看体征数据。',
        reply: '血压偏高但仍在可控范围，建议保持静卧休息，暂勿剧烈活动。若1小时内血压未回落至140/90以下，请及时来院就诊。我会持续关注监测数据。',
        action: '',
      },
    ],
  },
  {
    date: '03-03',
    items: [
      {
        type: 'review',
        icon: '📋',
        typeLabel: '计划审核',
        time: '14:20',
        title: '康复计划变更审核通过',
        content: '您的康复计划已由张伟医生审核通过：从II期（院外早期）调整为III期（规律康复），运动强度将适当增加。',
        reply: '患者恢复良好，各项指标稳定，同意进入III期康复训练。请按新计划执行，注意运动后心率不超过靶心率上限。',
        action: '查看新计划',
      },
    ],
  },
  {
    date: '02-28',
    items: [
      {
        type: 'followup',
        icon: '🩺',
        typeLabel: '定期随访',
        time: '09:00',
        title: '张伟医生的定期随访留言',
        content: '本周您的体征数据整体平稳，康复任务完成率92%，非常好。',
        reply: '近两周血压控制理想，心率恢复正常范围。建议本周开始尝试快走15分钟，注意监测运动中心率。下周复查心电图，请记得提前预约。',
        action: '',
      },
      {
        type: 'report',
        icon: '📊',
        typeLabel: '报告点评',
        time: '08:45',
        title: '周报已由医生审核',
        content: '您的第8周康复周报已完成审核，综合评分85分。',
        reply: '本周表现优秀，用药依从性100%，运动达标率85%。需关注的是睡眠质量有所下降，建议晚间减少屏幕使用，可尝试深呼吸放松训练。',
        action: '查看报告',
      },
    ],
  },
  {
    date: '02-20',
    items: [
      {
        type: 'notice',
        icon: '🔔',
        typeLabel: '系统通知',
        time: '16:00',
        title: '康复计划阶段调整通知',
        content: '根据您的康复进度，系统建议将计划从I期调整到II期。已提交张伟医生审核。',
        reply: '审核通过。患者术后恢复顺利，可开始居家康复初期训练。注意循序渐进，如有不适立即停止。',
        action: '',
      },
      {
        type: 'followup',
        icon: '🩺',
        typeLabel: '医嘱更新',
        time: '10:30',
        title: '用药方案微调',
        content: '张伟医生更新了您的用药方案。',
        reply: '根据近期血压监测数据，厄贝沙坦片剂量由100mg调整为150mg，每日1次，早餐后服用。其他药物不变。调整后请每日早晚各测一次血压，连续记录一周。',
        action: '',
      },
    ],
  },
])

function handleAction(msg: any) {
  if (msg.action === '查看新计划') {
    router.push('/p/recovery-plan')
  } else if (msg.action === '查看报告') {
    router.push('/p/recovery-report')
  } else {
    showToast('功能开发中')
  }
}
</script>

<style scoped>
.msg-page {
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
.doctor-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 16px 0;
  padding: 16px;
  background: linear-gradient(145deg, #8A7BFE 0%, #A89AFE 50%, #C4BAFF 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(138, 123, 254, 0.25);
}

.doc-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.doc-avatar-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 16px;
  font-weight: 800;
  color: white;
}

.doc-title {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.doc-dept {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

/* Messages */
.msg-list {
  padding: 16px 16px 0;
}

.msg-group {
  margin-bottom: 8px;
}

.msg-date {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  padding: 8px 4px;
}

.msg-item {
  display: flex;
  gap: 12px;
}

.msg-icon-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
  flex-shrink: 0;
}

.msg-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.msg-icon--reply { background: #f0eeff; }
.msg-icon--review { background: #ecfdf5; }
.msg-icon--followup { background: #eff6ff; }
.msg-icon--report { background: #fff7ed; }
.msg-icon--notice { background: #fef3c7; }

.msg-line {
  width: 2px;
  flex: 1;
  background: #e2e8f0;
  min-height: 16px;
  margin: 4px 0;
}

.msg-card {
  flex: 1;
  background: white;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  min-width: 0;
}

.msg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.msg-type-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.msg-tag--reply { color: #8A7BFE; background: #f0eeff; }
.msg-tag--review { color: #059669; background: #ecfdf5; }
.msg-tag--followup { color: #2563eb; background: #eff6ff; }
.msg-tag--report { color: #ea580c; background: #fff7ed; }
.msg-tag--notice { color: #d97706; background: #fef3c7; }

.msg-time {
  font-size: 12px;
  color: #94a3b8;
}

.msg-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
  line-height: 1.4;
}

.msg-content {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

.msg-reply {
  margin-top: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 3px solid #8A7BFE;
}

.msg-reply-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #8A7BFE;
  margin-bottom: 6px;
}

.msg-reply-text {
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
}

.msg-action {
  margin-top: 10px;
}

.msg-action-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1.5px solid #8A7BFE;
  background: rgba(138, 123, 254, 0.06);
  font-size: 13px;
  font-weight: 600;
  color: #8A7BFE;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.msg-action-btn:active {
  background: rgba(138, 123, 254, 0.15);
}
</style>
