<template>
  <div class="device-detail-page">
    <div class="page-header">
      <div class="header-left">
        <el-button type="text" :icon="icons.ArrowLeft" @click="goBack">返回</el-button>
        <div class="title-group">
          <h1 class="page-title">{{ device.deviceId }}</h1>
          <span class="device-status" :class="device.ledStatus === 1 ? 'online' : 'offline'">
            {{ device.ledStatus === 1 ? '运行中' : '已关闭' }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <el-button 
          :type="device.ledStatus === 1 ? 'danger' : 'primary'" 
          :icon="device.ledStatus === 1 ? icons.PowerOff : icons.Power"
          @click="handleControl"
        >
          {{ device.ledStatus === 1 ? '关闭LED' : '开启LED' }}
        </el-button>
      </div>
    </div>
    
    <div class="sensor-grid">
      <div class="sensor-card">
        <div class="card-icon temperature">
          <component :is="icons.Thermometer" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ device.temperature }}<span class="unit">°C</span></div>
          <div class="card-label">温度</div>
        </div>
      </div>
      
      <div class="sensor-card">
        <div class="card-icon humidity">
          <component :is="icons.Droplets" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ device.humidity }}<span class="unit">%</span></div>
          <div class="card-label">湿度</div>
        </div>
      </div>
      
      <div class="sensor-card">
        <div class="card-icon light">
          <component :is="icons.Sunny" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ device.lightIllum }}<span class="unit">lx</span></div>
          <div class="card-label">光照强度</div>
        </div>
      </div>
      
      <div class="sensor-card">
        <div class="card-icon voltage">
          <component :is="icons.Zap" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ device.voltage }}<span class="unit">V</span></div>
          <div class="card-label">电压</div>
        </div>
      </div>
      
      <div class="sensor-card">
        <div class="card-icon current">
          <component :is="icons.Battery" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ device.current }}<span class="unit">A</span></div>
          <div class="card-label">电流</div>
        </div>
      </div>
      
      <div class="sensor-card">
        <div class="card-icon led">
          <component :is="icons.Lightbulb" :class="{ active: device.ledStatus === 1 }" />
        </div>
        <div class="card-content">
          <div class="card-value">{{ device.ledStatus === 1 ? '开启' : '关闭' }}</div>
          <div class="card-label">LED状态</div>
        </div>
      </div>
    </div>
    
    <div class="section-row">
      <div class="section history-section">
        <div class="section-header">
          <h2 class="section-title">历史趋势</h2>
          <div class="time-filter">
            <el-select v-model="timeRange" class="filter-select" @change="loadHistory">
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
            <el-button size="small" type="primary" @click="loadCustomHistory">查询</el-button>
          </div>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>
      
      <div class="section alert-section">
        <div class="section-header">
          <h2 class="section-title">告警阈值设置</h2>
        </div>
        <div class="threshold-card">
          <div class="threshold-form">
            <div class="form-group">
              <label class="form-label">温度阈值</label>
              <div class="range-input">
                <el-input-number v-model="thresholds.tempMin" :min="-40" :max="100" />
                <span class="range-text">~</span>
                <el-input-number v-model="thresholds.tempMax" :min="-40" :max="100" />
                <span class="unit">°C</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">湿度阈值</label>
              <div class="range-input">
                <el-input-number v-model="thresholds.humidityMin" :min="0" :max="100" />
                <span class="range-text">~</span>
                <el-input-number v-model="thresholds.humidityMax" :min="0" :max="100" />
                <span class="unit">%</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">光照阈值</label>
              <div class="range-input">
                <el-input-number v-model="thresholds.lightMin" :min="0" :max="10000" />
                <span class="range-text">~</span>
                <el-input-number v-model="thresholds.lightMax" :min="0" :max="10000" />
                <span class="unit">lx</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">电压阈值</label>
              <div class="range-input">
                <el-input-number v-model="thresholds.voltageMin" :min="0" :max="24" step="0.1" />
                <span class="range-text">~</span>
                <el-input-number v-model="thresholds.voltageMax" :min="0" :max="24" step="0.1" />
                <span class="unit">V</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">电流阈值</label>
              <div class="range-input">
                <el-input-number v-model="thresholds.currentMin" :min="0" :max="1" step="0.01" />
                <span class="range-text">~</span>
                <el-input-number v-model="thresholds.currentMax" :min="0" :max="1" step="0.01" />
                <span class="unit">A</span>
              </div>
            </div>
          </div>
          <div class="form-actions">
            <el-button type="primary" @click="saveThresholds">保存设置</el-button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section sensor-data-section">
      <div class="section-header">
        <h2 class="section-title">传感器数据列表</h2>
      </div>
      <div class="sensor-table-container">
        <el-table 
          :data="historyData" 
          border
          :header-cell-style="{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 500 }"
        >
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="temperature" label="温度(°C)" width="100" />
          <el-table-column prop="humidity" label="湿度(%)" width="100" />
          <el-table-column prop="lightIllum" label="光照(lx)" width="100" />
          <el-table-column prop="voltage" label="电压(V)" width="100" />
          <el-table-column prop="current" label="电流(A)" width="100" />
        </el-table>
      </div>
    </div>
    
    <div class="section alert-history">
      <div class="section-header">
        <h2 class="section-title">最近告警记录</h2>
      </div>
      <div class="alert-list">
        <div v-for="alert in alerts" :key="alert.time" class="alert-item">
          <component :is="getAlertIcon(alert.level)" class="alert-icon" :class="alert.level" />
          <div class="alert-info">
            <div class="alert-title">{{ getAlertTitle(alert.type) }}</div>
            <div class="alert-detail">
              阈值: {{ alert.threshold }} | 当前: {{ alert.value }} | {{ alert.time }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { ArrowLeft, Lightning, Warning, HotWater, Sunny, InfoFilled } from '@element-plus/icons-vue';
import { getRealTimeData, controlDevice, getHistoryData, setAlertThreshold, getAlertList } from '../api/light';
const icons = { ArrowLeft, Power: Lightning, PowerOff: Warning, Thermometer: HotWater, Droplets: HotWater, Sunny, Zap: Lightning, Battery: Lightning, Lightbulb: Warning, AlertTriangle: Warning, AlertCircle: Warning, Info: InfoFilled };
const route = useRoute();
const router = useRouter();
const deviceId = ref('');
const device = ref({
 deviceId: '',
 temperature: 0,
 humidity: 0,
 lightIllum: 0,
 voltage: 0,
 current: 0,
 ledStatus: 0,
 time: ''
});
const timeRange = ref('24h');
const startTime = ref('');
const endTime = ref('');
const chartRef = ref(null);
let chartInstance = null;
const historyData = ref([]);
const thresholds = ref({
 tempMin: 10,
 tempMax: 35,
 humidityMin: 20,
 humidityMax: 90,
 lightMin: 100,
 lightMax: 1000,
 voltageMin: 4.5,
 voltageMax: 5.5,
 currentMin: 0.05,
 currentMax: 0.3
});
const alerts = ref([]);
const goBack = () => {
 router.push('/devices');
};
const getAlertIcon = (level) => {
 switch (level) {
 case 'high': return Warning;
 case 'medium': return Warning;
 default: return InfoFilled;
 }
};
const getAlertTitle = (type) => {
 const titles = {
 temperature: '温度告警',
 humidity: '湿度告警',
 lightIllum: '光照告警',
 voltage: '电压告警',
 current: '电流告警'
 };
 return titles[type] || '未知告警';
};
const loadDeviceData = async () => {
 if (!deviceId.value) {
 device.value = { deviceId: '', temperature: 0, humidity: 0, lightIllum: 0, voltage: 0, current: 0, ledStatus: 0, time: '' };
 return;
 }
 device.value = await getRealTimeData(deviceId.value);
};
const handleControl = async () => {
 const newStatus = device.value.ledStatus === 1 ? 0 : 1;
 try {
 await controlDevice({
 deviceId: deviceId.value,
 cmd: newStatus === 1 ? 'ledOn' : 'ledOff'
 });
 device.value.ledStatus = newStatus;
 ElMessage.success(newStatus === 1 ? 'LED已开启' : 'LED已关闭');
 }
 catch (error) {
 ElMessage.error('控制失败');
 }
};
const loadHistory = async () => {
 await loadHistoryData();
 initChart();
};
const loadCustomHistory = async () => {
 if (startTime.value && endTime.value) {
 await loadHistoryData(startTime.value, endTime.value);
 initChart();
 } else {
 await loadHistoryData();
 initChart();
 }
};
const formatLocalTime = (date) => {
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, '0');
 const day = String(date.getDate()).padStart(2, '0');
 const hour = String(date.getHours()).padStart(2, '0');
 const minute = String(date.getMinutes()).padStart(2, '0');
 const second = String(date.getSeconds()).padStart(2, '0');
 return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};
