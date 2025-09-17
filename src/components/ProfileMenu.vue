<script setup>
import { nextTick, ref } from "vue";
import emitter from "../plugins/emitter";
import { useMenuStore } from "../stores/menu";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

// Import needed icons
import { faVideo, faComment, faHeart, faMicrophone, faStar, faGem, faTimes, faAnchor, faCoffee, faBook } from '@fortawesome/free-solid-svg-icons'

// Add icons to library
library.add(faVideo, faComment, faHeart, faMicrophone, faStar, faGem, faTimes, faAnchor, faCoffee, faBook)

const props = defineProps(['avatarsShown']);

const menuStore = useMenuStore();
const isOpen = ref(false);
const playerID = ref(0);
// Menu should be expanded by default when shown
const isExpanded = ref(true);
// const avatarsShown = ref(false);

function handleProfileClick() {
  menuStore.setMenuState("user");
}

function clickChat() {
  // Преобразуем ID в число для обеспечения согласованности типов
  const playerId = Number(playerID.value);
  console.log("ProfileMenu: Отправка события player-private-chatting с ID:", playerId);
  emitter.emit("player-private-chatting", playerId);
  emitter.emit("ensure-private-chat-visible", playerId);
  // Не закрываем меню после нажатия на кнопку чата
  // Меню закроется только при выходе пользователя из зоны общения
  // или при нажатии кнопки close в чате
}

function openVideoForm() {
  emitter.emit("open-video-form", { targetId: playerID.value });
  // Не закрываем меню после нажатия на кнопку видео
  // Оно должно оставаться открытым для возможности продолжения взаимодействия
}

function closeMenu() {

  window.gameInstance.currentChattingUserId = null;
  console.log("ProfileMenu: Closing menu from X button");
  isOpen.value = false;
  emitter.emit('avatars-shown', false);

  emitter.emit("close-quick-info");

  // Сообщаем игроку, что меню закрыто (вернуть обычную молнию)
  emitter.emit("menu-closed", { playerID: playerID.value });

  // Также закрываем приватный чат при закрытии меню
  emitter.emit("close-private-chat");
}



emitter.on("click-menu2", (obj) => {
  console.log("ProfileMenu: received click-menu2 event:", obj);
  playerID.value = obj.playerID;

  if (isOpen.value) {
    isOpen.value = false;
    nextTick(() => {
      isOpen.value = true;
      // Ensure menu is expanded immediately
      isExpanded.value = true;
      // Сообщаем игроку, что меню открыто (установить зеленую молнию)
      emitter.emit("menu-opened", { playerID: playerID.value });
    });
  } else {
    isOpen.value = true;
    // Ensure menu is expanded immediately
    isExpanded.value = true;
    // Сообщаем игроку, что меню открыто (установить зеленую молнию)
    emitter.emit("menu-opened", { playerID: playerID.value });
  }
});

emitter.on("close-menu2", () => {

  console.log("ProfileMenu: Received close-menu2 event");
  if (Object.keys(window.gameInstance.bubbleMessages.others).length == 0 || window.gameInstance.currentChattingUserId == null) {
    if (isOpen.value) {
      isOpen.value = false;

      window.gameInstance.bubbleMessages.my.flush()

      if (window.gameInstance.bubbles.my !== null && typeof (window.gameInstance.bubbles.my.bubble) == 'object' && window.gameInstance.bubbles.my.bubble !== null) {
        if (typeof (window.gameInstance.bubbles.my.bubble.destroy) == 'function')
          window.gameInstance.bubbles.my.bubble.destroy();
      }
      if (window.gameInstance.bubbles.my !== null && typeof (window.gameInstance.bubbles.my.bubbleText) == 'object' && window.gameInstance.bubbles.my.bubbleText !== null) {
        if (typeof (window.gameInstance.bubbles.my.bubbleText.destroy) == 'function')
          window.gameInstance.bubbles.my.bubbleText.destroy();
      }


      for (let user_id in window.gameInstance.bubbleMessages.others) {
        window.gameInstance.bubbleMessages.others[user_id].messages.flush();
      }

      for (let user_id in window.gameInstance.bubbles.others) {
        if (typeof (window.gameInstance.bubbles.others) == 'object' && window.gameInstance.bubbles.others !== null) {
          if (typeof (window.gameInstance.bubbles.others[user_id].bubble.destroy) == 'function')
            window.gameInstance.bubbles.others[user_id].bubble.destroy();
          if (typeof (window.gameInstance.bubbles.others[user_id].bubbleText.destroy) == 'function')
            window.gameInstance.bubbles.others[user_id].bubbleText.destroy();
        }
        if (typeof (window.gameInstance.bubbles.others[user_id].replyButton) == 'object' && window.gameInstance.bubbles.others[user_id].replyButton !== null) {
          if (typeof (window.gameInstance.bubbles.others[user_id].replyButton.destroy) == 'function')
            window.gameInstance.bubbles.others[user_id].replyButton.destroy();
        }
      }


      // Сообщаем игроку, что меню закрыто (вернуть обычную молнию)
      emitter.emit("menu-closed", { playerID: playerID.value });

      // Также закрываем приватный чат
      emitter.emit("close-private-chat");
    }
  }

});

