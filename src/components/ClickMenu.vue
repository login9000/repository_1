<script setup>
import { ref, watch } from "vue";
import { useMenuStore } from "../stores/menu";

const menuStore = useMenuStore();

const showMenu = ref(false);
const showMenuDelayed = ref(false);
const position = ref({
  x: 0,
  y: 0,
});
const currentPage = ref("profile");

function toggle({ x, y }) {
  position.value.x = x - 70;
  position.value.y = y - 200;
  showMenu.value = !showMenu.value;
}

function close() {
  showMenu.value = false;
}

function handleClose(e) {
  showMenu.value = e.target.checked;
}

watch(
  () => showMenu.value,
  () => {
    menuStore.isMenuOpen = showMenu.value;
    setTimeout(() => {
      showMenuDelayed.value = showMenu.value;
    }, 0);
  }
);

defineExpose({ toggle, close, currentPage });
</script>

<template>
  <Transition>
    <div
      class="menu"
      v-if="showMenu"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
    >
      <input
        type="checkbox"
        href="#"
        class="menu-open"
        name="menu-open"
        id="menu-open"
        @change.stop="handleClose"
        :checked="showMenuDelayed"
      />
      <label class="menu-open-button" for="menu-open" @change="handleClose">
        <span className="mdi mdi-close-thick"></span>
      </label>
      <a @click.stop="currentPage = 'profile'" class="menu-item item-1"
        ><i class="mdi mdi-account-circle" aria-hidden="true"></i
      ></a>
      <a @click.stop="currentPage = 'chat'" class="menu-item item-2"
        ><i class="mdi mdi-chat" aria-hidden="true"></i
      ></a>
      <a @click.stop="currentPage = 'shop'" class="menu-item item-3"
        ><i class="mdi mdi-gift" aria-hidden="true"></i
      ></a>
    </div>
  </Transition>
</template>
<style scoped>
.menu {
  position: absolute;
  margin: auto;
  top: 0;
  left: 0;
  width: 80px;
  height: 80px;
  text-align: center;
  box-sizing: border-box;
  font-size: 26px;
}

.menu.active {
  opacity: 1;
}

.menu-item {
  box-shadow: none;
  transition-delay: 1s;
}

.menu-item:hover,
.menu-open-button:hover {
  background: #c566bd;
}

.menu-item,
.menu-open-button {
  position: absolute;
  background: #984e92;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  color: #ffffff;
  text-align: center;
  line-height: 50px;

  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  -webkit-transition: -webkit-transform ease-out 200ms;
  transition: -webkit-transform ease-out 200ms;
  transition: transform ease-out 200ms, -webkit-transform ease-out 200ms;
  transition-delay: 0.2s;
}

.menu-open {
  display: none;
}

.menu-open-button {
  z-index: 2;
  cursor: pointer;
}

.menu-open:checked ~ .menu-item:nth-child(3) {
  transition-duration: 150ms;
  -webkit-transition-duration: 150ms;
  -webkit-transform: translate3d(0px, -60px, 0);
  transform: translate3d(0px, -60px, 0);
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
}

.menu-open:checked ~ .menu-item:nth-child(4) {
  transition-duration: 200ms;
  -webkit-transition-duration: 200ms;
  -webkit-transform: translate3d(50px, 40px, 0);
  transform: translate3d(50px, 40px, 0);
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
}

.menu-open:checked ~ .menu-item:nth-child(5) {
  transition-duration: 250ms;
  -webkit-transition-duration: 250ms;
  -webkit-transform: translate3d(-50px, 40px, 0);
  transform: translate3d(-50px, 40px, 0);
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
}

/* i {
  text-shadow: 0px 0px 5px rgba(0, 0, 0, 1);
} */

.v-enter-active,
.v-leave-active {
  transition: opacity 0.1s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
