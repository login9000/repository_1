# Документация проекта Disco Map

## Содержание
1. [Общий обзор проекта](#общий-обзор-проекта)
2. [Архитектура приложения](#архитектура-приложения)
3. [Основные компоненты](#основные-компоненты)
4. [Система чата](#система-чата)
5. [Игровая система](#игровая-система)
6. [Хранилище состояний (Stores)](#хранилище-состояний-stores)
7. [Сетевое взаимодействие](#сетевое-взаимодействие)
8. [Полезные методы и функции](#полезные-методы-и-функции)

## Общий обзор проекта

Disco Map - интерактивная многопользовательская веб-платформа, разработанная на основе Vue.js 3 и Phaser 3. Проект представляет собой виртуальное пространство, где пользователи могут взаимодействовать друг с другом через аватары, обмениваться сообщениями и участвовать в различных активностях.

### Технологический стек
- **Фронтенд**: Vue.js 3, Vuetify 3
- **Управление состоянием**: Pinia
- **Игровой движок**: Phaser 3
- **Реактивное общение**: Socket.io
- **Сборка проекта**: Vite

## Архитектура приложения

Приложение состоит из следующих основных модулей:

1. **Основное приложение** (`App.vue`) - управляет общей структурой интерфейса
2. **Игровой компонент** (`Game.vue`) - интегрирует Phaser 3 с Vue
3. **Система чата** - состоит из нескольких компонентов для разных типов сообщений
4. **Профиль пользователя** - компоненты для отображения и редактирования профиля
5. **Видеозвонки** - компонент для видеокоммуникации между пользователями

## Основные компоненты

### App.vue
Корневой компонент приложения, объединяющий все модули и управляющий маршрутизацией между ними.

### Game.vue
```javascript
// Инициализирует игровое окружение Phaser
onMounted(async () => {
  // Проверка авторизации
  if (userStore.isAuthenticated) {
    // Загрузка данных пользователя
    await userStore.fetchUserData();
    
    // Инициализация игры с пользовательскими данными
    game.value = StartGame("game-container", {
      userId: userStore.user.id,
      username: userStore.user.username,
      token: userStore.token,
      avatar: userStore.user.avatar,
    });
  }
});
```

### ChatPanel.vue
Компонент для общего чата, где сообщения видны всем пользователям.

```javascript
// Методы обработки сообщений
function handlePlayerMessage() {
  // Проверка на пустое сообщение
  if (!playerMessage.value.trim()) return;
  
  // Проверка на упоминание (формат "@username: сообщение")
  const mentionRegex = /^@([^:]+):\s(.+)$/;
  const mentionMatch = playerMessage.value.trim().match(mentionRegex);
  
  // Если есть адресат через индикатор, отправляем приватное сообщение
  if (addressee.value) {
    // Формируем данные сообщения для сервера
    const messageData = {
      receiver_id: addressee.value.userId,
      content: playerMessage.value.trim(),
      type: 'private_message',
      receiver_name: addressee.value.username,
      from_bubble_chat: false
    };
    
    // Отправляем событие send-private-message на сервер
    emitter.emit('send-private-message', messageData);
  } 
  // Если есть упоминание в формате @username: сообщение
  else if (mentionMatch) {
    const mentionedName = mentionMatch[1];
    const messageContent = mentionMatch[2];
    
    // Отправка адресованного сообщения
    emitter.emit("player-send-addressed-message", {
      content: messageContent,
      addressee_id: addresseeId,
      addressee_username: mentionedName,
      show_bubble: false,
      from_chat_panel: true
    });
  } else {
    // Обычное сообщение без адресата
    emitter.emit("player-send-message", playerMessage.value, null);
  }
  
  playerMessage.value = "";
}
```

### PrivateChat.vue
Компонент для отправки Bubble сообщений(отображаемых на карте) и "мыслей" (статусные сообщения).

```javascript
// Метод отправки сообщения
function sendMessage() {
  // Проверка на пустое сообщение
  if (!newMessage.trim() && !attachedImage) return;
  
  // Проверка режима чата (приватный/статусный)
  const isPrivateChat = otherUserId > 0;
  
  // Подготовка данных сообщения
  const messageData = {
    receiver_id: isPrivateChat ? otherUserId : -1, // -1 для статусных сообщений
    content: newMessage.trim(),
    type: isPrivateChat ? 'private_message' : 'status_message',
    is_private: isPrivateChat
  };
  
  // Установка флагов для бабл-чата
  messageData.from_bubble_chat = true;
  messageData.is_bubble = true;
  
  // Добавление имени получателя
  if (isPrivateChat && window.gameInstance) {
    const otherPlayer = window.gameInstance.otherPlayers.get(otherUserId);
    messageData.receiver_name = otherPlayer?.playerName || `Игрок ${otherUserId}`;
  }
  
  // Отправка сообщения
  emitter.emit('send-private-message', messageData);
  
  // Отображение бабла для отправителя
  if (window.gameInstance && window.gameInstance.player) {
    window.gameInstance.player.createChatBubbleTarget(
      window.gameInstance.player.sprite, 
      20, 
      -250, 
      messageData.content,
      isPrivateChat ? 0.6 : 0.4,
      isPrivateChat ? 1 : 0.4
    );
  }
  
  // Очистка поля ввода
  newMessage = '';
  attachedImage = null;
}
```

### VideoForm.vue
Компонент для видеозвонков между пользователями.

```javascript
// Инициализация звонка
async function initiateCallToUser(userId) {
  // Создаем уникальный ID звонка
  currentCallId = Date.now().toString();
  
  // Открываем модальное окно звонка
  isModalOpen = true;
  
  // Запускаем локальные медиа
  await startLocalMedia();
  
  // Отправляем запрос на звонок
  window.gameInstance.socket.send(JSON.stringify({
    type: "call_request",
    target_id: userId,
    call_id: currentCallId
  }));
  
  // Устанавливаем таймаут для ответа
  callTimeout = setTimeout(() => {
    if (!isCallInProgress) {
      endCall();
      alert('Пользователь не ответил');
    }
  }, 30000); // 30 секунд
}
```

### CharacterActionMenu.vue
Меню действий для взаимодействия с другими персонажами.

```javascript
// Обработка действий в меню
const handleAction = (actionType) => {
  switch(actionType) {
    case 'video':
      emitter.emit("open-video-form", {targetId: playerId.value});
      break;
    case 'audio':
      emitter.emit("open-audio-form", {targetId: playerId.value});
      break;
    case 'gift':
      emitter.emit("open-gift-form", {targetId: playerId.value});
      break;
    case 'like':
      emitter.emit("send-like", {targetId: playerId.value});
      break;
    case 'block':
      emitter.emit("block-user", {targetId: playerId.value});
      break;
  }
  
  // Закрываем меню после действия
  close();
}
```

### PlayerQuickInfo.vue
Компонент для быстрого просмотра информации о персонаже.

```javascript
// Обработчик события для открытия информационной панели
const showInfo = async (data) => {
  // Обновляем состояние компонента
  playerId.value = data.playerID;
  playerName.value = 'Загрузка...';
  
  // Показываем панель
  visible.value = true;
  
  // Загружаем данные игрока
  try {
    await userStore.fetchExternalUserData(data.playerID);
    const userData = userStore.externalUserData;
    
    if (userData) {
      playerName.value = userData.username || 'Unknown Player';
      if (userData.imgurl) {
        avatarUrl.value = `https://escape-iq.com/${userData.imgurl}`;
      }
    }
  } catch (error) {
    console.error(`Ошибка загрузки данных:`, error);
    playerName.value = 'Error loading user';
  }
}
```

## Система чата

В проекте существует два типа чатов:

1. **Публичный чат** (ChatPanel.vue) - для общих сообщений и сообщений с упоминаниями
2. **Приватный чат/Бабл-чат** (PrivateChat.vue) - для личных сообщений и "мыслей"

### Типы сообщений:

1. **Публичные сообщения** - видны всем в общем чате
2. **Сообщения с упоминанием** - формат `@nickname сообщение`, видны всем, но выделены
3. **Приватные сообщения** - видны только получателю и отправителю
4. **Статусные сообщения** - полупрозрачные "мысли", отображаются в пузырьках над персонажем

### Процесс отправки сообщений:

```javascript
// Отправка глобального сообщения
function sendGlobalMessage(playerMessage, metadata) {
  if (socket?.readyState === WebSocket.OPEN) {
    if (playerMessage === "") return;
    
    // Если есть метаданные с именем адресата, добавляем их
    if (metadata && metadata.addresseeName) {
      socket.send(JSON.stringify({
        type: "player_send_message",
        content: playerMessage,
        metadata: metadata
      }));
    } else {
      // Обычное глобальное сообщение
      socket.send(JSON.stringify({
        type: "global_message",
        content: playerMessage
      }));
    }
  }
}

// Отправка приватного сообщения
function sendPrivateMessage(playerMessage) {
  if (socket?.readyState === WebSocket.OPEN) {
    if (playerMessage?.content === "") return;
    
    // Создаем пузырёк для отправителя, если сообщение из бабл-чата
    if (playerMessage.from_bubble_chat) {
      player.createChatBubbleTarget(player.sprite, 20, -250, playerMessage?.content);
    }
    
    // Отправляем сообщение
    socket.send(JSON.stringify(playerMessage));
  }
}

// Отправка статусного сообщения
function sendStatusMessage(playerMessage) {
  if (socket?.readyState === WebSocket.OPEN) {
    if (playerMessage?.content === "") return;
    
    // Создаем полупрозрачный пузырёк
    player.createChatBubbleTarget(player.sprite, 20, -250, playerMessage?.content, 0.4, 0.3);
    
    // Отправляем сообщение
    const statusMsg = {
      type: "status_message",
      content: playerMessage?.content,
      receiver_id: null,
      from_bubble_chat: true,
      is_bubble: true
    };
    
    socket.send(JSON.stringify(statusMsg));
  }
}
```

## Игровая система

Игровая система построена на Phaser 3 и включает следующие основные компоненты:

### Game.js - основной класс игры

```javascript
export default class Game extends Phaser.Scene {
  // Инициализация сцены
  create() {
    this.createMap();
    this.addPlayer();
    this.addCollision();
    this.addCamera();
    this.createAnimObjects();
    this.createAnimObjects2Layer();
    this.initWebSocket();
    this.onMapLoaded();
    this.setupVisibilityHandler();
  }
  
  // Обработка сообщений от сервера
  handleMessage(data) {
    switch (data.type) {
      case 'initial_players':
        // Инициализация других игроков
        break;
      case 'player_joined':
        // Обработка присоединения нового игрока
        break;
      case 'player_moved':
        // Обработка движения игрока
        break;
      case 'player_teleport':
        // Обработка телепортации игрока
        break;
      case 'player_leave':
        // Обработка выхода игрока
        break;
      case 'global_message':
        // Обработка глобального сообщения
        break;
      case 'private_message':
        // Обработка приватного сообщения
        break;
      case 'addressed_message':
        // Обработка адресованного сообщения
        break;
      case 'status_message':
        // Обработка статусного сообщения
        break;
      case 'call_request':
        // Обработка запроса на звонок
        break;
      case 'full_sync':
        // Обработка полной синхронизации данных
        break;
    }
  }
}
```

### Player.js - класс игрового персонажа

```javascript
export default class Player {
  constructor(scene, name, x, y, isPlayer, playerRef, avatar, playerid) {
    this.scene = scene;
    this.name = name;
    this.isPlayer = isPlayer;
    this.avatar = avatar;
    this.playerid = playerid;
    
    this.init(x, y);
  }
  
  // Инициализация персонажа
  init(x, y) {
    // Создание спрайта
    this.sprite = this.scene.matter.add.sprite(0, 0, "dummy", 0);
    
    // Настройка коллизий
    const { Body, Bodies } = Phaser.Physics.Matter.Matter;
    const mainBody = Bodies.rectangle(0, 5, 30, 15, {
      chamfer: { radius: 10 },
      label: this.label,
    });
    const compoundBody = Body.create({
      parts: [mainBody],
      render: { sprite: { xOffset: 0, yOffset: 0.4 } },
    });
    
    // Настройка спрайта
    this.sprite
      .setExistingBody(compoundBody)
      .setFixedRotation()
      .setPosition(x, y)
      .setCollisionGroup(null);
    
    // Добавление анимаций и элементов интерфейса
    this.addAnimations();
    this.addNickname();
    this.addLightning();
    this.addChatElements();
    
    // Настройка интерактивности
    if (!this.isPlayer) {
      this.setupInteractivity();
    }
  }
  
  // Создание пузырька с сообщением
  createChatBubbleTarget(targetSprite, offsetX, offsetY, text, scale = 0.6, bubbleAlpha = 1) {
    // Создаем графические элементы пузырька
    const bubble = this.scene.add.graphics();
    const bubbleText = this.scene.add.text(0, 0, text, {
      color: "#000",
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      lineSpacing: 4,
      wordWrap: { width: 650 * scale }
    });
    
    // Настраиваем визуальные эффекты и расположение
    // Автоматическое уничтожение через 5 секунд
    this.scene.time.delayedCall(5000, () => {
      if (bubble && bubble.destroy) bubble.destroy();
      if (bubbleText && bubbleText.destroy) bubbleText.destroy();
    });
    
    return { bubble, bubbleText };
  }
}
```

### DirectionArrow.js - класс указателей направления

```javascript
export default class DirectionArrow {
  constructor(scene, x, y, options = {}) {
    this.scene = scene;
    
    // Настройка опций
    this.options = {
      scale: options.scale || 0.5,
      alpha: options.alpha || 0.8,
      rotation: options.rotation || 0,
      tint: options.tint || 0xFFFFFF,
      pulseMinScale: options.pulseMinScale || 0.8,
      pulseMaxScale: options.pulseMaxScale || 1.2,
      pulseDuration: options.pulseDuration || 1000,
      depth: options.depth || 1000
    };
    
    // Создание спрайта
    this.sprite = this.scene.add.image(x, y, 'directionArrow');
    this.sprite.setScale(this.options.scale);
    this.sprite.setAlpha(this.options.alpha);
    this.sprite.setRotation(this.options.rotation);
    this.sprite.setTint(this.options.tint);
    this.sprite.setDepth(this.options.depth);
    
    // Запуск анимации
    this.startPulseAnimation();
  }
  
  // Методы управления стрелкой
  startPulseAnimation() {/* ... */}
  stopPulseAnimation() {/* ... */}
  setPosition(x, y) {/* ... */}
  setRotation(rotation) {/* ... */}
  setAngle(angle) {/* ... */}
  setTint(color) {/* ... */}
  setAlpha(alpha) {/* ... */}
  destroy() {/* ... */}
}
```

## Хранилище состояний (Stores)

Приложение использует Pinia для управления состоянием. Основные хранилища:

### UserStore (stores/user.js)

```javascript
export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const token = ref(null);
  const externalUserData = ref(null);
  const isAuthenticated = ref(false);
  
  // Авторизация пользователя
  const login = async (username, password) => {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);
    
    const response = await fetch(API_URL+'token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    
    if (!response.ok) {
      throw new Error('Ошибка авторизации');
    }
    
    const data = await response.json();
    token.value = data.access_token;
    isAuthenticated.value = true;
    await fetchUserData();
  };
  
  // Получение данных пользователя
  const fetchUserData = async () => {
    const response = await fetch(API_URL+'me', {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Ошибка получения данных пользователя');
    }
    
    user.value = await response.json();
    
    if (user.value && user.value.myid) {
      await fetchExternalUserData(user.value.id);
    }
  };
  
  // Получение расширенных данных пользователя
  const fetchExternalUserData = async (userId) => {
    try {
      const response = await fetch(`${API_URL}user-info/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      });
      
      if (!response.ok) {
        externalUserData.value = null;
        return;
      }
      
      externalUserData.value = await response.json();
    } catch (error) {
      externalUserData.value = null;
    }
  };
  
  // Обновление аватара пользователя
  const updateAvatar = async (userId, avatarUpdate) => {
    const response = await fetch(`${API_URL}users/${userId}/avatar?avatar_update=${avatarUpdate}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Ошибка обновления аватара');
    }
    
    await fetchUserData();
  };
  
  // Выход из системы
  const logout = () => {
    user.value = null;
    token.value = null;
    externalUserData.value = null;
    isAuthenticated.value = false;
  };
  
  return {
    user,
    token,
    isAuthenticated,
    externalUserData,
    login,
    logout,
    fetchUserData,
    fetchExternalUserData,
    updateAvatar,
  };
});
```

### MenuStore (stores/menu.js)

```javascript
export const useMenuStore = defineStore("menu", () => {
  const menuState = ref("");
  const currentUserId = ref(null);
  const isMenuOpen = ref(false);

  // Установка состояния меню
  function setMenuState(value) {
    menuState.value = value;
  }
  
  // Установка текущего ID пользователя
  function setCurrentUser(userId) {
    currentUserId.value = userId;
  }

  return { menuState, currentUserId, setMenuState, setCurrentUser };
});
```

### SkinStore (stores/skin.js)

```javascript
export const useSkinStore = defineStore("skin", () => {
  const currentSkin = ref("woman3");

  // Установка текущего скина
  function setCurrentSkin(value) {
    currentSkin.value = value;
  }

  return { currentSkin, setCurrentSkin };
});
```

## Сетевое взаимодействие

Проект использует WebSocket для обмена данными в реальном времени.

### Инициализация WebSocket соединения

```javascript
function initWebSocket() {
  // Получаем данные пользователя
  const userData = this.registry.get('userData');
  
  // Устанавливаем соединение
  this.socket = new WebSocket(WS_URL+`ws/${userData.userId}`);
  
  // Обработчик открытия соединения
  this.socket.onopen = (e) => {
    console.log("WebSocket connection established");
    this.wsState = 'connected';
    
    // Отправляем начальную позицию
    this.sendPlayerState(this.player.sprite.x, this.player.sprite.y);
    
    // Запрашиваем полную синхронизацию
    this.socket.send(JSON.stringify({ type: "request_full_sync" }));
    
    // Запускаем ping для поддержания соединения
    this.pingInterval = setInterval(() => {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "ping" }));
        this.socket.send(JSON.stringify({ type: "request_full_sync" }));
      }
    }, 10000);
  };
  
  // Обработчик сообщений
  this.socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Обработка различных типов сообщений
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  
  // Обработчик закрытия соединения
  this.socket.onclose = (event) => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.wsState = 'disconnected';
    
    clearInterval(this.pingInterval);
    clearInterval(this.syncCheckInterval);
    
    // Переподключение
    const reconnectDelay = Math.min(2000 + Math.random() * 1000, 5000);
    setTimeout(() => {
      if (this.wsState === 'disconnected') {
        this.initWebSocket();
      }
    }, reconnectDelay);
  };
  
  // Обработчик ошибок
  this.socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    this.wsState = 'error';
  };
}
```

### Основные методы для работы с сетью

```javascript
// Отправка состояния игрока
sendPlayerState(x, y) {
  if (this.socket?.readyState === WebSocket.OPEN) {
    this.socket.send(JSON.stringify({
      type: "position_update",
      x: parseInt(x),
      y: parseInt(y)
    }));
  }
}

