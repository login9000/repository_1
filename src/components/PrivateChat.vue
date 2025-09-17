<template>

  <div class="private-chat-input-wrapper">

    <div class="private-chat-input">
      <!-- Pink recipient indicator -->

      <div v-if="imageContent !== null" class="message-attachment">
        <div class="message-attachment_remove" @click="messageImageRemove"><svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512">
            <path
              d="M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z" />
          </svg></div>
        <img :src="imageContent" />
      </div>
      <div v-else class="message-attachment" @click="messageAttachment">
        <input type="file" ref="imageInput" @change="uploadImage($event)" />
        <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0.574179 8.43168C0.422523 8.28238 0.337324 8.07989 0.337324 7.86876C0.337324 7.65763 0.422523 7.45514 0.574179 7.30584L6.29146 1.68145C6.8143 1.15355 7.43842 0.733099 8.12761 0.444479C8.81681 0.155859 9.55735 0.00481661 10.3063 0.000113333C11.0553 -0.00458995 11.7977 0.137139 12.4906 0.417081C13.1835 0.697022 13.813 1.1096 14.3426 1.63089C14.8723 2.15218 15.2915 2.7718 15.576 3.45382C15.8605 4.13583 16.0046 4.86666 15.9999 5.60392C15.9952 6.34117 15.8419 7.07018 15.5488 7.74865C15.2557 8.42712 14.8287 9.04156 14.2925 9.55631L6.8627 16.8701C6.10152 17.6007 5.07853 18.0066 4.01541 17.9999C2.95228 17.9932 1.93466 17.5744 1.18307 16.8342C0.431467 16.094 0.00643507 15.0921 7.24706e-05 14.0456C-0.00629012 12.9991 0.406529 11.9922 1.14907 11.2433L7.43516 5.05537C7.89182 4.61656 8.50579 4.37263 9.14395 4.37648C9.7821 4.38033 10.393 4.63164 10.8442 5.07592C11.2953 5.5202 11.5504 6.12164 11.5541 6.74982C11.5578 7.37801 11.3098 7.9823 10.8638 8.43168L6.29146 12.9314C6.13996 13.0806 5.93448 13.1643 5.72022 13.1643C5.50596 13.1643 5.30048 13.0806 5.14898 12.9314C4.99748 12.7823 4.91236 12.58 4.91236 12.3691C4.91236 12.1582 4.99748 11.9559 5.14898 11.8068L9.72012 7.30584C9.79514 7.23199 9.85464 7.14433 9.89524 7.04785C9.93584 6.95136 9.95674 6.84795 9.95674 6.74352C9.95674 6.63909 9.93584 6.53568 9.89524 6.4392C9.85464 6.34271 9.79514 6.25505 9.72012 6.1812C9.64511 6.10736 9.55605 6.04878 9.45804 6.00882C9.36002 5.96885 9.25497 5.94828 9.14888 5.94828C9.04279 5.94828 8.93774 5.96885 8.83973 6.00882C8.74172 6.04878 8.65266 6.10736 8.57764 6.1812L2.29156 12.3691C1.83689 12.8167 1.58146 13.4237 1.58146 14.0567C1.58146 14.3701 1.64417 14.6804 1.766 14.97C1.88784 15.2595 2.06643 15.5226 2.29156 15.7442C2.51668 15.9658 2.78395 16.1416 3.0781 16.2616C3.37224 16.3815 3.68751 16.4432 4.00589 16.4432C4.64889 16.4432 5.26555 16.1918 5.72022 15.7442L13.15 8.43048C13.5401 8.06443 13.8518 7.62528 14.0669 7.13888C14.282 6.65247 14.396 6.12863 14.4024 5.59818C14.4088 5.06774 14.3073 4.54139 14.104 4.05011C13.9006 3.55884 13.5996 3.11256 13.2184 2.73752C12.8373 2.36249 12.3838 2.06629 11.8846 1.86634C11.3855 1.66639 10.8507 1.56674 10.3119 1.57324C9.77299 1.57974 9.24089 1.69226 8.74686 1.90419C8.25283 2.11612 7.80685 2.42318 7.43516 2.80729L1.72031 8.43168C1.5687 8.5806 1.36326 8.66423 1.14907 8.66423C0.934889 8.66423 0.729451 8.5806 0.577833 8.43168"
            fill="black" fill-opacity="0.45" />
        </svg>
      </div>

      <input v-model="newMessage" @keyup.enter="sendMessage" :maxlength="getMaxInputLength()"
        :placeholder="!remaningMessagesPerBubble ? 'Ваши сообщения ещё не прочитаны игроком @' + recipientName : (recipientName ? 'Сообщение для @' + recipientName : 'Ваше сообщение...')"
        :class="messageInputClasses" ref="messageInput" :disabled="!remaningMessagesPerBubble">

      <div class="private-message-length">
        {{ getMaxInputLengthLabel() }}
        <span class="progress-circle">
          <ve-progress animation="default 0 0" color="white" empty-color="transparent"
            :progress="remaningMEssageCircleProgress" :size="28">{{
              remaningMessagesPerBubble
            }}</ve-progress>
        </span>
      </div>


      <button @click="sendMessage" @mousedown="sendMessage"
        :class="((!newMessage.trim() && !imageContent) || !remaningMessagesPerBubble) ? 'disabled-btn' : ''"
        class="send-button">
        Отправить
      </button>


    </div>
  </div>

