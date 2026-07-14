<template>
  <div class="dashboard">
    <div class="stats-grid">
      <StatCard 
        title="在线设备" 
        :value="onlineCount" 
        unit="台"
        :icon="icons.Cpu"
        iconClass="device"
      />
      <StatCard 
        title="告警数量" 
        :value="alertCount" 
        unit="条"
        :icon="icons.Bell"
        iconClass="alert"
      />
      <StatCard 
        title="平均温度" 
        :value="avgTemperature" 
        unit="°C"
        :icon="icons.Thermometer"
        iconClass="temperature"
      />
      <StatCard 
        title="平均湿度" 
        :value="avgHumidity" 
        unit="%"
        :icon="icons.Droplets"
        iconClass="humidity"
      />
    </div>
    
    <div class="section-row">
      <div class="section device-section">
        <div class="section-header">
          <h2 class="section-title">设备状态</h2>
          <router-link to="/devices" class="view-all">查看全部</router-link>
        </div>
        <div class="device-list">
          <DeviceCard 
            v-for="device in devices" 
            :key="device.deviceId"
            :device="device"
            @click="goToDevice(device.deviceId)"
            @control="handleControl(device)"
          />
        </div>
      </div>
      
      <div class="section chart-section">
        <div class="section-header">
          <h2 class="section-title">环境趋势</h2>
          <div class="time-range">
            <button 
              v-for="range in timeRanges" 
              :key="range.value"
              class="range-btn"
              :class="{ active: selectedRange === range.value }"
              @click="handleTimeRangeChange(range.value)"
            >
              {{ range.label }}
            </button>
          </div>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>
    </div>
    
    <div class="section-row">
      <div class="section alert-section">
        <div class="section-header">
          <h2 class="section-title">最新告警</h2>
          <router-link to="/alerts" class="view-all">查看全部</router-link>
        </div>
        <div class="alert-list">
          <div v-for="alert in alerts" :key="alert.time" class="alert-item">
            <span class="alert-icon" :class="alert.level">
              <component :is="getAlertIcon(alert.level)" />
            </span>
            <div class="alert-content">
              <div class="alert-title">{{ getAlertTitle(alert.type) }}</div>
              <div class="alert-meta">{{ alert.deviceId }} · {{ alert.time }}</div>
            </div>
            <span class="alert-value">{{ alert.value }} {{ getAlertUnit(alert.type) }}</span>
          </div>
        </div>
      </div>
      
      <div class="section detect-section">
        <div class="section-header">
          <h2 class="section-title">检测统计</h2>
          <router-link to="/detect" class="view-all">查看全部</router-link>
        </div>
        <div class="detect-summary">
          <div class="detect-item">
            <div class="detect-icon">
              <component :is="icons.Eye" />
            </div>
            <div class="detect-info">
              <div class="detect-value">{{ todayDetectCount }}</div>
              <div class="detect-label">今日检测次数</div>
            </div>
          </div>
          <div class="detect-item">
            <div class="detect-icon person">
              <component :is="icons.User" />
            </div>
            <div class="detect-info">
              <div class="detect-value">{{ todayPersonCount }}</div>
              <div class="detect-label">今日检测人数</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted, onUnmounted, computed } from 'vue';
