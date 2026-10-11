<template>
  <div ref="wrapRef" class="trend-chart">
    <!-- 无数据占位 -->
    <div v-if="!sortedRecords.length" class="chart-empty">暂无数据</div>
    <!-- 有数据：按 fields 配置动态渲染 1~N 个子图 -->
    <div v-else class="chart-grid">
      <div
        v-for="idx in subChartIndexes"
        :key="idx"
        :ref="(el) => setChartRef(idx, el)"
        class="chart-box"
        :style="{ height }"
      ></div>
    </div>
  </div>
</template>

<script>
// ==================== 模块级常量 ====================
// defineProps 的 default 工厂函数会被提升到 setup() 之外执行，
// 不能引用 <script setup> 里的局部变量，所以放普通 <script> 的模块作用域中
// chart：子图编号（同编号画进同一个子图）；axis：该子图内的左/右轴
// 默认字段=灯杆传感器数据；要增加子图/曲线，直接改这里即可
const DEFAULT_FIELDS = [
  { key: 'temperature', name: '温度', unit: '°C', chart: 1, axis: 'left' },
  { key: 'humidity', name: '湿度', unit: '%', chart: 1, axis: 'right' },
  { key: 'lightIllum', name: '光照', unit: 'lx', chart: 2, axis: 'left' },
  { key: 'voltage', name: '电压', unit: 'V', chart: 3, axis: 'left' },
  { key: 'current', name: '电流', unit: 'A', chart: 3, axis: 'right' }
]
const DEFAULT_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6']
</script>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import echarts from '@/utils/echarts'

const props = defineProps({
  // 历史记录数组，每条含 time 及 fields 里声明的字段，如 { time, temperature, pressure, flow }
  records: { type: Array, default: () => [] },
  // 曲线字段配置（不传则用上面的水循环默认配置）
  fields: { type: Array, default: () => DEFAULT_FIELDS },
  // 子图高度
  height: { type: String, default: '260px' }
})

const wrapRef = ref(null)
// chart 编号 → DOM 元素 / echarts 实例（子图数量由 fields 配置动态决定）
const chartRefs = {}
const chartInstances = {}
let resizeObserver = null

// 按时间升序排序（组件内部统一处理，父组件无需关心顺序）
const sortedRecords = computed(() =>
  [...props.records].sort((a, b) => new Date(a.time) - new Date(b.time))
)
// 需要渲染的子图编号列表（按 fields 里 chart 值去重升序）
const subChartIndexes = computed(() =>
  [...new Set(props.fields.map(f => f.chart || 1))].sort((a, b) => a - b)
)
// v-for 的 ref 回调：挂载时存元素，卸载时置空
const setChartRef = (idx, el) => {
  chartRefs[idx] = el
}

// 时间跨度 > 24h 时，x 轴标签只显示 月-日
const isLongSpan = computed(() => {
  const list = sortedRecords.value
  if (list.length < 2) return false
  return (new Date(list[list.length - 1].time) - new Date(list[0].time)) > 24 * 3600 * 1000
})

// 单位映射：tooltip 用
const unitMap = computed(() => {
  const map = {}
  props.fields.forEach(f => { map[f.name] = f.unit })
  return map
})

// 断点空值：时间间隔超过 3 倍正常间隔（且不小于 20 秒）时插入 null，曲线断开不连线
const insertNullGaps = (field) => {
  const list = sortedRecords.value
  if (!list.length) return []
  let avgInterval = 20
  if (list.length >= 2) {
    const span = (new Date(list[list.length - 1].time) - new Date(list[0].time)) / 1000
    avgInterval = span / (list.length - 1)
  }
  const gapThreshold = Math.max(avgInterval * 3, 20)
  const data = []
  for (let i = 0; i < list.length; i++) {
    data.push(parseFloat(list[i][field]))
    if (i < list.length - 1) {
      const gap = (new Date(list[i + 1].time) - new Date(list[i].time)) / 1000
      if (gap > gapThreshold) data.push(null)
    }
  }
  return data
}

