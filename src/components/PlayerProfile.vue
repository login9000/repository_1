<script setup>
import SettingsDialog from "./SettingsDialog.vue";
import { onMounted, onUnmounted , computed ,ref } from "vue";

import {useUserStore} from "../stores/user.js";

const dialog = ref(false);
const userStore = useUserStore();

const userData = computed(() => userStore.externalUserData);

const fetchProfileUserData = async (userId) => {
 
 try {
  await userStore.fetchExternalUserData(userId);
 } catch (err) {
  
  console.error('Error fetching user data:', err);
 } finally {
  //console.log("Data fe")
 }
};


onMounted(async () => {
 const userData = userStore.user;
  console.log("Player Profile userData:",userData);
 
  if(userData?.id) {
   await userStore.fetchExternalUserData(userData.id);
  }
});
function handleOpenSettings() {
  dialog.value = true;
}
</script>
<template>
  <div class="filler">
    <v-row>
      <v-col cols="auto">
        <v-avatar color="surface-variant" size="80">
         
         <v-img v-if="userData?.imgurl" :src="`https://escape-iq.com/`+userData?.imgurl" >
         </v-img>
         <v-img v-else
            src="https://images.unsplash.com/photo-1599834562135-b6fc90e642ca?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          ></v-img>
        </v-avatar>
      </v-col>
      <v-col class="main-data">
        <div class="user">
          <div class="superheader" v-if="userStore?.user?.username"> {{ userStore?.user?.username ?? 'Иван' }} </div>
          <div class="rating">
            <v-icon icon="mdi-star" color="yellow"></v-icon>
            <div>4.7</div>
          </div>
        </div>
        <div class="friends">0 друзей</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card variant="outlined" color="white">
          <template v-slot:title>
            <div class="money">
              <div>Баланс</div>
              <div class="money-value">99 $</div>
            </div>
          </template>
          <template v-slot:actions>
            <v-btn text="Пополнить"></v-btn>
          </template>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="control">
        <v-btn prepend-icon="mdi-gift" stacked size="small">Мои подарки</v-btn>
        <v-btn
          prepend-icon="mdi-cog"
          stacked
          @click="handleOpenSettings"
          size="small"
        >
          Настройки
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col align-self="end">
        <div class="header">Ваши фотографии</div>
        <v-carousel height="300px" show-arrows="hover">
          <v-carousel-item
            src="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
            cover
          ></v-carousel-item>
          <v-carousel-item
            src="https://cdn.vuetifyjs.com/images/cards/hotel.jpg"
            cover
          ></v-carousel-item>
          <v-carousel-item
            src="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg"
            cover
          ></v-carousel-item>
        </v-carousel>
      </v-col>
    </v-row>
    <SettingsDialog v-model="dialog" />
  </div>
</template>
<style scoped>
.filler {
  width: 100%;
  height: 100%;
  max-height: 100%;
  display: grid;
  grid-template-rows: min-content min-content min-content calc(100% - 310px);
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
}
.rating {
  display: flex;
  align-items: center;
  align-content: center;
  column-gap: 0.5rem;
  color: white;
}
.friends {
  color: white;
}
.header {
  font-size: 1.2rem;
  color: white;
  text-align: center;
}
</style>
