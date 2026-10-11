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
            <div class="card-value">{{ displayDevice.temperature !== null ? displayDevice.temperature : '--' }}<span class="unit">°C</span></div>
            <div class="card-label">温度</div>
          </div>
        </div>

        <div class="sensor-card">
          <div class="card-icon humidity">
            <component :is="icons.Droplets" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.humidity !== null ? displayDevice.humidity : '--' }}<span class="unit">%</span></div>
            <div class="card-label">湿度</div>
          </div>
        </div>

        <div class="sensor-card">
          <div class="card-icon light">
            <component :is="icons.Sunny" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.lightIllum !== null ? displayDevice.lightIllum : '--' }}<span class="unit">lx</span></div>
            <div class="card-label">光照强度</div>
          </div>
        </div>

        <div class="sensor-card">
          <div class="card-icon voltage">
            <component :is="icons.Zap" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.voltage !== null ? displayDevice.voltage : '--' }}<span class="unit">V</span></div>
            <div class="card-label">电压</div>
          </div>
        </div>

        <div class="sensor-card">
          <div class="card-icon current">
            <component :is="icons.Battery" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.current !== null ? displayDevice.current : '--' }}<span class="unit">A</span></div>
            <div class="card-label">电流</div>
          </div>
        </div>

        <div class="sensor-card">
          <div class="card-icon led" :class="{ active: displayDevice.ledStatus === 1 }">
            <component :is="icons.Lightbulb" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ displayDevice.ledStatus === 1 ? '开启' : '关闭' }}</div>
            <div class="card-label">LED状态</div>
          </div>
        </div>
      </div>

      <div class="control-panel">
        <div class="section-header">
          <h3 class="section-title">设备控制</h3>
        </div>

        <div class="control-content">
          <div class="mode-switch">
            <span class="control-label">运行模式</span>
            <el-radio-group v-model="currentMode" :disabled="isDataStale" @change="handleModeChange">
              <el-radio-button value="manual">手动</el-radio-button>
              <el-radio-button value="auto">自动</el-radio-button>
            </el-radio-group>
          </div>

          <div class="led-control">
            <template v-if="currentMode === 'manual'">
              <div class="control-row">
                <span class="control-label">LED 开关</span>
                <el-switch
                  :model-value="displayDevice.ledStatus === 1"
                  :disabled="isDataStale"
                  @change="handleLedToggle"
                  active-color="#3b82f6"
                  inactive-color="#cbd5e1"
                />
              </div>
              <div class="control-row">
                <span class="control-label">当前亮度</span>
                <span class="brightness-value">{{ displayDevice.pwmLevel || (displayDevice.ledStatus === 1 ? 100 : 0) }}%</span>
              </div>
            </template>

            <template v-else>
              <div class="auto-mode-info">
                <span class="control-label">PWM 亮度挡位</span>
                <el-progress :percentage="displayDevice.pwmLevel || 0" :stroke-width="12" :color="'#3b82f6'" />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import { ArrowLeft, Lightning, HotWater, Sunny } from '@element-plus/icons-vue'
import { getRealTimeData, controlDevice } from '../api/light'

const icons = {
  ArrowLeft,
  Thermometer: HotWater, Droplets: HotWater,
  Sunny, Zap: Lightning, Battery: Lightning, Lightbulb: Lightning
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
  mode: 'manual',
  pwmLevel: 0,
  time: ''
})
const currentMode = ref('manual')

let refreshInterval = null

const isDataStale = computed(() => {
  if (!device.value.time) return true
  return (Date.now() - new Date(device.value.time)) > 50 * 1000
})

const displayDevice = computed(() => {
  if (isDataStale.value) {
    return {
      deviceId: device.value.deviceId || deviceId.value,
      temperature: null,
      humidity: null,
      lightIllum: null,
      voltage: null,
      current: null,
      ledStatus: 0,
      mode: device.value.mode,
      pwmLevel: 0,
      time: device.value.time
    }
  }
  return device.value
})

const goBack = () => {
  router.push('/devices')
}

const isControlling = ref(false)

