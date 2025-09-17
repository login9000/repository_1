<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import StartGame from "./main";
import { useUserStore } from "../stores/user";
import {useSkinStore} from "../stores/skin.js";

const game = ref();
const userStore = useUserStore();
const skinStore = useSkinStore();

onMounted(async () => {
 console.log("Проверка авторизации...");
 if (userStore.isAuthenticated) {
  console.log("Пользователь авторизован:", userStore.isAuthenticated);
  console.log("Токен:", userStore.token);
  console.log("Данные пользователя:", userStore.user);
  
  try {
   if (!userStore.user) {
    console.log("Загрузка данных пользователя...");
    await userStore.fetchUserData();
   }
   
   if (userStore.user) {
    console.log("Данные пользователя загружены:", userStore.user);
    
    // Устанавливаем скин пользователя в SkinStore
    if (userStore.user.avatar) {
     skinStore.setCurrentSkin(userStore.user.avatar);
     console.log("Текущий скин установлен:", userStore.user.avatar);
    } else {
     console.warn("У пользователя отсутствует аватар. Установлено значение по умолчанию.");
     skinStore.setCurrentSkin("man1"); // Установите значение по умолчанию
    }
    
    game.value = StartGame("game-container", {
     userId: userStore.user.id,
     username: userStore.user.username,
     token: userStore.token,
     avatar: userStore.user.avatar,
    });
   } else {
    console.error("Данные пользователя не загружены");
   }
  } catch (err) {
   console.error("Ошибка загрузки данных пользователя:", err);
  }
 } else {
  console.log("Пользователь не авторизован");
 }
});

</script>
<template>
  <div id="game-container"></div>
</template>
<style scoped>
#game-container {
  width: 100vw;
  height: 100vh;
}
</style>
