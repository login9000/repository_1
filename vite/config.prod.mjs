import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

const phasermsg = () => {
  return {
    name: "phasermsg",
    buildStart() {
      process.stdout.write(`Building for production...\n`);
    },
    buildEnd() {
      const line = "---------------------------------------------------------";
      const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
      process.stdout.write(`${line}\n${msg}\n${line}\n`);

      process.stdout.write(`✨ Done ✨\n`);
    },
  };
};

// Плагин для добавления версии (timestamp) к URL ассетов
const appendTimestamp = () => {
  return {
    name: "append-timestamp",
    transformIndexHtml(html) {
      const timestamp = Date.now(); // Генерируем timestamp
      return html.replace(/(\.(js|css))(")/g, `$1?v=${timestamp}$3`);
    },
  };
};

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true }), phasermsg(), appendTimestamp()],
  base: "./",
  logLevel: "warning",
  build: {
    // Генерируем хэш для имен файлов на основе их содержимого
    // Это гарантирует, что при изменении содержимого файла изменится и его имя
    // minify: false,
    // terserOptions: {
    //   compress: false,
    //   mangle: false,
    // },
    rollupOptions: {
      // treeshake: {
      //   correctVarValueBeforeDeclaration: true
      // },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: {
          phaser: ["phaser"],
        },
      },
    },
    // Используем строгие настройки кэширования
    manifest: true, // Создает manifest.json файл с маппингом имен файлов
    minify: "terser",
    terserOptions: {
      compress: {
        passes: 2
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
  },
});