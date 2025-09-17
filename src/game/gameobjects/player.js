// import { useMenuStore } from "../../stores/menu";
import emitter from "./../../plugins/emitter";
import { spriteMap } from "../scenes/bootloader";
import { useSkinStore } from "../../stores/skin";


export default class Player {
  constructor(scene, name, x, y, isPlayer, playerRef, avatar, playerid) {
    this.playerRef = playerRef;
    this.isPlayer = isPlayer;
    this.skinStore = useSkinStore();
    this.avatar = avatar;
    // this.menuStore = useMenuStore();
    this.name = name;
    this.scene = scene;
    this.label = isPlayer ? "player" : "dummy";
    this.playerid = playerid;
    this.pointerPosition = {
      x,
      y,
    };
    // проверка застревания
    this.lastPosition = { x, y }; // Последняя позиция для проверки застревания
    this.stuckTimer = null;       // Таймер для проверки
    this.isMoving = false;        // Флаг движения
    this.lightningVisible = false; // Флаг видимости молнии

    this.playerMomentPosition = {
      x,
      y,
    };
    this.init(x, y);
    if (this.isPlayer) {
      // emitter.on("player-chatting", () => this.showChatting());

    }
    this.replyButton = null;
  }



  init(x, y) {
    // creating sprite
    this.sprite = this.scene.matter.add.sprite(0, 0, "dummy", 0);

    // Настраиваем интерактивность для спрайтов NPC
    if (!this.isPlayer) {
      // Делаем спрайт интерактивным для всех не-игроков
      this.sprite.setInteractive({
        cursor: "pointer",
        pixelPerfect: false,  // Отключаем pixel perfect для упрощения определения области клика
        useHandCursor: true   // Явно указываем использовать курсор-руку
      });

      // console.log(`Player ${this.playerid}: Added interactivity to sprite`);
    }

    // creating body - collision box
    const { Body, Bodies } = Phaser.Physics.Matter.Matter;
    const mainBody = Bodies.rectangle(0, 5, 30, 15, {
      chamfer: { radius: 10 },
      label: this.label,
    });
    const compoundBody = Body.create({
      parts: [mainBody],
      render: { sprite: { xOffset: 0, yOffset: 0.4 } },
    });

    // updating sprite properties
    this.sprite
      .setExistingBody(compoundBody)
      .setFixedRotation()
      .setPosition(x, y)
      .setCollisionGroup(null);

    // other setups
    this.addAnimations();
    if (this.isPlayer) {
      this.addControls();
    }
    this.blockMovement = false;
    this.unblockMovement = false;
    this.scene.events.on("update", this.update, this);

    // Устанавливаем обработчики событий для меню
    emitter.on("menu-opened", (data) => {
      // Проверяем, относится ли это событие к данному игроку
      if (data.playerID === this.playerid) {
        // console.log(`Player ${this.playerid}: Menu opened, setting green lightning`);
        this.setMenuOpen(true);
      }
    });

    emitter.on("menu-closed", (data) => {
      // Проверяем, относится ли это событие к данному игроку
      if (data.playerID === this.playerid) {
        // console.log(`Player ${this.playerid}: Menu closed, resetting lightning`);
        this.setMenuOpen(false);
      }
    });

    // chatting
    this.chatting = this.scene.add.image(1500, 600, "messageIcon2");
    this.chatting.setScale(0.7);
    this.chatting.setOrigin(0, 0);
    this.chatting.setDepth(this.sprite.y);
    this.chatting.visible = false;
    this.chatTimeout = null;

    // chatting
    this.chatting1 = this.scene.add.image(1500, 600, "messageIcon");
    this.chatting1.setScale(0.6);
    this.chatting1.setOrigin(0, 0);
    this.chatting1.setDepth(this.sprite.y);
    this.chatting1.visible = false;
    this.chatTimeout1 = null;

    // nickname
    this.nickname = this.scene.add.text(1000, 600, this.name, {
      color: "#000",
    });
    this.nickname.setPosition(
      this.sprite.x - this.sprite.width / 2,
      this.sprite.y - this.sprite.height - 10
    );
    this.nickname.setDepth(this.sprite.y);

    // chat-message
    this.chatmess = this.scene.add.text(1000, 600, " Привет! Как дела?! \n Может пообщаемся? \n Познакомимся?\n Меня зовут, Alex \n А тебя?", {
      color: "#000",
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
    });

    this.chatmess.setLineSpacing(4);
    this.chatmess.setScale(0.6);
    this.chatmess.setPosition(
      this.sprite.x - this.sprite.width / 2,
      this.sprite.y - this.sprite.height - 10
    );
    this.chatmess.setDepth(this.sprite.y);
    this.chatmess.visible = false;

    // chat-message
    this.chatmess2 = this.scene.add.text(1000, 600,
      " Чем занимаешься?!  " +
      "\n Твои родители случайно " +
      "\n не пожарники?" +
      "\n Ты просто - Огонь" +
      "\n Твоей маме зять не  \n нужен?" +
      "\n Хотел бы пригласить тебя \n на свидание." +
      "\n Может сегодня вечером?" +
      "\n Часиков в 6 например?",
      {
        color: "#000",
        fontFamily: '"Press Start 2P"',
        fontSize: '20px'
      });
    this.chatmess2.setLineSpacing(4);
    this.chatmess2.setScale(0.5);
    this.chatmess2.setPosition(
      this.sprite.x - this.sprite.width / 2,
      this.sprite.y - this.sprite.height - 10
    );
    this.chatmess2.setDepth(this.sprite.y);
    this.chatmess2.visible = false;

    // Значок молнии с анимацией
    this.lightning = this.scene.add.image(0, 0, "lightningIcon");
    this.lightning.setScale(0.25); // Уменьшаем размер вдвое (с 0.5 до 0.25)
    this.lightning.setOrigin(0.5, 1);
    this.lightning.setDepth(this.sprite.y + 200);
    this.lightning.visible = false;
    this.lightning.name = "lightningIcon"; // Добавляем имя для отладки

    // Создаем зеленую молнию (изначально скрыта)
    this.lightningGreen = this.scene.add.image(0, 0, "lightningGreenIcon");
    this.lightningGreen.setScale(0.25);
    this.lightningGreen.setOrigin(0.5, 1);
    this.lightningGreen.setDepth(this.sprite.y + 200);
    this.lightningGreen.visible = false;
    this.lightningGreen.name = "lightningGreenIcon";

    // Создаем красную молнию (изначально скрыта)
    this.lightningRed = this.scene.add.image(0, 0, "lightningRedIcon");
    this.lightningRed.setScale(0.25);
    this.lightningRed.setOrigin(0.5, 1);
    this.lightningRed.setDepth(this.sprite.y + 200);
    this.lightningRed.visible = false;
    this.lightningRed.name = "lightningRedIcon";

    // Состояние молнии
    this.lightningState = "normal"; // normal, green, warning
    this.warningThreshold = 0.7; // 70% от максимального расстояния взаимодействия
    this.menuOpen = false; // Флаг открытого меню

    // Настраиваем анимацию пульсации для молнии
    this.setupLightningAnimation();

    // Настраиваем интерактивность молнии при необходимости
    if (!this.isPlayer) {
      this.setupLightningInteractivity();
    }

    // ===== Обработка клика на спрайте =====
    if (!this.isPlayer) {
      // Убираем старый обработчик, если он есть
      this.sprite.off('pointerdown');

      // Добавляем новый обработчик
      this.sprite.on('pointerdown', (pointer) => {
        // Генерируем уникальный ID для лога
        const clickId = Date.now();
        // console.log(`[CLICK ${clickId}] Обнаружен клик на персонаже ID=${this.playerid}`);

        // 1. Блокируем движение игрока принудительно
        if (this.playerRef) {
          this.playerRef.blockMovement = true;
          this.playerRef.resetMovement();
          // console.log(`[CLICK ${clickId}] Движение игрока заблокировано`);
        }

        // 2. Отмечаем для сцены, что был клик на персонаже
        if (this.scene) {
          this.scene.lastCharacterClick = Date.now();
          // console.log(`[CLICK ${clickId}] Установлен таймер lastCharacterClick=${this.scene.lastCharacterClick}`);
        }

        // 3. Эмитим событие для открытия панели быстрой информации
        const clickData = {
          playerID: this.playerid,
          x: this.sprite.x,
          y: this.sprite.y,
          timestamp: Date.now()
        };

        // console.log(`[CLICK ${clickId}] Эмитим событие player-quick-info с данными:`, clickData);
        emitter.emit('player-quick-info', clickData);

        // 4. Останавливаем обработку события
        pointer.event.stopPropagation();
        return false;
      });

      // console.log(`Player ${this.playerid}: Установлен обработчик клика на спрайте`);
    }
  }

