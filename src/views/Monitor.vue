<template>
  <div class="monitor-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">实时监控</h1>
        <p class="page-subtitle">实时监测所有设备状态</p>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          :icon="icons.Pause"
          @click="toggleAutoRefresh"
        >
          {{ isAutoRefresh ? '暂停刷新' : '开启刷新' }}
        </el-button>
      </div>
    </div>
    
    <div class="monitor-grid">
      <div class="main-panel">
        <div class="panel-header">
          <h2 class="panel-title">设备实时状态</h2>
          <div class="device-tabs">
            <el-button 
              v-for="d in devices" 
              :key="d.deviceId"
              class="tab-btn"
              :class="{ active: activeDevice === d.deviceId }"
              @click="activeDevice = d.deviceId; handleDeviceChange()"
            >
              {{ d.deviceId }}
            </el-button>
          </div>
        </div>
        
        <div class="sensor-panel">
          <div class="sensor-row">
            <div class="sensor-item">
              <div class="sensor-icon temp">
                <component :is="icons.Thermometer" />
              </div>
              <div class="sensor-info">
                <span class="sensor-label">温度</span>
                <span class="sensor-value">{{ currentDevice.temperature }}°C</span>
              </div>
              <div class="sensor-bar">
                <div class="bar-fill" :style="{ width: (currentDevice.temperature / 40 * 100) + '%' }"></div>
              </div>
            </div>
            
            <div class="sensor-item">
              <div class="sensor-icon humi">
                <component :is="icons.Droplets" />
              </div>
              <div class="sensor-info">
                <span class="sensor-label">湿度</span>
                <span class="sensor-value">{{ currentDevice.humidity }}%</span>
              </div>
              <div class="sensor-bar">
                <div class="bar-fill humi" :style="{ width: currentDevice.humidity + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="sensor-row">
            <div class="sensor-item">
              <div class="sensor-icon light">
                <component :is="icons.Sunny" />
              </div>
              <div class="sensor-info">
                <span class="sensor-label">光照</span>
                <span class="sensor-value">{{ currentDevice.lightIllum }}lx</span>
              </div>
              <div class="sensor-bar">
                <div class="bar-fill light" :style="{ width: (currentDevice.lightIllum / 1000 * 100) + '%' }"></div>
              </div>
            </div>
            
            <div class="sensor-item">
              <div class="sensor-icon volt">
                <component :is="icons.Zap" />
              </div>
              <div class="sensor-info">
                <span class="sensor-label">电压</span>
                <span class="sensor-value">{{ currentDevice.voltage }}V</span>
              </div>
              <div class="sensor-bar">
                <div class="bar-fill volt" :style="{ width: ((currentDevice.voltage - 220) / 20 * 100) + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="sensor-row">
            <div class="sensor-item">
              <div class="sensor-icon curr">
                <component :is="icons.Battery" />
              </div>
              <div class="sensor-info">
                <span class="sensor-label">电流</span>
                <span class="sensor-value">{{ currentDevice.current }}A</span>
              </div>
              <div class="sensor-bar">
                <div class="bar-fill curr" :style="{ width: (currentDevice.current / 0.5 * 100) + '%' }"></div>
              </div>
            </div>
            
            <div class="sensor-item">
              <div class="sensor-icon led">
                <component :is="icons.Lightbulb" :class="{ active: currentDevice.ledStatus === 1 }" />
              </div>
              <div class="sensor-info">
                <span class="sensor-label">LED</span>
                <span class="sensor-value" :class="currentDevice.ledStatus === 1 ? 'on' : 'off'">
                  {{ currentDevice.ledStatus === 1 ? '开启' : '关闭' }}
                </span>
              </div>
              <div class="sensor-bar">
                <div class="bar-fill led" :style="{ width: (currentDevice.ledStatus * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chart-panel">
          <div class="panel-header">
            <h3 class="panel-title">实时趋势</h3>
          </div>
          <div class="chart-wrapper">
            <div v-if="chartData.times.length === 0" class="chart-empty">
              <component :is="icons.LineChart" class="empty-icon" />
              <p class="empty-text">暂无数据</p>
              <p class="empty-hint">当前设备无实时数据</p>
            </div>
            <div ref="chartRef" class="chart-container"></div>
          </div>
        </div>
      </div>
      
      <div class="side-panel">
      <div class="video-section">
        <div class="section-header">
          <h3 class="section-title">视频监控</h3>
          <select class="device-select" v-model="videoDevice">
            <option v-for="d in devices" :key="d.deviceId" :value="d.deviceId">
              {{ d.deviceId }}
            </option>
          </select>
        </div>
        <div class="video-container">
          <img v-if="currentVideoFrame" :src="currentVideoFrame" class="video-frame" />
          <div v-else class="video-placeholder">
            <component :is="icons.Video" class="video-icon" />
            <span class="video-text">{{ isVideoPlaying ? '正在加载视频流...' : '点击开始监控' }}</span>
          </div>
          <div class="video-controls">
            <button class="control-btn" @click="toggleVideo">
              <component :is="isVideoPlaying ? icons.Pause : icons.Play" />
            </button>
          </div>
        </div>
      </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { VideoPause, HotWater, Sunny, Lightning, Camera, VideoPlay, Warning, RefreshRight } from '@element-plus/icons-vue'
