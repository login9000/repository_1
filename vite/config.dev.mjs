import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    nodePolyfills({
      include: ['crypto']
    }),
  ],
  base: "/disco-dev/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: true,
    port: 8081,
    proxy: {
      // '/assets/style.css': 'http://localhost:8800/assets/style.css',
      // '/disco-dev/docs/users/_sidebar.md': 'http://localhost:8800/docs/_sidebar.md',
      // '/disco-dev/docs/map/_sidebar.md': 'http://localhost:8800/docs/_sidebar.md',
      // '/disco-dev/docs/users/coordinates/_sidebar.md': 'http://localhost:8800/docs/_sidebar.md',
      // '/disco-dev/docs/users/messages/_sidebar.md': 'http://localhost:8800/docs/_sidebar.md',
      // '/token': {
      //   target: 'http://localhost:8800/token',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // },
     //  '/my': {
      //   target: 'http://localhost:8800/my',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // },
      // '/ws': {
      //   target: 'ws://localhost:8800',
      //   ws: true, // Включаем поддержку WebSocket
      //   changeOrigin: true,
        //rewrite: (path) => path.replace(/^\/ws/, ''),
      // },


    }
  },
});
