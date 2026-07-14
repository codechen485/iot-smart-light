<template>
  <header class="header">
    <div class="header-left">
      <button class="menu-toggle" @click="$emit('toggleSidebar')">
        <component :is="icons.Menu" />
      </button>
      <div class="page-title">
        {{ pageTitle }}
      </div>
    </div>
    
    <div class="header-right">
      <div class="status-badge">
        <span class="status-dot online"></span>
        <span class="status-text">系统在线</span>
      </div>
      <div class="user-info">
        <component :is="icons.User" class="user-icon" />
        <span class="user-name">管理员</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, User } from '@element-plus/icons-vue'

const icons = { Menu, User }
const route = useRoute()

const pageTitleMap = {
  '/': '系统总览',
  '/devices': '设备管理',
  '/monitor': '实时监控',
  '/alerts': '告警管理',
  '/detect': '智能检测'
}

const pageTitle = computed(() => {
  if (route.path.startsWith('/device/')) {
    return '设备详情'
  }
  return pageTitleMap[route.path] || '智能灯杆系统'
})

defineEmits(['toggleSidebar'])
</script>

<style scoped>
.header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  left: 220px;
  right: 0;
  top: 0;
  z-index: 99;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-toggle {
  width: 36px;
  height: 36px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.menu-toggle:hover {
  background: #e2e8f0;
}

.menu-toggle svg {
  width: 18px;
  height: 18px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.status-dot.online {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.user-icon {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.user-name {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

@media (max-width: 768px) {
  .header {
    left: 60px;
    padding: 0 12px;
  }
  
  .page-title {
    font-size: 14px;
  }
  
  .status-badge {
    display: none;
  }
  
  .user-name {
    display: none;
  }
  
  .user-info {
    padding: 6px;
  }
}
</style>
