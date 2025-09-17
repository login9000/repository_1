<script setup>
import { nextTick, ref } from "vue";
import emitter from "../plugins/emitter";
import { useMenuStore } from "../stores/menu";

const menuStore = useMenuStore();

const isOpen = ref(false);
function handleProfileClick() {
  menuStore.setMenuState("user");
}

emitter.on("click-menu", () => {
  if (isOpen.value) {
    isOpen.value = false;
    nextTick(() => {
      isOpen.value = true;
    });
  } else {
    isOpen.value = true;
  }
});

emitter.on("close-menu", () => {
  isOpen.value = false;
});
</script>
<template>
  <v-expand-transition>
    <div class="profile-preview" v-if="isOpen">
      <div @click="handleProfileClick" style="position: relative">
        <v-avatar color="surface-variant" size="120" class="avatar">
          <v-img
            src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          ></v-img>
        </v-avatar>
        <div class="name">Наташа</div>
        <v-btn
          class="close-button"
          icon="mdi-close"
          size="xs"
          @click.stop="() => (isOpen = false)"
        />
        <div class="profile-text">
          <div style="text-align: center">Открыть профиль</div>
        </div>
      </div>
    </div>
  </v-expand-transition>
</template>
<style scoped>
.profile-preview {
  position: absolute;
  top: 1rem;
  right: 1rem;
  cursor: pointer;
}
.name {
  text-align: center;
  color: white;
  font-size: 1.3rem;
  font-weight: bold;
}

.close-button {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
}

.avatar {
  transition: all 0.2s;
  z-index: 2;
}

.avatar:hover {
  opacity: 0.2;
}

.profile-text {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  width: 120px;
  height: 120px;
  background-color: black;
  border-radius: 9999px;
  z-index: 1;
  font-weight: bold;
  color: white;
}
</style>