</template>

<script>
import emitter from '../plugins/emitter.js';
import { useUserStore } from "../stores/user.js";
import { VeProgress } from "vue-ellipse-progress";
import { getCurrentInstance } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2'

export default {
  props: {
    otherUserId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      renderComponent: true,
      userStore: null,
      newMessage: '',
      counter: 0,
      maxMessageLetters: 250,
      letterAvaliable: 0,
      lettersInMessages: 0,
      limitMessagesPerBubble: 0,
      remaningMessagesPerBubble: 0,
      remaningMEssageCircleProgress: 100,
      isPrivate: false,
      currentUser: null,
      attachedImage: null,
      recipientName: '', // Добавляем состояние для имени получателя.
      letterSettingTimeout: null,
      limitsStore: false,
      playersWithMessages: {},
      closedMenu: true,
      imageContent: null,
      imageType: null,
      messageInputClasses: "message-input"
    };
  },
  watch: {
    // Следим за изменением ID пользователя, чтобы обновить имя
    isPrivate: {
      immediate: true, // Запускаем при инициализации
      handler(newValue, oldValue) {
        this.changeLimitsByPrivateStatus();
      }
    },
    newMessage: {
      immediate: true, // Запускаем при инициализации
      handler(newValue, oldValue) {
        this.letterAvaliable = newValue.length;
      }
    },
    otherUserId: {
      immediate: true, // Запускаем при инициализации
      handler(newValue, oldValue) {
        console.log('PrivateChat: otherUserId изменен с', oldValue, 'на', newValue);
        if (newValue > 0) {
          this.fetchRecipientName();
        }
      }
    }
  },
  beforeMount() {


    emitter.on('chat-set-limit-messages', this.chatSetLimitMessages);

    console.log('PrivateChat: beforeMount, otherUserId:', this.otherUserId);
    // Попытка установки имени получателя перед монтированием
    if (this.otherUserId > 0) {
      this.fetchRecipientName();
    }
  },
  updated() {
    if (typeof (window.gameInstance) == 'object') {
      if (Object.keys(window.gameInstance.playersWithMessages).length > 0) {
        emitter.emit('avatars-shown', true);
      } else {
        emitter.emit('avatars-shown', false);
      }
    }
  },
  mounted() {
    this.userStore = useUserStore();
    this.fetchCurrentUser();
    this.fetchRecipientName();

    this.changeLimitsByPrivateStatus();

    emitter.on('chat-remaning-messages', this.chatRemaningMessages);
    // emitter.on('chat-set-limit-messages', this.chatSetLimitMessages);
    emitter.on('chat-set-current-messages-length', this.chatSetCurrentMessagesLength);

    // Слушаем событие выбора пользователя для приватного чата

    emitter.on('player-private-chatting', this.handlePrivateChat);

    // Listen to bubble chat events
    emitter.on('new-bubble-message', this.handleBubbleMessage);
    emitter.on('update-bubble-message', this.handleBubbleMessage);

    // Слушаем событие, когда игрок выходит из зоны общения
    emitter.on('player-out-of-range', this.handlePlayerOutOfRange);

    // Слушаем событие обновления имени получателя
    emitter.on('update-recipient-name', this.updateRecipientName);

    emitter.on('close-private-chat', this.closedMenuHandler);

    // const instance = getCurrentInstance();
    // instance?.proxy?.$forceUpdate();

    // var _obj = this;
    // setInterval(() => {
    //   _obj.handleBubbleMessage(false);
    // }, 1);

  },
  beforeUnmount() {

    // Очищаем слушатели событий при уничтожении компонента
    emitter.off('player-private-chatting', this.handlePrivateChat);
    emitter.off('new-bubble-message', this.handleBubbleMessage);
    emitter.off('player-out-of-range', this.handlePlayerOutOfRange);
    emitter.off('update-recipient-name', this.updateRecipientName);
  },
  methods: {

    async uploadImage(event) {

      let file = this.$refs.imageInput.files[0];

      if (file.size > 1000000) {
        Swal.fire({
          title: 'Error!',
          text: 'Максимальный размер изображения: 1 мб.!',
          icon: 'error',
        });
        return false;
      }

      const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      try {

        var image_from_file = await toBase64(file);

        let form_data = new FormData();
        let token = document.head.querySelector('[name="csrf-token"]');
        token = token.getAttribute('content');
        form_data.append('target', 'disco');
        form_data.append('upload_image', file);

        fetch('/api/v1/upload_image', {
          method: 'POST',
          headers: {
            'csrf-token': token
          },
          body: form_data
        }).then((data) => data.json()).then((data) => {
          this.imageContent = image_from_file;
          Swal.fire({
            title: 'Изображение загружено!',
            text: 'И готово к отправке.',
            icon: 'success',
          });

        });

        this.imageType = file.type;

      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: 'Ошибка загрузки файла!',
          icon: 'error',
        });
      }

    },
    messageImageRemove() {
      this.imageContent = null;
      this.imageType = null;
      Swal.fire({
        title: 'Изображение удалено!',
        text: '.',
        icon: 'success',
      });
    },
    closedMenuHandler() {
      this.closedMenu = true;
    },
    messageAttachment() {
      this.$refs.imageInput.click();
    },
    getMaxInputLengthLabel() {
      let max_length = this.maxMessageLetters;
      if (max_length - this.letterAvaliable < 0) {
        return 0;
      }
      return max_length - this.letterAvaliable;
    },

    getMaxInputLength() {

      if (typeof (window.gameInstance) == 'object') {
        if (this.isPrivate) {
          window.gameInstance.bubbleMessages.my.setCurrentChattingPlayerId(window.gameInstance.currentChattingUserId);
          var lettersInMessages = window.gameInstance.bubbleMessages.my.getFormatedString().length;
        } else {
          var lettersInMessages = window.gameInstance.thoughtsBubbleMessages.my.getFormatedString().length;
        }
        this.lettersInMessages = lettersInMessages;
      }

      let max_length = this.maxMessageLetters;
      return max_length - this.lettersInMessages;
    },

    chatSetCurrentMessagesLength(number) {
      this.letterAvaliable = number + this.newMessage.length;
    },

    changeLimitsByPrivateStatus() {
      if (this.isPrivate) {
        this.limitMessagesPerBubble = this.limitsStore.private;
        this.remaningMessagesPerBubble = this.limitsStore.private;
      } else {
        this.limitMessagesPerBubble = this.limitsStore.status;
        this.remaningMessagesPerBubble = this.limitsStore.status;
      }
    },

    chatSetLimitMessages(obj) {
      this.limitsStore = obj;
    },

    chatRemaningMessages(object) {

      this.remaningMessagesPerBubble = (this.limitMessagesPerBubble - object.count);

      if (this.remaningMessagesPerBubble > 0)
        this.messageInputClasses = "message-input";

      if (object.status == 'read') {
        this.remaningMEssageCircleProgress = Math.round(((object.time - Date.now()) * 100) / object.duration);
      } else {
        this.remaningMEssageCircleProgress = 100;
      }

      if (object.count == 1) {
        var _obj = this;
        if (!this.letterSettingTimeout) {
          let timeout_time = object.time - Date.now();
          this.letterSettingTimeout = setTimeout(() => {
            _obj.remaningMessagesPerBubble = _obj.limitMessagesPerBubble;
            _obj.letterAvaliable = this.newMessage.length;
            _obj.letterSettingTimeout = null;
            _obj.remaningMEssageCircleProgress = 100;
          }, timeout_time);
        }
      } else {
        clearTimeout(this.letterSettingTimeout);
        this.letterSettingTimeout = null;
      }

    },
    fetchCurrentUser() {
      if (!this.userStore.isAuthenticated || !this.userStore.user) return;
      this.currentUser = this.userStore.user;
    },

    // Метод для получения имени получателя сообщения
    fetchRecipientName() {
      console.log('PrivateChat: fetchRecipientName вызван, otherUserId:', this.otherUserId);

      // Просто используем переданный prop otherUserId
      if (this.otherUserId <= 0) {
        this.recipientName = '';
        console.log('PrivateChat: otherUserId <= 0, recipientName сброшен');
        return;
      }

      if (window.gameInstance.playersData[this.otherUserId]) {
        this.recipientName = window.gameInstance.playersData[this.otherUserId].username;
      }

      console.log('PrivateChat: установлен recipientName:', this.recipientName, 'для otherUserId:', this.otherUserId);
    },

    // Обработчик события обновления имени получателя
    updateRecipientName(userId) {
      console.log('PrivateChat: получено событие update-recipient-name для ID:', userId);

      if (userId && userId > 0) {
        // Обновляем recipientName на основе otherUserId
        const otherPlayers = window.gameInstance?.otherPlayers;

        if (window.gameInstance.playersData[userId]) {
          this.recipientName = window.gameInstance.playersData[userId].username;
        }

        console.log('PrivateChat: обновлен recipientName:', this.recipientName);

        // Фокусируем поле ввода
        this.$nextTick(() => {
          if (this.$refs.messageInput) {
            this.$refs.messageInput.focus();
          }
        });
      }
    },

    // Обработчик события выбора пользователя для приватного чата
    handlePrivateChat(userId) {

      this.closedMenu = false;

      console.log('PrivateChat: получено событие player-private-chatting для ID:', userId);

      //TODO: dirty hack
      this.isPrivate = false;
      if (userId && userId > 0) {
        this.isPrivate = true;
      }

      this.changeLimitsByPrivateStatus();

      if (userId && userId > 0) {

        window.gameInstance.currentChattingUserId = userId;

        // Проверяем, не тот же ли это пользователь, с которым уже общаемся
        // Если да, просто фокусируем поле ввода и ничего больше не делаем
        if (this.otherUserId === Number(userId) && this.recipientName) {
          console.log('PrivateChat: продолжаем общение с текущим пользователем:', this.recipientName);
          // Фокусируем поле ввода
          this.$nextTick(() => {
            if (this.$refs.messageInput) {
              this.$refs.messageInput.focus();
            }
          });
          return;
        }

        // Сохраняем ID текущего собеседника
        // this.otherUserId = parseInt(userId);

        console.log('PrivateChat: установлен otherUserId:', userId);

        // Получаем имя пользователя на основе ID
        if (window.gameInstance.playersData[userId]) {
          this.recipientName = window.gameInstance.playersData[userId].username;
        }



        console.log('PrivateChat: установлен recipientName:', this.recipientName);

        // Отправляем событие открытия меню, если оно еще не открыто
        // Это нужно для тех случаев, когда чат открыли из другого места, не из меню
        emitter.emit("click-menu2", { playerID: userId });

        // Фокусируем поле ввода после установки получателя
        this.$nextTick(() => {
          if (this.$refs.messageInput) {
            this.$refs.messageInput.focus();
          }
        });
      }
    },

    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file && file.type.startsWith('image/')) {
        this.attachedImage = file;
      }
    },

    sendMessage() {

      if (!this.remaningMessagesPerBubble) {
        this.messageInputClasses = "message-input disabled-input-intence";
        return false;
      }

      if (!this.newMessage.trim() && !this.imageContent) return;

      // Проверяем ID получателя напрямую, а не через recipientName,
      // так как recipientName может быть не синхронизирован
      const isPrivateChat = this.otherUserId > 0;
      console.log('this.remaningMessagesPerBubble', this.remaningMessagesPerBubble);


      console.log('this.messageInputClasses', this.messageInputClasses);

      // Добавляем логирование
      console.log('PrivateChat: отправка сообщения:', {
        isPrivateChat: isPrivateChat,
        otherUserId: this.otherUserId,
        recipientName: this.recipientName
      });

      const messageData = {
        receiver_id: isPrivateChat ? this.otherUserId : -1, // -1 статусные сообщения
        content: this.newMessage.trim(),
        type: isPrivateChat ? 'private_message' : 'status_message', // Используем private_message если есть получатель
        // Добавляем дополнительные поля, чтобы убедиться в правильной отправке
        is_private: isPrivateChat
      };

      if (this.attachedImage) {
        // Здесь можно добавить логику обработки изображения
        // Например, преобразование в base64 или загрузка на сервер
        const reader = new FileReader();
        reader.onload = (e) => {
          messageData.image = e.target.result; // base64 строка
          this.emitMessage(messageData);
        };
        reader.readAsDataURL(this.attachedImage);
      } else {
        this.emitMessage(messageData);
      }
    },

    emitMessage(messageData) {

      this.counter = Math.random();

      // Подготавливаем объект сообщения
      const isPrivateChat = this.otherUserId > 0;
      const receiverName = isPrivateChat ? (this.recipientName || `User-${this.otherUserId}`) : '';

      // Обеспечим корректный тип сообщения независимо от состояния recipientName
      if (isPrivateChat) {
        messageData.type = 'private_message';
      } else {
        messageData.type = 'status_message';
      }


      // Устанавливаем флаги для обработки бабл-чата
      messageData.from_bubble_chat = true;
      messageData.is_bubble = true;
      if (this.imageContent) {
        messageData.is_atach = true;
        messageData.image = this.imageContent;
      } else {
        messageData.is_atach = false;
      }
      // messageData.image = { content: this.imageContent, type: this.imageType };
      messageData.uuid = uuidv4();
      messageData.receiver_id = this.otherUserId;

      // Проверяем есть ли имя получателя в gameInstance
      if (isPrivateChat && window.gameInstance) {
        const otherPlayer = window.gameInstance.otherPlayers.get(this.otherUserId);
        if (otherPlayer) {
          messageData.receiver_name = otherPlayer.playerName;
        } else {
          // Если не нашли имя, используем ID
          messageData.receiver_name = `Игрок ${this.otherUserId}`;
        }
      } else {
        messageData.receiver_name = receiverName;
      }

      console.log('PrivateChat: Сформирован объект сообщения:', {
        кому: messageData.receiver_name,
        тип: messageData.type,
        id: this.otherUserId,
        текст: messageData.content,
        from_bubble_chat: true,
        is_bubble: true
      });

      // Отправляем сообщение через эмиттер
      emitter.emit('send-private-message', messageData);

      // Отображаем бабл для отправителя сразу
      if (this.currentUser) {

        // Сообщение в бабл чат отображаем только при наличии получателя
        if (isPrivateChat) {
          emitter.emit('new-bubble-message', {
            message: {
              id: Date.now(), // временный ID
              content: messageData.content,
              uuid: messageData.uuid,
              sender_id: this.currentUser?.userId,
              sender_username: this.currentUser?.username || 'Вы',
              receiver_id: messageData.receiver_id,
              receiver_name: messageData.receiver_name,
              image: messageData.image,
              from_bubble_chat: true,
              is_bubble: true
            }
          });
        } else {

          if (window.gameInstance && window.gameInstance.player) {
            window.gameInstance.thoughtsBubbleMessages.my.addText(messageData.content, uuidv4(), false, false, true, messageData.image);

          }

        }
      }

      // Очищаем поле ввода и вложение
      this.newMessage = '';
      this.imageContent = null;
      this.imageType = null;
      this.attachedImage = null;

      // Убеждаемся, что компонент остается видимым
      // Отправляем специальное событие, которое гарантирует, что компонент будет видимым
      emitter.emit('ensure-private-chat-visible', this.otherUserId);

      // Фокусируем поле ввода после отправки для удобства продолжения разговора
      this.$nextTick(() => {
        if (this.$refs.messageInput) {
          this.$refs.messageInput.focus();
        }
      });
    },

    // Метод для закрытия приватного чата
    closePrivateChat() {
      console.log('PrivateChat: закрываем приватный чат с', this.recipientName);
      this.recipientName = '';
      // Другие поля можно тоже сбросить для надежности
      this.newMessage = '';
      this.attachedImage = null;

      window.gameInstance.currentChattingUserId = null;

      // Отправляем событие закрытия приватного чата
      emitter.emit('close-private-chat');

      // Отправляем событие для закрытия меню
      emitter.emit('close-menu2');
    },

    // Метод для обработки событий bubble-сообщений
    handleBubbleMessage(data) {

      // if (!this.closedMenu) {
      if (typeof (window.gameInstance) == 'object') {
        if (Object.keys(window.gameInstance.bubbleMessages.others).length > 0) {
          for (let player_id in window.gameInstance.bubbleMessages.others) {
            if (window.gameInstance.bubbleMessages.others[player_id] !== null) {
              window.gameInstance.playersWithMessages[player_id] = window.gameInstance.playersData[player_id];
              window.gameInstance.playersWithMessages[player_id]['count'] = window.gameInstance.bubbleMessages.others[player_id].messages.getMessagesCount();
            } else {
              if (typeof (window.gameInstance.playersWithMessages[player_id]) == 'object' && window.gameInstance.playersWithMessages[player_id] !== null) {
                window.gameInstance.playersWithMessages[player_id]['count'] = 0;
              }
            }
          }
        } else {
          for (let player_id in window.gameInstance.playersWithMessages) {
            window.gameInstance.playersWithMessages[player_id]['count'] = 0;
          }
        }
      }
      // } else {
      //   window.gameInstance.playersWithMessages = {};
      // }

      emitter.emit('avatars-changed', window.gameInstance.playersWithMessages);
    },

    // Метод для обработки события выхода игрока из зоны общения
    handlePlayerOutOfRange(playerId) {

      if (window.gameInstance.bubbleMessages.others[playerId] !== null) {
        if (typeof (window.gameInstance.bubbles.others[playerId]) == 'object') {

          if (window.gameInstance.bubbles.others[playerId].replyButton) {
            window.gameInstance.bubbles.others[playerId].replyButton.destroy();
          }

          window.gameInstance.bubbles.others[playerId].bubble.destroy();

          if (typeof (window.gameInstance.bubbles.others[playerId].bubbleText) == 'object') {
            for (let bubbleText of window.gameInstance.bubbles.others[playerId].bubbleText) {
              bubbleText.destroy();
            }
          }

          if (typeof (window.gameInstance.bubbleMessages.others[playerId]) == 'object' && window.gameInstance.bubbleMessages.others[playerId] !== null) {
            window.gameInstance.bubbleMessages.others[playerId].messages.flush();
          }
        }

        window.gameInstance.checkBubbleImages([], 'private', playerId);
        delete window.gameInstance.bubbleMessages.others[playerId];
        delete window.gameInstance.playersWithMessages[playerId];

        if (playerId == window.gameInstance.currentChattingUserId) {
          this.closePrivateChat();
        }
      }


      emitter.emit('avatars-changed', window.gameInstance.playersWithMessages);


      console.log('PrivateChat: получено событие player-out-of-range для игрока ID:', playerId,
        'текущий собеседник ID:', this.otherUserId,
        'типы данных:', typeof playerId, typeof this.otherUserId);

      // Преобразуем в числа для надежного сравнения
      const playerIdNum = Number(playerId);
      const otherUserIdNum = Number(this.otherUserId);

      console.log('PrivateChat: сравниваем числовые ID:', playerIdNum, otherUserIdNum);

      // Проверяем, является ли вышедший игрок текущим собеседником
      if (playerIdNum === otherUserIdNum && this.recipientName) {
        console.log('PrivateChat: закрываем чат из-за выхода игрока из зоны общения');

        // Получаем имя игрока для сообщения
        // let playerName = this.recipientName;
        // // Убираем символ @ в начале имени, если он есть
        // if (playerName.startsWith('@')) {
        //   playerName = playerName.substring(1);
        // }

        // Отправляем статусное сообщение
        // if (window.gameInstance) {
        //  window.gameInstance.sendStatusMessage({
        //   content: `Пользователь ${playerName} отошел от вас слишком далеко.`,
        //   is_bubble: true
        //  });
        // }

        // Закрываем чат и меню взаимодействия
        this.closePrivateChat();

        // Отправляем событие для закрытия меню
        emitter.emit('close-menu2');
      }
    },
    getCircleColor() {
      let current_percent = (this.getMaxInputLengthLabel() * 100) / this.maxMessageLetters;

      let red = ((255 - 74) * (100 - current_percent) / 100) + 74;
      let green = (((217) * (current_percent) / 100));
      let blue = (((110) * (current_percent) / 100));

      return 'rgb(' + red + ', ' + green + ', ' + blue + ')';
    }
  }
};
</script>

