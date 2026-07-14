<template>
  <div class="device-card" @click="$emit('click')">
    <div class="card-header">
      <div class="device-icon-wrapper">
        <component :is="icons.Lightbulb" class="device-icon" :class="{ active: device.ledStatus === 1 }" />
        <span class="status-indicator" :class="device.ledStatus === 1 ? 'online' : 'offline'"></span>
      </div>
      <div class="device-info">
        <h3 class="device-name">{{ device.deviceId }}</h3>
        <p class="device-status">{{ device.ledStatus === 1 ? 'LED开启' : 'LED关闭' }}</p>
      </div>
    </div>
    
    <div class="card-body">
      <div class="sensor-grid">
        <div class="sensor-item">
          <component :is="icons.Thermometer" class="sensor-icon" />
          <span class="sensor-value">{{ device.temperature }}°C</span>
        </div>
        <div class="sensor-item">
          <component :is="icons.Droplets" class="sensor-icon" />
          <span class="sensor-value">{{ device.humidity }}%</span>
        </div>
        <div class="sensor-item">
          <component :is="icons.Sunny" class="sensor-icon" />
          <span class="sensor-value">{{ device.lightIllum }}lx</span>
        </div>
        <div class="sensor-item">
          <component :is="icons.Zap" class="sensor-icon" />
          <span class="sensor-value">{{ device.voltage }}V</span>
        </div>
      </div>
    </div>
    
    <div class="card-footer">
      <span class="update-time">{{ device.time }}</span>
      <button class="control-btn" @click.stop="$emit('control')">
        <component :is="device.ledStatus === 1 ? icons.PowerOff : icons.Power" />
        <span>{{ device.ledStatus === 1 ? '关闭' : '开启' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { 
  Lightning, 
  HotWater, 
  Sunny, 
  Warning 
} from '@element-plus/icons-vue'

defineProps({
  device: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'control'])

const icons = {
  Lightbulb: Lightning,
  Thermometer: HotWater,
  Droplets: HotWater,
  Sunny,
  Zap: Lightning,
  Power: Lightning,
  PowerOff: Warning
}
</script>

<style scoped>
.device-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
}

.device-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.device-icon-wrapper {
  position: relative;
}

.device-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(74, 108, 247, 0.1);
  color: #4a6cf7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.device-icon.active {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.status-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.status-indicator.online {
  background: #10b981;
}

.status-indicator.offline {
  background: #94a3b8;
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.device-status {
  font-size: 12px;
  color: #94a3b8;
  margin: 4px 0 0;
}

.card-body {
  margin-bottom: 16px;
}

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.sensor-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.sensor-icon {
  width: 24px;
  height: 24px;
  color: #64748b;
}

.sensor-value {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.update-time {
  font-size: 12px;
  color: #94a3b8;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  opacity: 0.8;
}

.control-btn:has(.active) {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.control-btn:not(:has(.active)) {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
</style>