import { getDeviceList, getRealTimeData, getVideoStream } from '../api/light'

const icons = { Pause: VideoPause, Thermometer: HotWater, Droplets: HotWater, Sunny, Zap: Lightning, Battery: Lightning, Lightbulb: Warning, Video: Camera, Play: VideoPlay, Refresh: RefreshRight, LineChart: Sunny }

const devices = ref([])
const activeDevice = ref('light_01')
const isAutoRefresh = ref(true)
const videoDevice = ref('light_01')
const isVideoPlaying = ref(false)
const currentVideoFrame = ref(null)
const chartRef = ref(null)
let chartInstance = null
let refreshInterval = null
let videoInterval = null

const deviceData = ref({})

const currentDevice = computed(() => {
  return deviceData.value[activeDevice.value] || {
    temperature: 0,
    humidity: 0,
    lightIllum: 0,
    voltage: 0,
    current: 0,
    ledStatus: 0,
    updateTime: ''
  }
})

const toggleAutoRefresh = () => {
  isAutoRefresh.value = !isAutoRefresh.value
  if (isAutoRefresh.value) {
    startRefresh()
  } else {
    stopRefresh()
  }
}

const startRefresh = () => {
  if (refreshInterval) return
  refreshInterval = setInterval(() => {
    loadRealTimeData()
  }, 3000)
}

const stopRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

const loadDevices = async () => {
  const list = await getDeviceList()
  devices.value = list
  if (list.length > 0) {
    activeDevice.value = list[0].deviceId
    videoDevice.value = list[0].deviceId
  }
}

const loadRealTimeData = async () => {
  const result = await getRealTimeData(activeDevice.value)
  deviceData.value[activeDevice.value] = result
  updateChart()
}

const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const chartData = ref({
  times: [],
  temps: [],
  humis: []
})

const updateChart = () => {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  
  const current = currentDevice.value
  const temp = parseFloat(current.temperature)
  const humi = parseFloat(current.humidity)
  
  if (!temp && !humi) {
    return
  }
  
  chartData.value.times.push(timeStr)
  chartData.value.temps.push(temp || null)
  chartData.value.humis.push(humi || null)
  
  if (chartData.value.times.length > 20) {
    chartData.value.times.shift()
    chartData.value.temps.shift()
    chartData.value.humis.shift()
  }
  
  const times = chartData.value.times
  const temps = chartData.value.temps
  const humis = chartData.value.humis
  
  const option = {
    backgroundColor: 'transparent',
    grid: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 50
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b' },
      axisPointer: { type: 'cross', lineStyle: { color: '#94a3b8' } }
    },
    legend: {
      data: ['温度', '湿度'],
      top: 0,
      textStyle: { color: '#64748b' }
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '温度(°C)',
        min: 20,
        max: 30,
        axisLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      {
        type: 'value',
        name: '湿度(%)',
        min: 50,
        max: 70,
        axisLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '温度',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#ef4444', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
          ])
        },
        data: temps
      },
      {
        name: '湿度',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#3b82f6', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        },
        data: humis
      }
    ]
  }
  
  chartInstance.setOption(option)
}

