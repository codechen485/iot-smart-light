<template>
  <div class="device-list-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">设备管理</h1>
        <p class="page-subtitle">管理所有智能灯杆设备</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="icons.Refresh" @click="loadDevices">
          刷新列表
        </el-button>
      </div>
    </div>
    
    <div class="device-table-container">
      <el-table 
        :data="devices" 
        border
        :header-cell-style="{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 500 }"
        :row-style="{ height: '60px' }"
      >
        <el-table-column prop="deviceId" label="设备编号" min-width="120">
          <template #default="scope">
            <div class="device-id-cell">
              <component :is="icons.Lightbulb" class="device-icon" :class="{ active: scope.row.ledStatus === 1 }" />
              <span>{{ scope.row.deviceId }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="temperature" label="温度" width="100">
          <template #default="scope">
            <span>{{ scope.row.temperature }}°C</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="humidity" label="湿度" width="100">
          <template #default="scope">
            <span>{{ scope.row.humidity }}%</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="lightIllum" label="光照" width="100">
          <template #default="scope">
            <span>{{ scope.row.lightIllum }}lx</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="voltage" label="电压" width="100">
          <template #default="scope">
            <span>{{ scope.row.voltage }}V</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="current" label="电流" width="100">
          <template #default="scope">
            <span>{{ scope.row.current }}A</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="ledStatus" label="LED状态" width="100">
          <template #default="scope">
            <el-switch 
              :checked="scope.row.ledOn" 
              :model-value="scope.row.ledOn"
              @change="handleLedChange(scope.row)"
              active-color="#10b981"
              inactive-color="#cbd5e1"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="140">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              :icon="icons.Eye"
              @click="goToDetail(scope.row.deviceId)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="device-cards">
      <h2 class="section-title">设备概览</h2>
      <div class="cards-grid">
        <div v-for="device in devices" :key="device.deviceId" class="device-card-mini" @click="goToDetail(device.deviceId)">
          <div class="card-header">
            <component :is="icons.Lightbulb" class="mini-icon" :class="{ active: Number(device.ledStatus) === 1 }" />
            <span class="device-name">{{ device.deviceId }}</span>
          </div>
          <div class="card-stats">
            <div class="stat">
              <span class="stat-label">温度</span>
              <span class="stat-value">{{ device.temperature }}°C</span>
            </div>
            <div class="stat">
              <span class="stat-label">湿度</span>
              <span class="stat-value">{{ device.humidity }}%</span>
            </div>
          </div>
          <div class="card-footer">
            <span class="status" :class="Number(device.ledStatus) === 1 ? 'on' : 'off'">
              {{ Number(device.ledStatus) === 1 ? '运行中' : '已关闭' }}
            </span>
            <span class="update">{{ device.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Lightning, Refresh, Camera } from '@element-plus/icons-vue';
import { getDeviceList, getRealTimeData, controlDevice } from '../api/light';
const icons = { Lightbulb: Lightning, Refresh, Eye: Camera };
const router = useRouter();
const devices = ref([]);
const loadDevices = async () => {
 const list = await getDeviceList();
 const promises = list.map(item => getRealTimeData(item.deviceId));
 const results = await Promise.all(promises);
 
 devices.value = results.map(result => ({
 ...result,
 ledOn: Number(result.ledStatus) === 1
 }));
};
const goToDetail = (deviceId) => {
 router.push(`/device/${deviceId}`);
};
const handleLedChange = async (device) => {
 const newStatus = device.ledStatus === 1 ? 0 : 1;
 try {
 await controlDevice({
 deviceId: device.deviceId,
 cmd: newStatus === 1 ? 'ledOn' : 'ledOff'
 });
 device.ledStatus = newStatus;
 device.ledOn = newStatus === 1;
 ElMessage.success(newStatus === 1 ? 'LED已开启' : 'LED已关闭');
 }
 catch (error) {
 device.ledStatus = newStatus === 1 ? 0 : 1;
 device.ledOn = newStatus === 1;
 ElMessage.error('控制失败');
 }
};
onMounted(() => {
 loadDevices();
});
</script>

<style scoped>
.device-list-page {
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

.device-table-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  margin-bottom: 24px;
}

.device-id-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-icon {
  width: 20px;
  height: 20px;
  color: #94a3b8;
}

.device-icon.active {
  color: #f59e0b;
}

.device-cards {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.device-card-mini {
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.device-card-mini:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.mini-icon {
  width: 24px;
  height: 24px;
  color: #94a3b8;
}

.mini-icon.active {
  color: #f59e0b;
}

.device-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
}

.status.on {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status.off {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
}

.update {
  font-size: 11px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .device-list-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
