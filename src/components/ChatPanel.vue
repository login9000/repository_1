<script setup>
import { ref, onMounted, onUnmounted, computed, useTemplateRef } from "vue";
import emitter from "../plugins/emitter";
import { useUserStore } from "../stores/user";

const userStore = useUserStore();
const chatMessages = ref([]);
const chatBox = ref();
const playerMessage = ref("");
const isDragging = ref(false);
const startX = ref(0);
const currentWidth = ref(250);
const minWidth = ref(300);
const maxWidth = ref(600);

const addressee = ref(null); // Храним информацию о выбранном адресате
const showAddresseeIndicator = ref(false); // Флаг для отображения индикатора

// Для отображения контекстного меню с приватными сообщениями
const activeUserId = ref(null);
const showMenu = ref(false);
const menuPosition = ref({ x: 0, y: 0 });

// Вычисляем URL аватара пользователя
const userAvatarUrl = computed(() => {
  if (userStore.externalUserData && userStore.externalUserData.imgurl) {
    return `https://escape-iq.com/${userStore.externalUserData.imgurl}`;
  }
  return null;
});

// Вычисляем первую букву имени для плейсхолдера аватарки
const userNameInitial = computed(() => {
  if (userStore.user && userStore.user.username && userStore.user.username.length > 0) {
    return userStore.user.username.charAt(0).toUpperCase();
  }
  return '?';
});

function handleUsernameClick(username, userId) {
  // Проверяем, не является ли выбранный пользователь текущим пользователем
  const userData = userStore.user;
  if (userData && userId === userData.id) {
    // Если это текущий пользователь, ничего не делаем
    console.log("Нельзя выбрать себя в качестве адресата");
    return;
  }

  // Вставляем @username: в начало поля ввода
  playerMessage.value = `@${username}: ${playerMessage.value}`;

  // Фокусируемся на поле ввода и устанавливаем курсор в конец текста
  setTimeout(() => {
    const inputField = document.querySelector('.v-field__input');
    if (inputField) {
      inputField.focus();
      // Установка курсора в конец текста
      const len = playerMessage.value.length;
      if (inputField.setSelectionRange) {
        inputField.setSelectionRange(len, len);
      }
    }
  }, 10);
}

// Функция для открытия контекстного меню при клике на иконку шестеренки
function openUserMenu(event, username, userId, addresseeId, addresseeName) {
  // Останавливаем всплытие события, чтобы не сработал клик по имени пользователя
  event.stopPropagation();

  // Проверяем, не является ли выбранный пользователь текущим пользователем
  const userData = userStore.user;

  if (userData && userId === userData.id) {
    activeUserId.value = { userId: addresseeId, username: addresseeName };
  } else {
    activeUserId.value = { userId, username };
  }

  // Устанавливаем позицию меню относительно клика
  menuPosition.value = {
    x: event.clientX,
    y: event.clientY
  };

  // Показываем меню
  showMenu.value = true;

  // Добавляем обработчик для закрытия меню при клике вне его
  setTimeout(() => {
    document.addEventListener('click', closeUserMenu);
  }, 0);
}

// Функция для закрытия контекстного меню
function closeUserMenu() {
  showMenu.value = false;
  document.removeEventListener('click', closeUserMenu);
}

// Функция для отправки приватного сообщения
function sendPrivateMessage() {
  if (!activeUserId.value) return;

  // Устанавливаем адресата для приватного сообщения
  addressee.value = {
    username: activeUserId.value.username,
    userId: activeUserId.value.userId
  };
  showAddresseeIndicator.value = true;

  // Закрываем меню
  closeUserMenu();
}

// Функция для блокировки пользователя
function blockUser() {
  if (!activeUserId.value) return;

  console.log(`Блокировка пользователя: ${activeUserId.value.username} (ID: ${activeUserId.value.userId})`);

  // Здесь будет логика блокировки пользователя
  // Например, emit события для блокировки на сервере
  emitter.emit("block-user", activeUserId.value.userId);

  // Закрываем меню
  closeUserMenu();
}

// Функция для удаления адресата
function removeAddressee() {
  addressee.value = null;
  showAddresseeIndicator.value = false;
}

