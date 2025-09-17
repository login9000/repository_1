import Player from "../gameobjects/player";
import AnimObject from '../gameobjects/anim-object';
import DirectionArrow from '../gameobjects/direction-arrow';
import bubbleMessages from "../../stores/bubbleMessages.js";


import data from "../serverMock/data.json";
import emitter from "../../plugins/emitter.js";
import { WS_URL } from "../../config.js";
import { v4 as uuidv4 } from 'uuid';

export default class Game extends Phaser.Scene {
  // Методы для управления стрелками-указателями
  createDirectionArrow(id, x, y, options = {}) {
    // Если стрелка с таким ID уже существует, удаляем её
    if (this.directionArrows.has(id)) {
      this.removeDirectionArrow(id);
    }

    // Создаем новую стрелку
    const arrow = new DirectionArrow(this, x, y, options);

    // Сохраняем стрелку в Map
    this.directionArrows.set(id, arrow);

    return arrow;
  }

  // Метод для удаления стрелки-указателя по ID
  removeDirectionArrow(id) {
    const arrow = this.directionArrows.get(id);
    if (arrow) {
      arrow.destroy();
      this.directionArrows.delete(id);
      return true;
    }
    return false;
  }

  // Метод для обновления позиции стрелки-указателя
  updateDirectionArrowPosition(id, x, y) {
    const arrow = this.directionArrows.get(id);
    if (arrow) {
      arrow.setPosition(x, y);
      return true;
    }
    return false;
  }

  // Метод для обновления угла поворота стрелки-указателя (в радианах)
  updateDirectionArrowRotation(id, rotation) {
    const arrow = this.directionArrows.get(id);
    if (arrow) {
      arrow.setRotation(rotation);
      return true;
    }
    return false;
  }

  // Метод для обновления угла поворота стрелки-указателя (в градусах)
  updateDirectionArrowAngle(id, angle) {
    const arrow = this.directionArrows.get(id);
    if (arrow) {
      arrow.setAngle(angle);
      return true;
    }
    return false;
  }

  // Метод для обновления цвета стрелки-указателя
  updateDirectionArrowColor(id, color) {
    const arrow = this.directionArrows.get(id);
    if (arrow) {
      arrow.setTint(color);
      return true;
    }
    return false;
  }

  // Метод для создания стрелок-указателей для всех точек интереса на карте
  createAllDirectionArrows(points) {
    // Удаляем все существующие стрелки
    this.clearAllDirectionArrows();

    // Создаем новые стрелки для каждой точки
    points.forEach((point, index) => {
      this.createDirectionArrow(
        `point_${index}`, // уникальный ID для стрелки
        point.x,
        point.y,
        {
          rotation: point.rotation || 0,
          tint: point.color || 0xFFFFFF,
          scale: point.scale || 0.5
        }
      );
    });
  }

  // Метод для удаления всех стрелок-указателей
  clearAllDirectionArrows() {
    this.directionArrows.forEach((arrow, id) => {
      arrow.destroy();
    });
    this.directionArrows.clear();
  }

  // Метод для создания стрелки-указателя, показывающей направление к точке
  createPointingArrow(id, startX, startY, targetX, targetY, options = {}) {
    // Вычисляем угол между точками
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);

    // Создаем стрелку с нужным углом
    const arrowOptions = {
      ...options,
      rotation: angle
    };

