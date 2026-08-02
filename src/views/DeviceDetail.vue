<template>
  <div class="device-detail-page">
    <div class="page-header">
      <div class="header-left">
        <el-button type="text" :icon="icons.ArrowLeft" @click="goBack">返回</el-button>
        <div class="title-group">
          <h1 class="page-title">{{ displayDevice.deviceId }}</h1>
          <span class="device-status" :class="isDataStale ? 'offline' : 'online'">
            {{ isDataStale ? '离线' : '在线' }}
          </span>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="sensor-grid">
        <div class="sensor-card">
          <div class="card-icon temperature">
            <component :is="icons.Thermometer" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.temperature }}<span class="unit">°C</span></div>
            <div class="card-label">温度</div>
          </div>
        </div>

        <div class="sensor-card">
          <div class="card-icon humidity">
            <component :is="icons.Droplets" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.humidity }}<span class="unit">%</span></div>
            <div class="card-label">湿度</div>
          </div>
        </div>

        <div class="sensor-card">
          <div class="card-icon light">
            <component :is="icons.Sunny" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.lightIllum }}<span class="unit">lx</span></div>
            <div class="card-label">光照强度</div>
          </div>
        </div>

        <div class="sensor-card">
          <div class="card-icon voltage">
            <component :is="icons.Zap" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.voltage }}<span class="unit">V</span></div>
            <div class="card-label">电压</div>
          </div>
        </div>

        <div class="sensor-card">
          <div class="card-icon current">
            <component :is="icons.Battery" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.current }}<span class="unit">A</span></div>
            <div class="card-label">电流</div>
          </div>
        </div>

      </div>

      <div class="video-section">
        <div class="section-header">
          <h3 class="section-title">视频监控</h3>
          <span class="video-status-text">
            <span class="status-dot" :class="{ active: isVideoPlaying }"></span>
            {{ isVideoPlaying ? '监控中' : '待开启' }}
          </span>
        </div>
        <div class="video-container">
          <img v-if="currentVideoFrame" :src="currentVideoFrame" class="video-frame" />
          <div v-else class="video-placeholder">
            <component :is="icons.Video" class="video-icon" />
            <span class="video-text">{{ isVideoPlaying ? '正在加载...' : '点击按钮开始监控' }}</span>
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Lightning, Warning, HotWater, Sunny,
  VideoCamera, VideoPlay, VideoPause
} from '@element-plus/icons-vue'
import { getRealTimeData, getVideoStream } from '../api/light'

const icons = {
  ArrowLeft,
  Thermometer: HotWater, Droplets: HotWater,
  Sunny, Zap: Lightning, Battery: Lightning, Lightbulb: Warning,
  Video: VideoCamera, Play: VideoPlay, Pause: VideoPause
}

const route = useRoute()
const router = useRouter()
const deviceId = ref('')
const device = ref({
  deviceId: '',
  temperature: 0,
  lightIllum: 0,
  humidity: 0,
  voltage: 0,
  current: 0,
  ledStatus: 0,
  time: ''
})

const isVideoPlaying = ref(false)
const currentVideoFrame = ref(null)
let videoInterval = null
let refreshInterval = null

const isDataStale = computed(() => {
  if (!device.value.time) return true
  return (Date.now() - new Date(device.value.time)) > 8 * 1000
})

const displayDevice = computed(() => {
  if (isDataStale.value) {
    return {
      deviceId: device.value.deviceId || deviceId.value,
      temperature: 0,
      humidity: 0,
      lightIllum: 0,
      voltage: 0,
      current: 0,
      ledStatus: 0,
      time: device.value.time
    }
  }
  return device.value
})

const goBack = () => {
  router.push('/devices')
}

const loadDeviceData = async () => {
  if (!deviceId.value) {
    device.value = { deviceId: '', temperature: 0, humidity: 0, lightIllum: 0, voltage: 0, current: 0, ledStatus: 0, time: '' }
    return
  }
  device.value = await getRealTimeData(deviceId.value)
}

const startRefresh = () => {
  if (refreshInterval) return
  refreshInterval = setInterval(() => {
    loadDeviceData()
  }, 3000)
}

const stopRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

const toggleVideo = () => {
  if (isVideoPlaying.value) {
    stopVideo()
  } else {
    startVideo()
  }
}

const startVideo = async () => {
  isVideoPlaying.value = true
  const streamUrl = await getVideoStream(deviceId.value)
  if (!streamUrl) {
    isVideoPlaying.value = false
    ElMessage.warning('视频流连接失败，请检查设备或网络')
    return
  }
  currentVideoFrame.value = streamUrl

  if (streamUrl.startsWith('data:')) {
    videoInterval = setInterval(async () => {
      const frame = await getVideoStream(deviceId.value)
      if (!frame) {
        stopVideo()
        ElMessage.warning('视频流已断开')
        return
      }
      currentVideoFrame.value = frame
    }, 1000)
  }
}

const stopVideo = () => {
  isVideoPlaying.value = false
  if (videoInterval) {
    clearInterval(videoInterval)
    videoInterval = null
  }
  currentVideoFrame.value = null
}

watch(() => route.params.id, (newId) => {
  stopVideo()
  deviceId.value = newId
  loadDeviceData()
})

onMounted(() => {
  deviceId.value = route.params.id
  loadDeviceData()
  startRefresh()
})

onUnmounted(() => {
  stopRefresh()
  stopVideo()
})
</script>

<style scoped>
.device-detail-page {
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
  align-items: center;
  gap: 16px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.device-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.device-status.online {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.device-status.offline {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 24px;
  align-items: start;
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.sensor-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.card-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f1f5f9;
  color: #64748b;
}

.card-icon.temperature {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.card-icon.humidity {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.card-icon.light {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.card-icon.voltage {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.card-icon.current {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.card-icon.led {
  background: rgba(74, 108, 247, 0.1);
  color: #4a6cf7;
}

.card-icon.led.active {
  color: #f59e0b;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.card-value .unit {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
  margin-left: 4px;
}

.card-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
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
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.video-status-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-dot.active {
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.video-container {
  background: #0f172a;
  border-radius: 8px;
  flex: 1;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.video-frame {
  position: absolute;
  inset: 0;
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

@media (max-width: 1000px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .video-container {
    min-height: 260px;
  }
}

@media (max-width: 768px) {
  .device-detail-page {
    padding: 16px;
  }

  .sensor-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .sensor-card {
    padding: 14px;
  }

  .card-icon {
    width: 40px;
    height: 40px;
  }

  .video-container {
    min-height: 220px;
  }
}
</style>