  showChatting() {
    if (this.chatTimeout) {
      clearTimeout(this.chatTimeout);
    }
    this.chatting.visible = true;
    this.chatmess.visible = true;

    this.chatTimeout = setTimeout(() => {
      this.chatting.visible = false;
      this.chatmess.visible = false;
      this.chatting1.visible = true;
      this.chatmess2.visible = true;
    }, 5300);
  }

  updateNicknamePosition() {
    this.nickname.setPosition(
      this.sprite.x - this.sprite.width / 2,
      this.sprite.y - this.sprite.height - 10
    );
    this.nickname.setDepth(this.sprite.y);


    //this.chatting.visible=true;
    //this.chatmess.visible=true;

    this.chatting.setPosition(3650, 1990);
    this.chatmess.setPosition(3670, 2010);

    this.chatting.setDepth(this.sprite.y + 100);
    this.chatting.setScale(0.5);
    this.chatmess.setScale(0.55);

    this.chatting1.setPosition(3660, 1940);
    this.chatmess2.setPosition(3685, 1970)
    this.chatting1.setScale(0.6);
    this.chatmess2.setScale(0.51);

    this.chatting1.setDepth(this.sprite.y + 100);
    this.chatmess.setDepth(this.sprite.y + 100);
    this.chatmess2.setDepth(this.sprite.y + 100);
  }

  updateLightningPosition() {
    const x = this.sprite.x;
    const y = this.sprite.y - this.sprite.height + 10; // Приближаем к спрайту
    const depth = this.sprite.y + 200;

    // Обновляем позицию для всех молний
    if (this.lightning) {
      this.lightning.setPosition(x, y);
      this.lightning.setDepth(depth);

      // Ensure lightning remains interactive after position updates
      if (!this.isPlayer && this.lightning.input) {
        this.lightning.input.enabled = this.lightning.visible;
      }
    }

    if (this.lightningGreen) {
      this.lightningGreen.setPosition(x, y);
      this.lightningGreen.setDepth(depth);
    }

    if (this.lightningRed) {
      this.lightningRed.setPosition(x, y);
      this.lightningRed.setDepth(depth);
    }
  }

