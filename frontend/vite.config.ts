import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react-window'],
  },
  build: {
    // 启用CSS代码分割
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // 更精细的代码分割策略
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const moduleName = id.toString().split('node_modules/')[1].split('/')[0].toString()
            
            // React生态单独打包
            if (moduleName === '@react' || moduleName === 'react' || moduleName === 'react-dom') {
              return 'vendor-react'
            }
            
            // UI组件库单独打包
            if (moduleName === 'recharts' || moduleName === '@headlessui' || moduleName === 'lucide-react') {
              return 'vendor-ui'
            }
            
            // 数据管理单独打包
            if (moduleName === '@tanstack' || moduleName === 'zustand' || moduleName === 'jotai') {
              return 'vendor-query'
            }
            
            // 其他node_modules打包为vendor-others
            return 'vendor-others'
          }
        },
        // 配置chunk文件名格式
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  // 生产环境预加载提示
  preview: {
    port: 4173,
  },
})