// Функция для ответа на адресованное сообщение (с упоминанием)
function replyToAddressedMessage(message) {
  // Проверяем, что это сообщение с упоминанием
  if (!message.isAddressed) return;

  // Определяем, на чье сообщение отвечаем
  const userData = userStore.user;
  if (!userData) return;

  // Перед тем как добавить новое упоминание, очистим поле ввода
  playerMessage.value = "";

  // Если сообщение адресовано мне, отвечаем отправителю
  if (message.addresseeName === userData.username || message.addresseeId === userData.userId) {
    handleUsernameClick(message.sender, message.sender_id);
  }
  // Если я сам отправил сообщение с упоминанием, отвечаем упомянутому пользователю
  else if (message.sender_id === userData.userId || message.sender === userData.username) {
    handleUsernameClick(message.addresseeName, message.addresseeId);
  }
  // В других случаях (например, сообщение между двумя другими пользователями)
  // можно отвечать отправителю
  else {
    handleUsernameClick(message.sender, message.sender_id);
  }
}

// Функция для ответа на приватное сообщение
function replyToPrivateMessage(message) {
  // Получаем данные из сообщения для ответа
  // Если сообщение отправлено мной, отвечаем получателю
  // Если сообщение отправлено не мной, отвечаем отправителю
  const userData = userStore.user;
  console.log('private clicked!', message);
  if (!userData) return;

  if (message.sentByMe) {
    // Если я отправил это сообщение, то отвечаю получателю
    addressee.value = {
      username: message.receiverName,
      userId: message.receiverId
    };
  } else {
    // Если мне отправили это сообщение, то отвечаю отправителю
    addressee.value = {
      username: message.sender,
      userId: message.receiverId
    };
  }

  showAddresseeIndicator.value = true;

  // Фокусируемся на поле ввода сообщения
  setTimeout(() => {
    const inputField = document.querySelector('.v-field__input');
    if (inputField) {
      inputField.focus();
    }
  }, 100);
}

// Replace fetchChatHistory with an empty initialization
// We won't fetch chat history anymore
function initializeChat() {
  // Reset the chat messages array to empty
  chatMessages.value = [];
  scrollToBottom();
}

function startResize(event) {
  isDragging.value = true;
  startX.value = event.clientX;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
}

function handleResize(event) {
  if (!isDragging.value) return;

  const deltaX = event.clientX - startX.value;
  const newWidth = currentWidth.value + deltaX;
  console.log('currentWidth.value', currentWidth.value);
  if (newWidth >= minWidth.value && newWidth <= maxWidth.value) {
    currentWidth.value = newWidth;
    startX.value = event.clientX;
  }
}

function stopResize() {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
}

