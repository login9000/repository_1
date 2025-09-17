// /src/main.js

import { createApp } from "vue";
import App from "./App.vue";

import "vuetify/styles";
import { createVuetify } from "vuetify";
import { createPinia } from "pinia";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "@mdi/font/css/materialdesignicons.css";
import veProgress from "vue-ellipse-progress";

// Импортируем тестовый файл для PlayerQuickInfo
import './plugins/testPlayerQuickInfo';

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
});


// console.log("Main.js: Initializing application");

const pinia = createPinia();

const app = createApp(App);

app.use(vuetify);
app.use(pinia);
app.use(veProgress);

app.mount("#app");