const loadDeviceData = async () => {
  if (!deviceId.value) {
    device.value = { deviceId: '', temperature: 0, humidity: 0, lightIllum: 0, voltage: 0, current: 0, ledStatus: 0, mode: 'manual', pwmLevel: 0, TJ: '0', HJ: '0', GJ: '0', DJ: '0', DL: '0', time: '' }
    return
  }
  const data = await getRealTimeData(deviceId.value)
  if (!isControlling.value) {
    device.value = data
    currentMode.value = data.mode || 'manual'
  }
  checkAlerts(data)
}

// 告警类型名映射
const alarmConfig = {
  TJ: { name: '温度告警', field: 'temperature', unit: '°C' },
  HJ: { name: '湿度告警', field: 'humidity', unit: '%' },
  GJ: { name: '光照告警', field: 'lightIllum', unit: 'lx' },
  DJ: { name: '电压告警', field: 'voltage', unit: 'V' },
  DL: { name: '电流告警', field: 'current', unit: 'A' }
}

const alarmCooling = {}

const playAlarmSound = async () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = 800
    oscillator.type = 'square'
    gainNode.gain.value = 0.3
    oscillator.start()
    setTimeout(() => {
      oscillator.stop()
      ctx.close()
    }, 3000)
  } catch (e) {
    // 音频不支持时静默
  }
}

const showAlarm = (key, cfg, data) => {
  const value = data[cfg.field]
  ElNotification({
    title: `${data.deviceId} — ${cfg.name}`,
    message: `当前值 ${value}${cfg.unit}，超出阈值范围`,
    type: 'error',
    duration: 10000,
    position: 'top-right'
  })
  playAlarmSound()
  alarmCooling[key] = { coolEndTime: Date.now() + 60000, isStillAlerting: true }
}

const checkAlerts = (data) => {
  const now = Date.now()
  const keys = ['TJ', 'HJ', 'GJ', 'DJ', 'DL']
  keys.forEach(key => {
    if (data[key] !== '1') {
      if (alarmCooling[key] && !alarmCooling[key].isStillAlerting) {
        delete alarmCooling[key]
      }
      return
    }
    const cfg = alarmConfig[key]
    const cooling = alarmCooling[key]
    if (cooling) {
      if (now < cooling.coolEndTime) {
        cooling.isStillAlerting = true
        return
      }
      if (cooling.isStillAlerting) {
        showAlarm(key, cfg, data)
        return
      }
    }
    showAlarm(key, cfg, data)
  })
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

const handleModeChange = async (mode) => {
  if (isDataStale.value) {
    ElMessage.warning('设备离线，无法切换模式')
    currentMode.value = device.value.mode || 'manual'
    return
  }
  const previousMode = device.value.mode
  device.value.mode = mode
  isControlling.value = true
  try {
    await controlDevice({ deviceId: deviceId.value, cmd: mode === 'auto' ? 'modeAuto' : 'modeManual' })
  } catch (error) {
    device.value.mode = previousMode
    currentMode.value = previousMode
    ElMessage.error('模式切换失败')
  } finally {
    isControlling.value = false
  }
}

const handleLedToggle = async (val) => {
  if (isDataStale.value) {
    ElMessage.warning('设备离线，无法控制')
    return
  }
  const newStatus = val ? 1 : 0
  const previousStatus = device.value.ledStatus
  device.value.ledStatus = newStatus
  isControlling.value = true
  try {
    await controlDevice({ deviceId: deviceId.value, cmd: newStatus === 1 ? 'ledOn' : 'ledOff' })
  } catch (error) {
    device.value.ledStatus = previousStatus
    ElMessage.error('控制失败，设备无响应')
  } finally {
    isControlling.value = false
  }
}

watch(() => route.params.id, (newId) => {
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
  grid-template-columns: 1fr 420px;
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
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.card-icon.led.active {
  background: rgba(245, 158, 11, 0.1);
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

.control-panel {
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
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.control-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.mode-switch {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.led-control {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brightness-value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.auto-mode-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auto-mode-info .control-label {
  margin-bottom: 4px;
}

@media (max-width: 1000px) {
  .detail-grid {
    grid-template-columns: 1fr;
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
}
</style>
