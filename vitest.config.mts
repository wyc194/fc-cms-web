import { defineConfig } from 'vitest/config'
import path from 'path'

// 前端单元测试配置：只跑纯逻辑（工具函数、store 计算），不渲染组件，保持快速稳定
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts']
  }
})
