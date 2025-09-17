<script setup>
import Game from "./game/Game.vue";
import { onMounted, ref, computed, watch } from "vue";

import emitter from "./plugins/emitter";
import ClickMenu from "./components/ClickMenu.vue";
import ChatPanel from "./components/ChatPanel.vue";
import ProfilePanel from "./components/ProfilePanel.vue";
import ProfilePreview from "./components/ProfilePreview.vue";
import { useMenuStore } from "./stores/menu";
import { useUserStore } from './stores/user';
import ProfileMenu from "./components/ProfileMenu.vue";
import LoginForm from "./components/LoginForm.vue";
import VideoForm from "./components/VideoForm.vue";
import PrivateChat from "./components/PrivateChat.vue";
import PrivateChatAvatars from "./components/PrivateChatAvatars.vue";
import RadioControl from "./components/RadioControl.vue";
import PlayerQuickInfo from "./components/PlayerQuickInfo.vue";
import Bootloader from "./components/Bootloader.vue";
import CharacterStore from "./components/CharacterStore.vue";
import CharacterActionMenu from "./components/CharacterActionMenu.vue";
import { getCurrentInstance } from 'vue'
const instance = getCurrentInstance();

const menuStore = useMenuStore();
const userStore = useUserStore();
const isLoading = ref(true);
const error = ref(null);

console.log("App: Initializing component imports");

const chatModal = ref();
const profileModal = ref();
const clickMenu = ref();
const isVideoFormVisible = ref(false);
const inactiveScreen = ref(false);
// const isPrivateChatVisible = ref(false); // Переменная для контроля видимости
var isPrivateChatVisible = false;
const sendMessUserId = ref(0);
let gameInstance = ref(null);
let avatarsShown = ref(false);
let showBootloader = true;
let showCharacterStore = true;

console.log('inactiveScreen', inactiveScreen);
emitter.on('inactive-screen', (status) => {
  inactiveScreen.value = status;
});

emitter.on("avatars-shown", (status) => {
  avatarsShown.value = status;
});

const modules = {
  profile: "Профиль пользователя",
  chat: "Чат с пользователем",
  shop: "Магазин подарков",
};

function handleProfileButton() {
  menuStore.setMenuState("personal");
}

function openVideoCall() {
  isVideoFormVisible.value = true;
  emitter.emit('open-video-form', { type: 'outgoing' });
}

function toggleRadio() {
  emitter.emit('radio-toggle');
}

// Функция для открытия приватного чата
function openPrivateChat() {
  isPrivateChatVisible = true;
  // Используем ID 0, что означает, что пока получатель не выбран
  sendMessUserId.value = 0;
  window.gameInstance.currentChattingUserId = null;
  emitter.emit('player-private-chatting', 0);
}

emitter.on("open-video-form", () => {
  isVideoFormVisible.value = true;
});

emitter.on("hide-video-form", () => {
  isVideoFormVisible.value = false;
});

emitter.on("player-private-chatting", (valueId) => {
  console.log("App: Received player-private-chatting event with ID:", valueId);

  // Если компонент уже видим и ID тот же, просто обновляем данные
  if (isPrivateChatVisible && sendMessUserId.value === valueId) {
    // Отправляем специальное событие для обновления имени получателя
    emitter.emit('update-recipient-name', valueId);
    isPrivateChatVisible = true;
    instance?.proxy?.$forceUpdate();
    console.log("Chat already visible - just refreshing recipient data", isPrivateChatVisible);
    return;
  }

  // Устанавливаем ID пользователя для чата
  sendMessUserId.value = valueId;
  // Показываем компонент чата
  isPrivateChatVisible = true;
  instance?.proxy?.$forceUpdate();

  console.log("Chat state updated:", isPrivateChatVisible, "with user ID:", sendMessUserId.value);
});


emitter.on("close-private-chat", () => {
  console.log("App: Received close-private-chat event");

  if (Object.keys(window.gameInstance.bubbleMessages.others).length == 0 || window.gameInstance.currentChattingUserId == null) {
    // Скрываем компонент приватного чата
    isPrivateChatVisible = false;

    // Сбрасываем ID пользователя
    sendMessUserId.value = 0;
    console.log("App: Chat closed, state:", isPrivateChatVisible.value);
  }

  // console.log('isPrivateChatVisible',isPrivateChatVisible);

});




// Прослушиваем новое событие для обеспечения видимости приватного чата
emitter.on("ensure-private-chat-visible", (userId) => {
  console.log("Ensuring chat is visible with user:", userId);
  isPrivateChatVisible = true;
  sendMessUserId.value = userId;
});

