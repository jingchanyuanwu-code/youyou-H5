/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色系 (Medical Blue)
        brand: {
          DEFAULT: '#4A90D9', // 主操作色
          light: '#5BA3E8',   // 渐变辅助色 1
          lighter: '#8DC3F0', // 渐变辅助色 2
        },
        // 语义状态色 (Medical Alerts)
        status: {
          critical: '#FF4C61', // 高危/支出 (Red)
          success: '#20C997',  // 平稳/收入 (Green)
          warning: '#FFD166',  // 注意/待办 (Yellow)
        },
        // 界面灰度 (Surfaces & Backgrounds)
        surface: {
          DEFAULT: '#FFFFFF',  // 卡片纯白背景
          bg: '#F8F9FA',       // 全局极浅灰底色
          divider: '#F3F4F6',  // 极浅分割线
        },
        // 文本色系 (Typography)
        tx: {
          primary: '#111827',  // 核心大标题/总数据
          secondary: '#4B5563',// 常规正文
          tertiary: '#9CA3AF', // 辅助说明/时间标签
        }
      },
      boxShadow: {
        // 核心阴影规范
        'brand-glow': '0 20px 40px -15px rgba(74,144,217,0.6)', // 紫色霓虹悬浮阴影 (用于Hero卡片和核心FAB按钮)
        'soft-float': '0 8px 30px rgba(0,0,0,0.03)',            // 列表卡片悬浮阴影
        'micro-press': '0 4px 12px rgba(0,0,0,0.04)',           // 快捷操作块微浮雕阴影
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px', // 用于顶级容器(Hero卡片/底部导航)
      },
      fontFamily: {
        // 强行指定数字等宽，确保流水账单完美对齐
        sans: ['Inter', 'PingFang SC', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