  // Настройка анимации пульсации молнии
  setupLightningAnimation() {
    // Сначала остановим все существующие анимации для всех молний
    const lightnings = [this.lightning, this.lightningGreen, this.lightningRed];

    lightnings.forEach(icon => {
      if (icon) {
        this.scene.tweens.killTweensOf(icon);
      }
    });

    // Настройка стандартной анимации пульсации для обычной и зеленой молнии
    [this.lightning, this.lightningGreen].forEach(icon => {
      if (icon) {
        // Анимация пульсации (увеличение и уменьшение)
        this.scene.tweens.add({
          targets: icon,
          scaleX: { from: 0.25, to: 0.325 },
          scaleY: { from: 0.25, to: 0.325 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // Небольшое движение вверх-вниз
        this.scene.tweens.add({
          targets: icon,
          y: '-=3',
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // Настройка быстрого мигания для красной молнии (4 раза в секунду)
    // Один полный цикл мигания: появление + исчезновение = 250мс (4 раза в секунду)
    // Поэтому каждая фаза (появление или исчезновение) = 125мс
    if (this.lightningRed) {
      // Быстрое мигание альфа-канала (видимости)
      this.scene.tweens.add({
        targets: this.lightningRed,
        alpha: { from: 1, to: 0.3 },
        duration: 125, // 125мс на одну фазу, полный цикл 250мс (4 раза в секунду)
        yoyo: true,
        repeat: -1,
        ease: 'Linear'
      });

      // Увеличение/уменьшение размера
      this.scene.tweens.add({
        targets: this.lightningRed,
        scaleX: { from: 0.25, to: 0.35 },
        scaleY: { from: 0.25, to: 0.35 },
        duration: 125, // 125мс на одну фазу, полный цикл 250мс (4 раза в секунду)
        yoyo: true,
        repeat: -1,
        ease: 'Linear'
      });
    }
  }

  showLightning() {
    if (this.lightning) {
      // Сбрасываем состояние молнии
      this.setLightningState("normal");
      this.lightningVisible = true;

      // Добавляем анимацию "взрыва" при появлении
      // Сначала сбрасываем текущий масштаб и возможные активные анимации
      this.lightning.setScale(0.2);
      this.scene.tweens.killTweensOf(this.lightning);

      // Создаем анимацию "взрыва"
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

      // Make sure it's interactive when visible
      if (!this.isPlayer && this.lightning.input) {
        // console.log("Making lightning interactive for playerid:", this.playerid);
        this.lightning.input.enabled = true;
      } else if (!this.isPlayer) {
        // Если интерактивность не установлена, установим её
        // console.log("Lightning not interactive yet, setting up for playerid:", this.playerid);
        this.setupLightningInteractivity();
      }
    }
  }

  // Метод для изменения состояния молнии
  setLightningState(state) {
    // Обновляем текущее состояние
    this.lightningState = state;

    // Скрываем все молнии
    this.lightning.visible = false;
    this.lightningGreen.visible = false;
    this.lightningRed.visible = false;

    // Показываем нужную молнию в зависимости от состояния
    switch (state) {
      case "green":
        this.lightningGreen.visible = true;
        break;
      case "warning":
        this.lightningRed.visible = true;
        break;
      case "normal":
      default:
        this.lightning.visible = true;
        break;
    }

    // Обновляем анимации
    this.setupLightningAnimation();

    // Убедимся, что интерактивность настроена для видимой молнии
    if (!this.isPlayer) {
      this.setupLightningInteractivity();
    }
  }

  // Метод для установки флага открытого меню и изменения состояния молнии
  setMenuOpen(isOpen) {
    this.menuOpen = isOpen;

    // Если меню открыто, переключаем на зеленую молнию
    if (isOpen && this.lightningVisible) {
      // console.log(`Player ${this.playerid}: Menu opened, setting green lightning`);
      this.setLightningState("green");

      // Сразу после открытия меню проверяем текущее расстояние
      // Если игрок уже находится на критическом расстоянии, активируем предупреждение
      if (this.scene && this.scene.player) {
        const playerX = this.scene.player.sprite.x;
        const playerY = this.scene.player.sprite.y;
        const myX = this.sprite.x;
        const myY = this.sprite.y;

        const distanceX = Math.pow(playerX - myX, 2);
        const distanceY = Math.pow(playerY - myY, 2);
        const distance = Math.sqrt(distanceX + distanceY);

        // Предполагаем, что interactionDistance = 200 (из Game.js)
        const interactionDistance = 200;
        const distanceRatio = distance / interactionDistance;

        // Сразу проверяем порог предупреждения
        this.checkWarningState(distanceRatio);
      }
    } else if (this.lightningVisible) {
      // Если меню закрыто, возвращаемся к обычной молнии
      // console.log(`Player ${this.playerid}: Menu closed, setting normal lightning`);
      this.setLightningState("normal");
    }
  }

  // Метод для проверки и обновления состояния предупреждения
  checkWarningState(distanceRatio) {
    // Проверяем только если меню открыто
    if (this.menuOpen && this.lightningVisible) {
      // Если расстояние превышает порог предупреждения (70% от расстояния закрытия меню), 
      // переключаем на красную молнию, которая мигает 4 раза в секунду
      if (distanceRatio >= this.warningThreshold) {
        if (this.lightningState !== "warning") {
          // console.log(`Player ${this.playerid}: Lightning set to warning (red blinking)`);
          this.setLightningState("warning");
        }
      } else {
        // Иначе возвращаемся к зеленой молнии
        if (this.lightningState !== "green") {
          // console.log(`Player ${this.playerid}: Lightning set to green`);
          this.setLightningState("green");
        }
      }
    }
  }

  // Новый метод для установки интерактивности молнии
  setupLightningInteractivity() {
    if (!this.isPlayer) {
      // console.log("Setting up lightning interactivity for playerid:", this.playerid);

      // Настраиваем интерактивность для всех молний
      [this.lightning, this.lightningGreen, this.lightningRed].forEach(icon => {
        if (icon) {
          // Устанавливаем интерактивность
          icon.setInteractive({ cursor: "pointer" });

          // Убеждаемся, что слушатель событий добавлен только один раз
          icon.off('pointerdown'); // Удаляем предыдущий обработчик, если он есть

          icon.on("pointerdown", (e) => {
            // console.log("LIGHTNING CLICKED for playerid:", this.playerid);

            const x = this.sprite.x - (e.worldX - e.x);
            const y = this.sprite.y - (e.worldY - e.y);
            const playerID = this.playerid;

            // console.log("Emitting events for lightning click with playerID:", playerID);

            window.gameInstance.currentChattingUserId = playerID;
            emitter.emit("player-private-chatting", playerID);
            emitter.emit("ensure-private-chat-visible", playerID);

            // Эмитим событие для показа панели быстрой информации в правом верхнем углу
            emitter.emit("player-quick-info", { x, y, playerID });

            // Эмитим событие для показа меню действий над головой персонажа
            emitter.emit("show-character-actions", {
              x: this.sprite.x,
              y: this.sprite.y,
              playerID
            });
            emitter.emit("click-menu2", { x, y, playerID });

            // Устанавливаем флаг открытого меню
            this.setMenuOpen(true);

            // Останавливаем распространение события, чтобы предотвратить перемещение игрока
            // e.event.stopPropagation();
            // console.log('event',e);

            // Установка флага обработки для предотвращения дальнейшей обработки
            e.processed = true;
            setTimeout(() => {
              e.processed = false;
            }, 100);

            // // Выделяем этот клик, чтобы игровая сцена знала, что он уже обработан
            // if (this.scene) {
            //   this.scene.lastLightningClick = Date.now();
            // }

            // if (this.playerRef) {
            //   this.playerRef.blockMovement = true;
            //   this.playerRef.resetMovement();
            // }

          });

        }
      });
    }
  }

  hideLightning() {
    // Останавливаем все анимации перед скрытием
    [this.lightning, this.lightningGreen, this.lightningRed].forEach(icon => {
      if (icon) {
        this.scene.tweens.killTweensOf(icon);
        icon.visible = false;
      }
    });

    this.lightningVisible = false;
    this.lightningState = "normal";
    this.menuOpen = false;

    // Disable interactivity when not visible
    [this.lightning, this.lightningGreen, this.lightningRed].forEach(icon => {
      if (!this.isPlayer && icon && icon.input) {
        icon.input.enabled = false;
      }
    });

    // Закрываем меню ProfileMenu, когда молния исчезает
    // (игрок выходит из радиуса взаимодействия)
    emitter.emit("close-menu2");
    // console.log("hideLightning: Closing ProfileMenu due to player leaving interaction radius");
  }

  addAnimations() {
    if (this.scene.anims.anims.size > 0) return;
    spriteMap.forEach((item) => {
      item.sprites.forEach((sprite) => {
        const spriteKey = `${item.key}-${sprite.key}`;
        this.sprite.anims.create({
          key: spriteKey,
          frames: this.scene.anims.generateFrameNumbers(spriteKey, {
            start: 0,
            end: item?.frameCount ?? 3,
          }),
          frameRate: item?.frameCount ?? 4,
          repeat: -1,
        });
      });
    });
  }

  addControls() {
    this.scene.input.on(
      "pointerdown",
      (pointer) => {
        this.setPointer(pointer);
        // this.scene.sendPlayerState(this.scene.player.sprite.x, this.scene.player.sprite.y);
      },
      this
    );
  }

  setPointer(pointer) {
    // Проверяем, не было ли событие уже обработано (клик на другого игрока)
    if (pointer.processed) {
      // console.log("Событие клика уже обработано (processed=true), игнорируем перемещение");
      return;
    }

    // Проверяем состояние блокировки движения
    if (this.isPlayer && this.blockMovement) {
      // console.log("Движение заблокировано (blockMovement=true), игнорируем перемещение");
      this.blockMovement = false;
      return;
    }

    // console.log("Обработка перемещения игрока в точку:", pointer.worldX, pointer.worldY);

    // Сохраняем текущую и целевую позицию
    this.pointerPosition.x = pointer.worldX;
    this.pointerPosition.y = pointer.worldY;
    this.playerMomentPosition.x = this.sprite.x;
    this.playerMomentPosition.y = this.sprite.y;

    this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
    this.isMoving = true;
    // this.startStuckCheck();

    if (this.isPlayer) {
      // Отправляем серверу информацию о начале движения с текущей позицией и целью
      this.scene.sendPlayerMovement(
        this.sprite.x,
        this.sprite.y,
        this.pointerPosition.x,
        this.pointerPosition.y
      );

      // Запускаем периодическое обновление позиции во время движения
      // this.startPositionUpdates();
    }
  }

  // startStuckCheck() {
  //   if (this.stuckTimer) {
  //     clearTimeout(this.stuckTimer); // Сбрасываем предыдущий таймер
  //   }
  //   this.stuckTimer = setTimeout(() => {
  //     if (this.isMoving) {
  //       const distanceX = Math.abs(this.sprite.x - this.lastPosition.x);
  //       const distanceY = Math.abs(this.sprite.y - this.lastPosition.y);

  //       // Если игрок не сдвинулся более чем на 100 пикселей
  //       if (distanceX < 100 && distanceY < 100) {
  //         // Считаем, что он застрял
  //         this.pointerPosition.x = this.sprite.x;
  //         this.pointerPosition.y = this.sprite.y;
  //         this.scene.sendPlayerState(this.sprite.x, this.sprite.y); // Отправляем новую позицию
  //         this.isMoving = false; // Останавливаем движение
  //       } else {
  //         // Игрок движется, обновляем позицию и продолжаем проверку
  //         this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
  //         this.startStuckCheck();
  //       }
  //     }
  //   }, 2000); // Проверка через 2 секунды
  // }

  startPositionUpdates() {
    // Очищаем предыдущий интервал, если он существует
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
    }

    // Обновляем позицию каждые 500мс во время движения
    this.positionUpdateInterval = setInterval(() => {
      if (this.isMoving) {
        this.scene.sendPlayerPosition(this.sprite.x, this.sprite.y);
      } else {
        // Если больше не движемся, останавливаем обновления
        clearInterval(this.positionUpdateInterval);
        this.positionUpdateInterval = null;
      }
    }, 500);
  }

  moveToPosition(x, y) {
    if (!this.isPlayer) {
      this.pointerPosition.x = x;
      this.pointerPosition.y = y;
      this.playerMomentPosition.x = this.sprite.x;
      this.playerMomentPosition.y = this.sprite.y;

      // Устанавливаем флаг для активации движения
      this.isMoving = true;

      // Если был запущен таймер проверки застревания, сбрасываем его
      // if (this.stuckTimer) {
      //   clearTimeout(this.stuckTimer);
      // }

      // Запускаем новую проверку застревания
      // this.startStuckCheck();
    }
  }


  update() {
    if (!this.scene) return;
    if (!this.sprite) return;
    this.playerMovement();
    this.updateNicknamePosition();
    this.updateLightningPosition();
    this.sprite.setDepth(this.sprite.y);

    if (this.scene.socket?.readyState === WebSocket.OPEN && this.isMoving == true && this.isPlayer) {
      this.scene.socket.send(JSON.stringify(
        {
          type: "position_update",
          x: parseInt(this.sprite.x),
          y: parseInt(this.sprite.y),
          moving: true
        }
      ));
    }

    // Если игрок достиг цели, останавливаем проверку
    if (this.isMoving &&
      Math.abs(this.sprite.x - this.pointerPosition.x) < 10 &&
      Math.abs(this.sprite.y - this.pointerPosition.y) < 10) {
      this.isMoving = false;

      if (this.isPlayer) {
        this.scene.socket.send(JSON.stringify(
          {
            type: "position_update",
            x: parseInt(this.pointerPosition.x),
            y: parseInt(this.pointerPosition.y),
            moving: false
          }
        ));
      }

      clearTimeout(this.stuckTimer);
    }
  }




  resetMovement() {
    this.pointerPosition.x = this.sprite.x;
    this.pointerPosition.y = this.sprite.y;
    this.playerMomentPosition.x = this.sprite.x;
    this.playerMomentPosition.y = this.sprite.y;
    this.sprite.setVelocityX(0);
    this.sprite.setVelocityY(0);
  }

  playerMovement() {
    let avatar = this.avatar;

    const totalVelocity = 2;
    let xDirection = 1;
    let yDirection = 1;
    let xDiff = 0;
    let yDiff = 0;
    const boundries = 10;
    const speedPlayer = 1;
    xDiff = this.pointerPosition.x - this.playerMomentPosition.x;
    yDiff = this.pointerPosition.y - this.playerMomentPosition.y;
    if (this.pointerPosition.x > this.playerMomentPosition.x) {
      xDirection = speedPlayer;
    }
    if (this.pointerPosition.x < this.playerMomentPosition.x) {
      xDirection = -speedPlayer;
      xDiff *= -speedPlayer;
    }
    if (this.pointerPosition.y > this.playerMomentPosition.y) {
      yDirection = speedPlayer;
    }
    if (this.pointerPosition.y < this.playerMomentPosition.y) {
      yDirection = -speedPlayer;
      yDiff *= -speedPlayer;
    }

    // Проверяем, стоим ли мы на месте (по X)
    if (
      this.sprite.x > this.pointerPosition.x - boundries &&
      this.sprite.x < this.pointerPosition.x + boundries
    ) {
      if (this.sprite.body.velocity.y !== 0) {
        if (yDirection === -speedPlayer) {
          this.sprite.anims.play(`${avatar}-back`, true);
        } else {
          this.sprite.anims.play(`${avatar}-front`, true);
        }
      } else {
        //TODO: uncomment
        this.sprite.anims.play(`${avatar}-stand`, true);
      }
      this.sprite.setVelocityX(0);
    } else {
      let coefficientX = 1;
      if (xDiff + yDiff > 0) {
        coefficientX = xDiff / (xDiff + yDiff);
      }

      // Выбор анимации и флипа в зависимости от направления
      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        // Горизонтальное движение доминирует
        this.sprite.anims.play(`${avatar}-front`, true);
        this.sprite.setFlipX(xDirection === -speedPlayer);
      } else {
        // Вертикальное движение доминирует
        if (yDirection === -speedPlayer) {
          // Движение вверх - используем back анимацию
          this.sprite.anims.play(`${avatar}-back`, true);
          // ИНВЕРТИРУЕМ ЛОГИКУ - меняем местами флаги для направлений вверх-влево и вверх-вправо
          if (xDirection === -speedPlayer) {
            this.sprite.setFlipX(false);  // Влево-вверх - НЕ ФЛИПАЕМ
          } else {
            this.sprite.setFlipX(true);   // Вправо-вверх - ФЛИПАЕМ
          }
        } else {
          // Движение вниз - используем front анимацию
          this.sprite.anims.play(`${avatar}-front`, true);
          this.sprite.setFlipX(xDirection === -speedPlayer);
        }
      }

      this.sprite.setVelocityX(xDirection * totalVelocity * coefficientX);
    }

    // Проверяем, стоим ли мы на месте (по Y)
    if (
      this.sprite.y > this.pointerPosition.y - boundries &&
      this.sprite.y < this.pointerPosition.y + boundries
    ) {
      this.sprite.setVelocityY(0);
    } else {
      let coefficientY = 1;
      if (xDiff + yDiff > 0) {
        coefficientY = yDiff / (xDiff + yDiff);
      }
      this.sprite.setVelocityY(yDirection * totalVelocity * coefficientY);
    }
  }
  showChattingBaloon(type = 0) {
    this.chatting.visible = false;
    this.chatting2.visible = false;

    if (type === 1) {
      this.chatting2.visible = true;
      this.chatting2.setPosition(
        3660,
        1900
      );
      this.chatting1.setDepth(this.sprite.y + 100);

      this.chatmess2.setPosition(3720, 1950)
      this.chatmess2.setDepth(this.sprite.y + 100);
    } else {
      this.chatting.visible = true;
      this.chatting.setPosition(
        3660,
        1900
      );
      this.chatting.setDepth(this.sprite.y + 100);

      this.chatmess.setPosition(3720, 1950)
      this.chatmess.setDepth(this.sprite.y + 100);
    }

  }

  moveTo(x, y) {
    this.moveToPosition(x, y);

  }

  // В классе Player добавьте:
  destroy() {
    // Remove event listeners
    if (this.isPlayer) {
      emitter.off("player-chatting");
    }

    // Убираем обработчики событий для меню
    emitter.off("menu-opened");
    emitter.off("menu-closed");

    if (this.scene && this.scene.events) {
      this.scene.events.off("update", this.update, this);
    }

    // Clear any existing timeouts
    if (this.chatTimeout) {
      clearTimeout(this.chatTimeout);
    }
    if (this.chatTimeout1) {
      clearTimeout(this.chatTimeout1);
    }

    // Remove UI elements
    if (this.nickname) {
      this.nickname.destroy();
    }
    if (this.chatting) {
      this.chatting.destroy();
    }
    if (this.chatting1) {
      this.chatting1.destroy();
    }
    if (this.chatmess) {
      this.chatmess.destroy();
    }
    if (this.chatmess2) {
      this.chatmess2.destroy();
    }

    // Clean up all lightning icons
    [this.lightning, this.lightningGreen, this.lightningRed].forEach(icon => {
      if (icon) {
        if (icon.input) {
          icon.removeInteractive();
        }
        icon.destroy();
      }
    });

    // Clean up any active chat bubbles
    // Найдем все графические объекты, относящиеся к бабликам этого игрока
    if (this.scene) {
      const allGameObjects = this.scene.children.list;
      const playerBubbles = allGameObjects.filter(obj =>
        obj.bubbleOwner === this.playerid ||
        (obj.data && obj.data.values && obj.data.values.bubbleOwner === this.playerid)
      );

      playerBubbles.forEach(obj => {
        if (obj && obj.destroy) {
          obj.destroy();
        }
      });
    }

    // Remove sprite and physics body
    if (this.sprite) {
      // Remove interactive properties if they exist
      if (this.sprite.input) {
        this.sprite.removeInteractive();
      }

      // Remove any existing animations
      if (this.sprite.anims) {
        this.sprite.anims.stop();
      }

      // Remove the physics body first
      if (this.sprite.body && this.scene && this.scene.matter && this.scene.matter.world) {
        this.scene.matter.world.remove(this.sprite.body);
      }

      // Finally destroy the sprite
      this.sprite.destroy();
    }

    // Clear references
    this.pointerPosition = null;
    this.playerMomentPosition = null;
    this.sprite = null;
    this.scene = null;
    this.playerRef = null;
  }

  /**
   * Создаёт чат-бабл (изображение + текст) по заданным координатам.
   * @param {number} x - Координата X для расположения бабла.
   * @param {number} y - Координата Y для расположения бабла.
   * @param {string} text - Текст, который будет отображаться в бабле.
   * @param {string} [imageKey='messageIcon'] - Ключ для картинки бабла (по умолчанию 'messageIcon').
   * @param {number} [scale=0.6] - Масштаб для изображения и текста.
   * @returns {object} Объект с созданными элементами: { bubbleImage, bubbleText }
   */
  createChatBubble(x, y, text, imageKey = 'messageIcon', scale = 0.6) {
    // Создаём изображение бабла
    const bubbleImage = this.scene.add.image(x, y, imageKey);
    bubbleImage.setScale(scale);
    bubbleImage.setOrigin(0, 0);
    // Можно задать глубину относительно позиции игрока, чтобы отображалось поверх прочего
    bubbleImage.setDepth(this.sprite.y + 100);


    // Ограничение длины текста
    if (text.length > 120) {
      text = text.substring(0, 117) + "...";
    }

    // Функция для разбиения текста на строки по N символов
    const formatText = (str, length = 18) => {
      const words = str.split(" ");
      let line = "";
      let formattedText = [];

      words.forEach(word => {
        if ((line + word).length > length) {
          formattedText.push(line.trim());
          line = "";
        }
        line += word + " ";
      });

      if (line.trim().length > 0) {
        formattedText.push(line.trim());
      }

      return formattedText.join("\n");
    };

    const formattedText = formatText(text);


    // Создаём текст для бабла
    const bubbleText = this.scene.add.text(x + 40, y + 50, formattedText, {
      color: "#000",
      fontFamily: '"Press Start 2P"',
      fontSize: '20px'
    });
    bubbleText.setLineSpacing(4);
    bubbleText.setScale(scale);
    bubbleText.setDepth(this.sprite.y + 100);

    // Можно добавить анимацию появления/исчезновения или таймер для автоматического скрытия
    // Пример: скрыть через 5 секунд
    this.scene.time.delayedCall(5000, () => {
      bubbleImage.destroy();
      bubbleText.destroy();
    });

    // Возвращаем созданные элементы, если потребуется дальнейшая работа с ними
    return { bubbleImage, bubbleText };
  }


  //TODO: move this function to helper.
  createChatBubbleTarget2(targetSprite, offsetX, offsetY, text, scale = 0.6, bubbleAlpha = 1, enableReplyBtn = false, type = 'private') {

    if (this.scene.currentChattingUserId == this.playerid) {
      enableReplyBtn = false;
    }

    var bubble = this.scene.add.graphics({ x: targetSprite.x, y: targetSprite.y });

    var image_height = 200;
    var image_width = 200;
    var bubble_content_height = 0;
    var bubble_content_width = 0;
    var bubble_content = [];
    var bubble_content_offset_y = [];

    // var bubbleText = this.scene.add.text(0, 0, text, { fontFamily: '"Press Start 2P"', fontSize: "12px", color: 'rgba(0,0,0,' + (bubbleAlpha * 10) + ')', align: 'left', lineSpacing: 4, wordWrap: { width: 300 } });

    var last_height_of_bubbleText = 0;
    for (let message_id in text) {
      let message = text[message_id];
      // let offset_y = 0;

      if (message.text.trim() !== '') {
        let bubble_text = this.scene.add.text(0, 0, message.text, { fontFamily: '"Press Start 2P"', fontSize: "12px", color: 'rgba(0,0,0,' + (bubbleAlpha * 10) + ')', align: 'left', lineSpacing: 4, wordWrap: { width: 250 } });
        let bubble_text_boundaries = bubble_text.getBounds();

        if (bubble_text_boundaries.width > image_width)
          image_width = bubble_text_boundaries.width;


        bubble_content_offset_y['text_' + message_id] = last_height_of_bubbleText;

        bubble_content_height += bubble_text_boundaries.height;

        last_height_of_bubbleText += bubble_text_boundaries.height;


        if (bubble_content_width < bubble_text_boundaries.width)
          bubble_content_width = bubble_text_boundaries.width;

        bubble_content.push(bubble_text);
      }

      if (message.image !== '' && message.image !== null) {
        if (bubble_content_width < image_width)
          bubble_content_width = image_width;
      }

      if (message.image !== '' && message.image !== null) {

        bubble_content_offset_y['image_' + message_id] = (last_height_of_bubbleText);

        bubble_content_height += image_height + 15;
        last_height_of_bubbleText += image_height + 15;


      }

      // last_height_of_bubbleText += offset_y;

    }



    // console.log('bubble_content_offset_y', bubble_content_offset_y);


    // console.log('bubble_content_height', bubble_content_height);

    if (enableReplyBtn) {
      if (typeof (this.replyButton) == 'object' && this.replyButton !== null && this.replyButton.active) {
        var replyButton = this.replyButton;
      } else {
        var replyButton = this.scene.add.text(0, 0, "📨 Ответить", {
          color: "#007BFF",
          backgroundColor: "#F0F0F0",
          padding: { x: 10, y: 5 },
          fontFamily: '"Press Start 2P"',
          fontSize: '14px',
        });
        // replyButton.setScale(scale);
        replyButton.setInteractive({ useHandCursor: true });

        // Реакция на наведение
        replyButton.on('pointerover', () => {
          replyButton.setStyle({ color: "#0056b3" });
          // console.log('over button');
        });

        replyButton.on('pointerout', () => {
          replyButton.setStyle({ color: "#007BFF" });
        });

        // Реакция на клик
        replyButton.on('pointerdown', (e) => {
          // Открываем меню взаимодействия с пользователем
          // // console.log(`Reply button clicked for user ${this.playerid} (${senderName})`);

          window.gameInstance.currentChattingUserId = this.playerid;
          emitter.emit("player-private-chatting", this.playerid);
          emitter.emit("ensure-private-chat-visible", this.playerid);

          // Эмитим два события:
          // 1. Открываем меню взаимодействия
          emitter.emit("click-menu2", { playerID: this.playerid });

          // 2. Открываем приватный чат с указанием ника
          emitter.emit("player-private-chatting", this.playerid);

          e.processed = true;
          setTimeout(() => {
            e.processed = false;
          }, 100);

        });


        this.replyButton = replyButton;
      }
    } else {
      if (this.replyButton) {
        this.replyButton.destroy();
      }
    }


    const drawBubble = (text, bubble_content_offset_y) => {

      bubble.clear();

      var bubblePadding = 10;

      var b = { width: bubble_content_width, height: bubble_content_height };//bubbleText.getBounds();

      var replyHeight = 0;
      var replyWidth = 0;

      if (enableReplyBtn) {
        var enableReplyBtnBounds = replyButton.getBounds();
        replyHeight = enableReplyBtnBounds.height;
        replyWidth = enableReplyBtnBounds.width;
      }

      if (b.width < replyWidth) {
        var bubbleWidth = b.width + bubblePadding + 30 + replyWidth;

      } else {
        var bubbleWidth = b.width + bubblePadding + 30;
      }

      var bubbleHeight = b.height + bubblePadding + 15 + replyHeight;
      var arrowHeight = 24;

      //Цвет заливки облачка
      bubble.fillStyle(0xffffff, bubbleAlpha);

      //Цвет обводки облачка
      bubble.lineStyle(4, 0x565656, bubbleAlpha);

      bubble.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight, 16);
      bubble.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 16);

      var point1X = 0;
      var point1Y = bubblePadding + 2;
      var point2X = -20;
      var point2Y = arrowHeight / 2;
      var point3X = 0;
      var point3Y = arrowHeight;

      bubble.fillTriangle(point1X, point1Y, point2X, point2Y, point3X, point3Y);
      bubble.lineStyle(2, 0x565656, bubbleAlpha);
      bubble.lineBetween(point1X, point1Y, point2X, point2Y);
      bubble.lineBetween(point2X, point2Y, point3X, point3Y);

      const bubbleX = targetSprite.x + 20;
      const bubbleY = targetSprite.y + 5;

      const depth = 99999 + 50;

      bubble.setDepth(depth);
      // bubbleText.setDepth(depth + 10);
      for (let bubble_text of bubble_content) {
        bubble_text.setDepth(depth + 10);
      }
      if (enableReplyBtn) {
        replyButton.setDepth(depth + 100);
      }

      const diffY = (targetSprite.height - bubbleHeight) / 2;

      bubble.setPosition(targetSprite.x + (targetSprite.width / 2) + bubblePadding, targetSprite.y - 0 - bubbleHeight - diffY * 2 + 15);



      for (let message_id in text) {
        let message = text[message_id];

        // this.scene.textures.removeKey('bubble-image-' + message_id);
        // if (this.scene.textures.exists('bubble-image')) {
        //   this.scene.textures.remove('bubble-image');
        // }

        if (message.image) {


          if (typeof (window.gameInstance.bubbleImages[type][this.playerid]) !== 'object' || typeof (window.gameInstance.bubbleImages[type][this.playerid][message.uuid]) !== 'object') {


            this.scene.textures.once('addtexture', function () {

              let offset_y = bubble_content_offset_y['image_' + message_id];
              // offset_y = offset_y - image_height / 2;

              // console.log('offset_y22', offset_y);
              let image = this.scene.add.image(targetSprite.x + (targetSprite.width / 2) + bubblePadding + image_width / 2 + 15, targetSprite.y - 0 - bubbleHeight - diffY + 100, 'bubble-image-' + message.uuid);
              // let image = this.scene.add.image(0, 0, 'bubble-image-' + message.uuid);

              image.setDisplaySize(image_width, image_height);
              image.setDepth(depth + 10);

              if (typeof (window.gameInstance.bubbleImages[type][this.playerid]) !== 'object') {
                window.gameInstance.bubbleImages[type][this.playerid] = {};
              }

              window.gameInstance.bubbleImages[type][this.playerid][message.uuid] = image;

              // message_images.push({ id: 'bubble-image-' + message_id, 'texture': texture, 'image': image });

            }, this);


          } else {
            // console.log('message.image', message.image);

            let offset_y = bubble_content_offset_y['image_' + message_id] + 100;
            // console.log(offset_y);
            // offset_y = offset_y - image_height / 2;
            window.gameInstance.bubbleImages[type][this.playerid][message.uuid].setPosition(targetSprite.x + (targetSprite.width / 2) + bubblePadding + image_width / 2 + 15, targetSprite.y - 0 - bubbleHeight + offset_y - diffY * 2 + 30);
            window.gameInstance.bubbleImages[type][this.playerid][message.uuid].setDepth(depth + 10);
          }


          // if (!this.scene.textures.exists('bubble-image-' + message.uuid)) {
          if (!window.gameInstance.bubbleTextures['bubble-image-' + message.uuid]) {
            // console.log(this.scene.textures.exists('bubble-image-' + message.uuid));
            // console.log('bubble-image-' + message.uuid);
            // console.log('base64',message.image.content);
            let texture = this.scene.textures.addBase64('bubble-image-' + message.uuid, message.image);
            // console.log('texture', texture);
            window.gameInstance.bubbleTextures['bubble-image-' + message.uuid] = texture;
          }

        }
      }


      var last_height_of_bubbleText = 0;
      for (let message_id in bubble_content) {

        let bubble_text = bubble_content[message_id];
        // let bubble_text_boundaries = bubble_text.getBounds()
        // let offset_y = bubble_text_boundaries.height;

        // if (last_height_of_bubbleText == 0)
        //   last_height_of_bubbleText = offset_y;

        let offset_y = bubble_content_offset_y['text_' + message_id];

        bubble_text.setPosition(bubbleX + (targetSprite.width / 2) + bubblePadding, bubbleY - bubbleHeight + last_height_of_bubbleText + (bubblePadding / 2) + offset_y - diffY * 2 + 15);

        last_height_of_bubbleText += offset_y;

        bubble_text.bubbleOwner = this.playerid;
      }

      if (enableReplyBtn) {

        const diffXReplyBtn = ((bubbleWidth - replyWidth) / 2) - bubblePadding - 10;

        replyButton.setPosition(bubbleX + (targetSprite.width / 2) + bubblePadding + diffXReplyBtn, bubbleY + (bubblePadding / 2) - diffY * 2 - replyHeight);
      }


    }

    drawBubble(text, bubble_content_offset_y);

    if (bubble) {
      bubble.bubbleOwner = this.playerid;
    }

    // bubbleText = null;
    // if (bubbleText) {
    //   bubbleText.bubbleOwner = this.playerid;
    // }
    if (replyButton) {
      replyButton.bubbleOwner = this.playerid;
    }

    return { "bubble": bubble, "bubbleText": bubble_content, "replyButton": replyButton };
  }




  /**
   * Создаёт чат-бабл, привязанный к позиции целевого спрайта с заданным смещением.
   * @param {Phaser.GameObjects.Sprite} targetSprite - Спрайт, к которому привязывается бабл.
   * @param {number} offsetX - Смещение по X относительно целевого спрайта.
   * @param {number} offsetY - Смещение по Y относительно целевого спрайта.
   * @param {string} text - Текст бабла.
   * @param {number} [scale=0.6] - Масштаб.
   * @returns {object} Объект с элементами бабла.
   */
  createChatBubbleTarget(targetSprite, offsetX, offsetY, text, scale = 0.6, bubbleAlpha = 1, type = 'thoughts') {

    return this.createChatBubbleTarget2(targetSprite, offsetX, offsetY, text, scale, bubbleAlpha, false, type);
    // console.log(targetSprite);
    // Проверяем наличие сцены и спрайта
    if (!this.scene || !targetSprite) {
      console.warn("Cannot create chat bubble: scene or target sprite is null");
      return { bubble: null, bubbleText: null };
    }
    // Форматирование текста с учетом максимальной ширины строки
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

    const formattedText = text.length > 250 ? text.substring(0, 250) + "..." : formatText(text);

    // Создаём временный текст для измерения размеров
    const tempText = this.scene.add.text(0, 0, formattedText, {
      color: "#000",
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      lineSpacing: 4,
      wordWrap: { width: 10 } // Добавляем автоматический перенос слов
    });
    // tempText.setScale(scale);

    // Вычисляем актуальные размеры текста
    const textBounds = tempText.getBounds();

    // Вычисляем размеры бабла на основе текста
    const padding = 20;
    const bubbleWidth = (textBounds.width) + (padding * 1.5);
    const bubbleHeight = (textBounds.height / 2) + (padding * 2);
    const tailWidth = 20;  // Ширина хвостика
    const tailHeight = 15; // Высота хвостика

    // Удаляем временный текст
    tempText.destroy();

    // Создаём графический объект для бабла
    const bubble = this.scene.add.graphics();

    // Создаём текст бабла
    const bubbleText = this.scene.add.text(0, 0, formattedText, {
      color: "rgba(0,0,0,0.2)",
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      lineSpacing: 4,
      wordWrap: { width: 650 * scale } // Тот же перенос слов для основного текста
    });
    bubbleText.setScale(scale);

    // Функция отрисовки бабла
    const drawBubble = (x, y) => {
      bubble.clear();

      // Стиль обводки
      bubble.lineStyle(2, 0x000000, bubbleAlpha);
      // Используем bubbleAlpha для настройки прозрачности заливки
      bubble.fillStyle(0xFFFFFF, bubbleAlpha);

      // Радиус скругления углов
      const radius = 10;

      // Начинаем путь
      bubble.beginPath();

      // Смещаем бабл вправо для хвостика
      x += tailWidth;

      // Верхняя сторона
      bubble.moveTo(x + radius, y);
      bubble.lineTo(x + bubbleWidth - radius, y);

      // Правый верхний угол
      bubble.arc(x + bubbleWidth - radius, y + radius, radius, -Math.PI / 2, 0);

      // Правая сторона
      bubble.lineTo(x + bubbleWidth, y + bubbleHeight - radius);

      // Правый нижний угол
      bubble.arc(x + bubbleWidth - radius, y + bubbleHeight - radius, radius, 0, Math.PI / 2);

      // Нижняя сторона
      bubble.lineTo(x + radius, y + bubbleHeight);

      // Левый нижний угол
      bubble.arc(x + radius, y + bubbleHeight - radius, radius, Math.PI / 2, Math.PI);

      // Левая сторона с хвостиком
      const tailY = y + bubbleHeight / 2;
      bubble.lineTo(x, tailY + tailHeight);
      bubble.lineTo(x - tailWidth, tailY);  // Кончик хвостика
      bubble.lineTo(x, tailY - tailHeight);
      bubble.lineTo(x, y + radius);

      // Левый верхний угол
      bubble.arc(x + radius, y + radius, radius, Math.PI, -Math.PI / 2);

      bubble.closePath();

      // Заливка и обводка
      bubble.fillPath();
      bubble.strokePath();
    };

    // Сохраняем ссылку на сцену для безопасного доступа в updatePosition
    const sceneRef = this.scene;

    // Функция обновления позиции
    const updatePosition = () => {
      // Проверяем доступность объектов перед работой с ними
      if (!sceneRef || !targetSprite || !targetSprite.active || !bubble || !bubbleText) {
        // Пытаемся очистить объекты безопасно
        if (bubble && bubble.destroy) bubble.destroy();
        if (bubbleText && bubbleText.destroy) bubbleText.destroy();

        // Безопасно удаляем обработчик события, только если сцена существует
        if (sceneRef && sceneRef.events) {
          sceneRef.events.off('update', updatePosition);
        }
        return;
      }

      const bubbleX = targetSprite.x + offsetX;
      const bubbleY = targetSprite.y + offsetY + 100;

      drawBubble(bubbleX, bubbleY);
      bubbleText.setPosition(bubbleX + tailWidth + padding, bubbleY + padding);

      const depth = targetSprite.y + 100;
      bubble.setDepth(depth);
      bubbleText.setDepth(depth);
    };

    // Начальная отрисовка
    updatePosition();

    // Безопасно подписываемся на обновление сцены
    if (this.scene && this.scene.events) {
      this.scene.events.on('update', updatePosition);
    }

    // Добавляем идентификатор владельца для упрощения очистки
    if (bubble) {
      bubble.bubbleOwner = this.playerid;
    }
    if (bubbleText) {
      bubbleText.bubbleOwner = this.playerid;
    }

    // Автоматическое уничтожение через 5 секунд
    if (this.scene && this.scene.time) {
      this.scene.time.delayedCall(5000, () => {
        // Безопасно удаляем объекты
        if (bubble && bubble.destroy) bubble.destroy();
        if (bubbleText && bubbleText.destroy) bubbleText.destroy();

        // Безопасно удаляем обработчик события, только если сцена существует
        if (sceneRef && sceneRef.events) {
          sceneRef.events.off('update', updatePosition);
        }
      });
    }

    return { bubble, bubbleText };
  }

  /**
   * Создаёт чат-бабл с кнопкой ответа для приватных сообщений
   * @param {Phaser.GameObjects.Sprite} targetSprite - Спрайт, к которому привязывается бабл
   * @param {number} offsetX - Смещение по X относительно целевого спрайта
   * @param {number} offsetY - Смещение по Y относительно целевого спрайта
   * @param {string} text - Текст сообщения
   * @param {string} senderName - Имя отправителя
   * @param {number} [scale=0.6] - Масштаб
   * @param {number} [alfa=1] - Прозрачность бабла
   * @returns {object} Объект с элементами бабла
   */
  createChatBubbleWithReply(targetSprite, offsetX, offsetY, text, senderName, scale = 0.6, alfa = 1) {

    return this.createChatBubbleTarget2(targetSprite, offsetX, offsetY, text, scale, alfa, true);

    // console.log(this);
    // console.log(targetSprite);
    // Проверяем наличие сцены и спрайта
    if (!this.scene || !targetSprite) {
      console.warn("Cannot create chat bubble with reply: scene or target sprite is null");
      return { bubble: null, bubbleText: null, replyButton: null };
    }

    // console.log(`Creating chat bubble with reply for ${senderName}: "${text}"`);

    // Форматирование текста с учетом максимальной ширины строки
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

    const formattedText = text.length > 120 ? text.substring(0, 117) + "..." : formatText(text);

    // Создаём временный текст для измерения размеров
    const tempText = this.scene.add.text(0, 0, formattedText, {
      color: "#000",
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      lineSpacing: 4,
      wordWrap: { width: 400 * scale }
    });
    tempText.setScale(scale);

    // Вычисляем актуальные размеры текста
    const textBounds = tempText.getBounds();

    // Вычисляем размеры бабла на основе текста
    const padding = 20;
    const bubbleWidth = (textBounds.width / scale) + (padding * 1.5);
    const bubbleHeight = (textBounds.height * 0.7 / scale) + (padding * 2) + 35; // Дополнительная высота для кнопки
    const tailWidth = 20;  // Ширина хвостика
    const tailHeight = 15; // Высота хвостика

    // Удаляем временный текст
    tempText.destroy();

    // Создаём графический объект для бабла
    const bubble = this.scene.add.graphics();

    // Создаём текст бабла
    const bubbleText = this.scene.add.text(0, 0, formattedText, {
      color: "#000",
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      lineSpacing: 4,
      wordWrap: { width: 650 * scale }
    });
    bubbleText.setScale(scale);

    // Создаем кнопку ответа
    const replyButton = this.scene.add.text(0, 0, "📨 Ответить", {
      color: "#007BFF",
      backgroundColor: "#F0F0F0",
      padding: { x: 10, y: 5 },
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
    });
    replyButton.setScale(scale);
    replyButton.setInteractive({ useHandCursor: true });

    // Реакция на наведение
    replyButton.on('pointerover', () => {
      replyButton.setStyle({ color: "#0056b3" });
    });

    replyButton.on('pointerout', () => {
      replyButton.setStyle({ color: "#007BFF" });
    });

    // Реакция на клик
    replyButton.on('pointerdown', () => {
      // Открываем меню взаимодействия с пользователем
      // console.log(`Reply button clicked for user ${this.playerid} (${senderName})`);

      // Эмитим два события:
      // 1. Открываем меню взаимодействия
      emitter.emit("click-menu2", { playerID: this.playerid });

      // 2. Открываем приватный чат с указанием ника
      emitter.emit("player-private-chatting", this.playerid);
    });

    // Функция отрисовки бабла
    const drawBubble = (x, y) => {
      bubble.clear();

      // Стиль обводки
      bubble.lineStyle(2, 0x000000);
      // Используем альфа для настройки прозрачности заливки
      bubble.fillStyle(0xFFFFFF, alfa);

      // Радиус скругления углов
      const radius = 10;

      // Начинаем путь
      bubble.beginPath();

      // Смещаем бабл вправо для хвостика
      x += tailWidth;

      // Верхняя сторона
      bubble.moveTo(x + radius, y);
      bubble.lineTo(x + bubbleWidth - radius, y);

      // Правый верхний угол
      bubble.arc(x + bubbleWidth - radius, y + radius, radius, -Math.PI / 2, 0);

      // Правая сторона
      bubble.lineTo(x + bubbleWidth, y + bubbleHeight - radius);

      // Правый нижний угол
      bubble.arc(x + bubbleWidth - radius, y + bubbleHeight - radius, radius, 0, Math.PI / 2);

      // Нижняя сторона
      bubble.lineTo(x + radius, y + bubbleHeight);

      // Левый нижний угол
      bubble.arc(x + radius, y + bubbleHeight - radius, radius, Math.PI / 2, Math.PI);

      // Левая сторона с хвостиком
      const tailY = y + bubbleHeight / 2;
      bubble.lineTo(x, tailY + tailHeight);
      bubble.lineTo(x - tailWidth, tailY);  // Кончик хвостика
      bubble.lineTo(x, tailY - tailHeight);
      bubble.lineTo(x, y + radius);

      // Левый верхний угол
      bubble.arc(x + radius, y + radius, radius, Math.PI, -Math.PI / 2);

      bubble.closePath();

      // Заливка и обводка
      bubble.fillPath();
      bubble.strokePath();

      // Дополнительно добавляем линию-разделитель для кнопки
      bubble.lineStyle(1, 0xCCCCCC);
      bubble.beginPath();
      const lineY = y + bubbleHeight - 35;
      bubble.moveTo(x, lineY);
      bubble.lineTo(x + bubbleWidth, lineY);
      bubble.strokePath();
    };

    // Сохраняем ссылку на сцену для безопасного доступа в updatePosition
    const sceneRef = this.scene;

    // Функция обновления позиции
    const updatePosition = () => {
      // Проверяем доступность объектов
      if (!targetSprite || !targetSprite.active || !bubble || !bubbleText || !replyButton) {
        // Уничтожаем все объекты
        if (bubble && bubble.destroy) bubble.destroy();
        if (bubbleText && bubbleText.destroy) bubbleText.destroy();
        if (replyButton && replyButton.destroy) replyButton.destroy();

        // Удаляем обработчик
        if (sceneRef && sceneRef.events) {
          sceneRef.events.off('update', updatePosition);
        }
        return;
      }

      const bubbleX = targetSprite.x + offsetX;
      const bubbleY = targetSprite.y + offsetY + 100;

      drawBubble(bubbleX, bubbleY);
      bubbleText.setPosition(bubbleX + tailWidth + padding, bubbleY + padding);

      // Позиция кнопки ответа внизу бабла
      const buttonX = bubbleX + tailWidth + (bubbleWidth - replyButton.width * scale) / 2;
      const buttonY = bubbleY + bubbleHeight - 30;
      replyButton.setPosition(buttonX, buttonY);

      const depth = targetSprite.y + 100;
      bubble.setDepth(depth);
      bubbleText.setDepth(depth);
      replyButton.setDepth(depth);
    };

    // Начальная отрисовка
    updatePosition();

    // Подписываемся на обновление сцены
    this.scene.events.on('update', updatePosition);

    // Добавляем идентификатор владельца для упрощения очистки
    if (bubble) {
      bubble.bubbleOwner = this.playerid;
    }
    if (bubbleText) {
      bubbleText.bubbleOwner = this.playerid;
    }
    if (replyButton) {
      replyButton.bubbleOwner = this.playerid;
    }

    // Автоматическое уничтожение через N секунд (даем больше времени на ответ)
    this.scene.time.delayedCall(8000, () => {
      // Уничтожаем все объекты
      if (bubble && bubble.destroy) bubble.destroy();
      if (bubbleText && bubbleText.destroy) bubbleText.destroy();
      if (replyButton && replyButton.destroy) replyButton.destroy();

      // Удаляем обработчик
      this.scene.events.off('update', updatePosition);
    });

    // console.log('Chat bubble with reply created successfully');
    return { bubble, bubbleText, replyButton };
  }

}