<style>
.swal2-actions {
  button {
    border: solid 1px color-mix(in srgb, var(--swal2-confirm-button-background-color), var(--swal2-action-button-hover));

    &:hover {
      color: white !important;
    }
  }
}

.message-attachment_remove {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    svg {
      display: block;
    }
  }

  svg {
    width: 25px;
    height: 25px;
    fill: red;
    display: none;
  }
}

.disabled-btn {
  cursor: not-allowed !important;
  /* pointer-events: unset !important; */
}

.disabled-input-intence {
  box-shadow: 0px 0px 20px 0px rgba(255, 0, 0, 0.5) !important;
  border: solid 1px rgba(255, 0, 0, 0.5) !important;

}

input.disabled-input-intence::placeholder {
  color: red !important;
  font-weight: bold;
}

.ep-legend--value__counter {
  font-size: 13px !important;
}

.private-message-length {
  /* background: rgb(74, 217, 110); */
  background: v-bind(getCircleColor());
  /* background: #4AD96E; */
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
}

.message-attachment {
  cursor: pointer;
  width: 42px;
  height: 42px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;

  input {
    display: none;
  }

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: solid 1px color-mix(in srgb, var(--swal2-confirm-button-background-color), var(--swal2-action-button-hover));
  }
}

.progress-circle {
  display: flex;
  align-items: center;
}