// 生成某个子图的完整 option
const buildOption = (chartIdx) => {
  const fields = props.fields.filter(f => (f.chart || 1) === chartIdx)
  const timeData = sortedRecords.value.map(item => item.time)
  const leftFields = fields.filter(f => f.axis === 'left')
  const rightFields = fields.filter(f => f.axis === 'right')

  // ---- y 轴：子图内按左/右轴各自生成 ----
  const axisBase = {
    type: 'value',
    nameTextStyle: { color: '#64748b', fontSize: 11 },
    axisLine: { show: true, lineStyle: { color: '#cbd5e1' } },
    axisTick: { show: false },
    axisLabel: { color: '#64748b', fontSize: 11 }
  }
  const yAxis = []
  if (leftFields.length) {
    yAxis.push({
      ...axisBase,
      name: leftFields.map(f => `${f.name}(${f.unit})`).join(' / '),
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } }
    })
  }
  if (rightFields.length) {
    yAxis.push({
      ...axisBase,
      name: rightFields.map(f => `${f.name}(${f.unit})`).join(' / '),
      position: 'right',
      splitLine: { show: false }
    })
  }

  // ---- 曲线 series ----
  const series = fields.map((f, i) => {
    const color = f.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
    return {
      name: f.name,
      type: 'line',
      yAxisIndex: f.axis === 'right' ? 1 : 0,
      data: sortedRecords.value.length ? insertNullGaps(f.key) : [],
      smooth: true,
      sampling: 'lttb',
      symbol: 'none',
      color: color,
      connectNulls: false,
      lineStyle: { color, width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '1a' }, // 10% 透明度
          { offset: 1, color: color + '00' }
        ])
      }
    }
  })

  return {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 30, bottom: 40, left: 55 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#475569' },
      formatter: (params) => {
        let result = params[0].axisValue + '<br/>'
        params.forEach(item => {
          const unit = unitMap.value[item.seriesName] || ''
          result += `${item.marker} ${item.seriesName}: ${item.value}${unit}<br/>`
        })
        return result
      }
    },
    xAxis: {
      type: 'category',
      data: timeData,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        interval: 'auto',
        formatter: (value) => {
          const date = new Date(value)
          if (isLongSpan.value) {
            return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          }
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        }
      },
      splitLine: { show: false }
    },
    yAxis,
    series
  }
}

// 初始化 + 更新所有子图（按 fields 配置动态增减）
const updateCharts = () => {
  subChartIndexes.value.forEach((idx) => {
    const el = chartRefs[idx]
    if (!el) return
    if (!chartInstances[idx]) chartInstances[idx] = echarts.init(el)
    chartInstances[idx].setOption(buildOption(idx))
  })
  // 清理已不在配置里的旧实例
  Object.keys(chartInstances).forEach((idx) => {
    if (!subChartIndexes.value.includes(Number(idx))) {
      chartInstances[idx]?.dispose()
      delete chartInstances[idx]
    }
  })
}

// 容器尺寸变化时自适应（比 window resize 更精确）
const observeResize = () => {
  if (!wrapRef.value || typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => {
    Object.values(chartInstances).forEach((c) => c?.resize())
  })
  resizeObserver.observe(wrapRef.value)
}

// 数据变化 → 自动重绘（父组件直接改 records 数组即可）
// 必须等 nextTick：图表容器在 v-if/v-else 切换后才渲染，watch 触发时 ref 可能还是 null
watch(() => props.records, async () => {
  await nextTick()
  updateCharts()
}, { deep: true, immediate: true })

onMounted(() => {
  // 兜底：挂载完成后容器一定存在，确保首次初始化（数据已在则直接画图）
  updateCharts()
  observeResize()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  Object.values(chartInstances).forEach((c) => c?.dispose())
})
</script>

<style scoped>
.trend-chart {
  width: 100%;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 12px;
}

.chart-box {
  width: 100%;
  min-height: 200px;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 8px;
}
</style>
