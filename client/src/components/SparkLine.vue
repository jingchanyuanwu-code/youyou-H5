<template>
  <div class="sparkline-wrap" :style="{ width: width + 'px', height: (height + 14) + 'px' }">
    <svg :width="width" :height="height" class="sparkline">
      <defs>
        <linearGradient :id="gradId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" :stop-color="color" stop-opacity="0.15" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <!-- 渐变填充区域 -->
      <path
        v-if="fillPath"
        :d="fillPath"
        :fill="`url(#${gradId})`"
      />
      <!-- 趋势线 -->
      <path
        v-if="linePath"
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- 最新数据点（呼吸闪烁动画） -->
      <circle
        v-if="endPoint"
        :cx="endPoint.x"
        :cy="endPoint.y"
        r="3"
        :fill="color"
        class="pulse-dot"
      />
    </svg>
    <span v-if="label" class="sparkline-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  data: { date: string; value: number; isAbnormal?: boolean }[]
  color?: string
  width?: number
  height?: number
  label?: string
}>(), {
  color: '#FF4C61',
  width: 96,
  height: 40,
  label: '',
})

// 唯一 gradient id，防止多实例冲突
const gradId = computed(() => `spark-grad-${props.color.replace('#', '')}`)

const validData = computed(() => props.data.filter(d => d.value > 0))

const coords = computed(() => {
  if (validData.value.length < 2) return []
  const values = validData.value.map(d => d.value)
  const max = Math.max(...values) * 1.05
  const min = Math.min(...values) * 0.95
  const range = max - min || 1
  const padding = 4
  const drawW = props.width - padding * 2
  const drawH = props.height - padding * 2
  const stepX = drawW / (values.length - 1)

  return values.map((v, i) => ({
    x: padding + i * stepX,
    y: padding + drawH - ((v - min) / range) * drawH,
  }))
})

const linePath = computed(() => {
  if (coords.value.length < 2) return ''
  return coords.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
})

const fillPath = computed(() => {
  if (coords.value.length < 2) return ''
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  return `${linePath.value} L${last.x},${props.height} L${first.x},${props.height} Z`
})

const endPoint = computed(() => {
  if (coords.value.length < 2) return null
  return coords.value[coords.value.length - 1]
})
</script>

<style scoped>
.sparkline-wrap {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
}
.sparkline {
  display: block;
  overflow: visible;
}
.sparkline-label {
  font-size: 9px;
  color: #8A9AC3;
  font-weight: 500;
  margin-top: 2px;
}
.pulse-dot {
  animation: spark-pulse 2s ease-in-out infinite;
}
@keyframes spark-pulse {
  0%, 100% { opacity: 1; r: 3; }
  50% { opacity: 0.5; r: 5; }
}
</style>
