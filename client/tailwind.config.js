/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 主色系 - 沉稳蓝
        primary: '#2563EB',
        'primary-light': '#3B82F6',
        'primary-dark': '#1D4ED8',
        'primary-50': '#EFF6FF',
        'primary-100': '#DBEAFE',
        // 背景色 - 淡灰蓝
        'bg-base': '#F1F5F9',
        'bg-card': '#FFFFFF',
        // 文本色 - 深蓝灰
        'text-primary': '#1E293B',
        'text-secondary': '#475569',
        'text-muted': '#94A3B8',
        'text-light': '#CBD5E1',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        // 轻盈的层叠投影 - medical shadow
        'medical': '0 1px 2px rgba(30, 41, 59, 0.04), 0 4px 12px rgba(30, 41, 59, 0.06)',
        'medical-lg': '0 2px 4px rgba(30, 41, 59, 0.04), 0 8px 24px rgba(30, 41, 59, 0.08)',
        'medical-hover': '0 4px 8px rgba(30, 41, 59, 0.06), 0 12px 32px rgba(30, 41, 59, 0.1)',
        // 按钮呼吸阴影
        'btn-glow': '0 4px 14px rgba(37, 99, 235, 0.35)',
        'btn-glow-hover': '0 6px 20px rgba(37, 99, 235, 0.45)',
      },
      borderRadius: {
        'card': '16px',
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
