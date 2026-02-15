import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz'
    }),
    visualizer({
      open: false,
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ],
  esbuild: {
    drop: ['console', 'debugger']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2015',
    // minify: 'terser',
    minify: 'esbuild',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 3000, // 调高警告阈值到 3MB，适应包含重型预览库的项目
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true
    //   }
    // },
    // cssCodeSplit: false, // 精准定位：禁用 CSS 代码拆分，确保所有样式合并到同一个文件，严格遵循导入顺序
    rollupOptions: {
      output: {
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. 核心框架运行时 (核心全家桶 + 基础工具库 + 紧耦合插件及其底层依赖) (必须保持自洽，避免循环依赖)
            // 必须包含 axios 和 nprogress，因为它们常被 router/store 引用，不并入会导致循环依赖 (vendor <-> framework)
            // 将 vuedraggable 纳入 framework 是为了解决它与 Vue 的初始化顺序问题，必须包含 sortablejs，因为 vuedraggable 依赖它，否则会产生循环依赖 (vendor <-> framework)
            if (
              id.includes('node_modules/vue/') || 
              id.includes('node_modules/@vue/') || 
              id.includes('node_modules/pinia/') || 
              id.includes('node_modules/vue-router/') ||
              id.includes('node_modules/vue-demi/') ||
              id.includes('node_modules/axios/') ||
              id.includes('node_modules/nprogress/') ||
              id.includes('node_modules/vuedraggable/') ||
              id.includes('node_modules/sortablejs/')
            ) {
              return 'framework'
            }

            // 2. 核心 UI 组件库
            if (id.includes('element-plus') || id.includes('@element-plus')) {
              return 'element-plus'
            }

            // 3. 业务重型库 - 编辑器细分
            if (id.includes('md-editor-v3')) return 'editor-md'
            if (id.includes('prismjs')) return 'editor-prism'

            // 4. 业务重型库 - Office 预览细分
            if (id.includes('@vue-office/docx')) return 'office-docx'
            if (id.includes('@vue-office/excel')) return 'office-excel'
            if (id.includes('@vue-office/pdf') || id.includes('pdfjs-dist')) return 'office-pdf'
            if (id.includes('@vue-office/pptx')) return 'office-pptx'

            // 5. 其他杂项第三方库
            return 'vendor'
          }
        }
      }
    }
  },
  server: {
    port: 8443,
    host: true, // 监听所有网卡，支持通过域名访问
    allowedHosts: ['freecity.club', 'www.freecity.club', 'localhost'], // Vite 6+ 需要显式放行自定义域名
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