function handlePlayerMessage() {
  console.log('sending type - start');
  if (!playerMessage.value.trim()) return;

  // Проверка на упоминание (формат "@username: сообщение")
  const mentionRegex = /^@([^:]+):\s(.+)$/;
  const mentionMatch = playerMessage.value.trim().match(mentionRegex);
  console.log('playerMessage: ', playerMessage);

  // Если есть адресат через индикатор, отправляем приватное сообщение
  if (addressee.value) {
    console.log('sending type5', addressee.value);

    // Проверяем, что у нас есть данные текущего пользователя
    const currentUser = userStore.user;
    if (currentUser) {
      // Формируем данные сообщения для сервера
      const messageData = {
        receiver_id: addressee.value.userId,
        content: playerMessage.value.trim(),
        type: 'private_message',
        receiver_name: addressee.value.username,
        from_bubble_chat: false  // Явно указываем, что сообщение НЕ из bubble chat
      };
      // Отправляем событие send-private-message на сервер

      const currentUser = userStore.user;
      const receiverName = currentUser?.username

      const privateMessage = {
        id: Date.now(),
        sender: receiverName,
        message: playerMessage.value.trim(),
        receiverId: addressee.value.userId,
        receiverName: receiverName,
        isPrivate: true,
        sentByMe: true,
        color: "#FF69B4",
        timestamp: Date.now() // Добавляем временную метку для проверки дубликатов
      };

      chatMessages.value.push(privateMessage);

      console.log('sending type - all', chatMessages.value);

      emitter.emit('send-private-message', messageData);

      // Не добавляем сообщение напрямую в чат - 
      // оно придет от сервера через handlePrivateMessage

      console.log('Отправлено приватное сообщение:', {
        кому: addressee.value.username,
        текст: playerMessage.value.trim()
      });
    }
    // Сбрасываем адресата после отправки
    removeAddressee();
  }
  // Если есть упоминание в формате @username: сообщение
  else if (mentionMatch) {
    console.log('sending type6');

    const mentionedName = mentionMatch[1];
    const messageContent = mentionMatch[2];

    // Отправляем публичное сообщение с упоминанием
    const currentUser = userStore.user;
    if (currentUser) {
      // Формируем данные сообщения
      const messageData = {
        content: messageContent,
        addresseeName: mentionedName,
        type: 'public_message_with_mention'
      };

      // Ищем ID пользователя в активных соединениях игры
      let addresseeId = null;
      if (window.gameInstance && window.gameInstance.otherPlayers) {
        window.gameInstance.otherPlayers.forEach((player, id) => {
          if (player.name === mentionedName) {
            addresseeId = id;
          }
        });
      }

      // Формируем данные сообщения для адресованного сообщения
      const addressedMessageData = {
        content: messageContent,
        addressee_id: addresseeId,
        addressee_username: mentionedName,
        show_bubble: false  // Явно устанавливаем false, чтобы не показывать в пузырьке
      };

      if (addresseeId) {

        console.log('sending type3');

        // Если нашли ID пользователя, отправляем адресованное сообщение
        emitter.emit("player-send-addressed-message", {
          content: messageContent,
          addressee_id: addresseeId,
          addressee_username: mentionedName,
          show_bubble: false,
          from_chat_panel: true // Явно указываем источник сообщения
        });
      } else {
        console.log('sending type2');

        // Если ID не найден, отправляем как обычное сообщение с метаданными
        emitter.emit("player-send-message", messageContent, {
          addresseeName: mentionedName
        });
      }

      // Создаем локальное представление сообщения с упоминанием
      // Примечание: в реальном приложении этот код может быть лишним,
      // так как сервер должен транслировать сообщение всем участникам
      const publicMessage = {
        id: Date.now(),
        sender: currentUser.username || 'Вы',
        message: messageContent,
        sender_id: currentUser.userId,
        addresseeName: mentionedName,
        isAddressed: true,  // Флаг для отображения как адресованное
        color: currentUser.color || "#FFFFFF"
      };

      // В зависимости от реализации сервера, этот код может быть не нужен
      // chatMessages.value.push(publicMessage);
      // scrollToBottom();
    }
  } else {
    // Обычное сообщение без адресата
    console.log('sending type1');
    emitter.emit("player-send-message", playerMessage.value, null);
  }

  playerMessage.value = "";
}

function handleNewMessage(message) {
  // Проверяем наличие дополнительных метаданных о упоминании
  if (message.metadata && message.metadata.addresseeName) {
    // Добавляем информацию об адресате в сообщение
    message.addresseeName = message.metadata.addresseeName;
    message.isAddressed = true;
  }

  // Проверяем, есть ли уже такое сообщение в списке (предотвращаем дубликаты)
  const isDuplicate = chatMessages.value.some(existingMsg =>
    (existingMsg.id === message.id) ||
    (existingMsg.sender === message.sender &&
      existingMsg.message === message.message &&
      existingMsg.sender_id === message.sender_id &&
      Math.abs(Date.now() - (existingMsg.timestamp || Date.now())) < 2000) // Проверка в пределах 2 секунд
  );

  // Только если сообщение уникальное, добавляем его в список
  if (!isDuplicate) {
    chatMessages.value.push(message);
    console.log('messages', chatMessages);

    scrollToBottom();
  } else {
    console.log('Предотвращено дублирование сообщения:', message);
  }
}

