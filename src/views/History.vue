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
          <el-option label="24小时" value="24h" />
          <el-option label="7天" value="7d" />
        </el-select>

        <el-date-picker
          v-model="startTime"
          type="datetime"
          placeholder="开始时间"
          style="width: 185px"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
        <span class="range-separator">至</span>
        <el-date-picker
          v-model="endTime"
          type="datetime"
          placeholder="结束时间"
          style="width: 185px"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />

        <el-button type="primary" :loading="loading" @click="loadHistory">查询</el-button>
      </div>
    </div>

    <div class="content-row">
      <div class="section chart-section">
        <div class="section-header">
          <h2 class="section-title">传感数据曲线</h2>
        </div>
        <SensorTrendChart :records="historyData" height="280px" />
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
            max-height="500"
            :header-cell-style="{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 500 }"
          >
            <el-table-column prop="time" label="时间" width="145" />
            <el-table-column prop="temperature" label="温度(°C)" min-width="70" />
            <el-table-column prop="humidity" label="湿度(%)" min-width="70" />
            <el-table-column prop="lightIllum" label="光照(lx)" min-width="70" />
            <el-table-column prop="voltage" label="电压(V)" min-width="70" />
            <el-table-column prop="current" label="电流(A)" min-width="70" />
          </el-table>
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            :pager-count="5"
            class="table-pagination"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import SensorTrendChart from '../components/SensorTrendChart.vue'
import { getDeviceList, getHistoryData } from '../api/light'

const devices = ref([])
const filterDevice = ref('')
const timeRange = ref('1h')
const startTime = ref('')
const endTime = ref('')
const historyData = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

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
      '24h': 24,
      '7d': 7 * 24
    }
    const hours = ranges[timeRange.value] || 1
    start = formatLocalTime(new Date(Date.now() - hours * 60 * 60 * 1000))
  }
  startTime.value = start
  endTime.value = end

  if (!filterDevice.value) {
    ElMessage.warning('请先选择设备')
    return
  }

  const result = await getHistoryData({
    deviceId: filterDevice.value,
    startTime: start,
    endTime: end,
    page: page.value,
    pageSize: pageSize.value
  })
  historyData.value = result.records || result || []
  total.value = result.total || historyData.value.length
}

const handleTimeRangeChange = () => {
  startTime.value = ''
  endTime.value = ''
}

// 切换页码：重新请求数据，图表由 SensorTrendChart 监听 records 自动重绘
const handlePageChange = async (p) => {
  page.value = p
  await loadHistoryData(startTime.value, endTime.value)
}

const handleSizeChange = async (s) => {
  pageSize.value = s
  page.value = 1
  await loadHistoryData(startTime.value, endTime.value)
}

const loadHistory = async () => {
  if (!filterDevice.value) {
    ElMessage.warning('请先选择设备')
    return
  }
  loading.value = true
  page.value = 1
  const datePicked = startTime.value && endTime.value
  await loadHistoryData(
    datePicked ? startTime.value : null,
    datePicked ? endTime.value : null
  )
  loading.value = false
}

onMounted(async () => {
  await loadDevices()
  loadHistory()
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

.table-section {
  min-width: 0;
}

.table-pagination {
  margin-top: 16px;
  justify-content: flex-end;
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
