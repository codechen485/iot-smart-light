<template>
  <div class="device-list-page">
    <div class="page-header">
      <div class="header-left">
        <!-- 修改文字 -->
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
      <!-- 修改文字 -->
        <el-table-column prop="deviceId" label="设备编号" min-width="180">
          <template #default="scope">
            <div class="device-id-cell">
              <component :is="icons.Lightbulb" class="device-icon" />
              <span>{{ scope.row.deviceId }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="time" label="最后上报时间" min-width="170" />

        <el-table-column label="操作" width="120" fixed="right">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Lightning, Refresh, View } from '@element-plus/icons-vue'
import { getDeviceList, getRealTimeData } from '../api/light'

const icons = { Lightbulb: Lightning, Refresh, Eye: View }
const router = useRouter()
const devices = ref([])

const loadDevices = async () => {
  const list = await getDeviceList()
  const promises = list.map(item => getRealTimeData(item.deviceId))
  const results = await Promise.all(promises)
  devices.value = results
}

const goToDetail = (deviceId) => {
  router.push(`/device/${deviceId}`)
}

onMounted(() => {
  loadDevices()
})
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

@media (max-width: 768px) {
  .device-list-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
