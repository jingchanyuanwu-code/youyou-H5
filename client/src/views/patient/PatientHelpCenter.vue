<template>
  <div class="help-page">
    <div class="header-bar">
      <button class="header-back" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="header-title">帮助中心</span>
      <div class="header-back" style="visibility: hidden;"><svg width="22" height="22" viewBox="0 0 24 24" /></div>
    </div>

    <!-- App info -->
    <div class="app-info">
      <div class="app-logo">
        <img src="/images/logo.png" alt="呦呦·心康" class="logo-img" />
      </div>
      <div class="app-name">呦呦·心康</div>
      <div class="app-version">v1.0.0</div>
    </div>

    <!-- Introduction -->
    <div class="intro-card">
      <div class="intro-text">
        呦呦·心康是一款面向心脏康复患者的全周期健康管理工具。通过智能监测、AI洞察和个性化康复计划，帮助患者及其家庭成员实现科学、高效的术后康复管理。
      </div>
    </div>

    <!-- Features -->
    <div class="features-section">
      <div class="section-label">核心功能</div>
      <div
        v-for="(f, i) in features"
        :key="i"
        class="feature-item"
        @click="f.expanded = !f.expanded"
      >
        <div class="fi-header">
          <span class="fi-icon">{{ f.icon }}</span>
          <span class="fi-title">{{ f.title }}</span>
          <svg
            class="fi-arrow"
            :class="{ 'fi-arrow--open': f.expanded }"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div v-if="f.expanded" class="fi-body">{{ f.desc }}</div>
      </div>
    </div>

    <!-- Contact -->
    <div class="contact-section">
      <div class="section-label">联系我们</div>
      <div class="contact-card">
        <div class="contact-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
          <span>客服热线：400-888-9999</span>
        </div>
        <div class="contact-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A7BFE" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span>邮箱：support@youyou-health.com</span>
        </div>
      </div>
    </div>

    <div class="safe-bottom"></div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const features = reactive([
  {
    icon: '🧭',
    title: '健康领航',
    desc: '实时监测心率、血压、血糖、血氧等核心体征指标，AI智能分析趋势变化，及时发现异常波动并发出预警提醒。',
    expanded: false,
  },
  {
    icon: '📋',
    title: '康复计划',
    desc: '基于四阶段康复模型（术后早期→院外早期→规律康复→长期维持），为每位患者量身定制每日康复任务，包括监测录入、运动跟练、饮食记录和用药打卡。',
    expanded: false,
  },
  {
    icon: '💎',
    title: '生命资产',
    desc: '独创五维健康评估体系，从运动耐力、心肺功能、代谢指标、生活质量和心理状态五个维度全面评估康复成效，让健康进步可量化、可感知。',
    expanded: false,
  },
  {
    icon: '👨‍👩‍👧‍👦',
    title: '家庭守护',
    desc: '支持多成员健康监控，家属可实时查看患者体征数据，预警信息同步推送，一键联系主治医生，实现全家共同参与的康复管理。',
    expanded: false,
  },
  {
    icon: '🤖',
    title: 'AI智能咨询',
    desc: '内置AI健康助手，随时解答康复过程中的疑问，提供专业的饮食建议、运动指导和心理支持，让专业陪伴触手可及。',
    expanded: false,
  },
])
</script>

<style scoped>
.help-page {
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

/* App info */
.app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px 20px;
}

.app-logo {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #8A7BFE, #A89AFE);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(138, 123, 254, 0.25);
  overflow: hidden;
}

.logo-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.app-name {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin-top: 12px;
}

.app-version {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Intro */
.intro-card {
  margin: 0 16px 20px;
  background: white;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.intro-text {
  font-size: 14px;
  color: #475569;
  line-height: 1.8;
}

/* Features */
.features-section {
  padding: 0 16px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 4px;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.feature-item {
  background: white;
  border-radius: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.fi-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
}

.fi-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.fi-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

.fi-arrow {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.fi-arrow--open {
  transform: rotate(180deg);
}

.fi-body {
  padding: 0 16px 14px;
  font-size: 14px;
  color: #64748b;
  line-height: 1.7;
}

/* Contact */
.contact-section {
  padding: 20px 16px 0;
}

.contact-card {
  background: white;
  border-radius: 14px;
  padding: 4px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  font-size: 14px;
  color: #334155;
}

.contact-row + .contact-row { border-top: 1px solid #f1f5f9; }

.safe-bottom {
  height: calc(20px + env(safe-area-inset-bottom));
}
</style>