    return this.createDirectionArrow(id, startX, startY, arrowOptions);
  }

  // Метод для создания маршрута из стрелок между точками
  createArrowPath(points, options = {}) {
    // Удаляем существующие стрелки на пути
    points.forEach((_, index) => {
      if (index > 0) {
        this.removeDirectionArrow(`path_${index - 1}_${index}`);
      }
    });

    // Создаем стрелки между последовательными точками
    for (let i = 0; i < points.length - 1; i++) {
      const startPoint = points[i];
      const endPoint = points[i + 1];

      // Рассчитываем позицию стрелки (может быть посередине между точками)
      const arrowX = (startPoint.x + endPoint.x) / 2;
      const arrowY = (startPoint.y + endPoint.y) / 2;

      // Создаем стрелку, указывающую направление
      this.createPointingArrow(
        `path_${i}_${i + 1}`, // уникальный ID для стрелки
        arrowX,
        arrowY,
        endPoint.x,
        endPoint.y,
        options
      );
    }
  }
  userData;
  constructor() {
    super({ key: "game" });
    this.player = null;
    this.counter = 0;
    this.offset = 0;
    this.dummies = [];
    this.animObjects = [];
    this.x_start_offset = 800;
    this.y_start_offset = 400;
    this.bubbles = { 'my': null, 'others': {} };
    this.bubbleMessages = { 'my': new bubbleMessages(), 'others': {} };

    this.thoughtsBubbles = { 'my': null, 'others': {} };
    this.thoughtsBubbleMessages = { 'my': new bubbleMessages(2), 'others': {} };
    this.bubbleImages = { 'private': {}, 'thoughts': {} };
    this.bubbleTextures = {};

    this.currentChattingUserId = null;

    this.otherPlayers = new Map();
    this.playersData = {};
    this.playersWithMessages = {}
    this.chatting_mode = ''; //message or thoughts

    // Хранилище для стрелок-указателей
    this.directionArrows = new Map();

    emitter.emit('chat-set-limit-messages', { 'private': this.bubbleMessages.my.message_per_bubble, 'status': this.thoughtsBubbleMessages.my.message_per_bubble });


    document.addEventListener("visibilitychange", function () {
      switch (document.visibilityState) {
        case 'visible':
          globalThis.WEB_SOCKET.send(JSON.stringify(
            { "type": "get_initial_players" }
          ));
          break;
        case 'hidden':
          emitter.emit('inactive-screen', true);
          break;
      }
    });

  }

  update() {
    this.counter++;
    if (this.counter > 200) {
      this.offset++;
      if (this.offset >= data.length) {
        this.offset = 0;
      }
      const coords = this.tileMap.getObjectLayer("walkingDummy");
      const x = coords.objects[0].x - this.x_start_offset;
      const y = coords.objects[0].y + this.y_start_offset;
      this.dummies.forEach((dummy, index) =>
        dummy.setPointer({
          x: x + data[this.offset].x + 100 * (index % 13),
          y: y + data[this.offset].y - 100 * (index / 13),
        })
      );
      this.counter = 0;
    }

    // Проверка расстояния между игроком и другими персонажами
    this.checkPlayerProximity();

    if (typeof (this.player) == 'object' && this.player !== null) {

      //Private messages
      this.bubbleMessages.my.setCurrentChattingPlayerId(this.currentChattingUserId);
      let text = this.bubbleMessages.my.getFormatedContent();
      this.checkBubbleImages(text, 'private');

      if (this.bubbles.my) {
        this.bubbles.my.bubble.destroy();
        for (let bubbleText of this.bubbles.my.bubbleText) {
          if (typeof (bubbleText.destroy) == 'function')
            bubbleText.destroy();
        }
        // this.bubbles.my.bubbleText.destroy();
      }
      if (text.length > 0) {
        this.bubbles.my = this.player.createChatBubbleTarget(this.player.sprite, 20, -250, text, false, 1, 'private');
      }

      if (this.currentChattingUserId !== null) {
        emitter.emit('chat-remaning-messages', this.bubbleMessages.my.getRemainingTime());
        emitter.emit('chat-set-current-messages-length', this.bubbleMessages.my.getMessagesLength());
      }

      //Status messages/thoughts
      let text_thought = this.thoughtsBubbleMessages.my.getFormatedContent();

      //checking images for deleting
      this.checkBubbleImages(text_thought, 'thoughts');

      if (this.thoughtsBubbles.my) {
        this.thoughtsBubbles.my.bubble.destroy();
        for (let bubbleText of this.thoughtsBubbles.my.bubbleText) {
          if (typeof (bubbleText.destroy) == 'function')
            bubbleText.destroy();
        }
        // this.thoughtsBubbles.my.bubbleText.destroy();
      }

      if (text_thought.length > 0) {
        this.thoughtsBubbles.my = this.player.createChatBubbleTarget(this.player.sprite, 20, -250, text_thought, 0, 0.2);
      }

      if (this.currentChattingUserId == null) {
        emitter.emit('chat-remaning-messages', this.thoughtsBubbleMessages.my.getRemainingTime());
        emitter.emit('chat-set-current-messages-length', this.thoughtsBubbleMessages.my.getMessagesLength());
      }

    }


    if (Object.keys(this.bubbleMessages.others).length > 0) {
      //Private messages
      for (let player_id in this.bubbleMessages.others) {

        if (this.bubbleMessages.others[player_id] !== null) {
          let player_bubbleMessages = this.bubbleMessages.others[player_id].messages;
          let player_sprite = this.bubbleMessages.others[player_id].sprite;
          if (window.gameInstance.currentChattingUserId == null || window.gameInstance.currentChattingUserId == player_id) {
            let text = player_bubbleMessages.getFormatedContent();

            const otherPlayer = this.otherPlayers.get(player_id);

            if (typeof (this.bubbles.others[player_id]) == 'object') {
              this.bubbles.others[player_id].bubble.destroy();
              for (let bubbleText of this.bubbles.others[player_id].bubbleText) {
                if (typeof (bubbleText.destroy) == 'function')
                  bubbleText.destroy();
              }

              // this.bubbles.others[player_id].bubbleText.destroy();
            }

            if (text.length > 0) {
              this.bubbles.others[player_id] = otherPlayer.createChatBubbleWithReply(player_sprite, 20, -250, text);
            } else {
              if (typeof (this.bubbles.others[player_id].replyButton) == 'object' && this.bubbles.others[player_id].replyButton !== null) {
                this.bubbles.others[player_id].replyButton.destroy();
              }
              this.bubbles.others[player_id].bubble.destroy();
              for (let bubbleText of this.bubbles.others[player_id].bubbleText) {
                if (typeof (bubbleText.destroy) == 'function')
                  bubbleText.destroy();
              }

              // this.bubbles.others[player_id].bubbleText.destroy();

              player_bubbleMessages.flush();
              this.checkBubbleImages([], 'private', player_id);

              if (!this.playersInRange.get(player_id))
                this.bubbleMessages.others[player_id] = null;
            }

            this.checkBubbleImages(text, 'private', player_id);

          } else {

            // if (typeof(this.bubbles.others[player_id]) !== 'undefined' && this.bubbles.others[player_id] !== null) {

            //   if (typeof(this.bubbles.others[player_id].replyButton) == 'object' && this.bubbles.others[player_id].replyButton !== null) {
            //     this.bubbles.others[player_id].replyButton.destroy();
            //   }
            //   this.bubbles.others[player_id].bubble.destroy();
            //   this.bubbles.others[player_id].bubbleText.destroy();
            //   player_bubbleMessages.flush();
            // }
          }
        }
      }
    }

    emitter.emit('update-bubble-message');


    if (Object.keys(this.thoughtsBubbleMessages.others).length > 0) {
      //Status messages/thoughts
      for (let player_id in this.thoughtsBubbleMessages.others) {
        let player_bubbleMessages = this.thoughtsBubbleMessages.others[player_id].messages;
        let player_sprite = this.thoughtsBubbleMessages.others[player_id].sprite;
        let text = player_bubbleMessages.getFormatedContent();
        this.checkBubbleImages(text, 'thoughts', player_id);

        const otherPlayer = this.otherPlayers.get(player_id);

        if (typeof (this.thoughtsBubbles.others[player_id]) == 'object') {
          this.thoughtsBubbles.others[player_id].bubble.destroy();

          for (let bubbleText of this.thoughtsBubbles.others[player_id].bubbleText) {
            bubbleText.destroy();
          }
          // this.thoughtsBubbles.others[player_id].bubbleText.destroy();
        }

        if (text.length > 0) {
          this.thoughtsBubbles.others[player_id] = otherPlayer.createChatBubbleTarget(player_sprite, 20, -250, text, 0, 0.2);
        }
      }

    }

  }


  checkBubbleImages(messages, type, player_id = 0) {
    if (typeof (this.bubbleImages[type]) == 'object' && typeof (this.bubbleImages[type][player_id]) == 'object') {
      for (let image_uuid in this.bubbleImages[type][player_id]) {
        let remove_image = true;
        for (let message of messages) {
          if (message.uuid == image_uuid) {
            remove_image = false;
          }
        }
        if (remove_image) {
          this.bubbleImages[type][player_id][image_uuid].destroy(true);
          // this.bubbleTextures['bubble-image-' + image_uuid].destroy(true);
          // delete this.bubbleTextures['bubble-image-' + image_uuid];
          delete this.bubbleImages[type][player_id][image_uuid];
        }
      }
    }
  }

  init(data) {
    this.map = data.map;
    document.body.classList.add('game-body');
    // Сохраняем данные пользователя в registry
    if (data.userData) {
      this.registry.set('userData', data.userData);
    }
  }

  afterPlayerCreated() {
    this.addCollision();
    this.addCamera();
    //this.createDummy();
    // this.createDummies(80);
    this.createAnimObjects();
    this.createAnimObjects2Layer();

    // Тестовый пример стрелок указателей
    // Создаем несколько стрелок на карте, указывающих на интересные места
    this.createDirectionArrow('restaurant', 2650, 2035, {
      tint: 0xFFD700, // золотой цвет
      scale: 0.7,
      angle: 270,
      pulseMaxScale: 1.3
    });

    this.createDirectionArrow('dance_floor', 2925, 1610, {
      tint: 0xFF1493, // розовый цвет
      scale: 0.7,
      angle: 180, // стрелка вниз
      pulseMaxScale: 1.3
    });

    this.createDirectionArrow('dance_floor', 2900, 1150, {
      tint: 0xFF1493, // розовый цвет
      scale: 0.7,
      angle: 180, // стрелка вниз
      pulseMaxScale: 1.3
    });


    this.createDirectionArrow('lounge', 3350, 1900, {
      tint: 0x00BFFF, // голубой цвет
      scale: 0.7,
      angle: 90, // стрелка вправо
      pulseMaxScale: 1.3,
      depth: 2000,
    });

    this.createDirectionArrow('lounge', 4100, 1000, {
      tint: 0x00BFFF, // голубой цвет
      scale: 0.7,
      angle: 90, // стрелка вправо
      pulseMaxScale: 1.3
    });


    this.onMapLoaded();

    this.setupVisibilityHandler();
  }

  create() {

    // Получаем данные пользователя из registry
    const userData = this.registry.get('userData');
    if (!userData) {
      console.error("Данные пользователя не найдены");
      return;
    }

    this.createMap();

    this.initWebSocket();
  }

  initWebSocket() {
    const userData = this.registry.get('userData');
    if (!userData) {
      console.error("Данные пользователя не найдены");
      return;
    }
    // Track connection state
    this.wsState = 'connecting';
    // console.log("Connecting to WebSocket...");

    // Передаем токен как query-параметр
    this.socket = globalThis.WEB_SOCKET; //new WebSocket(WS_URL + `wss`);
    // console.log("Connecting to WebSocket...", this.socket);
    // this.socket.onopen = (e) => {

    // // console.log("WebSocket connection established");
    this.wsState = 'connected';

    // Update connection timestamp
    this.lastConnectionTime = Date.now();

    // Store set of known players for sync validation
    this.knownPlayerIds = new Set([userData.userId]);


    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'initial_players':


            if (data.players.length > 0) {
              data.players.forEach(player => {
                this.handlePlayerLeave(player);
              });
            }

            // Track the players we know about
            data.players.forEach(player => {
              this.knownPlayerIds.add(player.user_id);
              this.playersData[player.user_id] = player;
              if (parseInt(player.user_id) !== parseInt(userData.userId)) {
                console.log('adding other user!', player);
                this.createOtherPlayer(player);
              } else {
                if (this.player == null) {
                  console.log('adding current user!', player);
                  this.addPlayer(player);
                }
              }
            });

            emitter.emit('inactive-screen', false);

            break;

          case 'player_joined': // Новое событие подключения игрока
            // console.log("Player joined:", data.user_id, data.username);
            this.knownPlayerIds.add(data.user_id);
            if (typeof (this.playersData[data.user_id]) !== 'object') {
              this.playersData[data.user_id] = {
                'user_id': data.user_id,
                'username': data.username,
                'avatar': data.avatar,
                'skin': data.skin,
                'status': data.status,
                'x': data.x,
                'y': data.y
              };

            }
            this.handlePlayerJoin(data);
            break;

          case 'error':
            // window.location.href = '/#' + data.message;
            break;

          case 'player_moved':
            if (data.user_id !== userData.userId) {
              // console.log('player_moved!');
              this.handlePlayerMove(data);
            }
            break;

          case 'player_teleported':
            if (data.user_id !== userData.userId) {
              this.handlePlayerTeleport(data);
            }
            break;

          case 'player_updated':

            console.log('player is updating!');
            // this.updateOtherPlayer(data);
            this.handlePlayerLeave(data);
            this.createOtherPlayer(data);

            //this.updateOtherPlayers(data.players);
            break;
          case 'player_leaved':
            // console.log("Player left:", data.user_id);
            this.knownPlayerIds.delete(data.user_id);
            this.handlePlayerLeave(data);
            break;
          case "global_message":
            if (data.message) {
              const newMessage = {
                id: data.message.id,
                sender: data.message.sender_username,
                sender_id: data.message.sender_id, // Используем правильное имя поля
                message: data.message.content,
                color: data.message.sender_id === userData.id ? "#4CAF50" : "#fff"
              };
              // console.log('Processed message:', newMessage); // Отладочный вывод
              emitter.emit('new-message', newMessage);
            }
            break;

          case 'private_message_is_read':

            if (typeof (data.uuid) == 'string') {
              window.gameInstance.bubbleMessages.my.makeMessageRead(data.uuid, data.sender_id);
            }

            break;
          case 'private_message':
            // console.log('Buble message show from receiver:', data);
            // console.log('got message', data);


            // Проверяем, что сообщение существует и содержит необходимые данные
            if (data.message && data.message.sender_id && data.message.from_bubble_chat === true) {

              // Проверяем, пришло ли сообщение из бабл-чата и нужно ли показывать бабл

              if (userData.userId !== data.message.sender_id) {
                this.addMessageBubbleWithReply(
                  data.message.sender_id,
                  data.message.uuid,
                  data.message.content,
                  data.message.image,
                  data.message.sender_username || `User-${data.message.sender_id}`);
              }

            }

            // Forward the message to appropriate handler based on the flag
            if (data.message.from_bubble_chat === true || data.from_bubble_chat === true) {
              emitter.emit('new-bubble-message', data);
            } else {
              emitter.emit('new-private-message', data);
            }

            break;

          case "addressed_message":
            if (data.message) {
              // Проверка: если сообщение помечено как from_chat_panel или show_bubble равно false,
              // то мы его не показываем в пузырьке
              const dontShowBubble = data.message.from_chat_panel === true ||
                data.from_chat_panel === true ||
                data.message.show_bubble === false ||
                data.show_bubble === false;

              const isCurrentUser = data.message.sender_id === userData.userId;
              const newMessage = {
                id: data.message.id,
                sender: data.message.sender_username,
                sender_id: data.message.sender_id, // Используем правильное имя поля
                message: data.message.content,
                addresseeName: data.message.addressee_username,
                addresseeId: data.message.addressee_id,
                isAddressed: true,
                sentByMe: isCurrentUser,
                color: isCurrentUser ? "#4CAF50" : "#6495ED",
                from_chat_panel: data.message.from_chat_panel || data.from_chat_panel
              };
              // console.log('Получено адресованное сообщение:', newMessage);
              emitter.emit('new-message', newMessage);

              // Создаем пузырёк только если сообщение не из ChatPanel и show_bubble не равен false
              // if (!dontShowBubble && data.message.sender_id) {
              //   // Это может быть пузырёк от другой системы (не из ChatPanel)
              //   this.addMessageBubble(
              //    data.message.sender_id,
              //    `@${data.message.addressee_username}: ${data.message.content}`,
              //    0.6,
              //    1
              //   );
              // }
            }
            break;

          case 'status_message':
            if (data.message) {

              // console.log('Status message:', data);

              if (data.message.content && data.message.sender_id && userData.userId !== data.message.sender_id) {
                this.addMessageBubble(data.message.sender_id, data.message.content, 0.4, 0.04, data.message.image);
              }

            }
            break;

          case 'call_request':
            emitter.emit('open-video-form', {
              type: 'incoming',
              callerId: data.callerId,
              callerName: data.callerName,
              callId: data.callId
            });
            // console.log("Incoming call from " + data.callerId);
            break;

          case 'call_response':
            emitter.emit('call-response', data);
            break;

          case 'call_signal':
            emitter.emit('call-signal', data);
            break;

          // case 'full_sync':
          //   // console.log("Full sync received with", data.players.length, "players");
          //   this.handleFullSync(data.players);

          //   // Update our known player set
          //   const syncedIds = new Set();
          //   data.players.forEach(p => syncedIds.add(p.user_id));

          //   // Check for inconsistencies
          //   const missingPlayers = [...this.knownPlayerIds].filter(id =>
          //     id !== userData.userId && !syncedIds.has(id));
          //   const newPlayers = [...syncedIds].filter(id =>
          //     id !== userData.userId && !this.knownPlayerIds.has(id));

          //   if (missingPlayers.length > 0) {
          //     console.warn("Players missing from sync:", missingPlayers);
          //   }

          //   if (newPlayers.length > 0) {
          //     // console.log("New players discovered in sync:", newPlayers);
          //   }

          //   // Update our known player set
          //   this.knownPlayerIds = syncedIds;
          //   this.knownPlayerIds.add(userData.userId);
          //   break;

          case 'radio_state_update':
            // Emit a radio state update event
            emitter.emit('radio-state-update', data.radioState);
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.socket.onclose = (event) => {
      // console.log('WebSocket disconnected:', event.code, event.reason);
      this.wsState = 'disconnected';

      // Clean up intervals
      clearInterval(this.pingInterval);
      clearInterval(this.syncCheckInterval);

      // More aggressive reconnection strategy
      const reconnectDelay = Math.min(2000 + Math.random() * 1000, 5000);
      // console.log(`Attempting to reconnect in ${reconnectDelay}ms...`);

      setTimeout(() => {
        if (this.wsState === 'disconnected') {
          // console.log("Attempting to reconnect...");
          this.initWebSocket();
        }
      }, reconnectDelay);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.wsState = 'error';

      // Don't show alerts as they're disruptive
      console.error('Connection Error! WebSocket error');
    };

    // Make game instance globally available for VideoForm to use
    window.gameInstance = this;

    // Emit the game instance to allow other components to communicate
    emitter.emit('game-instance', this);

    this.socket.send(JSON.stringify(
      { "type": "get_initial_players" }
    ));


  }

  // method to update radio state on server
  sendRadioCommand(command, params = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: "radio_command",
        command: command,
        params: params
      }));
    }
  }
  handlePlayerJoin(playerData, update = false) {
    // Проверяем, что это не текущий пользователь
    if (playerData.user_id === this.registry.get('userData').userId) return;

    if (!update) {
      // Проверяем, не существует ли уже игрок с таким ID
      if (this.otherPlayers.has(playerData.user_id)) {
        console.warn(`Player ${playerData.user_id} already exists`);
        return;
      }

      // Создаем нового игрока немедленно
      this.createOtherPlayer(playerData);

      // Дополнительная проверка и обновление позиции
      if (playerData.x && playerData.y) {
        const newPlayer = this.otherPlayers.get(playerData.user_id);
        if (newPlayer) {
          newPlayer.sprite.setPosition(playerData.x, playerData.y);
        }
      }
    } else {

      if (playerData.x && playerData.y) {
        const newPlayer = this.otherPlayers.get(playerData.user_id);
        // console.log('newPlayer', newPlayer);
        if (newPlayer) {
          newPlayer.sprite.setPosition(playerData.x, playerData.y);
        }
      }

    }
  }

  handlePlayerMove(data) {
    const otherPlayer = this.otherPlayers.get(data.user_id);
    if (!otherPlayer) return;
    otherPlayer.moveToPosition(data.target.x, data.target.y);
  }

  handlePlayerLeave(data) {
    // console.log(`Game: Игрок ${data.user_id} покидает игру`);

    // Отправляем событие о выходе игрока из зоны общения перед удалением
    emitter.emit('player-out-of-range', data.user_id);

    // Если отслеживаем игроков в зоне, удаляем запись
    if (this.playersInRange) {
      this.playersInRange.delete(data.user_id);
    }

    // Удаляем игрока
    this.removePlayer(data.user_id);
  }

  handleFullSync(players) {
    // console.log(`Processing full sync with ${players.length} players`);
    const userData = this.registry.get('userData');

    // Create a map of existing players by ID for quick lookup
    const existingPlayerMap = new Map();
    this.otherPlayers.forEach((player, id) => {
      existingPlayerMap.set(id, player);
    });

    // Track processed players
    const processedPlayerIds = new Set();

    players.forEach(player => {
      if (player.user_id === userData.userId) return;
      processedPlayerIds.add(player.user_id);

      const existingPlayer = existingPlayerMap.get(player.user_id);
      if (existingPlayer) {
        // Используем ту же логику интерполяции, что и в handlePlayerMove
        if (player.target_x !== undefined && player.targeting_started_at !== undefined) {
          const currentTime = Date.now();
          const elapsedTime = currentTime - player.targeting_started_at;
          const totalDistance = Math.sqrt(
            Math.pow(player.target_x - player.x, 2) +
            Math.pow(player.target_y - player.y, 2)
          );

          // Скорость персонажа в пикселях в миллисекунду (подстроить под вашу игру)
          const playerSpeed = 0.1; // пиксели/мс

          // Сколько пройдено от начальной точки к цели (0 до 1)
          const movementProgress = Math.min(1, (elapsedTime * playerSpeed) / totalDistance);

          if (movementProgress < 1) {
            // Есть незавершенное движение - интерполируем текущую позицию
            const interpolatedX = player.x + (player.target_x - player.x) * movementProgress;
            const interpolatedY = player.y + (player.target_y - player.y) * movementProgress;

            // Проверка расстояния между текущей и интерполированной позицией
            const currentX = existingPlayer.sprite.x;
            const currentY = existingPlayer.sprite.y;
            const distance = Math.sqrt(
              Math.pow(currentX - interpolatedX, 2) +
              Math.pow(currentY - interpolatedY, 2)
            );

            if (distance > 100) {
              // Значительное расхождение - телепортируем к интерполированной точке
              existingPlayer.sprite.setPosition(interpolatedX, interpolatedY);
              existingPlayer.resetMovement();
              // Устанавливаем целевую точку для продолжения движения
              existingPlayer.pointerPosition.x = player.target_x;
              existingPlayer.pointerPosition.y = player.target_y;
              existingPlayer.isMoving = true;
            } else {
              // Небольшое расхождение - просто обновляем цель движения
              existingPlayer.moveToPosition(player.target_x, player.target_y);
            }
          } else {
            // Движение должно было завершиться - проверяем, на месте ли игрок
            const currentX = existingPlayer.sprite.x;
            const currentY = existingPlayer.sprite.y;
            const distance = Math.sqrt(
              Math.pow(currentX - player.target_x, 2) +
              Math.pow(currentY - player.target_y, 2)
            );

            if (distance > 50) {
              // Игрок должен был прийти к цели, но еще не там - телепортируем
              existingPlayer.sprite.setPosition(player.target_x, player.target_y);
              existingPlayer.resetMovement();
            }
          }
        } else {
          // Нет информации о движении - обновляем, как раньше
          const currentX = existingPlayer.sprite.x;
          const currentY = existingPlayer.sprite.y;
          const distance = Math.sqrt(
            Math.pow(currentX - player.x, 2) +
            Math.pow(currentY - player.y, 2)
          );

          if (distance > 50) {
            existingPlayer.sprite.setPosition(player.x, player.y);
            existingPlayer.resetMovement();
          } else if (distance > 0) {
            existingPlayer.moveToPosition(player.x, player.y);
          }
        }
      } else {
        // Create new player
        this.createOtherPlayer(player);
      }
    });

    // Remove players that weren't in the sync
    existingPlayerMap.forEach((player, id) => {
      if (!processedPlayerIds.has(id)) {
        this.removePlayer(id);
      }
    });
  }

  createOtherPlayer(playerData) {
    // Проверяем, что playerData содержит user_id
    if (!playerData || playerData.user_id === undefined) {
      console.error("Invalid playerData: user_id is missing");
      return;
    }

    // Проверяем, существует ли игрок с таким user_id
    if (this.otherPlayers.has(playerData.user_id)) {
      console.warn(`Player with id ${playerData.user_id} already exists`);
      return;
    }

    // console.log("Creating other player:", playerData);  // Добавленный отладочный вывод

    // Получаем координаты стартовой позиции из карты
    const coords = this.tileMap.getObjectLayer("playerStart");
    if (!coords || !coords.objects || coords.objects.length === 0) {
      console.error("Start coordinates not found in the map");
      return;
    }

    // Создаем нового игрока
    const newPlayer = new Player(
      this,
      playerData.username,
      playerData.x || coords.objects[0].x, // Используем переданные координаты или стартовые
      playerData.y || coords.objects[0].y,
      false,
      this.player,
      playerData.skin, // Используем переданный аватар или значение по умолчанию
      playerData.user_id
    );
    newPlayer.sprite.body.label = "otherPlayer";
    newPlayer.resetMovement();


    // Добавляем игрока в Map других игроков
    this.otherPlayers.set(playerData.user_id, newPlayer);

    // Устанавливаем глубину отрисовки спрайта
    newPlayer.sprite.setDepth(10);
    // newPlayer.createChatBubbleTarget(newPlayer.sprite, 20, -250, "Привет. Я - " + playerData.username, 0.4, 0.3);

    if (playerData.state == "moving" && typeof (playerData) == 'object') {
      this.handlePlayerMove(playerData);
    }


    // console.log(`Player ${playerData.user_id} created successfully`);
  }

  removePlayer(playerId) {
    const player = this.otherPlayers.get(playerId);
    if (player) {
      // console.log(`Game: Удаление игрока ${playerId}`);
      // Call the destroy method to clean up the player
      player.destroy();

      // Отправляем событие о выходе игрока из зоны общения при полном удалении
      // Заметка: дублируем вызов события здесь для надежности, чтобы гарантировать
      // что сообщение об уходе игрока будет отправлено
      emitter.emit('player-out-of-range', playerId);

      // Remove the player from the otherPlayers Map
      this.otherPlayers.delete(playerId);
    }
  }

  updatePlayers(players) {
    players.forEach(player => {
      if (player.id === this.userData.id) return;
      if (!this.otherPlayers.has(player.id)) {
        //this.createOtherPlayer(player);

      } else {
        //this.updatePlayerPosition(player);
      }
    });
  }


  updateOtherPlayer(data) {
    // console.log("Update player:", data.user_id, "to:", data.x, data.y);
    // Update existing player position
    // this.dummy.moveToPosition(
    //   parseInt(data.x),
    //   parseInt(data.y)
    // );
  }

  updateOtherPlayers(players) {
    players.forEach(playerData => {
      if (playerData.id === this.registry.get('userData').userId) return; // Skip self

      let otherPlayer = this.otherPlayers.get(playerData.id);

      if (!otherPlayer) {
        // Create new player if doesn't exist
        otherPlayer = new Player(
          this,
          `player-${playerData.id}`,
          playerData.x,
          playerData.y,
          false,
          this.player,
          "Man_4", // Default avatar, can be customized based on playerData
          playerData.id
        );
        this.otherPlayers.set(playerData.id, otherPlayer);
      } else {
        // Update existing player position
        otherPlayer.setPointer({
          x: playerData.x,
          y: playerData.y
        });
      }
    });
  }


  sendPlayerState(x, y) {
    if (this.socket?.readyState === WebSocket.OPEN) {


      // console.log("sendPos:", parseInt(x), parseInt(y));

      // this.socket.send(JSON.stringify(
      //   {
      //     type: "position_update",
      //     x: parseInt(x),//  parseInt(this.player.playerMomentPosition.x),
      //     y: parseInt(y),// parseInt(this.player.playerMomentPosition.y)
      //   }
      // ));

    }
  }

  sendGlobalMessage(playerMessage, metadata) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      if (playerMessage === "") return;

      // Если есть метаданные с именем адресата (упоминание), добавляем их в сообщение
      if (metadata && metadata.addresseeName) {
        this.socket.send(JSON.stringify({
          type: "player_send_message",
          content: playerMessage,
          metadata: metadata
        }));
      } else {
        // Обычное глобальное сообщение без упоминания
        this.socket.send(JSON.stringify({
          type: "global_message",
          content: playerMessage
        }));
      }
    }
  }

  sendPrivateMessage(playerMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {

      // Only create chat bubble if it has the from_bubble_chat flag
      if (playerMessage.from_bubble_chat) {

        const userData = this.registry.get('userData');

        this.bubbleMessages.my.addText(playerMessage?.content, playerMessage.uuid, false, playerMessage.receiver_id, false, playerMessage.image);

        // Убедимся, что флаг show_bubble установлен для сообщений из бабл-чата
        if (typeof playerMessage.show_bubble === 'undefined') {
          playerMessage.show_bubble = true;
        }

      }

      let new_message = {};
      for (let field in playerMessage) {
        if (field !== 'image') {
          new_message[field] = playerMessage[field];
        }
      }
      this.socket.send(JSON.stringify(new_message));
    }
  }

  sendStatusMessage(playerMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {

      if (playerMessage?.content === "") return;

      // this.player.createChatBubbleTarget(this.player.sprite, 20, -250, playerMessage?.content, 0.4, 0.3);
      const statusMesg = {
        type: "status_message",
        content: playerMessage?.content,
        // receiver_id: null,
        is_atach: playerMessage.is_atach,
        // image: playerMessage?.image,
        from_bubble_chat: true,  // Add this crucial flag
        is_bubble: true          // Add this crucial flag
      };

      // console.log("send statusMessage:", statusMesg);
      this.socket.send(JSON.stringify(
        statusMesg
      ));


    }
  }

  createDummies(num) {
    const coords = this.tileMap.getObjectLayer("walkingDummy");
    const x = coords.objects[0].x - 800;
    const y = coords.objects[0].y + 400;
    for (let index = 0; index < num; index++) {
      const dummy = new Dummy(
        this,
        this.player,
        `bot-${index}`,
        x + 100 * (index % 13),
        y - 100 * (index / 13)
      );
      this.dummies.push(dummy);
    }
  }


  createAnimObjects() {
    //const coords = this.tileMap.getObjectLayer("animObjects");

    const animObjectsLayer = this.tileMap.getObjectLayer("animObjects");


    const animObjectsInLayer = animObjectsLayer.objects;
    animObjectsInLayer.forEach((obj) => {

      const animObject = new AnimObject(
        this,
        obj.x,
        obj.y,
        obj.name,
        obj.name
      );
      if (animObject.sprite) {
        animObject.sprite.setDepth(999999999);
      }
      this.animObjects.push(animObject);
    });


  }


  createAnimObjects2Layer() {
    //const coords = this.tileMap.getObjectLayer("animObjects");

    const animObjectsLayer = this.tileMap.getObjectLayer("animObjects2");

    const animObjectsInLayer = animObjectsLayer.objects;
    animObjectsInLayer.forEach((obj) => {

      const animObject = new AnimObject(
        this,
        obj.x,
        obj.y,
        obj.name,
        obj.name
      );
      if (animObject.sprite) {
        animObject.sprite.setDepth(999999999);
      }
      this.animObjects.push(animObject);
    });

    const animObjectsRoomLayer = this.tileMap.getObjectLayer("animObjectsRoom");

    const animObjectsInRoomLayer = animObjectsRoomLayer.objects;
    animObjectsInRoomLayer.forEach((obj) => {

      const animObject = new AnimObject(
        this,
        obj.x,
        obj.y,
        obj.name,
        obj.name
      );
      if (animObject.sprite) {
        animObject.sprite.setDepth(999999999);
      }
      this.animObjects.push(animObject);
    });


    const animBackLayer = this.tileMap.getObjectLayer("animBack");

    const animBackItems = animBackLayer.objects;
    animBackItems.forEach((obj) => {

      const animObject = new AnimObject(
        this,
        obj.x,
        obj.y,
        obj.name,
        obj.name
      );

      this.animObjects.push(animObject);
    });

    const animBack2Layer = this.tileMap.getObjectLayer("animBack2");

    const animBack2Items = animBack2Layer.objects;
    animBack2Items.forEach((obj) => {

      const animObject = new AnimObject(
        this,
        obj.x,
        obj.y,
        obj.name,
        obj.name
      );
      if (animObject.sprite) {
        animObject.sprite.setDepth(-1);
      }
      this.animObjects.push(animObject);
    });

  }

  createDummy() {
    const coords = this.tileMap.getObjectLayer("playerStart");
    const userData = this.registry.get('userData');
    if (!userData) {
      console.error("Данные пользователя не найдены");
      return;
    }

    const getAvatarPosition = (coords, userId) => {
      const basePosition = {
        x: coords.objects[0].x - 200,
        y: coords.objects[0].y + 100
      };

      return userId === 2
        ? basePosition
        : {
          x: basePosition.x + 200,
          y: basePosition.y - 100
        };
    };

    const getAvatarType = (userId) => userId === 2 ? "Man_4" : "woman3";

    const { x: posX, y: posY } = getAvatarPosition(coords, userData.userId);
    const Avatar = getAvatarType(userData.userId);

    this.dummy = new Player(
      this,
      "bot!",
      coords.objects[0].x + 10,
      coords.objects[0].y - 10,
      false,
      this.player,
      Avatar,
      0
    );
  }

  addCollision() {
    // возможно на другие эвенты колизии тоже повесить
    this.matter.world.on("collisionstart", (event, bodyA, bodyB) => {
      // // console.log({ event, bodyA, bodyB });
      if (
        (bodyA.label === "walls" && bodyB.label === "player") ||
        (bodyA.label === "player" && bodyB.label === "walls") ||
        (bodyA.label === "player" && bodyB.label === "env") ||
        (bodyA.label === "env" && bodyB.label === "player")
      ) {
        //this.player.resetMovement();
      }

      // Новая проверка для doorHitbox
      // Если игрок столкнулся с объектом дверного хитбокса:
      if (
        (bodyA.label === "player" && bodyB.label === "doorHitbox") ||
        (bodyA.label === "doorHitbox" && bodyB.label === "player")
      ) {
        // console.log("Игрок пересёк hitbox двери!", bodyA);
        // Здесь вы можете реализовать логику:
        // - открыть дверь,
        // - перейти в другую комнату,
        // - запустить анимацию,
        // - или телепортировать персонажа в новую позицию.

        // Например, телепортируем игрока:
        //this.player.sprite.setPosition(2500, 0);
        this.player.blockMovement = true;
        this.player.resetMovement();

        const sObInt = 4;

        if (bodyA.id === sObInt) { this.teleportPlayer(2500, 1300); }
        if (bodyA.id === sObInt + 1) { this.teleportPlayer(2500, 1300); }
        if (bodyA.id === sObInt + 2) { this.teleportPlayer(3800, 1200); }
        if (bodyA.id === sObInt + 3) { this.teleportPlayer(2800, 2300); }
        if (bodyA.id === sObInt + 4) { this.teleportPlayer(3400, 2000); }
      }

    });



  }

  addCamera() {
    this.cameras.main.setBounds(
      0,
      0,
      this.tileMap.widthInPixels,
      this.tileMap.heightInPixels
    );
    this.cameras.main.startFollow(this.player.sprite, false, 0.5, 0.5);
  }

  addPlayer(userData) {

    // const userData = this.registry.get('userData');
    // if (!userData) {
    //   console.error("Данные пользователя не найдены");
    //   return;
    // }

    // const getAvatarType = (userId) => userId === 2 ? "woman3" : "Man_4";

    // // console.log("UserDATA", userData, userData.avatar);
    const Avatar = userData.skin; // || getAvatarType(userData.userId);

    // const getAvatarPosition = (coords, userId) => {
    //   // Base position from the object layer
    //   const basePosition = {
    //     x: coords.objects[0].x + 200,
    //     y: coords.objects[0].y - 100
    //   };

    //   // Random deviation between -200 and 200 for both x and y
    //   const randomOffsetX = Math.random() * 400 - 200;
    //   const randomOffsetY = Math.random() * 400 - 200;

    //   return userId === 1
    //     ? {
    //       x: basePosition.x + randomOffsetX,
    //       y: basePosition.y + randomOffsetY
    //     }
    //     : {
    //       x: basePosition.x - 200 + randomOffsetX,
    //       y: basePosition.y + 100 + randomOffsetY
    //     };
    // };

    // const coords = this.tileMap.getObjectLayer("playerStart");
    // const { x: posX, y: posY } = getAvatarPosition(coords, userData.userId);

    this.player = new Player(
      this,
      `Iam ${userData.username}`,
      userData.x,  // Use the randomized x position
      userData.y,  // Use the randomized y position
      true,
      null,
      userData.skin,
      0
    );

    // Добавляем обработчик клика на игровой сцене для закрытия информационной панели
    this.lastLightningClick = 0; // Время последнего клика на молнию
    this.lastCharacterClick = 0; // Время последнего клика на персонаже

    // Добавляем глобальный обработчик перемещения
    this.input.on('pointerdown', (pointer) => {
      // Генерируем уникальный ID для отслеживания логов
      const eventId = Date.now();
      // console.log(`[SCENE CLICK ${eventId}] Клик на сцене, координаты: ${pointer.worldX}, ${pointer.worldY}`);

      // Проверяем таймер последнего клика на персонаже
      const now = Date.now();
      const lastCharClick = this.lastCharacterClick || 0;
      const timeSinceCharClick = now - lastCharClick;

      // Если прошло менее 200 мс с клика по персонажу, игнорируем
      if (timeSinceCharClick < 200) {
        // console.log(`[SCENE CLICK ${eventId}] Недавно был клик на персонаже (${timeSinceCharClick}ms назад), игнорируем`);
        return;
      }

      // Проверяем, не было ли другого недавнего интерактива
      const lastLightClick = this.lastLightningClick || 0;
      const timeSinceLightClick = now - lastLightClick;

      // Если недавно кликали по молнии, проверяем нужно ли закрыть панель
      if (timeSinceLightClick < 200) {
        // console.log(`[SCENE CLICK ${eventId}] Недавно был клик на молнии (${timeSinceLightClick}ms назад), игнорируем`);
      } else {
        // Закрываем панель player-quick-info при клике в пустое место
        // console.log(`[SCENE CLICK ${eventId}] Клик не на интерактивных объектах, закрываем панель`);
        // emitter.emit('close-quick-info');
      }
    });

    this.afterPlayerCreated();
    // console.log("playerINFO", this.player.playerMomentPosition.x, this.player.playerMomentPosition.y);
  }

  createMap() {
    // tile map
    this.tileMap = this.make.tilemap({
      key: this.map,
      tileWidth: 40,
      tileHeight: 20,
    });

    this.tileSet = this.tileMap.addTilesetImage("tile_m2");
    this.tileSetEnv = this.tileMap.addTilesetImage("tile_m2");
    // this.tileSet = this.tileMap.addTilesetImage("tileset");
    // this.tileSetEnv = this.tileMap.addTilesetImage("tileset_env");
    this.tileSet2 = this.tileMap.addTilesetImage("tile_m2");
    this.tileSet3 = this.tileMap.addTilesetImage("tile_v3");
    this.tileSetWall = this.tileMap.addTilesetImage("tile_wall");



    this.tileSetFurniture = this.tileMap.addTilesetImage("tile_furniture");
    this.tileSetF1 = this.tileMap.addTilesetImage("tile_f1");
    // =layers=


    // floor
    this.tileMap.createLayer("floor", this.tileSet2);
    this.tileMap.createLayer("dancepoll", this.tileSet3);
    this.tileMap.createLayer("test", this.tileSetEnv);




    this.walls = this.tileMap.createLayer("test walls", this.tileSetWall);


    this.walls_top = this.tileMap.createLayer("wall_top", this.tileSetWall);
    this.walls_top.setDepth(999999999);

    //this.walls.setCollisionFromCollisionGroup();

    this.furni_back = this.tileMap.createLayer("furni_back", this.tileSetFurniture);

    //this.matter.world.convertTilemapLayer(this.walls, { label: "walls" });


    // walls
    this.walls2 = this.tileMap.createLayer("walls", this.tileSetWall);


    this.walls2.setCollisionFromCollisionGroup();
    this.matter.world.convertTilemapLayer(this.walls2, { label: "walls" });

    // this.walls2.renderDebug(this.add.graphics())
    this.tileMap.createLayer("dancepoll2", this.tileSetWall);
    // borders
    this.borders = this.tileMap.createLayer("borders", this.tileSetF1);

    this.tileMap.createLayer("shadow", this.tileSetWall);
    this.tileMap.createLayer("shadow2", this.tileSetWall);



    //this.borders.setCollisionFromCollisionGroup();
    //this.matter.world.convertTilemapLayer(this.borders, { label: "walls" });
    // door
    this.door = this.tileMap.createLayer("door", this.tileSetFurniture);
    // plants
    this.plants = this.tileMap.createLayer("plants", this.tileSetFurniture);
    // sofas
    this.sofas = this.tileMap.createLayer("sofas", this.tileSetFurniture);

    this.tileMap.createLayer("f1", this.tileSetF1);

    this.f_top = this.tileMap.createLayer("f_top", this.tileSetF1);
    this.f_top.setDepth(999999999);

    // furniture
    this.furniture = this.tileMap.createLayer("furniture", this.tileSetFurniture);


    this.tileMap.createLayer("wall_decoration", this.tileSetWall);


    this.furnitureFront = this.tileMap.createLayer("furniture_front", this.tileSetFurniture);
    this.furnitureFront.setDepth(999999999);

    this.tileMap.createLayer("f2", this.tileSetF1);


    this.ladder = this.tileMap.createLayer("ladder", this.tileSetFurniture);

    // cafe chairs back
    this.cafeChairsBack = this.tileMap.createLayer(
      "cafe back chairs",
      this.tileSet3
    );
    // cafe
    this.cafe = this.tileMap.createLayer("cafe", this.tileSet3);
    // cafe chairs
    this.cafeChairs = this.tileMap.createLayer("cafe chairs", this.tileSet3);
    this.cafeChairs.setDepth(999999999);

    // decorations
    this.decorations = this.tileMap.createLayer("decorations", this.tileSetFurniture);
    this.decorations.setDepth(999999999);
    // lights
    this.lights = this.tileMap.createLayer("lights", this.tileSet3);
    this.lights.setDepth(999999999);

    this.front_tile = this.tileMap.createLayer("front_tile", this.tileSetF1);
    this.front_tile.setDepth(999999999);

    this.addCollisionFromTiled("doorHitbox", 1, "doorHitbox");
    // new collision test
    this.addCollisionFromTiled("envCollision", 1, "env");
  }

  addCollisionFromTiled(layerName, group, label) {
    const graphics = this.add.graphics().lineStyle(2, 0x00ff00, 1);
    const objectLayer = this.tileMap.getObjectLayer(layerName);

    objectLayer.objects.forEach((object) => {
      // Определяем, должен ли объект быть сенсором
      const isSensor = label === "doorHitbox";

      if (object.rectangle) {
        const rect2 = this.add.rectangle(0, 0, object.width, object.height);
        const polygon = new Phaser.Geom.Polygon(rect2.pathData);
        const body2 = this.matter.add.fromVertices(
          object.x + object.width / 2,
          object.y + object.height / 2,
          polygon.points.slice(0, -1),
          { isSensor: isSensor } // Добавляем свойство isSensor
        );
        if (label) {
          body2.label = label;
        }
        const collision = this.matter.add.gameObject(rect2, body2);
        collision.setStatic(true);
        collision.setCollisionGroup(group);

        if (this.game.config.physics.matter.debug) {
          graphics.strokeRect(object.x, object.y, object.width, object.height);
        }
      } else if (object.ellipse) {
        const elps2 = this.add.ellipse(0, 0, object.width, object.height);
        const polygon = new Phaser.Geom.Polygon(elps2.pathData);
        const body2 = this.matter.add.fromVertices(
          object.x + object.width / 2,
          object.y + object.height / 2,
          polygon.points.slice(0, -1),
          { isSensor: isSensor } // Добавляем свойство isSensor
        );
        if (label) {
          body2.label = label;
        }
        const collision = this.matter.add.gameObject(elps2, body2);
        collision.setStatic(true);
        collision.setCollisionGroup(group);

        if (this.game.config.physics.matter.debug) {
          graphics.strokeEllipse(
            object.x + object.width / 2,
            object.y + object.height / 2,
            object.width,
            object.height
          );
        }
      } else if (object.polygon || object.polyline) {
        const objPol = object.polygon ? object.polygon : object.polyline;
        const polygon = new Phaser.Geom.Polygon(objPol);
        const points = [];
        for (let point of polygon.points) {
          points.push({
            x: object.x + point.x,
            y: object.y + point.y,
          });
        }
        const sliceCentre = this.matter.vertices.centre(points);
        const body2 = this.matter.add.fromVertices(
          sliceCentre.x,
          sliceCentre.y,
          points,
          { isSensor: isSensor } // Добавляем свойство isSensor
        );
        if (label) {
          body2.label = label;
        }
        const poly2 = this.add.polygon(sliceCentre.x, sliceCentre.y, points);
        const collision = this.matter.add.gameObject(poly2, body2);
        collision.setStatic(true);
        collision.setCollisionGroup(group);

        if (this.game.config.physics.matter.debug) {
          graphics.strokePoints(points);
        }
      }
    });
  }

  // Метод телепортации
  teleportPlayer(newX, newY) {
    // Начинаем затемнение экрана
    this.cameras.main.fadeOut(1000, 0, 0, 0); // 1 секунда, черный цвет

    // После завершения затемнения перенесём игрока
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Перемещаем игрока на новые координаты
      this.player.sprite.setPosition(newX, newY);
      this.player.resetMovement();

      this.sendWSteleportPlayerTo(newX, newY);

      // Начинаем осветление экрана
      this.cameras.main.fadeIn(1000, 0, 0, 0);
      this.cameras.main.once('camerafadeincomplete', () => {
        this.player.blockMovement = false;
        this.player.resetMovement();
      });
    });
  }

  // метод
  sendWSteleportPlayerTo(newX, newY) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: "teleport",
        x: newX,
        y: newY
      }));
    }
  }

  // Метод для отправки информации о начале движения к точке
  sendPlayerMovement(currentX, currentY, targetX, targetY) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        // console.log("Sending movement start:", currentX, currentY, "to", targetX, targetY);

        // Округляем координаты до целых чисел для уменьшения объема данных
        const roundedCurrentX = Math.round(currentX);
        const roundedCurrentY = Math.round(currentY);
        const roundedTargetX = Math.round(targetX);
        const roundedTargetY = Math.round(targetY);

        this.socket.send(JSON.stringify({
          type: "position_update",
          x: roundedTargetX,
          y: roundedTargetY,
          moving: false
        }));

        // Запоминаем время начала движения для локальной интерполяции
        this.lastMovementStartTime = Date.now();

        // Сохраняем информацию о последнем движении
        this.lastMovement = {
          startX: roundedCurrentX,
          startY: roundedCurrentY,
          targetX: roundedTargetX,
          targetY: roundedTargetY,
          startTime: this.lastMovementStartTime
        };
      } catch (e) {
        console.error("Error sending player movement:", e);
      }
    }
  }

  // Метод для проверки расстояния между игроком и другими персонажами
  checkPlayerProximity() {
    if (!this.player) return;

    // Расстояние, при котором показывается значок молнии
    const interactionDistance = 200;
    // Расстояние предупреждения (70% от максимального расстояния взаимодействия)
    const warningDistanceRatio = 0.7; // Соотношение 70%

    // Отслеживаем игроков, которые находятся в зоне общения
    // Если не объявлена, создаем новую Map для хранения игроков в зоне общения
    if (!this.playersInRange) {
      this.playersInRange = new Map();
    }

    // Проверяем расстояние до других игроков
    this.otherPlayers.forEach((otherPlayer, playerId) => {
      if (otherPlayer && otherPlayer.sprite) {
        // Вычисляем расстояние между игроками
        const distanceX = Math.pow(this.player.sprite.x - otherPlayer.sprite.x, 2);
        const distanceY = Math.pow(this.player.sprite.y - otherPlayer.sprite.y, 2);
        const distance = Math.sqrt(distanceX + distanceY);

        // Вычисляем соотношение текущего расстояния к максимальному
        const distanceRatio = distance / interactionDistance;

        // Проверяем, находился ли игрок ранее в зоне общения
        const wasInRange = this.playersInRange.get(playerId);

        if (distance <= interactionDistance) {
          // Игрок в зоне общения
          if (!otherPlayer.lightningVisible) {
            otherPlayer.showLightning();
          }

          // Если у игрока открыто меню, проверяем состояние предупреждения
          // Мы хотим, чтобы молния мигала, когда расстояние достигает 70% от максимального
          if (otherPlayer.menuOpen) {
            // Передаем соотношение текущего расстояния к максимальному
            // Это позволит игроку определить, нужно ли включать красную мигающую молнию
            otherPlayer.checkWarningState(distanceRatio);

            // Debug log для отслеживания расстояния
            // if (distanceRatio >= warningDistanceRatio) {
            //   // console.log(`Игрок ${playerId} приближается к границе взаимодействия: ${Math.round(distanceRatio * 100)}%`);
            // }
          }

          this.playersInRange.set(playerId, true);
        } else {
          // Игрок вне зоны общения
          if (otherPlayer.lightningVisible) {
            otherPlayer.hideLightning();
          }

          // Если игрок был в зоне общения, а теперь вышел, отправляем событие
          if (wasInRange) {
            // console.log(`Game: игрок с ID ${playerId} вышел из зоны общения, расстояние: ${distance}`);
            emitter.emit('player-out-of-range', playerId);
          }

          // Отмечаем, что игрок вышел из зоны общения
          this.playersInRange.set(playerId, false);
        }
      }
    });
  }
  // Метод для обновления текущей позиции при движении (вызывать периодически)
  sendPlayerPosition(x, y) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // // console.log("Sending current position:", parseInt(x), parseInt(y));

      // this.socket.send(JSON.stringify({
      //   type: "position_update",
      //   x: parseInt(x),
      //   y: parseInt(y)
      // }));
    }
  }


  addMessageBubble(from_user_id, text, scale = 0.6, alfa = 1, image) {
    // Проверяем, не содержит ли текст сообщения формат @username: который используется в ChatPanel
    // Если текст содержит формат @username:, значит это сообщение из ChatPanel и мы его не показываем
    // if (typeof text === 'string' && text.match(/^@[^:]+:/)) {
    //   // console.log("Обнаружено сообщение с упоминанием в формате @username:, не показываем бабл:", text);
    //   return; // Не показываем сообщение в виде пузырька
    // }

    // Check if the message is from the current player
    // if (from_user_id === this.registry.get('userData').userId) {
    //   // Show bubble over the current player
    //   if (this.player) {
    //     this.player.createChatBubbleTarget(this.player.sprite, 20, -250, text, scale, alfa);
    //   }
    // } else {
    //   // Show bubble over the other player
    //   const otherPlayer = this.otherPlayers.get(from_user_id);
    //   if (otherPlayer) {
    //     otherPlayer.createChatBubbleTarget(otherPlayer.sprite, 20, -250, text, scale, alfa);
    //   }
    // }

    const otherPlayer = this.otherPlayers.get(from_user_id);

    if (otherPlayer) {
      if (typeof (this.thoughtsBubbleMessages['others'][from_user_id]) !== 'object') {
        this.thoughtsBubbleMessages['others'][from_user_id] = { 'messages': new bubbleMessages() };
      }

      this.thoughtsBubbleMessages.others[from_user_id].messages.addText(text, uuidv4(), false, false, true, image);
      this.thoughtsBubbleMessages.others[from_user_id].sprite = otherPlayer.sprite;
    }


  }

  /**
   * Создаёт чат-бабл с кнопкой ответа для получателя сообщения
   * @param {number} from_user_id - ID отправителя сообщения
   * @param {string} text - Текст сообщения
   * @param {string} senderName - Имя отправителя
   * @param {number} scale - Масштаб бабла
   * @param {number} alfa - Прозрачность бабла
   */
  addMessageBubbleWithReply(from_user_id, message_uuid, text, image, senderName, scale = 0.6, alfa = 1) {
    // Находим отправителя (другого игрока)
    const otherPlayer = this.otherPlayers.get(from_user_id);
    if (!otherPlayer) {
      console.error(`Buble message ERROR: Не найден игрок с ID ${from_user_id}. Доступные игроки:`,
        Array.from(this.otherPlayers.keys()));
      return;
    }

    if (typeof (this.bubbleMessages['others'][from_user_id]) !== 'object' || this.bubbleMessages['others'][from_user_id] == null) {
      this.bubbleMessages['others'][from_user_id] = { 'messages': new bubbleMessages() };
    }


    this.bubbleMessages.others[from_user_id].messages.addText(text, message_uuid, from_user_id, false, false, image);
    this.bubbleMessages.others[from_user_id].sprite = otherPlayer.sprite;

  }

  setupVisibilityHandler() {
    // Track visibility state
    this.lastVisibilityChange = Date.now();
    this.isVisible = !document.hidden;

    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      const timeSinceLastChange = now - this.lastVisibilityChange;
      this.lastVisibilityChange = now;

      if (document.visibilityState === 'visible') {
        this.isVisible = true;
        // console.log(`Tab became visible after ${timeSinceLastChange / 1000} seconds hidden`);

        // If hidden for more than a few seconds, request full sync
        if (timeSinceLastChange > 3000) {
          this.handleTabVisible();
        }
      } else {
        this.isVisible = false;
        // console.log('Tab hidden');
      }
    });
  }

  handleTabVisible() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // console.log("Tab visible - requesting full sync");

      // First request - immediate
      // this.socket.send(JSON.stringify({ type: "request_full_sync" }));

      // Second request after a small delay to handle race conditions
      // setTimeout(() => {
      //   if (this.socket?.readyState === WebSocket.OPEN) {
      //     // console.log("Sending follow-up sync request");
      //     this.socket.send(JSON.stringify({ type: "request_full_sync" }));
      //   }
      // }, 1000);
    } else {
      // console.log("Socket not open, attempting reconnection");
      // Attempt to reconnect if socket is closed
      if (this.socket?.readyState === WebSocket.CLOSED) {
        this.initWebSocket();
      }
    }
  }

  handlePlayerTeleport(data) {
    const player = this.otherPlayers.get(data.user_id);
    if (player) {
      player.sprite.setPosition(data.x, data.y);
      // player.playerMomentPosition.x = data.x;
      // player.playerMomentPosition.y = data.y;
      player.resetMovement();

    }
  }


  sendAddressedMessage(messageData) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      if (!messageData.content || messageData.content === "") return;

      this.socket.send(JSON.stringify({
        type: "addressed_message",
        content: messageData.content,
        addressee_id: messageData.addressee_id,
        addressee_username: messageData.addressee_username,
        show_bubble: false,  // Всегда устанавливаем false для сообщений из ChatPanel
        from_chat_panel: true  // Явно помечаем, что сообщение из ChatPanel
      }));

      // НЕ показываем сообщения из ChatPanel в виде пузырьков
      // Даже для отправителя

      // Добавляем сообщение в локальный чат отправителя для мгновенного отображения
      const userData = this.registry.get('userData');
      if (userData) {
        const newMessage = {
          id: Date.now(), // временный ID
          sender: userData.username,
          sender_id: userData.userId, // Используем правильное имя поля
          message: messageData.content,
          addresseeName: messageData.addressee_username,
          addresseeId: messageData.addressee_id,
          isAddressed: true,
          sentByMe: true,
          color: "#4CAF50" // цвет для собственных сообщений
        };

        emitter.emit('new-message', newMessage);
      }
    }
  }

  onMapLoaded() {
    this.loadTimeOut = setTimeout(() => {
      emitter.emit("player-chatting");
      // console.log("run chatting");

      //this.updateOtherPlayer({user_id:3,x:2900,y:2303});

      //this.player.createChatBubble(this.player.sprite.x+20, this.player.sprite.y-250,"Привет. Добро пожаловать в игру. Хм инетерсно кто тут есть");
      //this.player.createChatBubbleTarget(this.player.sprite,20, -250,"Привет. Добро пожаловать в игру. Хм инетерсно кто тут есть");


      this.player.createChatBubble(2620, 2700, "Да как же сесть на этот диван?");
    }, 2000);


    // this.loadTimeOut = setTimeout(() => {
    //
    //   this.addMessageBubble(1,"Она отказала мне. Сказала, что любит тебя");
    //   this.addMessageBubble(3,"ДА,Я ЛЮБЛЮ ТЕБЯ");
    // }, 15000);




    emitter.on("player-send-message", (playerMessage, metadata) => {
      this.sendGlobalMessage(playerMessage, metadata);
    });

    emitter.on('send-private-message', (messageData) => {
      // console.log("send-private-message", messageData)
      if (messageData.receiver_id < 1) {
        this.sendStatusMessage(messageData);
      }
      else {
        this.sendPrivateMessage(messageData);
      }
    });

    emitter.on("player-send-addressed-message", (messageData) => {
      // console.log("Отправка адресованного сообщения:", messageData);
      this.sendAddressedMessage(messageData);
    });

    //send call
    emitter.on("send-call-request", (data) => {
      // console.log("send-call-request", data)
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(
          data
        ));
      }

    });

    //accept video call
    emitter.on("video-call-accept", (data) => {
      // console.log("video-call-accept", data)
      if (this.socket?.readyState === WebSocket.OPEN) {

        this.socket.send(JSON.stringify(
          data
        ));

      }

    });

    emitter.on("player-send-addressed-message", (messageData) => {
      this.sendAddressedMessage(messageData);
    });
  }
}
