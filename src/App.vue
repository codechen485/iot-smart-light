<template>
  <div class="app-container">
    <Sidebar />
    <div class="main-content">
      <Header @toggle-sidebar="toggleSidebar" />
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
  margin-left: 220px;
  min-height: 100vh;
  padding-top: 60px;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 60px;
  }
}
</style>
