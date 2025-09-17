import { defineStore } from "pinia";
import { ref } from "vue";

export const useSkinStore = defineStore("skin", () => {
  const currentSkin = ref("woman3");

  function setCurrentSkin(value) {
    currentSkin.value = value;
  }

  return { currentSkin, setCurrentSkin };
});
