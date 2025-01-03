import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Checker from 'vite-plugin-checker'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' // or "modern"
      }
    }
  },
  plugins: [vue(), Checker({ typescript: true }),
  AutoImport({
    imports: [
      'vue',
      {
        'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
      },
    ],
  }),
  Components({
    resolvers: [NaiveUiResolver()]
  })

  ],
  server: {
    port: 3090,
    proxy: {
      '/api': {
        target: 'http://localhost:3091',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },

})