.progress-circle .ep-legend--value {
  height: 100% !important;
}

.progress-circle .ep-legend--value div {
  display: flex;
  align-items: center;
}

.private-chat-input-wrapper {
  position: relative;
  /* bottom: 20px; */
  /* Отступ от нижнего края экрана на 20px */
  /* left: 25%; */
  width: 100%;
  padding: 10px;
  background-color: rgba(255, 255, 255, 1);
  z-index: 1000;
  border-radius: 12px;
  /* Более закругленные углы для всего компонента */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  /* Добавляем небольшую тень */
}

.private-chat-input {
  display: flex;
  align-items: center;
  max-width: 100%;
  width: 100%;
  gap: 10px;
  justify-content: space-between;
}

.message-input {
  flex-grow: 1;
  padding: 10px 15px;
  /* border: 1px solid #e0e0e0; */
  border-radius: 10px;
  /* Более закругленные углы для поля ввода */
  outline: none;
  font-size: 14px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  background: #F8F8F8;

  &::placeholder {
    color: #8C8C8C !important;
  }
}

.message-input:focus {
  border-color: #007bff;
}

.attach-button {
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
}

.attach-icon {
  font-size: 20px;
}

.send-button {
  padding: 10px 22px;
  /* background: #007bff; */
  color: white;
  border: none;
  border-radius: 25px;
  /* Более закругленные углы для кнопки */
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
  color: #097AF2;
  font-weight: bold;
  border: solid 1px transparent;

}

.send-button.disabled-btn {
  background: #cccccc;
  cursor: not-allowed;
  color: white !important;

}

.send-button:not(.disabled-btn):hover {
  /* background: #0069d9; */
  /* transform: translateY(-1px); */
  color: #097AF2;
  font-weight: bold;
  border: solid 1px #097AF2;
}

/* Стили для индикатора получателя */
.recipient-indicator {
  display: flex;
  align-items: center;
  background-color: #ff69b4;
  color: white;
  padding: 5px 15px;
  border-radius: 25px;
  /* Более закругленные углы для индикатора получателя */
  margin-right: 10px;
  box-shadow: 0 2px 5px rgba(255, 105, 180, 0.3);
  /* Добавляем нежную тень */
}

.recipient-name {
  font-size: 14px;
  font-weight: 500;
}

.close-button {
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

.close-button:hover {
  opacity: 0.8;
}
</style>