function handlePrivateMessage(message) {

  // Skip messages from bubble chat
  if (message.from_bubble_chat || (message.message && message.message.from_bubble_chat)) {
    return;
  }

  // Если это ответ от сервера, но сообщение не предназначено текущему пользователю
  // и не отправлено им самим, то игнорируем сообщение
  const currentUserId = userStore.user?.id;

  //TODO: Нужно активировать проверку по полю receiver_id, sender_id проверять не требуется
  if (!message.message /*||
  (message.message.receiver_id !== currentUserId &&
   message.message.sender_id !== currentUserId) */) {
    return;
  }

  // Определяем, отправлено ли сообщение текущим пользователем
  const isMessageFromMe = message.message.sender_id === currentUserId;

  // Получаем имя получателя из сообщения или из gameInstance
  let receiverName = message.message.receiver_name;
  if (!receiverName && window.gameInstance) {
    // Если мы отправитель, то ищем имя получателя по ID
    if (isMessageFromMe) {
      return true;
      const receiverId = message.message.receiver_id;
      const otherPlayer = window.gameInstance.otherPlayers.get(receiverId);
      if (otherPlayer) {
        receiverName = otherPlayer.playerName;
      }
    } else {
      // Если мы получатель, используем своё имя
      receiverName = userStore.user?.username;
    }
  }

  // Если имя все еще не найдено, используем ID или запасное значение
  if (!receiverName) {
    receiverName = isMessageFromMe
      ? message.message.receiver_username
      : 'Вы';
  }

  // Адаптируем сообщение для отображения в чате
  const privateMessage = {
    id: message.message.id || Date.now(), // Используем ID сообщения или генерируем временный
    sender: message.message.sender_username || 'Пользователь',
    message: message.message.content,
    receiverId: message.message.sender_id,
    receiverName: receiverName,
    isPrivate: true,
    sentByMe: isMessageFromMe,
    color: "#FF69B4",
    timestamp: Date.now() // Добавляем временную метку для проверки дубликатов
  };


  console.log('handle private message', privateMessage);

  // Проверяем, есть ли такое же сообщение уже в чате
  const isDuplicate = chatMessages.value.some(existingMsg =>
  // Проверяем по содержимому и отправителю
  (existingMsg.isPrivate === true &&
    existingMsg.sender === privateMessage.sender &&
    existingMsg.message === privateMessage.message &&
    existingMsg.receiverId === privateMessage.receiverId &&
    Math.abs((existingMsg.timestamp || 0) - privateMessage.timestamp) < 2000) // В пределах 2 секунд
  );

  if (!isDuplicate) {
    console.log('Добавление приватного сообщения в чат:', {
      от: privateMessage.sender,
      кому: privateMessage.receiverName,
      текст: privateMessage.message
    });

    chatMessages.value.push(privateMessage);
    scrollToBottom();
  } else {
    console.log('Предотвращено дублирование приватного сообщения:', privateMessage);
  }
}

function scrollToBottom() {
  if (chatBox.value) {
    chatBox.value.scrollIntoView({ behavior: "smooth", block: "end" });
  }
}

onMounted(async () => {
  if (userStore.isAuthenticated) {
    if (!userStore.user) {
      try {
        await userStore.fetchUserData();
      } catch (error) {
        console.error("Ошибка загрузки данных пользователя:", error);
        return;
      }
    }


    // Initialize empty chat instead of fetching history
    initializeChat();
  }

  emitter.on('new-message', handleNewMessage);
  emitter.on('new-private-message', handlePrivateMessage);
});

onUnmounted(() => {
  emitter.off('new-message', handleNewMessage);
  emitter.off('new-private-message', handlePrivateMessage);
});


</script>

