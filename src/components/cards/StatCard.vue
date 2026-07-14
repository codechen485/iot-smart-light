<template>
  <div class="stat-card">
    <div class="card-header">
      <component :is="icon" class="card-icon" :class="iconClass" />
      <span class="card-title">{{ title }}</span>
    </div>
    <div class="card-body">
      <div class="card-value">{{ displayValue }}</div>
      <div class="card-unit">{{ unit }}</div>
    </div>
    <div v-if="trend" class="card-footer">
      <span class="trend" :class="trendClass">
        <component :is="trendIcon" />
        {{ trend }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

const props = defineProps({
  title: String,
  value: [Number, String],
  unit: String,
  icon: Object,
  iconClass: {
    type: String,
    default: ''
  },
  trend: String
})

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

const trendClass = computed(() => {
  if (!props.trend) return ''
  if (props.trend.startsWith('+')) return 'up'
  if (props.trend.startsWith('-')) return 'down'
  return ''
})

const trendIcon = computed(() => {
  if (!props.trend) return null
  if (props.trend.startsWith('+')) return ArrowUp
  if (props.trend.startsWith('-')) return ArrowDown
  return Minus
})
</script>

<style scoped>
.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.card-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon.blue {
  background: rgba(74, 108, 247, 0.1);
  color: #4a6cf7;
}

.card-icon.green {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.card-icon.orange {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.card-icon.red {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.card-title {
  font-size: 13px;
  color: #64748b;
}

.card-body {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
}

.card-unit {
  font-size: 14px;
  color: #64748b;
}

.card-footer {
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend.up {
  color: #10b981;
}

.trend.down {
  color: #ef4444;
}
</style>
