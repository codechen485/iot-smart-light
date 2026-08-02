<template>
  <aside class="sidebar" :class="{ collapsed: collapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <component :is="icons.Lightbulb" class="logo-icon" />
        <span class="logo-text">智能灯杆</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: $route.path === item.path }"
      >
        <component :is="item.icon" class="nav-icon" />
        <span class="nav-text">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import {
  Cpu,
  Clock,
  Bell,
  Camera,
  Lightning
} from '@element-plus/icons-vue'

defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const icons = {
  Cpu,
  Clock,
  Bell,
  Camera,
  Lightbulb: Lightning
}

const menuItems = [
  { path: '/devices', label: '设备管理', icon: Cpu },
  { path: '/history', label: '历史查询', icon: Clock },
  { path: '/alerts', label: '告警管理', icon: Bell },
  { path: '/detect', label: '智能检测', icon: Camera }
]
</script>

<style scoped>
.sidebar {
  width: 220px;
  background: #1e293b;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 100;
  overflow: hidden;
}

/* 收缩状态：宽度变为 64px，隐藏文字 */
.sidebar.collapsed {
  width: 64px;
}

.sidebar.collapsed .logo-text,
.sidebar.collapsed .nav-text {
  display: none;
}

.sidebar.collapsed .sidebar-header {
  padding: 16px;
  display: flex;
  justify-content: center;
}

.sidebar.collapsed .logo {
  justify-content: center;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 14px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #334155;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: #4a6cf7;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 6px;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(74, 108, 247, 0.1);
  color: #cbd5e1;
}

.nav-item.active {
  background: rgba(74, 108, 247, 0.15);
  color: #4a6cf7;
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-text {
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }

  .logo-text {
    display: none;
  }

  .nav-text {
    display: none;
  }

  .sidebar-header {
    padding: 16px;
    display: flex;
    justify-content: center;
  }

  .logo {
    justify-content: center;
  }

  .nav-item {
    justify-content: center;
    padding: 14px;
  }
}
</style>
