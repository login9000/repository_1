<template>
  <div v-if="visible" class="player-quick-info">
    <div class="avatar-container">
      <img v-if="avatarUrl" :src="avatarUrl" alt="Player Avatar" class="player-avatar">
      <div v-else class="avatar-placeholder">
        <span class="placeholder-text">{{ playerNameInitial }}</span>
      </div>
    </div>
    <div class="player-info">
      <button @click="openProfile" class="profile-button">Раскрыть профиль</button>
    </div>
  </div>

  <div class="profile-container" v-html="components.profile_window"></div>


</template>

<script>
export default {
  name: 'PlayerQuickInfo'
}
</script>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import emitter from "../plugins/emitter";
import { useUserStore } from '../stores/user';

console.log("PlayerQuickInfo component initializing");

const visible = ref(false);
const playerId = ref(null);
const playerName = ref('');
const avatarUrl = ref('');
const userStore = useUserStore();
const ignoreNextClick = ref(false);

// Вычисляем первую букву имени для плейсхолдера аватарки
const playerNameInitial = computed(() => {
  if (playerName.value && playerName.value.length > 0) {
    return playerName.value.charAt(0).toUpperCase();
  }
  return '?';
});



// Обработчик события для открытия информационной панели
const showInfo = async (data) => {
  // Генерируем уникальный ID для отслеживания логов
  const handlerId = Date.now();
  console.log(`[HANDLER ${handlerId}] PlayerQuickInfo получил событие:`, data);

  // Валидация данных
  if (!data || !data.playerID) {
    console.error(`[HANDLER ${handlerId}] Ошибка: Неверные данные события, playerID отсутствует:`, data);
    return;
  }

  // Обновляем состояние компонента
  playerId.value = data.playerID;
  // playerName.value = 'Загрузка...';
  avatarUrl.value = '';

  // Показываем панель
  visible.value = true;
  console.log(`[HANDLER ${handlerId}] Панель видима:`, visible.value);

  // Устанавливаем флаг для игнорирования следующего клика
  ignoreNextClick.value = true;
  console.log(`[HANDLER ${handlerId}] Установлен флаг ignoreNextClick:`, ignoreNextClick.value);

  // Загружаем данные игрока
  try {
    console.log(`[HANDLER ${handlerId}] Запрос данных игрока ID:`, data.playerID);
    // await userStore.fetchExternalUserData(data.playerID);

    if (typeof (window.gameInstance.playersData[data.playerID]) == 'object' && window.gameInstance.playersData[data.playerID].avatar !== '') {
      avatarUrl.value = "/user_files/" + data.playerID + "/" + window.gameInstance.playersData[data.playerID].avatar;
    } else {
      avatarUrl.value = '/img/no_avatar.png';
    }

    const userData = userStore.externalUserData;
    console.log('userData', userData);
    if (userData) {
      playerName.value = userData.username || 'Unknown Player';
      // if (userData.imgurl) {
      //   avatarUrl.value = `https://escape-iq.com/${userData.imgurl}`;
      // }
      console.log(`[HANDLER ${handlerId}] Загружены данные игрока:`, playerName.value);
    } else {
      console.warn(`[HANDLER ${handlerId}] Данные игрока не получены`);
    }
  } catch (error) {
    console.error(`[HANDLER ${handlerId}] Ошибка загрузки данных:`, error);
    playerName.value = 'Error loading user';
  }
};

const hideInfo = () => {
  const hideId = Date.now();
  console.log(`[HIDE ${hideId}] Запрос на скрытие панели`);

  visible.value = false;
  ignoreNextClick.value = false;

  // Убедимся, что изменения применились
  nextTick(() => {
    console.log(`[HIDE ${hideId}] Панель скрыта, состояние:`, visible.value);
  });
};

