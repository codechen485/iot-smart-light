import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 读取 .env / .env.[mode] 中的环境变量（第三个参数 '' 表示不过滤前缀，可读到全部）
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      proxy: {
        // 后端接口服务：地址来自 .env（VITE_API_TARGET），不再硬编码
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
        // 摄像头/检测服务：地址来自 .env（VITE_CAMERA_TARGET）
        '/camera': {
          target: env.VITE_CAMERA_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    }
  }
})
