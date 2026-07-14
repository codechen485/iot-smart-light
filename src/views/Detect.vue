<template>
  <div class="detect-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">智能检测</h1>
        <p class="page-subtitle">基于YOLO的行人检测与分析</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="icons.Search" @click="startDetection">
          开始检测
        </el-button>
      </div>
    </div>
    
    <div class="detect-grid">
      <div class="left-panel">
        <div class="video-section">
          <div class="section-header">
            <h3 class="section-title">视频流画面</h3>
            <div class="video-status">
              <span class="status-dot" :class="{ active: isStreaming }"></span>
              <span>{{ isStreaming ? '监控中' : '离线' }}</span>
            </div>
          </div>
          <div class="video-container">
            <img v-if="currentImage" :src="currentImage" class="video-image" />
            <div v-else class="video-placeholder">
              <component :is="icons.Video" class="placeholder-icon" />
              <span class="placeholder-text">{{ isStreaming ? '正在加载...' : '点击开始监控' }}</span>
            </div>
          </div>
          <div class="video-controls">
            <el-button size="small" :icon="isStreaming ? icons.Pause : icons.Play" @click="toggleStream">
              {{ isStreaming ? '停止监控' : '开始监控' }}
            </el-button>
            <el-button size="small" :icon="icons.Camera" @click="captureFrame" :disabled="!isStreaming">
              截取画面
            </el-button>
            <el-button size="small" :icon="icons.Download" @click="downloadImage">
              保存图片
            </el-button>
          </div>
        </div>
        
        <div v-if="capturedFrame" class="captured-section">
          <div class="section-header">
            <h3 class="section-title">截取的画面</h3>
            <span class="captured-time">{{ capturedTime }}</span>
          </div>
          <img :src="capturedFrame" class="captured-image" />
          <div class="captured-actions">
            <el-button type="primary" :icon="icons.Search" @click="startDetection">
              开始检测
            </el-button>
            <el-button @click="clearCaptured">清除</el-button>
          </div>
        </div>
        
        <div v-if="hasDetected" class="detection-result">
          <div class="result-header">
            <h3 class="result-title">检测结果</h3>
            <span class="result-time">{{ lastDetectTime }}</span>
          </div>
          <div class="result-content">
            <div class="person-count">
              <component :is="icons.User" class="count-icon" />
              <div class="count-info">
                <div class="count-value">{{ detectResult.personNum }}</div>
                <div class="count-label">检测人数</div>
              </div>
            </div>
            <div v-if="detectResult.processedImage" class="result-image">
              <img :src="detectResult.processedImage" />
              <span class="image-label">识别后</span>
            </div>
            <div class="result-list">
              <div 
                v-for="(result, index) in detectResult.results" 
                :key="index" 
                class="result-item"
              >
                <span class="result-label">{{ result.label }}</span>
                <span class="result-confidence">{{ (result.confidence * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="right-panel">
        <div class="device-section">
          <h3 class="section-title">选择设备</h3>
          <div class="device-list">
            <div 
              v-for="device in devices" 
              :key="device.deviceId"
              class="device-item"
              :class="{ active: selectedDevice === device.deviceId }"
              @click="selectDevice(device.deviceId)"
            >
              <component :is="icons.Lightbulb" class="device-icon" />
              <span class="device-name">{{ device.deviceId }}</span>
            </div>
          </div>
        </div>
        
        <div class="history-section">
          <div class="section-header">
            <h3 class="section-title">检测历史</h3>
            <el-button size="small" @click="loadHistory">刷新</el-button>
          </div>
          <div class="filter-bar">
            <el-select v-model="filterDevice" placeholder="选择设备" class="filter-select">
              <el-option label="全部" value="" />
              <el-option label="light_01" value="light_01" />
              <el-option label="light_02" value="light_02" />
              <el-option label="light_03" value="light_03" />
            </el-select>
            <el-date-picker 
              v-model="dateRange" 
              type="daterange" 
              range-separator="至" 
              start-placeholder="开始" 
              end-placeholder="结束"
              class="date-picker"
            />
            <el-button size="small" type="primary" @click="filterHistory">筛选</el-button>
          </div>
          <div class="history-list">
            <div 
              v-for="record in filteredHistory" 
              :key="record.detectTime" 
              class="history-item"
            >
              <div class="history-images">
                <div class="history-image original">
                  <img :src="record.originalImage" />
                  <span class="image-label">原图</span>
                </div>
                <div class="history-image processed">
                  <img :src="record.processedImage" />
                  <span class="image-label">识别后</span>
                </div>
              </div>
              <div class="history-info">
                <div class="history-device">{{ record.deviceId }}</div>
                <div class="history-count">检测到 {{ record.personNum }} 人</div>
                <div class="history-time">{{ record.detectTime }}</div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, VideoCamera, Camera, Download, User, Lightning, VideoPlay, VideoPause } from '@element-plus/icons-vue';
import { detectPerson, getDetectHistory, getVideoStream, getDeviceList } from '../api/light';

const icons = { 
  Search, 
  Video: VideoCamera, 
  Camera, 
  Download, 
  User, 
  Lightbulb: Lightning,
  Play: VideoPlay,
  Pause: VideoPause
};

const devices = ref([]);
const selectedDevice = ref('');
const isStreaming = ref(false);
const isDetecting = ref(false);
const currentImage = ref('');
const capturedFrame = ref('');
const capturedTime = ref('');
const lastDetectTime = ref('');

const detectResult = ref({
  personNum: 0,
  results: [],
  originalImage: '',
  processedImage: ''
});

const hasDetected = ref(false);

const detectHistory = ref([]);
const filterDevice = ref('');
const dateRange = ref([]);

let streamInterval = null;

const selectDevice = (deviceId) => {
  selectedDevice.value = deviceId;
  loadHistory();
};

// 视频流功能
const toggleStream = () => {
  if (isStreaming.value) {
    stopStream();
  } else {
    startStream();
  }
};

const startStream = async () => {
  isStreaming.value = true;
  const result = await getVideoStream(selectedDevice.value);
  if (!result.data) {
    isStreaming.value = false;
    ElMessage.warning('视频流连接失败，请检查设备或网络');
    return;
  }
  currentImage.value = result.data;
  ElMessage.success('视频监控已开启');
  streamInterval = setInterval(async () => {
    const result = await getVideoStream(selectedDevice.value);
    if (!result.data) {
      stopStream();
      ElMessage.warning('视频流已断开');
      return;
    }
    currentImage.value = result.data;
  }, 1000);
};

const stopStream = () => {
  isStreaming.value = false;
  if (streamInterval) {
    clearInterval(streamInterval);
    streamInterval = null;
  }
  ElMessage.info('视频监控已停止');
};

const captureFrame = () => {
  if (!isStreaming.value) {
    ElMessage.warning('请先开始监控');
    return;
  }
  // 从当前视频流中截取当前帧
  capturedFrame.value = currentImage.value;
  capturedTime.value = formatTime();
  ElMessage.success('画面已截取');
};

const clearCaptured = () => {
  capturedFrame.value = '';
  capturedTime.value = '';
};

const startDetection = async () => {
  if (!capturedFrame.value) {
    ElMessage.warning('请先截取画面');
    return;
  }
  
  isDetecting.value = true;
  const result = await detectPerson({
    deviceId: selectedDevice.value,
    imageBase64: capturedFrame.value
  });
  detectResult.value = result;
  hasDetected.value = true;
  lastDetectTime.value = formatTime();
  ElMessage.success('检测完成');
  isDetecting.value = false;
};

const downloadImage = () => {
  if (capturedFrame.value) {
    const link = document.createElement('a');
    link.download = `capture_${Date.now()}.png`;
    link.href = capturedFrame.value;
    link.click();
    ElMessage.success('图片已保存');
  } else {
    ElMessage.warning('没有可保存的图片');
  }
};

const filteredHistory = computed(() => {
  let result = [...detectHistory.value];
  if (filterDevice.value) {
    result = result.filter(item => item.deviceId === filterDevice.value);
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = new Date(dateRange.value[0]);
    const endDate = new Date(dateRange.value[1]);
    endDate.setDate(endDate.getDate() + 1);
    result = result.filter(item => {
      const itemDate = new Date(item.detectTime);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }
  return result;
});

const filterHistory = () => {
  loadHistory();
};

const loadDevices = async () => {
  const list = await getDeviceList();
  devices.value = list;
  if (list.length > 0 && !selectedDevice.value) {
    selectedDevice.value = list[0].deviceId;
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
const loadHistory = async () => {
  const endTime = formatLocalTime(new Date());
  const startTime = formatLocalTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
  detectHistory.value = await getDetectHistory({
    deviceId: selectedDevice.value,
    startTime,
    endTime
  });
};

const formatTime = (date = new Date()) => {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

onMounted(async () => {
  await loadDevices();
  loadHistory();
});

onUnmounted(() => {
  if (streamInterval) {
    clearInterval(streamInterval);
  }
});
</script>

<style scoped>
.detect-page {
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

.detect-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

.left-panel {
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
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.video-status {
  display: flex;
  align-items: center;
  gap: 8px;
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
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-image {
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

.placeholder-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 14px;
}

.video-controls {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: flex-end;
}

.captured-section {
  margin-top: 20px;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.captured-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.captured-time {
  font-size: 12px;
  color: #94a3b8;
}

.captured-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  background: #f8fafc;
}

.captured-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.detection-result {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

.result-time {
  font-size: 12px;
  color: #94a3b8;
}

.result-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.person-count {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: 10px;
}

.count-icon {
  width: 32px;
  height: 32px;
  color: #10b981;
}

.count-info {
  display: flex;
  flex-direction: column;
}

.count-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.count-label {
  font-size: 12px;
  color: #64748b;
}

.result-image {
  width: 160px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: #e2e8f0;
  margin-left: 20px;
}

.result-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-image .image-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 10px;
  padding: 4px;
  text-align: center;
}

.result-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.result-label {
  font-size: 14px;
  color: #475569;
}

.result-confidence {
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.device-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.device-item:hover {
  background: #f8fafc;
}

.device-item.active {
  background: rgba(74, 108, 247, 0.08);
  border-left: 3px solid #4a6cf7;
}

.device-icon {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.device-name {
  font-size: 14px;
  color: #475569;
}

.history-section {
 background: #ffffff;
 border-radius: 12px;
 padding: 20px;
 box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
 border: 1px solid #f1f5f9;
}

.filter-bar {
 display: flex;
 gap: 12px;
 margin-bottom: 16px;
 padding-bottom: 12px;
 border-bottom: 1px solid #f1f5f9;
}

.filter-select {
 flex: 1;
 min-width: 100px;
}

.date-picker {
 flex: 1;
 min-width: 200px;
}

.history-list {
 display: flex;
 flex-direction: column;
 gap: 12px;
 max-height: 400px;
 overflow-y: auto;
}

.history-item {
 display: flex;
 gap: 12px;
 padding: 12px;
 background: #f8fafc;
 border-radius: 8px;
}

.history-images {
 display: flex;
 gap: 6px;
}

.history-image {
 width: 50px;
 height: 50px;
 border-radius: 6px;
 overflow: hidden;
 background: #e2e8f0;
 position: relative;
}

.history-image img {
 width: 100%;
 height: 100%;
 object-fit: cover;
}

.image-label {
 position: absolute;
 bottom: 0;
 left: 0;
 right: 0;
 background: rgba(0, 0, 0, 0.6);
 color: #fff;
 font-size: 10px;
 padding: 2px 4px;
 text-align: center;
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.history-device {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.history-count {
  font-size: 12px;
  color: #10b981;
  margin-top: 4px;
}

.history-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

@media (max-width: 1200px) {
  .detect-grid {
    grid-template-columns: 1fr;
  }
  
  .right-panel {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .device-section,
  .history-section {
    flex: 1;
    min-width: 280px;
  }
}

@media (max-width: 768px) {
  .detect-page {
    padding: 16px;
  }
  
  .right-panel {
    flex-direction: column;
  }
  
  .result-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .person-count {
    width: 100%;
    justify-content: center;
  }
}
</style>