<!-- Обновим шаблон в компоненте ChatPanel.vue -->
<template>
  <div class="chat">
    <div class="chat-wrapper">
      <div class="chat-box" :style="{ width: `${currentWidth}px` }" >
        <div class="resize-handle" @mousedown="startResize"></div>
        <div v-for="message in chatMessages" :key="message.id" :class="{
          'chat-message': true,
          'private-message': message.isPrivate,
          'addressed-message': message.isAddressed,
          'sent-by-me': message.sentByMe
        }"
          @click="message.isPrivate ? replyToPrivateMessage(message) : (message.isAddressed ? replyToAddressedMessage(message) : null)">
          <div v-if="message.isPrivate" class="private-label">
            <span class="private-indicator">
              {{ message.sentByMe ? 'Вы' : message.sender }} > {{ message.sentByMe ? message.receiverName : 'Вы' }}:
            </span>
            <!--<span class="private-text">Приватное сообщение</span>-->
            <!--<span class="reply-hint"><small>👆 Нажмите, чтобы ответить</small></span> -->
          </div>
          <!-- Пока не нужно это уведомление     -->
          <!--     <div style="display: none" v-if="message.isAddressed" class="addressed-label">-->
          <!--       <span class="reply-addressed-hint"><small>👆 Нажмите, чтобы ответить</small></span>-->
          <!--     </div>-->
          <span class="message-content">
            <span v-if="!message.isPrivate" class="sender" :style="{ color: message.color }"
              @click="handleUsernameClick(message.sender, message.sender_id || message.id)"
              :class="{ 'clickable': message.sender_id !== userStore.user?.id }">{{ message.sender
              }}<!-- Показываем иконку шестеренки только если это НЕ текущий пользователь --><span
                v-if="message.sender_id !== userStore.user?.id || message.isAddressed" class="settings-icon"
                @click.stop="openUserMenu($event, message.sender, message.sender_id || message.id, message.addresseeId, message.addresseeName)">
                <svg class="gear-icon" viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor"
                    d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
                </svg>
              </span>
              <span v-if="message.addresseeName">@{{ message.addresseeName }}</span>:
            </span>
            {{ message.message }}
          </span>
        </div>
        <div class="chat-box-anchor" ref="chatBox"></div>
      </div>

      <!-- Контекстное меню пользователя -->
      <div v-if="showMenu" class="user-context-menu" :style="{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`
      }" @click.stop>
        <div class="menu-option" @click="sendPrivateMessage">
          <span class="menu-icon">📩</span>
          <span class="menu-text">Приватное сообщение</span>
        </div>
        <div class="menu-option" @click="blockUser">
          <span class="menu-icon">❌</span>
          <span class="menu-text">Заблокировать</span>
        </div>
      </div>

      <form v-on:submit.prevent="handlePlayerMessage">
        <!-- Индикатор адресата отображается с аватаром пользователя -->
        <div v-if="showAddresseeIndicator" class="addressee-indicator">
          <!-- Аватар пользователя -->
          <div class="user-avatar-container">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="User Avatar" class="user-avatar">
            <div v-else class="avatar-placeholder">
              <span class="placeholder-text">{{ userNameInitial }}</span>
            </div>
          </div>
          <span class="addressee">@{{ addressee.username }}</span>
          <button @click="removeAddressee" class="remove-addressee">×</button>
        </div>

        <v-text-field v-model="playerMessage" append-inner-icon="mdi-send" bg-color="white" label="Введите сообщение"
          variant="outlined" density="compact" hide-details single-line @click:append-inner="handlePlayerMessage"
          @keydown.enter.prevent="handlePlayerMessage" />
      </form>
    </div>
  </div>
</template>
<!-- Добавьте следующие стили в <style> блок компонента ChatPanel.vue -->
<style scoped>
.chat {
  position: absolute;
  bottom: 1rem;
  top: 1rem;
  left: 1rem;
  height: 100%;
}

.chat-wrapper {
  position: relative;
}

.chat-box {
  position: relative;
  background-color: rgba(0, 0, 0, 0.5);
  color: black;
  min-height: 100px;
  height: calc(100vh - 5rem - 40px);
  padding: 1rem 1rem 0 1rem;
  overflow-y: scroll;
  /* resize: horizontal; */
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  cursor: ew-resize;
  background-color: rgba(255, 255, 255, 0.1);
  &:after {
    content: ' ';
    background: url('assets/resize-right-svgrepo-com.svg');
    display: block;
    position: absolute;
    right: 0px;
    bottom: 0px;
    width: 10px;
    height: 10px;
  }
}

.resize-handle:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.chat-box-anchor {
  height: 20px;
  width: 100%;
}