// 视频流控制
const toggleVideo = () => {
  if (isVideoPlaying.value) {
    stopVideo()
  } else {
    startVideo()
  }
}

const startVideo = async () => {
  isVideoPlaying.value = true
  const result = await getVideoStream(videoDevice.value)
  if (!result.data) {
    isVideoPlaying.value = false
    ElMessage.warning('视频流连接失败，请检查设备或网络')
    return
  }
  currentVideoFrame.value = result.data
  videoInterval = setInterval(async () => {
    const result = await getVideoStream(videoDevice.value)
    if (!result.data) {
      stopVideo()
      ElMessage.warning('视频流已断开')
      return
    }
    currentVideoFrame.value = result.data
  }, 1000)
}

const stopVideo = () => {
  isVideoPlaying.value = false
  if (videoInterval) {
    clearInterval(videoInterval)
    videoInterval = null
  }
  currentVideoFrame.value = null
}

const handleDeviceChange = () => {
  chartData.value = { times: [], temps: [], humis: [] }
  loadRealTimeData()
}

onMounted(async () => {
  await loadDevices()
  loadRealTimeData()
  startRefresh()
  initChart()
  
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

onUnmounted(() => {
  stopRefresh()
  stopVideo()
  chartInstance?.dispose()
})
</script>

<style scoped>
.monitor-page {
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

.monitor-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.main-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.device-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #4a6cf7;
  color: #fff;
}

.sensor-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.sensor-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.sensor-row:not(:last-child) {
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 16px;
}

.sensor-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 10px;
}

.sensor-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.sensor-icon.temp {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.sensor-icon.humi {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.sensor-icon.light {
  background: rgba(234, 179, 8, 0.1);
  color: #eab308;
}

.sensor-icon.volt {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.sensor-icon.curr {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.sensor-icon.led {
  background: rgba(74, 108, 247, 0.1);
  color: #4a6cf7;
}

.sensor-icon.led.active {
  color: #fbbf24;
}

.sensor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sensor-label {
  font-size: 12px;
  color: #94a3b8;
}

.sensor-value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-top: 2px;
}

.sensor-value.on {
  color: #10b981;
}

.sensor-value.off {
  color: #94a3b8;
}

.sensor-bar {
  width: 100px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #f87171);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.bar-fill.humi {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.bar-fill.light {
  background: linear-gradient(90deg, #eab308, #facc15);
}

.bar-fill.volt {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.bar-fill.curr {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

.bar-fill.led {
  background: linear-gradient(90deg, #4a6cf7, #7c93e6);
}

.chart-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.chart-wrapper {
  position: relative;
  height: 300px;
}

.chart-container {
  height: 100%;
}

.chart-empty {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background: #fff;
}

.chart-empty .empty-icon {
  width: 48px;
  height: 48px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.chart-empty .empty-text {
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  margin: 0 0 8px;
}

.chart-empty .empty-hint {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-section {
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
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin: 0;
}

.device-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #475569;
  background: #f8fafc;
}

.video-container {
  background: #0f172a;
  border-radius: 8px;
  height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.video-frame {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #475569;
}

.video-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.video-text {
  font-size: 13px;
}

.video-controls {
  position: absolute;
  bottom: 12px;
  display: flex;
  gap: 12px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

@media (max-width: 1200px) {
  .monitor-grid {
    grid-template-columns: 1fr;
  }
  
  .side-panel {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .video-section {
    flex: 1;
    min-width: 280px;
  }
}

@media (max-width: 768px) {
  .monitor-page {
    padding: 16px;
  }
  
  .sensor-row {
    grid-template-columns: 1fr;
  }
  
  .side-panel {
    flex-direction: column;
  }
}
</style>
