import request from '../utils/request'
import { IS_MOCK, MOCK_DELAY } from '../config'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
//修改
const mockDeviceList = [
  { deviceId: 'light_01' },
  { deviceId: 'light_02' },
  { deviceId: 'light_03' },
]

const formatTime = (date) => {
  const pad = (n) => n.toString().padStart(2, '0')
  const d = date instanceof Date ? date : new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
//修改
const generateRealTimeData = (deviceId) => {
  const now = formatTime()
  const data = {
    light_01: { deviceId: 'light_01', temperature: 25.3, humidity: 61.5, lightIllum: 350, voltage: 5.02, current: 0.15, ledStatus: 1, mode: 'manual', pwmLevel: 100, TJ: '1', HJ: '0', GJ: '0', DJ: '0', DL: '0', time: now },
    light_02: { deviceId: 'light_02', temperature: 24.8, humidity: 58.2, lightIllum: 320, voltage: 4.98, current: 0.14, ledStatus: 0, mode: 'manual', pwmLevel: 0, TJ: '0', HJ: '0', GJ: '0', DJ: '0', DL: '0', time: now },
    light_03: { deviceId: 'light_03', temperature: 26.1, humidity: 63.8, lightIllum: 380, voltage: 5.05, current: 0.16, ledStatus: 1, mode: 'auto', pwmLevel: 65, TJ: '0', HJ: '0', GJ: '0', DJ: '0', DL: '0', time: now }
  }
  return data[deviceId] || data.light_01
}

const generateHistoryData = (params) => {
  const { deviceId, startTime, endTime } = params
  const data = []
  const start = new Date(startTime)
  const end = new Date(endTime)
  const interval = (end - start) / 24
  //修改
  for (let i = 0; i < 24; i++) {
    const time = new Date(start.getTime() + i * interval)
    data.push({
      deviceId,
      temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),
      humidity: parseFloat((50 + Math.random() * 20).toFixed(1)),
      lightIllum: Math.floor(200 + Math.random() * 600),
      voltage: parseFloat((4.8 + Math.random() * 0.5).toFixed(2)),
      current: parseFloat((0.1 + Math.random() * 0.1).toFixed(2)),
      ledStatus: Math.random() > 0.3 ? 1 : 0,
      time: formatTime(time)
    })
  }
  return data
}

const generateMockAlerts = () => {
  const devices = ['light_01', 'light_02', 'light_03']
  const types = ['temperature', 'humidity', 'lightIllum', 'voltage', 'current']
  const alerts = []
  for (let i = 0; i < 45; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const deviceId = devices[Math.floor(Math.random() * devices.length)]
    const baseValues = { temperature: 35, humidity: 90, lightIllum: 1000, voltage: 5.5, current: 0.3 }
    const time = new Date(Date.now() - i * 30 * 60 * 1000)
    alerts.push({
      deviceId,
      type,
      value: parseFloat((baseValues[type] + (Math.random() - 0.5) * 2).toFixed(1)),
      threshold: baseValues[type],
      time: formatTime(time)
    })
  }
  return alerts
}

const mockAlertList = generateMockAlerts()