.chat-message {
  color: white;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.private-message {
  text-align: right;
  background-color: rgba(255, 105, 180, 0.1);
  border-radius: 10px;
  padding: 3px 8px;
  margin-left: auto;
  max-width: 85%;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.private-message:hover {
  background-color: rgba(255, 105, 180, 0.2);
}

.addressed-message {
  background-color: rgba(100, 149, 237, 0.1);
  border-radius: 10px;
  padding: 3px 8px;
  margin-bottom: 10px;
  /* border-left: 3px solid #6495ED; */
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}

.addressed-message:hover {
  background-color: rgba(100, 149, 237, 0.2);
}

.addressed-message::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle, rgba(100, 149, 237, 0.2) 0%, rgba(100, 149, 237, 0) 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: 10px;
}

.addressed-message:hover::after {
  opacity: 1;
}

.private-message.sent-by-me {
  margin-left: auto;
  margin-right: 0;
  position: relative;
}

.private-message::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle, rgba(255, 105, 180, 0.2) 0%, rgba(255, 105, 180, 0) 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: 10px;
}

.private-message:hover::after {
  opacity: 1;
}

.private-label,
.addressed-label {
  font-size: 12px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.reply-hint {
  opacity: 0;
  transition: opacity 0.3s ease;
  color: #FF69B4;
  font-size: 10px;
  margin-top: 2px;
  width: 100%;
  text-align: center;
}

.private-message:hover .reply-hint {
  opacity: 0.8;
}

.reply-addressed-hint {
  opacity: 0;
  transition: opacity 0.3s ease;
  color: #6495ED;
  font-size: 10px;
  margin-top: 2px;
  width: 100%;
  text-align: center;
}

.chat-message.addressed-message {
  display: flex;
  align-items: center;

  &:before {
    content: ' ';
    width: 5px;
    height: 5px;
    box-shadow: 0px 0px 10px 2px #6495ED;
    background: #6495ED;
    border-radius: 50%;
    display: block;
  }
}

.chat-message.addressed-message.sent-by-me {
  &:before {
    box-shadow: 0px 0px 10px 2px rgb(76, 175, 80);
    background: rgb(76, 175, 80);
  }
}

.addressed-message:hover .reply-addressed-hint {
  opacity: 0.8;
}

.private-indicator {
  color: #FF69B4;
  font-weight: bold;
  margin-right: 8px;
}

.addressed-indicator {
  color: #6495ED;
  font-weight: bold;
  font-size: 13px;
}

.private-text {
  color: #FF69B4;
  font-style: italic;
}

.message-content {
  line-height: 1.4;
  display: flex;
  flex-wrap: wrap;
}

.sender {
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.sender:hover {
  text-decoration: underline;
}

/* Стили для иконки шестеренки */
.settings-icon {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-left: 1px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.settings-icon:hover {
  opacity: 1;
}

.settings-icon:hover .gear-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.gear-icon {
  vertical-align: middle;
  transition: transform 0.3s ease;
  position: relative;
  /* top: 2px; */
}

/* Стили для контекстного меню пользователя */
.user-context-menu {
  position: fixed;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;
}

.menu-option {
  padding: 10px 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #333;
}

.menu-option:hover {
  background-color: #f5f5f5;
}

.menu-icon {
  margin-right: 10px;
  font-size: 16px;
}

.menu-text {
  font-size: 14px;
}

/* Стиль для индикатора адресата с аватаром */
.addressee-indicator {
  display: flex;
  align-items: center;
  background-color: #6495ED;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 8px;
}

/* Стили для аватара пользователя */
.user-avatar-container {
  margin-right: 8px;
}

.user-avatar,
.avatar-placeholder {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid white;
}

.user-avatar {
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
  font-size: 14px;
  font-weight: bold;
}

.addressee {
  font-size: 14px;
  font-weight: 500;
  margin-right: auto;
}

.remove-addressee {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  margin-left: 8px;
  padding: 0 5px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-addressee:hover {
  opacity: 0.8;
}

.clickable {
  cursor: pointer;
}

/* Стили для упоминания пользователя */
.addressed-message {
  position: relative;
}

.addressed-message .addressed-indicator {
  display: block;
  margin-bottom: 4px;
}

.addressed-message .message-content {
  padding-left: 5px;
  display: flex;
  flex-wrap: wrap;
}
</style>