emitter.on("close-quick-info", () => {
  console.log("ProfileMenu: Received close-quick-info event, closing menu");
  if (isOpen.value) {
    isOpen.value = false;
    // Сообщаем игроку, что меню закрыто (вернуть обычную молнию)
    emitter.emit("menu-closed", { playerID: playerID.value });

    // Также закрываем приватный чат
    emitter.emit("close-private-chat");
  }
});

// Слушаем событие закрытия приватного чата
emitter.on("close-private-chat", () => {

  if (Object.keys(window.gameInstance.bubbleMessages.others).length == 0) {
    console.log("ProfileMenu: Received close-private-chat event");
    window.gameInstance.currentChattingUserId = null;

    if (isOpen.value) {
      isOpen.value = false;
      // Сообщаем игроку, что меню закрыто (вернуть обычную молнию)
      emitter.emit("menu-closed", { playerID: playerID.value });
    }
  }

});

function closeAllMenus() {
  console.log("ProfileMenu: Closing all menus");
  isOpen.value = false;
  emitter.emit("close-quick-info");
  // Сообщаем игроку, что меню закрыто (вернуть обычную молнию)
  emitter.emit("menu-closed", { playerID: playerID.value });

  // Также закрываем приватный чат
  emitter.emit("close-private-chat");
}


// defineExpose({})

</script>

<template>
  <v-expand-transition>
    <div :class="'menu-container ' + (props.avatarsShown ? 'above-avatars' : '')" v-if="isOpen">
      <div class="menu-wrapper">
        <button @click="closeMenu" class="menu-toggle">
          <font-awesome-icon :icon="['fas', 'times']" />
        </button>

        <div class="menu" :class="{ 'expanded': isExpanded }">
          <a href="#" @click.stop="() => (clickChat())" class="menu-item blue">
            <font-awesome-icon :icon="['fas', 'comment']" />
          </a>
          <a href="#" @click.stop="() => (openVideoForm())" class="menu-item green">
            <font-awesome-icon :icon="['fas', 'video']" />
          </a>
          <a href="#" @click.stop="() => (closeAllMenus())" class="menu-item red">
            <font-awesome-icon :icon="['fas', 'heart']" />
          </a>
          <a href="#" @click.stop="() => (closeAllMenus())" class="menu-item purple">
            <font-awesome-icon :icon="['fas', 'microphone']" />
          </a>
          <a href="#" @click.stop="() => (closeAllMenus())" class="menu-item orange">
            <font-awesome-icon :icon="['fas', 'star']" />
          </a>
          <a href="#" @click.stop="() => (clickChat())" class="menu-item lightblue">
            <font-awesome-icon :icon="['fas', 'gem']" />
          </a>
        </div>
      </div>
    </div>
  </v-expand-transition>
</template>

<style scoped>
.menu-container {
  position: relative;
  z-index: 900;
  margin-bottom: 20px;
}

.menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.menu-toggle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #EEEEEE;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #596778;
  border: none;
  cursor: pointer;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
  z-index: 20;
}

.menu {
  display: flex;
  position: absolute;
  left: 55px;
  white-space: nowrap;
  height: 50px;
  align-items: center;
}

.menu-item {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  text-decoration: none;
  margin-left: 10px;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
  transform: translateX(-80px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.menu.expanded .menu-item {
  opacity: 1;
  transform: translateX(0);
}

/* Stagger the animations for each item */
.menu-item:nth-child(1) {
  transition-delay: 0.05s;
}

.menu-item:nth-child(2) {
  transition-delay: 0.1s;
}

.menu-item:nth-child(3) {
  transition-delay: 0.15s;
}

.menu-item:nth-child(4) {
  transition-delay: 0.2s;
}

.menu-item:nth-child(5) {
  transition-delay: 0.25s;
}

.menu-item:nth-child(6) {
  transition-delay: 0.3s;
}

.menu-item:nth-child(7) {
  transition-delay: 0.35s;
}

.blue {
  background-color: #669AE1;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.12);
}

.blue:hover {
  background-color: #EEEEEE;
  color: #669AE1;
  text-shadow: none;
}

.green {
  background-color: #70CC72;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.12);
}

.green:hover {
  background-color: #EEEEEE;
  color: #70CC72;
  text-shadow: none;
}

.red {
  background-color: #FE4365;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.12);
}

.red:hover {
  background-color: #EEEEEE;
  color: #FE4365;
  text-shadow: none;
}

.purple {
  background-color: #C49CDE;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.12);
}

.purple:hover {
  background-color: #EEEEEE;
  color: #C49CDE;
  text-shadow: none;
}

.orange {
  background-color: #FC913A;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.12);
}

.orange:hover {
  background-color: #EEEEEE;
  color: #FC913A;
  text-shadow: none;
}

.lightblue {
  background-color: #62C2E4;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.14);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.12);
}

.lightblue:hover {
  background-color: #EEEEEE;
  color: #62C2E4;
  text-shadow: none;
}
</style>