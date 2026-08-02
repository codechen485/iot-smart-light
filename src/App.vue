<template>
  <div class="app-container">
    <Sidebar :collapsed="sidebarCollapsed" />
    <div class="main-content" :style="{ marginLeft: sidebarCollapsed ? '64px' : '220px' }">
      <Header :collapsed="sidebarCollapsed" @toggle-sidebar="toggleSidebar" />
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/layout/Sidebar.vue'
import Header from './components/layout/Header.vue'

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.main-content {
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  padding-top: 60px;
  transition: margin-left 0.3s ease;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 60px !important;
  }
}
</style>