const loadHistoryData = async (customStartTime = null, customEndTime = null) => {
 let end, start;
 if (customStartTime && customEndTime) {
 start = customStartTime;
 end = customEndTime;
 } else {
 end = formatLocalTime(new Date());
 const ranges = {
 '1h': 1,
 '6h': 6,
 '24h': 24,
 '7d': 7 * 24
 };
 const hours = ranges[timeRange.value] || 24;
 start = formatLocalTime(new Date(Date.now() - hours * 60 * 60 * 1000));
 }
 historyData.value = await getHistoryData({
 deviceId: deviceId.value,
 startTime: start,
 endTime: end
 });
};
const initChart = () => {
 if (!chartRef.value)
 return;
 if (chartInstance) {
 chartInstance.dispose();
 }
 chartInstance = echarts.init(chartRef.value);
 
 const timeData = historyData.value.map(item => {
 const timeStr = item.time;
 return timeStr.includes(' ') ? item.time : timeStr;
 });
 const tempData = historyData.value.map(item => parseFloat(item.temperature));
 const humidityData = historyData.value.map(item => parseFloat(item.humidity));
 
 const option = {
 backgroundColor: 'transparent',
 grid: {
 top: 30,
 right: 20,
 bottom: 50,
 left: 50
 },
 tooltip: {
 trigger: 'axis',
 backgroundColor: 'rgba(255, 255, 255, 0.95)',
 borderColor: '#e2e8f0',
 borderWidth: 1,
 textStyle: { color: '#475569' },
 formatter: function(params) {
 let result = params[0].axisValue + '<br/>';
 params.forEach(item => {
 const unit = item.seriesName === '温度' ? '°C' : '%';
 result += `${item.marker} ${item.seriesName}: ${item.value}${unit}<br/>`;
 });
 return result;
 }
 },
 xAxis: {
 type: 'time',
 data: timeData.length > 0 ? timeData : [],
 axisLine: { lineStyle: { color: '#e2e8f0' } },
 axisTick: { show: false },
 axisLabel: { 
 color: '#94a3b8', 
 fontSize: 11,
 formatter: function(value) {
 const date = new Date(value);
 const hoursMap = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };
 const hours = hoursMap[timeRange.value] || 24;
 
 if (hours <= 24) {
 const hoursStr = date.getHours().toString().padStart(2, '0');
 const minutes = date.getMinutes().toString().padStart(2, '0');
 return `${hoursStr}:${minutes}`;
 } else {
 const month = (date.getMonth() + 1).toString().padStart(2, '0');
 const day = date.getDate().toString().padStart(2, '0');
 return `${month}-${day}`;
 }
 }
 },
 splitLine: { show: false }
 },
 yAxis: {
 type: 'value',
 axisLine: { show: false },
 axisTick: { show: false },
 axisLabel: { color: '#94a3b8', fontSize: 11 },
 splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
 },
 series: [
 {
 name: '温度',
 type: 'line',
 data: timeData.length > 0 ? historyData.value.map(item => [item.time, parseFloat(item.temperature)]) : [],
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
 data: timeData.length > 0 ? historyData.value.map(item => [item.time, parseFloat(item.humidity)]) : [],
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
 };
 chartInstance.setOption(option);
};
const generateTimeLabels = () => {
 const labels = [];
 const now = new Date();
 for (let i = 23; i >= 0; i--) {
 const time = new Date(now.getTime() - i * 60 * 60 * 1000);
 labels.push(`${time.getHours().toString().padStart(2, '0')}:00`);
 }
 return labels;
};
const generateRandomData = (count, min, max) => {
 const data = [];
 for (let i = 0; i < count; i++) {
 data.push(Math.round((Math.random() * (max - min) + min) * 10) / 10);
 }
 return data;
};
const loadAlerts = async () => {
 const endTime = formatLocalTime(new Date());
 const startTime = formatLocalTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
 alerts.value = await getAlertList({
 deviceId: deviceId.value,
 startTime,
 endTime
 });
};
const saveThresholds = async () => {
 try {
 await setAlertThreshold({
 deviceId: deviceId.value,
 ...thresholds.value
 });
 ElMessage.success('阈值设置成功');
 }
 catch (error) {
 ElMessage.error('保存失败');
 }
};
const handleResize = () => {
 chartInstance?.resize();
};
watch(() => route.params.id, (newId) => {
 deviceId.value = newId;
 loadDeviceData();
 loadAlerts();
});
onMounted(() => {
 deviceId.value = route.params.id;
 loadDeviceData();
 loadAlerts();
 initChart();
 window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
 window.removeEventListener('resize', handleResize);
 chartInstance?.dispose();
});
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

.sensor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
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

.section-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
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

.time-filter {
 display: flex;
 align-items: center;
 gap: 12px;
}

.filter-select {
 width: 120px;
}

.date-picker {
 width: 200px;
}

.range-separator {
 margin: 0 8px;
 color: #94a3b8;
}

.chart-container {
 height: 280px;
}

.sensor-data-section {
 background: #ffffff;
 border-radius: 12px;
 padding: 20px;
 box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
 border: 1px solid #f1f5f9;
 margin-top: 24px;
}

.sensor-table-container {
 max-height: 400px;
 overflow-y: auto;
}

.threshold-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.threshold-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-text {
  color: #94a3b8;
}

.unit {
  color: #64748b;
  font-size: 13px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.alert-history {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.alert-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.alert-icon.high {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.alert-icon.medium {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.alert-icon.low {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.alert-icon svg {
  width: 18px;
  height: 18px;
}

.alert-info {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.alert-detail {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

@media (max-width: 1200px) {
  .section-row {
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
