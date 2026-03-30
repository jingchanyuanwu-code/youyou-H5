/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 品牌控制色 - 皇家蓝
        primary: '#396CFF',
        'primary-light': '#5A85FF',
        'primary-dark': '#2A54D9',
        'primary-50': '#EEF2FF',
        'primary-100': '#DCE4FF',
        // 背景色 - 极浅冷灰蓝
        'bg-base': '#F2F5FA',
        'bg-card': '#FFFFFF',
        'bg-inner': '#F8FAFC',
        // 文本色 - 极深藏青 + 冷灰紫蓝
        'text-primary': '#1A2238',
        'text-secondary': '#8A9AC3',
        'text-muted': '#8A9AC3',
        'text-light': '#B4C0DC',
        // 警示色 - 玫瑰红
        'alert-critical': '#FF4C61',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        // 空气感弥散阴影
        'air': '0 4px 20px rgba(0, 0, 0, 0.02)',
        'air-lg': '0 8px 30px rgba(0, 0, 0, 0.03)',
        // 品牌蓝彩色投影
        'brand': '0 8px 20px rgba(57, 108, 255, 0.3)',
        'brand-hover': '0 10px 28px rgba(57, 108, 255, 0.4)',
        // 保留 medical 兼容
        'medical': '0 4px 20px rgba(0, 0, 0, 0.02)',
        'medical-lg': '0 8px 30px rgba(0, 0, 0, 0.03)',
        'medical-hover': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'btn-glow': '0 8px 20px rgba(57, 108, 255, 0.3)',
        'btn-glow-hover': '0 10px 28px rgba(57, 108, 255, 0.4)',
      },
      borderRadius: {
        // 极限圆角层级
        'outer': '24px',
        'inner': '16px',
        'card': '24px',
        'module': '12px',
        'tag': '6px',
        'input': '12px',
      },
      spacing: {
        'card-margin': '16px',
        'card-padding': '20px',
      },
    },
  },
  plugins: [],
}