// Отправка начала движения
sendPlayerMovement(currentX, currentY, targetX, targetY) {
  if (this.socket?.readyState === WebSocket.OPEN) {
    this.socket.send(JSON.stringify({
      type: "position_update",
      x: Math.round(currentX),
      y: Math.round(currentY),
      target_x: Math.round(targetX),
      target_y: Math.round(targetY)
    }));
  }
}

// Отправка текущей позиции
sendPlayerPosition(x, y) {
  if (this.socket?.readyState === WebSocket.OPEN) {
    this.socket.send(JSON.stringify({
      type: "position_update",
      x: parseInt(x),
      y: parseInt(y)
    }));
  }
}

// Телепортация игрока
sendWSteleportPlayerTo(newX, newY) {
  if (this.socket?.readyState === WebSocket.OPEN) {
    this.socket.send(JSON.stringify({
      type: "teleport",
      x: newX,
      y: newY
    }));
  }
}
```

## Полезные методы и функции

### Работа с чат-бабликами

```javascript
// Создание чат-бабла с сообщением
createChatBubbleTarget(targetSprite, offsetX, offsetY, text, scale = 0.6, bubbleAlpha = 1) {
  // Форматирование текста
  const formatText = (str, maxLineLength = 35) => {
    const words = str.split(" ");
    let lines = [];
    let currentLine = "";
    
    for (let word of words) {
      if (currentLine.length + word.length + 1 <= maxLineLength) {
        currentLine += (currentLine.length === 0 ? "" : " ") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    return lines.join("\n");
  };
  
  // Создание графического объекта для бабла
  const bubble = this.scene.add.graphics();
  
  // Создание текста бабла
  const bubbleText = this.scene.add.text(0, 0, formatText(text), {
    color: "#000",
    fontFamily: '"Press Start 2P"',
    fontSize: '20px',
    lineSpacing: 4,
    wordWrap: { width: 650 * scale }
  });
  
  // Автоматическое уничтожение через 5 секунд
  this.scene.time.delayedCall(5000, () => {
    if (bubble && bubble.destroy) bubble.destroy();
    if (bubbleText && bubbleText.destroy) bubbleText.destroy();
  });
  
  return { bubble, bubbleText };
}
```

### Управление видимостью молнии (интерактивность с другими игроками)

```javascript
// Показать молнию над персонажем
showLightning() {
  if (this.lightning) {
    // Сбрасываем состояние молнии
    this.setLightningState("normal");
    this.lightningVisible = true;
    
    // Добавляем анимацию "взрыва" при появлении
    this.lightning.setScale(0.2);
    this.scene.tweens.killTweensOf(this.lightning);
    
    this.scene.tweens.add({
      targets: this.lightning,
      scaleX: { from: 0.2, to: 1.2 },
      scaleY: { from: 0.2, to: 1.2 },
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // После "взрыва" возвращаемся к нормальному размеру
        this.scene.tweens.add({
          targets: this.lightning,
          scaleX: 0.25, 
          scaleY: 0.25,
          duration: 200,
          ease: 'Power2.easeInOut',
          onComplete: () => {
            // И затем запускаем обычную пульсацию
            this.setupLightningAnimation();
          }
        });
      }
    });
    
    // Настраиваем интерактивность
    if (!this.isPlayer) {
      this.setupLightningInteractivity();
    }
  }
}

// Скрыть молнию над персонажем
hideLightning() {
  // Останавливаем все анимации
  [this.lightning, this.lightningGreen, this.lightningRed].forEach(icon => {
    if (icon) {
      this.scene.tweens.killTweensOf(icon);
      icon.visible = false;
    }
  });
  
  this.lightningVisible = false;
  this.lightningState = "normal";
  this.menuOpen = false;
  
  // Отключаем интерактивность
  [this.lightning, this.lightningGreen, this.lightningRed].forEach(icon => {
    if (!this.isPlayer && icon && icon.input) {
      icon.input.enabled = false;
    }
  });
  
  // Закрываем меню
  emitter.emit("close-menu2");
}
```

### Проверка расстояния между игроками

```javascript
// Проверка расстояния между игроком и другими персонажами
checkPlayerProximity() {
  if (!this.player) return;
  
  // Расстояние взаимодействия
  const interactionDistance = 200;
  const warningDistanceRatio = 0.7;
  
  // Отслеживаем игроков в зоне общения
  if (!this.playersInRange) {
    this.playersInRange = new Map();
  }
  
  // Проверяем всех игроков
  this.otherPlayers.forEach((otherPlayer, playerId) => {
    if (otherPlayer && otherPlayer.sprite) {
      // Вычисляем расстояние
      const distanceX = Math.pow(this.player.sprite.x - otherPlayer.sprite.x, 2);
      const distanceY = Math.pow(this.player.sprite.y - otherPlayer.sprite.y, 2);
      const distance = Math.sqrt(distanceX + distanceY);
      
      // Соотношение расстояния
      const distanceRatio = distance / interactionDistance;
      
      // Проверяем статус взаимодействия
      const wasInRange = this.playersInRange.get(playerId);
      
      if (distance <= interactionDistance) {
        // Игрок в зоне общения
        if (!otherPlayer.lightningVisible) {
          otherPlayer.showLightning();
        }
        
        // Проверка состояния предупреждения
        if (otherPlayer.menuOpen) {
          otherPlayer.checkWarningState(distanceRatio);
        }
        
        this.playersInRange.set(playerId, true);
      } else {
        // Игрок вне зоны общения
        if (otherPlayer.lightningVisible) {
          otherPlayer.hideLightning();
        }
        
        // Если игрок был в зоне, а теперь вышел
        if (wasInRange) {
          emitter.emit('player-out-of-range', playerId);
        }
        
        this.playersInRange.set(playerId, false);
      }
    }
  });
}
```

### Телепортация игрока

```javascript
// Метод телепортации
teleportPlayer(newX, newY) {
  // Затемнение экрана
  this.cameras.main.fadeOut(1000, 0, 0, 0);

  // После завершения затемнения
  this.cameras.main.once('camerafadeoutcomplete', () => {
    // Перемещаем игрока
    this.player.sprite.setPosition(newX, newY);
    this.player.resetMovement();

    // Отправляем информацию на сервер
    this.sendWSteleportPlayerTo(newX, newY);
    
    // Начинаем осветление экрана
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeincomplete', () => {
      this.player.blockMovement = false;
      this.player.resetMovement();
    });
  });
}
```
