
<template>
  <div v-if="visible" class="character-action-menu" :style="{ left: position.x + 'px', top: position.y + 'px' }">
    <div class="action-menu-items">
      <button @click="handleAction('video')" class="action-button video-button">
        <span class="action-icon">🎥</span>
        <span class="action-text">Позвать на видео-свидание</span>
      </button>
      <button @click="handleAction('audio')" class="action-button audio-button">
        <span class="action-icon">🎙️</span>
        <span class="action-text">Отправить аудио-сообщение</span>
      </button>
      <button @click="handleAction('gift')" class="action-button gift-button">
        <span class="action-icon">🎁</span>
        <span class="action-text">Подарить подарок</span>
      </button>
      <button @click="handleAction('like')" class="action-button like-button">
        <span class="action-icon">❤️</span>
        <span class="action-text">Поставить лайк</span>
      </button>
      <button @click="handleAction('block')" class="action-button block-button">
        <span class="action-icon">🚫</span>
        <span class="action-text">Заблокировать пользователя</span>
      </button>
    </div>
    <button @click="close" class="close-button">×</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import emitter from "../plugins/emitter";

const visible = ref(false);
const position = ref({ x: 0, y: 0 });
const playerId = ref(null);

// Обработка клика по молнии над головой персонажа
const showMenu = (data) => {
  console.log("CharacterActionMenu: Received show-character-actions event with data:", data);
  
  // Обновляем позицию с учетом головы персонажа
  position.value = {
    x: data.x - 150, // Центрируем относительно персонажа
    y: data.y - 300  // Располагаем над головой персонажа
  };
  
  playerId.value = data.playerID;
  visible.value = true;
  
  // Устанавливаем флаг игнорирования следующего клика документа
  ignoreNextClick.value = true;
};

// Обработка действий в меню
const handleAction = (actionType) => {
  console.log("CharacterActionMenu: Action triggered:", actionType, "for player:", playerId.value);
  
  switch(actionType) {
    case 'video':
      emitter.emit("open-video-form", {targetId: playerId.value});
      break;
    case 'audio':
      // Эмитим событие для аудио-сообщения
      emitter.emit("open-audio-form", {targetId: playerId.value});
      break;
    case 'gift':
      // Эмитим событие для подарка
      emitter.emit("open-gift-form", {targetId: playerId.value});
      break;
    case 'like':
      // Эмитим событие для лайка
      emitter.emit("send-like", {targetId: playerId.value});
      break;
    case 'block':
      // Эмитим событие для блокировки
      emitter.emit("block-user", {targetId: playerId.value});
      break;
  }
  
  // Закрываем меню после действия
  close();
};

// Закрытие меню
const close = () => {
  console.log("CharacterActionMenu: Closing action menu");
  visible.value = false;
};

// Флаг для игнорирования события клика после открытия
const ignoreNextClick = ref(false);

// Обработчик клика вне компонента
const handleClickOutside = (e) => {
  // Если нужно игнорировать этот клик, просто сбрасываем флаг
  if (ignoreNextClick.value) {
    console.log("CharacterActionMenu: Ignoring first click outside");
    ignoreNextClick.value = false;
    return;
  }

  // Проверяем, был ли клик вне нашего компонента
  const actionMenu = document.querySelector('.character-action-menu');
  
  if (visible.value && actionMenu && !actionMenu.contains(e.target)) {
    console.log("CharacterActionMenu: Click outside detected, closing menu");
    close();
  }
};

// Обработчик нажатия клавиши Escape
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && visible.value) {
    console.log("CharacterActionMenu: Escape key pressed, closing menu");
    close();
  }
};

// Слушатель события для закрытия меню действий
const handleCloseMenu = () => {
  console.log("CharacterActionMenu: Received close-character-actions event");
  close();
};

onMounted(() => {
  console.log("CharacterActionMenu: Component mounted, setting up event listeners");
  
  // Подписываемся на событие показа меню действий
  emitter.on('show-character-actions', showMenu);
  
  // Слушаем клики на документе и нажатия клавиш
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
  
  // Подписываемся на событие закрытия меню
  emitter.on('close-character-actions', handleCloseMenu);
});

onUnmounted(() => {
  console.log("CharacterActionMenu: Component unmounted, removing event listeners");
  
  // Отписываемся от событий
  emitter.off('show-character-actions', showMenu);
  emitter.off('close-character-actions', handleCloseMenu);
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
});

// Экспортируем методы, которые могут вызываться извне
defineExpose({ showMenu, close });
</script>

<style scoped>
.character-action-menu {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.75);
  border-radius: 10px;
  padding: 12px;
  z-index: 9999; /* Высокий z-index для отображения над другими элементами */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  animation: pop-in 0.3s ease-out;
  min-width: 280px;
  max-width: 320px;
}

@keyframes pop-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.action-menu-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  text-align: left;
}

.action-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateX(3px);
}

.action-icon {
  font-size: 20px;
  margin-right: 12px;
  display: inline-block;
  width: 24px;
  text-align: center;
}

.action-text {
  font-size: 14px;
}

.video-button:hover {
  background-color: rgba(114, 137, 218, 0.3);
}

.audio-button:hover {
  background-color: rgba(114, 187, 218, 0.3);
}

.gift-button:hover {
  background-color: rgba(255, 182, 83, 0.3);
}

.like-button:hover {
  background-color: rgba(255, 112, 112, 0.3);
}

.block-button:hover {
  background-color: rgba(255, 69, 58, 0.3);
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.close-button:hover {
  color: white;
}
</style>