import * as echarts from 'echarts';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Cpu, Bell, HotWater, Warning, InfoFilled, User } from '@element-plus/icons-vue';
import StatCard from '../components/cards/StatCard.vue';
import DeviceCard from '../components/cards/DeviceCard.vue';
import { getDeviceList, getRealTimeData, getAlertList, controlDevice, getHistoryData } from '../api/light';
const icons = { Cpu, Bell, Thermometer: HotWater, Droplets: HotWater, AlertTriangle: Warning, AlertCircle: Warning, Info: InfoFilled, User };
const router = useRouter();
const devices = ref([]);
const alerts = ref([]);
const chartRef = ref(null);
let chartInstance = null;
const selectedRange = ref('7d');
const timeRanges = [
 { label: '1小时', value: '1h' },
 { label: '6小时', value: '6h' },
 { label: '24小时', value: '24h' },
 { label: '7天', value: '7d' }
];
const onlineCount = computed(() => devices.value.filter(d => Number(d.ledStatus) === 1).length);
const alertCount = computed(() => alerts.value.length);
const avgTemperature = computed(() => {
 if (devices.value.length === 0)
 return 0;
 return devices.value.reduce((sum, d) => sum + d.temperature, 0) / devices.value.length;
});
const avgHumidity = computed(() => {
 if (devices.value.length === 0)
 return 0;
 return devices.value.reduce((sum, d) => sum + d.humidity, 0) / devices.value.length;
});
const todayDetectCount = ref(128);
const todayPersonCount = ref(356);
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
const getAlertUnit = (type) => {
 const units = {
 temperature: '°C',
 humidity: '%',
 lightIllum: 'lx',
 voltage: 'V',
 current: 'A'
 };
 return units[type] || '';
};
const goToDevice = (deviceId) => {
 router.push(`/device/${deviceId}`);
};
const handleControl = async (device) => {
 try {
 await controlDevice({
 deviceId: device.deviceId,
 cmd: device.ledStatus === 1 ? 'ledOff' : 'ledOn'
 });
 device.ledStatus = device.ledStatus === 1 ? 0 : 1;
 ElMessage.success(device.ledStatus === 1 ? 'LED已开启' : 'LED已关闭');
 }
 catch (error) {
 ElMessage.error('控制失败');
 }
};
const initChart = () => {
 if (!chartRef.value)
 return;
 chartInstance = echarts.init(chartRef.value);
 const avgData = calculateAverageData();
 const option = {
 backgroundColor: 'transparent',
 grid: {
 top: 30,
 right: 20,
 bottom: 30,
 left: 50
 },
 tooltip: {
 trigger: 'axis',
 backgroundColor: 'rgba(255, 255, 255, 0.95)',
 borderColor: '#e2e8f0',
 borderWidth: 1,
 textStyle: {
 color: '#475569'
 },
 formatter: (params) => {
 let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
 params.forEach(param => {
 result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
 <span style="display: inline-block; width: 10px; height: 2px; background: ${param.color};"></span>
 <span>${param.seriesName}: ${param.value}</span>
 </div>`;
 });
 return result;
 }
 },
 xAxis: {
 type: 'time',
 data: avgData.timeData.length > 0 ? avgData.timeData.map(item => item.time) : [],
 axisLine: {
 lineStyle: {
 color: '#e2e8f0'
 }
 },
 axisTick: {
 show: false
 },
 axisLabel: {
 color: '#94a3b8',
 fontSize: 11,
 formatter: function(value) {
 const date = new Date(value);
 const hoursMap = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };
 const hours = hoursMap[currentTimeRange.value] || 168;
 
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
 yAxis: [
 {
 type: 'value',
 name: '温度/湿度',
 nameTextStyle: {
 color: '#94a3b8',
 fontSize: 11
 },
 axisLine: {
 show: false
 },
 axisTick: {
 show: false
 },
 axisLabel: {
 color: '#94a3b8',
 fontSize: 11
 },
 splitLine: {
 lineStyle: {
 color: '#f1f5f9',
 type: 'dashed'
 }
 }
 },
 {
 type: 'value',
 name: '光照',
 nameTextStyle: {
 color: '#94a3b8',
 fontSize: 11
 },
 axisLine: {
 show: false
 },
 axisTick: {
 show: false
 },
 axisLabel: {
 color: '#94a3b8',
 fontSize: 11
 },
 splitLine: {
 show: false
 }
 }
 ],
 series: [
 {
 name: '温度',
 type: 'line',
 data: avgData.timeData.length > 0 ? avgData.timeData.map(item => [item.time, item.temperature]) : [],
 smooth: true,
 symbol: 'none',
 lineStyle: {
 color: '#ef4444',
 width: 2
 },
 areaStyle: {
 color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
 { offset: 0, color: 'rgba(239, 68, 68, 0.15)' },
 { offset: 1, color: 'rgba(239, 68, 68, 0)' }
 ])
 }
 },
 {
 name: '湿度',
 type: 'line',
 data: avgData.timeData.length > 0 ? avgData.timeData.map(item => [item.time, item.humidity]) : [],
 smooth: true,
 symbol: 'none',
 lineStyle: {
 color: '#3b82f6',
 width: 2
 },
 areaStyle: {
 color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
 { offset: 0, color: 'rgba(59, 130, 246, 0.15)' },
 { offset: 1, color: 'rgba(59, 130, 246, 0)' }
 ])
 }
 },
 {
 name: '光照',
 type: 'line',
 yAxisIndex: 1,
 data: avgData.timeData.length > 0 ? avgData.timeData.map(item => [item.time, item.lightIllum]) : [],
 smooth: true,
 symbol: 'none',
 lineStyle: {
 color: '#f59e0b',
 width: 2
 },
 areaStyle: {
 color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
 { offset: 0, color: 'rgba(245, 158, 11, 0.15)' },
 { offset: 1, color: 'rgba(245, 158, 11, 0)' }
 ])
 }
 }
 ]
 };
 chartInstance.setOption(option);
};
const currentTimeRange = ref('7d');
const historyDataList = ref([]);
const handleTimeRangeChange = async (range) => {
 selectedRange.value = range;
 currentTimeRange.value = range;
 await loadHistoryData();
 initChart();
};
const generateTimeLabels = (hours = 168) => {
 const labels = [];
 const now = new Date();
 let interval, pointsCount;
 if (hours <= 1) {
 interval = 10;
 pointsCount = 6;
 } else if (hours <= 6) {
 interval = 30;
 pointsCount = 12;
 } else if (hours <= 24) {
 interval = 60;
 pointsCount = 24;
 } else {
 interval = 360;
 pointsCount = 28;
 }
 for (let i = pointsCount - 1; i >= 0; i--) {
 const time = new Date(now.getTime() - i * interval * 60 * 1000);
 const year = time.getFullYear();
 const month = (time.getMonth() + 1).toString().padStart(2, '0');
 const day = time.getDate().toString().padStart(2, '0');
 const hourStr = time.getHours().toString().padStart(2, '0');
 const minutes = time.getMinutes().toString().padStart(2, '0');
 labels.push(`${year}-${month}-${day} ${hourStr}:${minutes}:00`);
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
const formatLocalTime = (date) => {
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, '0');
 const day = String(date.getDate()).padStart(2, '0');
 const hour = String(date.getHours()).padStart(2, '0');
 const minute = String(date.getMinutes()).padStart(2, '0');
 const second = String(date.getSeconds()).padStart(2, '0');
 return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};
const loadHistoryData = async () => {
 const ranges = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };
 const hours = ranges[currentTimeRange.value] || 168;
 const endTime = formatLocalTime(new Date());
 const startTime = formatLocalTime(new Date(Date.now() - hours * 60 * 60 * 1000));
 try {
 const deviceList = await getDeviceList();
 const promises = deviceList.map(item => getHistoryData({
 deviceId: item.deviceId,
 startTime,
 endTime
 }));
 historyDataList.value = await Promise.all(promises);
 } catch (error) {
 console.error('获取历史数据失败:', error);
 historyDataList.value = [];
 }
};
const calculateAverageData = () => {
 const hoursMap = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };
 const hours = hoursMap[currentTimeRange.value] || 168;
 
 let pointsCount;
 if (hours <= 1) {
 pointsCount = 6;
 } else if (hours <= 6) {
 pointsCount = 12;
 } else if (hours <= 24) {
 pointsCount = 24;
 } else {
 pointsCount = 28;
 }
 
 if (historyDataList.value.length === 0) {
 const timeLabels = generateTimeLabels(hours);
 const tempData = generateRandomData(pointsCount, 20, 30);
 const humData = generateRandomData(pointsCount, 40, 70);
 const lightData = generateRandomData(pointsCount, 200, 800);
 const timeData = timeLabels.slice(0, pointsCount).map((time, index) => ({
 time: time,
 temperature: tempData[index],
 humidity: humData[index],
 lightIllum: lightData[index]
 }));
 return {
 timeLabels: timeLabels.slice(0, pointsCount),
 timeData,
 temperature: tempData,
 humidity: humData,
 lightIllum: lightData
 };
 }
 const allData = historyDataList.value.flat();
 const timeMap = {};
 allData.forEach(item => {
 const timeKey = item.time;
 if (!timeMap[timeKey]) {
 timeMap[timeKey] = { temp: [], hum: [], light: [], originalTime: item.time };
 }
 if (item.temperature) timeMap[timeKey].temp.push(parseFloat(item.temperature));
 if (item.humidity) timeMap[timeKey].hum.push(parseFloat(item.humidity));
 if (item.lightIllum) timeMap[timeKey].light.push(parseFloat(item.lightIllum));
 });
 const sortedTimes = Object.keys(timeMap).sort();
 const timeData = sortedTimes.map(timeKey => {
 const data = timeMap[timeKey];
 return {
 time: data.originalTime || timeKey,
 temperature: data.temp.length > 0 ? (data.temp.reduce((a, b) => a + b, 0) / data.temp.length).toFixed(1) : null,
 humidity: data.hum.length > 0 ? (data.hum.reduce((a, b) => a + b, 0) / data.hum.length).toFixed(1) : null,
 lightIllum: data.light.length > 0 ? Math.round(data.light.reduce((a, b) => a + b, 0) / data.light.length) : null
 };
 }).filter(item => item.temperature !== null || item.humidity !== null || item.lightIllum !== null);
 const temperature = timeData.map(item => item.temperature);
 const humidity = timeData.map(item => item.humidity);
 const lightIllum = timeData.map(item => item.lightIllum);
 return {
 timeLabels: sortedTimes,
 timeData,
 temperature: temperature.length > 0 ? temperature : generateRandomData(pointsCount, 20, 30),
 humidity: humidity.length > 0 ? humidity : generateRandomData(pointsCount, 40, 70),
 lightIllum: lightIllum.length > 0 ? lightIllum : generateRandomData(pointsCount, 200, 800)
 };
};
const loadDevices = async () => {
 const list = await getDeviceList();
 const promises = list.map(item => getRealTimeData(item.deviceId));
 devices.value = await Promise.all(promises);
};
const loadAlerts = async () => {
 const endTime = formatLocalTime(new Date());
 const startTime = formatLocalTime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
 alerts.value = await getAlertList({
 deviceId: 'light_01',
 startTime,
 endTime
 });
};
const handleResize = () => {
 chartInstance?.resize();
};
onMounted(async () => {
 loadDevices();
 loadAlerts();
 await loadHistoryData();
 initChart();
 window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
 window.removeEventListener('resize', handleResize);
 chartInstance?.dispose();
});
</script>

<style scoped>
.dashboard {
  padding: 24px;
  max-width: 1800px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
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
  align-items: center;
  justify-content: space-between;
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

.view-all {
  font-size: 13px;
  color: #4a6cf7;
  text-decoration: none;
  font-weight: 500;
}

.view-all:hover {
  color: #3a55d4;
}

.device-section {
  grid-column: 1;
}

.device-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.chart-section {
  grid-column: 2;
}

.time-range {
  display: flex;
  gap: 8px;
}

.range-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s ease;
}

.range-btn:hover {
  background: #f1f5f9;
}

.range-btn.active {
  background: #4a6cf7;
  border-color: #4a6cf7;
  color: #ffffff;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.alert-section {
  grid-column: 1;
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
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.alert-item:hover {
  background: #f1f5f9;
}

.alert-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
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

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.alert-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.alert-value {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.detect-section {
  grid-column: 2;
}

.detect-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detect-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 10px;
}

.detect-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(74, 108, 247, 0.1);
  color: #4a6cf7;
}

.detect-icon.person {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.detect-icon svg {
  width: 24px;
  height: 24px;
}

.detect-info {
  display: flex;
  flex-direction: column;
}

.detect-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.detect-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

@media (max-width: 1200px) {
  .section-row {
    grid-template-columns: 1fr;
  }
  
  .device-section,
  .chart-section,
  .alert-section,
  .detect-section {
    grid-column: 1;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .device-list {
    grid-template-columns: 1fr;
  }
  
  .detect-summary {
    grid-template-columns: 1fr;
  }
}
</style>
