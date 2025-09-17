<script setup>
import { ref, watch } from "vue";
import { useSkinStore } from "./../stores/skin";
import {useUserStore} from "../stores/user.js";


const skinStore = useSkinStore();
const userStore = useUserStore();

const avatarItems = [
  {
    title: "Парень 1",
    value: "man1",
  },
  {
    title: "Man 1",
    value: "Man_1",
  },
  {
    title: "Man 2",
    value: "Man_2",
  },
  {
    title: "Man 3",
    value: "Man_3",
  },
  {
    title: "Man 4",
    value: "Man_4",
  },
  {
    title: "Девушка 1",
    value: "woman1",
  },
  {
    title: "Девушка 2",
    value: "woman2",
  },
  {
    title: "Девушка 3",
    value: "woman3",
  },
  {
    title: "Девушка 4",
    value: "woman4",
  },
  {
    title: "Girl 1",
    value: "womanG1",
  },
  {
    title: "Girl 2",
    value: "womanG2",
  },
  {
    title: "Girl 3",
    value: "womanG3",
  },
  {
    title: "Girl 4",
    value: "womanG4",
  },
  {
    title: "Girl 5",
    value: "womanG5",
  },
  {
    title: "Ninja",
    value: "Ninja",
  },
  {
    title: "Girl Super",
    value: "GS1",
  },
  {
    title: "A1 Super",
    value: "A1",
  },
  {
    title: "Elvis",
    value: "Elvis",
  },
  {
    title: "Macho",
    value: "Macho",
  },
  {
    title: "Snow White",
    value: "SnowWhite",
  },
  {
    title: "Strannik",
    value: "Strannik",
  },
  {
    title: "BlondeMan",
    value: "BlondeMan",
  },
  {
    title: "Lolita",
    value: "Lolita",
  },
];

const avatarState = ref({
  title: "Парень 1",
  value: "man1",
});

watch(
 () => avatarState.value,
 async () => {
  skinStore.setCurrentSkin(avatarState.value); // Устанавливаем текущий скин в SkinStore
  
  try {
   // Вызываем updateAvatar после изменения скина
   const userId = userStore.user?.id || 0; // Убедитесь, что user.id доступен
   await userStore.updateAvatar(userId, avatarState.value);
   console.log("Аватар успешно обновлен!");
  } catch (error) {
   console.error("Ошибка при обновлении аватара:", error.message);
  }
 },
 {
  deep: true,
 }
);
</script>
<template>
  <v-dialog max-width="500">
    <template v-slot:default="{ isActive }">
      <v-card title="Настройки">
        <v-card-text>
          <p style="margin-bottom: 2rem">Выберите скин персонажа</p>
          <v-select
            v-model="avatarState"
            label="Скин"
            :items="avatarItems"
            variant="outlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn text="Закрыть" @click="isActive.value = false"></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
