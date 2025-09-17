<script setup>
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '../stores/user';
import { useMenuStore } from '../stores/menu';
import emitter from "../plugins/emitter";

const props = defineProps({
  userId: {
    type: Number,
    default: null
  }
});

const userStore = useUserStore();
const menuStore = useMenuStore();
const userData = ref(null);
const isLoading = ref(false);
const error = ref(null);


console.log('player-menu-id', menuStore.currentUserId);

// Функция для загрузки данных пользователя
async function loadUserData(userId) {
  if (!userId) return;

  isLoading.value = true;
  error.value = null;

  try {
    await userStore.fetchExternalUserData(userId);
    userData.value = userStore.externalUserData;
    console.log("Загружены данные пользователя:", userData.value);
  } catch (err) {
    console.error("Ошибка при загрузке данных пользователя:", err);
    error.value = err.message || "Не удалось загрузить данные пользователя";
  } finally {
    isLoading.value = false;
  }
}

// Загружаем данные при монтировании и при изменении userId
onMounted(() => {
  if (props.userId) {
    loadUserData(props.userId);
  }
});

watch(() => props.userId, (newId) => {
  if (newId) {
    loadUserData(newId);
  }
});

// Функция для открытия приватного чата
function openPrivateChat() {
  if (props.userId) {
    emitter.emit("player-private-chatting", props.userId);
  }
}

// Функция для начала видеовызова
function startVideoCall() {
  if (props.userId) {
    emitter.emit("open-video-form", {
      type: 'outgoing',
      targetId: props.userId
    });
  }
}
</script>
<template>

   

</template>

<style scoped>
.filler {
  width: 100%;
  height: 100%;
  max-height: 100%;
  /* display: grid; */
  /* grid-template-rows: min-content min-content auto; */

  iframe {
    border: 0px;
    background: transparent;
    min-height: 800px;
    width: 100%;
  }
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: white;
}

.loading-text,
.error-text {
  margin-top: 16px;
  font-size: 16px;
}

.money {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.money-value {
  font-weight: bold;
}

.main-data {
  display: grid;
  grid-template-rows: auto auto;
}

.control {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  margin: 1rem 0;
}

.superheader {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.user {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.rating {
  display: flex;
  align-items: center;
  align-content: center;
  column-gap: 0.5rem;
  color: white;
}

.header {
  font-size: 1.2rem;
  color: white;
  text-align: center;
  margin: 1rem 0;
}

.info-container {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 1rem;
  color: white;
}

.info-item {
  margin-bottom: 8px;
}

.info-label {
  font-weight: bold;
  margin-right: 8px;
  color: #aaa;
}

.info-value {
  color: white;
}

.about-text {
  margin-top: 8px;
  white-space: pre-wrap;
}

.no-photos {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: grey;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}
</style>