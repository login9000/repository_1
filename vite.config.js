import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "./",
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 8081, // Замените на нужный вам порт
    open: true, // Опционально: автоматически открывать браузер при запуске
    proxy: {
      // Опционально: настройка прокси-сервера
    },
  },
})
