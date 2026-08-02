<template>
  <div class="history-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">历史查询</h1>
        <p class="page-subtitle">查询传感器历史数据与趋势</p>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-bar">
        <el-select v-model="filterDevice" placeholder="选择设备" class="filter-select">
          <el-option v-for="d in devices" :key="d.deviceId" :label="d.deviceId" :value="d.deviceId" />
        </el-select>

        <el-select v-model="timeRange" class="filter-select" style="width: 90px" @change="handleTimeRangeChange">
          <el-option label="1小时" value="1h" />
          <el-option label="6小时" value="6h" />
          <el-option label="24小时" value="24h" />
          <el-option label="7天" value="7d" />
        </el-select>

        <el-date-picker
          v-model="startTime"
          type="datetime"
          placeholder="开始时间"
          class="date-picker"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
        <span class="range-separator">至</span>
        <el-date-picker
          v-model="endTime"
          type="datetime"
          placeholder="结束时间"
          class="date-picker"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />

        <el-button type="primary" @click="loadHistory">查询</el-button>
      </div>
    </div>

    <div class="content-row">
      <div class="section chart-section">
        <div class="section-header">
          <h2 class="section-title">传感数据曲线</h2>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>

      <div class="section table-section">
        <div class="section-header">
          <h2 class="section-title">传感器数据列表</h2>
        </div>
        <div class="table-container">
          <el-table
            :data="historyData"
            border
            size="small"
            :header-cell-style="{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 500 }"
          >
            <el-table-column prop="time" label="时间" width="145" />
            <el-table-column prop="temperature" label="温度(°C)" min-width="70" />
            <el-table-column prop="humidity" label="湿度(%)" min-width="70" />
            <el-table-column prop="lightIllum" label="光照(lx)" min-width="70" />
            <el-table-column prop="voltage" label="电压(V)" min-width="70" />
            <el-table-column prop="current" label="电流(A)" min-width="70" />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getDeviceList, getHistoryData } from '../api/light'

const devices = ref([])
const filterDevice = ref('')
const timeRange = ref('24h')
const startTime = ref('')
const endTime = ref('')
const chartRef = ref(null)
let chartInstance = null
const historyData = ref([])

const loadDevices = async () => {
  const list = await getDeviceList()
  devices.value = list
  if (list.length > 0 && !filterDevice.value) {
    filterDevice.value = list[0].deviceId
  }
}

const formatLocalTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const loadHistoryData = async (customStartTime = null, customEndTime = null) => {
  let end, start
  if (customStartTime && customEndTime) {
    start = customStartTime
    end = customEndTime
  } else {
    end = formatLocalTime(new Date())
    const ranges = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 7 * 24
    }
    const hours = ranges[timeRange.value] || 24
    start = formatLocalTime(new Date(Date.now() - hours * 60 * 60 * 1000))
  }
  startTime.value = start
  endTime.value = end

  if (!filterDevice.value) {
    ElMessage.warning('请先选择设备')
    return
  }

  historyData.value = await getHistoryData({
    deviceId: filterDevice.value,
    startTime: start,
    endTime: end
  })
}

const handleTimeRangeChange = () => {
  startTime.value = ''
  endTime.value = ''
}

const initChart = () => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const sorted = [...historyData.value].sort((a, b) => new Date(a.time) - new Date(b.time))
  const timeData = sorted.map(item => item.time)

  let isLongSpan = false
  if (timeData.length >= 2) {
    const first = new Date(timeData[0])
    const last = new Date(timeData[timeData.length - 1])
    isLongSpan = (last - first) / (1000 * 60 * 60) > 24
  }

  const option = {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 30, bottom: 40, left: 55 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#475569' },
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>'
        params.forEach(item => {
          const unit = item.seriesName === '温度' ? '°C' : '%'
          result += `${item.marker} ${item.seriesName}: ${item.value}${unit}<br/>`
        })
        return result
      }
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: function(value) {
          const date = new Date(value)
          if (isLongSpan) {
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            const day = date.getDate().toString().padStart(2, '0')
            return `${month}-${day}`
          }
          const hoursStr = date.getHours().toString().padStart(2, '0')
          const minutes = date.getMinutes().toString().padStart(2, '0')
          return `${hoursStr}:${minutes}`
        }
      },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '温度(°C) / 湿度(%)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLine: { show: true, lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } }
    },
    series: [
      {
        name: '温度',
        type: 'line',
        data: timeData.length > 0 ? sorted.map(item => [item.time, parseFloat(item.temperature)]) : [],
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#ef4444', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.1)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0)' }
          ])
        }
      },
      {
        name: '湿度',
        type: 'line',
        data: timeData.length > 0 ? sorted.map(item => [item.time, parseFloat(item.humidity)]) : [],
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#3b82f6', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.1)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' }
          ])
        }
      }
    ]
  }
  chartInstance.setOption(option)
}

const loadHistory = async () => {
  if (!filterDevice.value) {
    ElMessage.warning('请先选择设备')
    return
  }
  const datePicked = startTime.value && endTime.value
  await loadHistoryData(
    datePicked ? startTime.value : null,
    datePicked ? endTime.value : null
  )
  initChart()
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(async () => {
  await loadDevices()
  loadHistory()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.history-page {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.filter-select {
  width: 150px;
}

.date-picker {
  width: 170px;
}

.range-separator {
  color: #94a3b8;
  font-size: 13px;
}

.content-row {
  display: grid;
  grid-template-columns: 5fr 4fr;
  gap: 24px;
}

.section {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.chart-container {
  height: 360px;
}

.table-section {
  min-width: 0;
}

.table-container {
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 1200px) {
  .content-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .history-page {
    padding: 16px;
  }

  .filter-bar {
    flex-wrap: wrap;
  }
}
</style>
