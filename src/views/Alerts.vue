<template>
  <div class="alerts-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">告警管理</h1>
        <p class="page-subtitle">查询历史告警记录与阈值设置</p>
      </div>
    </div>

    <div class="content-grid">
      <div class="section query-section">
        <div class="section-header query-header">
          <h2 class="section-title">告警查询</h2>
          <div class="filter-bar">
            <el-select v-model="filterDevice" placeholder="选择设备" class="filter-select">
              <el-option label="全部" value="" />
              <el-option v-for="d in devices" :key="d.deviceId" :label="d.deviceId" :value="d.deviceId" />
            </el-select>

            <el-select v-model="filterType" placeholder="告警类型" class="filter-select">
              <el-option label="全部" value="" />
              <el-option label="温度" value="temperature" />
              <el-option label="湿度" value="humidity" />
              <el-option label="光照" value="lightIllum" />
              <el-option label="电压" value="voltage" />
              <el-option label="电流" value="current" />
            </el-select>

            <el-date-picker
              v-model="startTime"
              type="datetime"
              placeholder="开始时间"
              style="width: 180px"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
            <span class="range-separator">至</span>
            <el-date-picker
              v-model="endTime"
              type="datetime"
              placeholder="结束时间"
              style="width: 180px"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />

            <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          </div>
        </div>

        <el-table
          :data="filteredAlerts"
          border
          max-height="420"
          :header-cell-style="{ backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 500 }"
          v-loading="loading"
        >
          <el-table-column prop="deviceId" label="设备编号" min-width="110" />
          <el-table-column prop="type" label="类型" min-width="90">
            <template #default="scope">
              <span class="type-tag">{{ getTypeName(scope.row.type) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="value" label="当前值" min-width="90">
            <template #default="scope">
              <span>{{ scope.row.value }} {{ getUnit(scope.row.type) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="threshold" label="阈值" min-width="90">
            <template #default="scope">
              <span>{{ scope.row.threshold }} {{ getUnit(scope.row.type) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="time" label="时间" min-width="160" />
          <template #empty>
            <div class="empty-state">
              <p class="empty-text">暂无告警数据</p>
            </div>
          </template>
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

      <div class="section threshold-section">
        <div class="section-header">
          <h2 class="section-title">阈值设置</h2>
        </div>
        <div class="threshold-card">
          <el-select v-model="selectedDevice" placeholder="选择设备" class="device-select">
            <el-option v-for="d in devices" :key="d.deviceId" :label="d.deviceId" :value="d.deviceId" />
          </el-select>

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
                <el-input-number v-model="thresholds.voltageMin" :min="0" :max="24" :step="0.1" />
                <span class="range-text">~</span>
                <el-input-number v-model="thresholds.voltageMax" :min="0" :max="24" :step="0.1" />
                <span class="unit">V</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">电流阈值</label>
              <div class="range-input">
                <el-input-number v-model="thresholds.currentMin" :min="0" :max="2" :step="0.01" />
                <span class="range-text">~</span>
                <el-input-number v-model="thresholds.currentMax" :min="0" :max="2" :step="0.01" />
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDeviceList, getAlertList, setAlertThreshold } from '../api/light'

const devices = ref([])
const alerts = ref([])
const filterDevice = ref('')
const filterType = ref('')
const startTime = ref('')
const endTime = ref('')
const selectedDevice = ref('light_01')
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filteredAlerts = computed(() => {
  if (!filterType.value) return alerts.value
  return alerts.value.filter(a => a.type === filterType.value)
})

const thresholds = ref({
  tempMin: 10,
  tempMax: 35,
  humidityMin: 20,
  humidityMax: 90,
  lightMin: 100,
  lightMax: 1000,
  voltageMin: 0.5,
  voltageMax: 5.5,
  currentMin: 0.05,
  currentMax: 0.3
})

const getTypeName = (type) => {
  const names = { temperature: '温度', humidity: '湿度', lightIllum: '光照', voltage: '电压', current: '电流' }
  return names[type] || type
}
const getUnit = (type) => {
  const units = { temperature: '°C', humidity: '%', lightIllum: 'lx', voltage: 'V', current: 'A' }
  return units[type] || ''
}
const formatLocalTime = (date) => {
  const pad = (n) => n.toString().padStart(2, '0')
  const d = date instanceof Date ? date : new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const loadAlerts = async () => {
  loading.value = true
  try {
    const datePicked = startTime.value && endTime.value
    const queryEndTime = datePicked ? endTime.value : formatLocalTime(new Date())
    const queryStartTime = datePicked ? startTime.value : formatLocalTime(new Date(Date.now() - 1 * 60 * 60 * 1000))
    const result = await getAlertList({
      deviceId: filterDevice.value,
      startTime: queryStartTime,
      endTime: queryEndTime,
      page: page.value,
      pageSize: pageSize.value
    })
    alerts.value = result.records || result || []
    total.value = result.total || alerts.value.length
  } catch (error) {
    console.log('[Alerts] loadAlerts error:', error)
    ElMessage.error('加载告警数据失败')
    alerts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  page.value = 1
  loadAlerts()
}

const handlePageChange = (p) => {
  page.value = p
  loadAlerts()
}

const handleSizeChange = (s) => {
  pageSize.value = s
  page.value = 1
  loadAlerts()
}

const loadDevices = async () => {
  const list = await getDeviceList()
  devices.value = list
  if (list.length > 0) {
    selectedDevice.value = list[0].deviceId
  }
}

const saveThresholds = async () => {
  try {
    await setAlertThreshold({
      deviceId: selectedDevice.value,
      ...thresholds.value
    })
    ElMessage.success('阈值设置成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(async () => {
  await loadDevices()
  loadAlerts()
})
</script>

<style scoped>
.alerts-page {
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

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
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

.section-header.query-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-select {
  width: 100px;
}

.range-separator {
  margin: 0 2px;
  color: #94a3b8;
  font-size: 13px;
  white-space: nowrap;
}

.table-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.type-tag {
  padding: 4px 10px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
}

.threshold-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.device-select { width: 100%; }

.threshold-form { display: flex; flex-direction: column; gap: 16px; }

.form-group { display: flex; flex-direction: column; gap: 8px; }

.form-label { font-size: 13px; color: #64748b; font-weight: 500; }

.range-input { display: flex; align-items: center; gap: 8px; }

.range-text { color: #94a3b8; }

.unit { color: #64748b; font-size: 13px; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-text { font-size: 16px; font-weight: 500; color: #64748b; margin: 0; }

@media (max-width: 1000px) {
  .content-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .alerts-page { padding: 16px; }
}
</style>
