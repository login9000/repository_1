<script setup>
import emitter from "../plugins/emitter";
import PlayerProfile from "./PlayerProfile.vue";
import NonPlayerProfile from "./NonPlayerProfile.vue";
import { nextTick, ref, watch } from "vue";
import { useMenuStore } from "../stores/menu";

const menuStore = useMenuStore();
const delayTrigger = ref(false);

watch(
  () => menuStore.menuState,
  (value) => {
    nextTick(() => (delayTrigger.value = !!value));
  }
);

function handleMenuClose() {
  menuStore.setMenuState("");
  menuStore.setCurrentUser(null);
}
</script>
<template>
</template>
<style scoped>
.close-button {
  position: absolute;
  z-index: 999;
  top: -0.5rem;
  left: -0.5rem;
}

.profile {
  position: absolute;
  bottom: 1rem;
  top: 1rem;
  right: 1rem;
  height: calc(100% - 2rem);
  width: 400px;
  background-color: transparent;
  padding: 1rem;
}

.profile-anchor {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>