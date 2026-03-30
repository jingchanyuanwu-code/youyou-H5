<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
    <circle
      v-for="(seg, i) in segments"
      :key="i"
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke="seg.color"
      :stroke-width="strokeWidth"
      :stroke-dasharray="seg.dashArray"
      :stroke-dashoffset="seg.dashOffset"
      stroke-linecap="round"
      :transform="`rotate(-90 ${center} ${center})`"
    />
    <text :x="center" :y="center - 6" text-anchor="middle" class="ring-label">总计</text>
    <text :x="center" :y="center + 14" text-anchor="middle" class="ring-value">¥{{ formatTotal }}</text>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  data: { category: string; percentage: number; amount: number }[]
  size?: number
  strokeWidth?: number
}>(), {
  size: 140,
  strokeWidth: 20,
})

const colors = ['#396CFF', '#20C997', '#F59E0B', '#FF4C61', '#3B82F6']
const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2 - 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const total = computed(() => props.data.reduce((s, d) => s + d.amount, 0))

const formatTotal = computed(() => {
  if (total.value >= 10000) return (total.value / 10000).toFixed(1) + '万'
  return total.value.toLocaleString()
})

const segments = computed(() => {
  let offset = 0
  const gap = 3
  return props.data.map((d, i) => {
    const length = (d.percentage / 100) * circumference.value
    const segment = {
      color: colors[i % colors.length],
      dashArray: `${Math.max(0, length - gap)} ${circumference.value - Math.max(0, length - gap)}`,
      dashOffset: -offset,
    }
    offset += length
    return segment
  })
})
</script>

<style scoped>
.ring-label {
  font-size: 11px;
  fill: #8A9AC3;
  font-weight: 500;
}
.ring-value {
  font-size: 15px;
  fill: #1A2238;
  font-weight: 800;
  font-family: 'SF Mono', 'Menlo', Monaco, monospace;
}
</style>
