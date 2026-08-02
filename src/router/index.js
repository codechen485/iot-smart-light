import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/devices'
    },
    {
      path: '/devices',
      name: 'DeviceList',
      component: () => import('../views/DeviceList.vue')
    },
    {
      path: '/device/:id',
      name: 'DeviceDetail',
      component: () => import('../views/DeviceDetail.vue')
    },
    {
      path: '/history',
      name: 'History',
      component: () => import('../views/History.vue')
    },
    {
      path: '/alerts',
      name: 'Alerts',
      component: () => import('../views/Alerts.vue')
    },
    {
      path: '/detect',
      name: 'Detect',
      component: () => import('../views/Detect.vue')
    }
  ]
})

export default router