const openProfile = () => {
  console.log("PlayerQuickInfo:22 Opening full profile for player ID:", playerId.value);
  visible.value = false;
  hideInfo();
  get_profile('open', playerId.value, 'profile');

  const observer = new MutationObserver(() => {
    const profile_window_close_btn = document.querySelector(".profile-container .icon_close_profile_window");
    if (profile_window_close_btn) {
      profile_window_close_btn.addEventListener('click', function () {
        hideInfo();
      });
    }
  });

  observer.observe(document.querySelector(".profile-container"), {
    subtree: true,
    childList: true,
  });


  if (playerId.value) {
    // Эмитим событие для открытия полного профиля
    // emitter.emit('open-profile', { playerId: playerId.value });
    hideInfo();
  }
};

// Добавляем обработчик для закрытия при клике вне компонента
const handleClickOutside = (e) => {
  const clickId = Date.now();

  // Если должны игнорировать этот клик, сбрасываем флаг и выходим
  if (ignoreNextClick.value) {
    console.log(`[CLICK_OUTSIDE ${clickId}] Игнорируем клик по флагу ignoreNextClick`);
    ignoreNextClick.value = false;
    return;
  }

  // Проверяем, что клик был не на нашем компоненте
  const clickedElement = e.target;
  const infoPanel = document.querySelector('.player-quick-info');

  // Если панель открыта и клик был вне панели
  if (visible.value && infoPanel && !infoPanel.contains(clickedElement)) {
    console.log(`[CLICK_OUTSIDE ${clickId}] Клик вне панели, закрываем`);
    hideInfo();
  }
};

// Обработчик события закрытия информационной панели
const handleCloseInfo = () => {
  const closeId = Date.now();
  console.log(`[CLOSE ${closeId}] Получено событие close-quick-info`);
  hideInfo();
};

onMounted(() => {
  console.log(globalThis.components);
  // Генерируем уникальный ID для компонента
  const componentId = Date.now();
  console.log(`[MOUNT ${componentId}] PlayerQuickInfo компонент монтируется`);

  // Устанавливаем обработчики событий
  emitter.on('player-quick-info', (data) => {
    console.log(`[MOUNT ${componentId}] Получено событие player-quick-info:`, data);
    showInfo(data);
  });

  emitter.on('close-quick-info', () => {
    console.log(`[MOUNT ${componentId}] Получено событие close-quick-info`);
    hideInfo();
  });

  // Обработчик клавиши Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && visible.value) {
      console.log(`[MOUNT ${componentId}] Нажата клавиша Escape, закрываем панель`);
      hideInfo();
    }
  });

  // Обработчик кликов вне панели
  document.addEventListener('click', handleClickOutside);

  console.log(`[MOUNT ${componentId}] Все обработчики событий установлены`);
});

onUnmounted(() => {
  const unmountId = Date.now();
  console.log(`[UNMOUNT ${unmountId}] PlayerQuickInfo демонтируется`);

  // Отписываемся от всех событий
  emitter.off('player-quick-info');
  emitter.off('close-quick-info');
  document.removeEventListener('click', handleClickOutside);

  console.log(`[UNMOUNT ${unmountId}] Все обработчики событий удалены`);
});

const components = globalThis.components;

defineExpose({ components });

</script>

<style>
.profile-container {
  position: fixed;
  top: 50px;
  right: 50px;
  z-index: 999;


  .profile_window__ {
    background-color: transparent;
    height: 100% !important;
    position: fixed;

    /* div.profile_window_ {
      height: 785px !important;
    } */

    .min-h-full {
      min-height: 95% !important;
    }

    div.profile_window {
      height: 100vh !important;
    }
  }
}

.player-quick-info {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.75);
  border-radius: 10px;
  padding: 12px;
  z-index: 10000;
  /* Значение больше, чем у ProfileMenu */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  animation: slide-in 0.3s ease-out;
}

@keyframes slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.avatar-container {
  margin-right: 12px;
}

.player-avatar,
.avatar-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #4CAF50;
}

.player-avatar {
  object-fit: cover;
}

.avatar-placeholder {
  background-color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  color: white;
  font-size: 22px;
  font-weight: bold;
}

.player-info {
  display: flex;
  flex-direction: column;
}

.player-nickname {
  color: white;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
}

.profile-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.profile-button:hover {
  background-color: #45a049;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 18px;
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