const generateMockVideoFrame = () => {
  const colors = ['#fef3c7', '#dbeafe', '#d1fae5', '#fee2e2', '#fce7f3']
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  const timeStr = new Date().toLocaleTimeString()

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
      <rect width="800" height="600" fill="#1e293b"/>
      <rect width="760" height="560" x="20" y="20" fill="${randomColor}" opacity="0.3"/>
      <text x="400" y="300" text-anchor="middle" fill="#94a3b8" font-size="24">Video Stream</text>
      <text x="400" y="340" text-anchor="middle" fill="#64748b" font-size="16">${timeStr}</text>
    </svg>
  `
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

const generateMockDetectHistory = () => {
  const records = []
  for (let i = 0; i < 30; i++) {
    const time = new Date(Date.now() - i * 20 * 60 * 1000)
    records.push({
      deviceId: i % 3 === 0 ? 'light_02' : 'light_01',
      personNum: Math.floor(Math.random() * 5),
      originalImage: '',
      processedImage: '',
      detectTime: formatTime(time)
    })
  }
  return records
}

const mockDetectHistory = generateMockDetectHistory()

export async function getDeviceList() {
  if (IS_MOCK) {
    await delay(MOCK_DELAY)
    return mockDeviceList
  }
  try {
    return await request({
      //修改接口
      url: '/api/light/list',
      method: 'get'
    })
  } catch (error) {
    console.log('[API] getDeviceList:', error.message)
    return []
  }
}

export async function getRealTimeData(deviceId) {
  if (IS_MOCK) {
    await delay(MOCK_DELAY)
    return generateRealTimeData(deviceId)
  }
  try {
    return await request({
      //修改接口
      url: '/api/light/real',
      method: 'get',
      params: { deviceId }
    })
  } catch (error) {
    console.log('[API] getRealTimeData:', error.message)
    return { deviceId, temperature: 0, humidity: 0, lightIllum: 0, voltage: 0, current: 0, ledStatus: 0, time: '' }
  }
}

export async function controlDevice(data) {
  if (IS_MOCK) {
    await delay(MOCK_DELAY)
    return { success: true }
  }
  return await request({
    //修改接口
    url: '/api/light/control',
    method: 'post',
    data
  })
}

export async function getHistoryData(params) {
  if (IS_MOCK) {
    await delay(MOCK_DELAY)
    const all = generateHistoryData(params)
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const records = all.slice(start, start + pageSize)
    return { records, total: all.length, page, pageSize }
  }
  try {
    const res = await request({
      url: '/api/light/history',
      method: 'get',
      params
    })
    return {
      records: res.records || [],
      total: res.total || 0,
      page: res.page || params.page || 1,
      pageSize: res.pageSize || params.pageSize || 20
    }
  } catch (error) {
    console.log('[API] getHistoryData:', error.message)
    return { records: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
  }
}

export async function setAlertThreshold(data) {
  if (IS_MOCK) {
    await delay(MOCK_DELAY)
    return { success: true }
  }
  try {
    return await request({
      url: '/api/light/alert/set',
      method: 'post',
      data
    })
  } catch (error) {
    console.log('[API] setAlertThreshold:', error.message)
    return { success: false }
  }
}

export async function getAlertList(params) {
  if (IS_MOCK) {
    await delay(MOCK_DELAY)
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const records = mockAlertList.slice(start, start + pageSize)
    return { records, total: mockAlertList.length, page, pageSize }
  }
  try {
    const res = await request({
      url: '/api/light/alert/list',
      method: 'get',
      params
    })
    return {
      records: res.records || [],
      total: res.total || 0,
      page: res.page || params.page || 1,
      pageSize: res.pageSize || params.pageSize || 20
    }
  } catch (error) {
    console.log('[API] getAlertList:', error.message)
    return { records: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
  }
}

export async function getVideoStream(deviceId) {
  if (IS_MOCK) {
    await delay(MOCK_DELAY)
    return generateMockVideoFrame()
  }
  try {
    const url = await request({
      url: '/api/light/video/stream',
      method: 'get',
      params: { deviceId }
    })
    // 将绝对 URL 转为同源路径，走 Vite 代理，避免 Canvas 截帧跨域
    // http://192.168.162.114:5000/camera/stream → /camera/stream
    if (url && typeof url === 'string' && url.startsWith('http')) {
      const parsed = new URL(url)
      return parsed.pathname + parsed.search
    }
    return url
  } catch (error) {
    console.log('[API] getVideoStream:', error.message)
    return null
  }
}

export async function detectPerson(data) {
  if (IS_MOCK) {
    await delay(MOCK_DELAY)
    return {
      personNum: Math.floor(Math.random() * 5) + 1,
      results: [{ class: 0, confidence: 0.92 + Math.random() * 0.06, label: 'person' }],
      originalImage: data.imageBase64 || '',
      processedImage: data.imageBase64 || ''
    }
  }
  try {
    return await request({
      url: '/api/light/detect',
      method: 'post',
      data
    })
  } catch (error) {
    console.log('[API] detectPerson:', error.message)
    return { personNum: 0, results: [], originalImage: '', processedImage: '' }
  }
}

export async function getDetectHistory(params) {
  if (IS_MOCK) {
    await delay(MOCK_DELAY)
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const start = (page - 1) * pageSize
    const records = mockDetectHistory.slice(start, start + pageSize)
    return { records, total: mockDetectHistory.length, page, pageSize }
  }
  try {
    const res = await request({
      url: '/api/light/detect/list',
      method: 'get',
      params
    })
    return {
      records: res.records || [],
      total: res.total || 0,
      page: res.page || params.page || 1,
      pageSize: res.pageSize || params.pageSize || 20
    }
  } catch (error) {
    console.log('[API] getDetectHistory:', error.message)
    return { records: [], total: 0, page: params.page || 1, pageSize: params.pageSize || 20 }
  }
}