// Обработчик события открытия профиля
emitter.on("open-profile", (data) => {
  if (data && data.playerId) {
    // Открываем профиль через существующий механизм
    menuStore.setMenuState("external");
    menuStore.setCurrentUser(data.playerId);
  }
});


emitter.on("bootloader-loading", (loaded, message) => {
  showBootloader = loaded;
});

emitter.on("show-skin-selector", (state) => {
  showCharacterStore = state;
  instance?.proxy?.$forceUpdate();
});



onMounted(async () => {
  try {
    if (userStore.isAuthenticated) {
      console.log("Пользователь авторизован, загружаем данные...");
      await userStore.fetchUserData();
    }
    isLoading.value = false;

    emitter.on('game-instance', (instance) => {
      gameInstance.value = instance;
    });

  } catch (err) {
    console.error("Ошибка при загрузке данных:", err);
    error.value = err.message;
    isLoading.value = false;
  }
});

const components = globalThis.components;

defineExpose({ components, isPrivateChatVisible });

</script>

<template>
  <Suspense>
    <div class="app-container">
      <template v-if=(inactiveScreen)>
        <div class="inactive-screen"></div>
      </template>
      <template v-if="isLoading">Загрузка...</template>
      <template v-else-if="error" class="error">{{ error }}</template>
      <template v-else>
        <template v-if="!userStore.isAuthenticated">
          <LoginForm />
        </template>
        <template v-else>

          <template v-if="showCharacterStore">
            <CharacterStore />
          </template>
          <template v-else>

            <Bootloader v-if="showBootloader" />
            <Game class="container-game" style="z-index: 0" />
            <RadioControl :game-instance="gameInstance" />
            <ChatPanel style="z-index: 999" v-show="true" />

            <!-- Кнопка "Мысли" в виде облачка в правом нижнем углу -->
            <button @click="openPrivateChat" class="thoughts-button" title="Мысли">
              <div class="thought-bubble">
                <span>Мысли</span>
              </div>
            </button>

            <VideoForm style="z-index: 999" v-show="isVideoFormVisible" />

            <!-- Компонент PrivateChat, скрыт по умолчанию -->

            <div class="actions-container">
              <ProfileMenu :avatarsShown="avatarsShown" />

              <!--<CharacterActionMenu />-->

              <PrivateChatAvatars />
              <PrivateChat style="z-index: 999" :class="isPrivateChatVisible ? 'shown' : 'hidden'"
                :other-user-id="sendMessUserId" />

              <!-- Добавляем компоненты для взаимодействия с персонажами -->
              <PlayerQuickInfo />


            </div>

            <ProfilePreview />

            <!--<v-btn v-if="false" @click="handleProfileButton" class="profile-button" prepend-icon="mdi-account"
              size="small" stacked>
              Мой профиль
            </v-btn>-->


            <ProfilePanel />
          </template>

        </template>
      </template>
    </div>
  </Suspense>
  <!--<div v-html="components.media_window"></div>
  <div v-html="components.black_list_window"></div>
  <div v-html="components.error_window"></div>
  <div v-html="components.crop_avatar_window"></div>
  <div v-html="components.choice_locations_window"></div>
  <div v-html="components.friends_list_window"></div>
  <div v-html="components.confirm_delete_friend_window"></div>
  <div v-html="components.complaint_window"></div>-->
</template>

<style scoped>
.inactive-screen {
  position: fixed;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  backdrop-filter: grayscale(100%);
  z-index: 99;
}

.actions-container {
  position: fixed;
  left: 25%;
  width: 50%;
  bottom: 20px;
}

.shown {
  display: block !important;
}

.hidden {
  display: none !important;
}

.media_window {
  position: fixed;
  z-index: 9999;
  top: 0px;
}

.profile-button {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}

.app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.error {
  color: red;
  font-weight: bold;
}

/* Стили для кнопки "Мысли" в виде облачка */
.thoughts-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 0;
  padding: 0;
  transition: transform 0.2s;
}

.thoughts-button:hover {
  transform: scale(1.05);
}

.thought-bubble {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 60px;
  background-color: white;
  border-radius: 50%;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  padding: 10px;
}

/* Создаем облачко мыслей с "хвостиками" */
.thought-bubble:before,
.thought-bubble:after {
  content: '';
  position: absolute;
  background-color: white;
  border-radius: 50%;
}

.thought-bubble:before {
  width: 20px;
  height: 20px;
  bottom: -10px;
  right: 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.thought-bubble:after {
  width: 10px;
  height: 10px;
  bottom: -20px;
  right: 5px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}
</style>