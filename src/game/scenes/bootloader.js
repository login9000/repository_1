import Phaser from "phaser";
import emitter from "../../plugins/emitter.js";

import dummyImage from "/assets/dummy.png";
import mapJSON_new from "./../maps/newmap4.json";
//import newTileset from "/assets/maps/tile_m3.png";
//import tilesetEnv from "/assets/maps/tile_m3.png";

import newTileset from "/assets/maps/tileset-v0.2.png";
import tilesetEnv from "/assets/maps/tileset_env-v2.1.png";
import tile_m2 from "/assets/maps/tile_m2.png";
import tile_v3 from "/assets/maps/tile_v3.png";
import tile_wall from "/assets/maps/tile_wall.png";
import tile_furniture from "/assets/maps/tile_furniture.png";
import tile_f1 from "/assets/maps/tile_f1.png";

import messageIcon from "/assets/chat-cloude.png";
import messageIcon2 from "/assets/chat-cloude2.png";
import messageIcon3 from "/assets/chat-cloude3.png";
import lightningIcon from "/assets/flash.png";
import lightningGreenIcon from "/assets/lightning-green.svg";
import lightningRedIcon from "/assets/lightning-red.svg";
import directionArrow from "/assets/direction-arrow.svg";
// == avatars ==
// man 1
import man1Stand from "/assets/avatars/man1/stand.png";
import man1Front from "/assets/avatars/man1/walk-front.png";
import man1Back from "/assets/avatars/man1/walk-back.png";
// woman 1
import woman1Stand from "/assets/avatars/woman1/stand.png";
import woman1Front from "/assets/avatars/woman1/walk-front.png";
import woman1Back from "/assets/avatars/woman1/walk-back.png";
// woman 2
import woman2Stand from "/assets/avatars/woman2/stand-v2.png";
import woman2Front from "/assets/avatars/woman2/walk-front-v2.png";
import woman2Back from "/assets/avatars/woman2/walk-back-v2.png";

import woman3Stand from "/assets/avatars/woman3/stand.png";
import woman3Front from "/assets/avatars/woman3/walk.png";
import woman3Back from "/assets/avatars/woman3/walk-back.png";

import woman4Stand from "/assets/avatars/woman4/stand.png";
import woman4Front from "/assets/avatars/woman4/walk.png";
import woman4Back from "/assets/avatars/woman4/walk-back.png";


import womanG1Stand from "/assets/avatars/g1/st.png";
import womanG1Front from "/assets/avatars/g1/frontr.png";
import womanG1Back from "/assets/avatars/g1/back.png";

import womanG2Stand from "/assets/avatars/g2/stand.png";
import womanG2Front from "/assets/avatars/g2/walk_r.png";
import womanG2Back from "/assets/avatars/g2/back.png";

import womanG3Stand from "/assets/avatars/g3/stand.png";
import womanG3Front from "/assets/avatars/g3/walk_r.png";
import womanG3Back from "/assets/avatars/g3/back_l.png";


import womanG4Stand from "/assets/avatars/g4/stand.png";
import womanG4Front from "/assets/avatars/g4/walk_r.png";
import womanG4Back from "/assets/avatars/g4/walk_back_left.png";

import womanG5Stand from "/assets/avatars/g5/stand.png";
import womanG5Front from "/assets/avatars/g5/walkr.png";
import womanG5Back from "/assets/avatars/g5/walkb.png";


import Man1Stand from "/assets/avatars/m1/stand.png";
import Man1Front from "/assets/avatars/m1/walk_r.png";
import Man1Back from "/assets/avatars/m1/walk_back_l.png";


import Man2Stand from "/assets/avatars/m2/stand.png";
import Man2Front from "/assets/avatars/m2/walk.png";
import Man2Back from "/assets/avatars/m2/back.png";

import Man3Stand from "/assets/avatars/m3/stand.png";
import Man3Front from "/assets/avatars/m3/walk.png";
import Man3Back from "/assets/avatars/m3/back.png";


import Man4Stand from "/assets/avatars/m4/stand.png";
import Man4Front from "/assets/avatars/m4/walk.png";
import Man4Back from "/assets/avatars/m4/back.png";

import NinjaStand from "/assets/avatars/ninja/stand_.png";
import NinjaFront from "/assets/avatars/ninja/walk.png";
import NinjaBack from "/assets/avatars/ninja/back.png";


import GS1Stand from "/assets/avatars/gs1/stand.png";
import GS1Front from "/assets/avatars/gs1/front.png";
import GS1Back from "/assets/avatars/gs1/back.png";

import A1Stand from "/assets/avatars/a1/stand.png";
import A1Front from "/assets/avatars/a1/walking.png";
import A1Back from "/assets/avatars/a1/walking_back.png";

import MachoStand from "/assets/avatars/macho/idleprav.png";
import MachoFront from "/assets/avatars/macho/walkprav.png";
import MachoBack from "/assets/avatars/macho/walkingbackprav.png";

import ElvisStand from "/assets/avatars/elvis/stand.png";
import ElvisFront from "/assets/avatars/elvis/walk.png";
import ElvisBack from "/assets/avatars/elvis/walk_back.png";

import SnowWhiteStand from "/assets/avatars/snowwhite/dance.png";
import SnowWhiteFront from "/assets/avatars/snowwhite/walk.png";
import SnowWhiteBack from "/assets/avatars/snowwhite/walk_back.png";


import StrannikStand from "/assets/avatars/strannik/idleprav.png";
import StrannikFront from "/assets/avatars/strannik/walkingprav.png";
import StrannikBack from "/assets/avatars/strannik/walkingbackprav.png";

import BlondeManStand from "/assets/avatars/nyash/idleprav.png";
import BlondeManFront from "/assets/avatars/nyash/walkingprav.png";
import BlondeManBack from "/assets/avatars/nyash/walkbackprav.png";

import LolitaStand from "/assets/avatars/lolita/idle.png";
import LolitaFront from "/assets/avatars/lolita/walk.png";
import LolitaBack from "/assets/avatars/lolita/walk_back.png";


import anim_kamin from "/assets/anim/kamin.png";
import anim_cloud1 from "/assets/anim/cloud_small.png";
import anim_cloud2 from "/assets/anim/cloud_2.png";


import bartable from "/assets/anim/bar-table.png";
import candleslight from "/assets/anim/candleslight.png";

import dancepoll1 from "/assets/anim/dancepoll1.png";
import dancepoll2 from "/assets/anim/dancepoll2.png";

import dancepoll_anim1 from "/assets/anim/dancepoll_anim1.png";
import dancepoll_anim2 from "/assets/anim/dancepoll_anim2.png";


import storlight from "/assets/anim/storlight.png";
import tablelight from "/assets/anim/table-light.png";

import tableAnim from "/assets/anim/table_anim.png";
import lamplight from "/assets/anim/lamplight.png";
import light_arka from "/assets/anim/light_arka.png";
import anim_portal from "/assets/anim/anim_portal.png";
import Sit from "/assets/anim/Sit.png";

import Ps2font from "/assets/font/PressStart2P-Regular.ttf";

import fxp2 from "/assets/anim/fxp2.png";
import WebFontFile from "../../plugins/WebFontFile.js";
import LocalFontFile from "../../plugins/LocalFontFile.js";


export const spriteMap = [
  {
    key: "man1",
    sprites: [
      {
        key: "stand",
        src: man1Stand,
      },
      {
        key: "front",
        src: man1Front,
      },
      {
        key: "back",
        src: man1Back,
      },
    ],
  },
  {
    key: "woman1",
    sprites: [
      {
        key: "stand",
        src: woman1Stand,
      },
      {
        key: "front",
        src: woman1Front,
      },
      {
        key: "back",
        src: woman1Back,
      },
    ],
  },
  {
    key: "woman2",
    sprites: [
      {
        key: "stand",
        src: woman2Stand,
      },
      {
        key: "front",
        src: woman2Front,
      },
      {
        key: "back",
        src: woman2Back,
      },
    ],
  },
  {
    key: "woman3",
    sprites: [
      {
        key: "stand",
        src: woman3Stand,
      },
      {
        key: "front",
        src: woman3Front,
      },
      {
        key: "back",
        src: woman3Back,
      },
    ],
  },
  {
    key: "woman4",
    sprites: [
      {
        key: "stand",
        src: woman4Stand,
      },
      {
        key: "front",
        src: woman4Front,
      },
      {
        key: "back",
        src: woman4Back,
      },
    ],
  },
  {
    key: "womang1",
    sprites: [
      {
        key: "stand",
        src: womanG1Stand,
      },
      {
        key: "front",
        src: womanG1Front,
      },
      {
        key: "back",
        src: womanG1Back,
      },
    ],
  },
  {
    key: "womang2",
    sprites: [
      {
        key: "stand",
        src: womanG2Stand,
      },
      {
        key: "front",
        src: womanG2Front,
      },
      {
        key: "back",
        src: womanG2Back,
      },
    ],
  },
  {
    key: "womang3",
    sprites: [
      {
        key: "stand",
        src: womanG3Stand,
      },
      {
        key: "front",
        src: womanG3Front,
      },
      {
        key: "back",
        src: womanG3Back,
      },
    ],
  },
  {
    key: "womang4",
    sprites: [
      {
        key: "stand",
        src: womanG4Stand,
      },
      {
        key: "front",
        src: womanG4Front,
      },
      {
        key: "back",
        src: womanG4Back,
      },
    ],
  },
  {
    key: "womang5",
    sprites: [
      {
        key: "stand",
        src: womanG5Stand,
      },
      {
        key: "front",
        src: womanG5Front,
      },
      {
        key: "back",
        src: womanG5Back,
      },
    ],
  },
  {
    key: "man_1",
    sprites: [
      {
        key: "stand",
        src: Man1Stand,
      },
      {
        key: "front",
        src: Man1Front,
      },
      {
        key: "back",
        src: Man1Back,
      },
    ],
  },
  {
    key: "man_2",
    sprites: [
      {
        key: "stand",
        src: Man2Stand,
      },
      {
        key: "front",
        src: Man2Front,
      },
      {
        key: "back",
        src: Man2Back,
      },
    ],
  },
  {
    key: "man_3",
    sprites: [
      {
        key: "stand",
        src: Man3Stand,
      },
      {
        key: "front",
        src: Man3Front,
      },
      {
        key: "back",
        src: Man3Back,
      },
    ],
  },
  {
    key: "man_4",
    sprites: [
      {
        key: "stand",
        src: Man4Stand,
      },
      {
        key: "front",
        src: Man4Front,
      },
      {
        key: "back",
        src: Man4Back,
      },
    ],
  },
  {
    key: "ninja",
    sprites: [
      {
        key: "stand",
        src: NinjaStand,
      },
      {
        key: "front",
        src: NinjaFront,
      },
      {
        key: "back",
        src: NinjaBack,
      },
    ],
  },
  {
    key: "gs1",
    sprites: [
      {
        key: "stand",
        src: GS1Stand,
      },
      {
        key: "front",
        src: GS1Front,
      },
      {
        key: "back",
        src: GS1Back,
      },

    ],
    frameWidth: 80,
    frameHeight: 140,
    frameCount: 16,
  },
  {
    key: "elvis",
    sprites: [
      {
        key: "stand",
        src: ElvisStand,
      },
      {
        key: "front",
        src: ElvisFront,
      },
      {
        key: "back",
        src: ElvisBack,
      },

    ],
    frameCount: 16,
  },
  {
    key: "a1",
    sprites: [
      {
        key: "stand",
        src: A1Stand,
      },
      {
        key: "front",
        src: A1Front,
      },
      {
        key: "back",
        src: A1Back,
      },
    ],
    frameCount: 25,
  },
  {
    key: "macho",
    sprites: [
      {
        key: "stand",
        src: MachoStand,
      },
      {
        key: "front",
        src: MachoFront,
      },
      {
        key: "back",
        src: MachoBack,
      },
    ],
    frameWidth: 140,
    frameHeight: 140,
    frameCount: 25,
  },
  {
    key: "snowwhite",
    sprites: [
      {
        key: "stand",
        src: SnowWhiteStand,
      },
      {
        key: "front",
        src: SnowWhiteFront,
      },
      {
        key: "back",
        src: SnowWhiteBack,
      },
    ],
    frameWidth: 140,
    frameHeight: 140,
    frameCount: 20,
  },
  {
    key: "strannik",
    sprites: [
      {
        key: "stand",
        src: StrannikStand,
      },
      {
        key: "front",
        src: StrannikFront,
      },
      {
        key: "back",
        src: StrannikBack,
      },
    ],
    frameWidth: 140,
    frameHeight: 140,
    frameCount: 34,
  },
  {
    key: "blondeman",
    sprites: [
      {
        key: "stand",
        src: BlondeManStand,
      },
      {
        key: "front",
        src: BlondeManFront,
      },
      {
        key: "back",
        src: BlondeManBack,
      },
    ],
    frameWidth: 140,
    frameHeight: 140,
    frameCount: 25,
  },
  {
    key: "lolita",
    sprites: [
      {
        key: "stand",
        src: LolitaStand,
      },
      {
        key: "front",
        src: LolitaFront,
      },
      {
        key: "back",
        src: LolitaBack,
      },
    ],
    frameWidth: 140,
    frameHeight: 140,
    frameCount: 25,
  },
];

export default class Bootloader extends Phaser.Scene {
  constructor() {
    super({ key: "bootloader" });
  }

  preload() {
    this.createBars();
    this.setLoadEvents();
    this.loadImages();
    this.loadMaps();
    this.loadSpritesheets();

    //this.load.addFile(new WebFontFile(this.load, 'Press Start 2P'));

    this.load.addFile(new LocalFontFile(
      this.load,
      'Press Start 2P', // ключ для доступа к шрифту
      'Press Start 2P', // название шрифта для использования в CSS
      Ps2font // путь к файлу шрифта
    ));
  }

  setLoadEvents() {
    this.load.on(
      "progress",
      function (value) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x0088aa, 1);
        this.progressBar.fillRect(
          this.cameras.main.width / 4,
          this.cameras.main.height / 2 - 16,
          (this.cameras.main.width / 2) * value,
          16
        );

        if (value > 0.1)
          emitter.emit('bootloader-loading', true, 'Loading scripts... [OK]');
        if (value > 0.2)
          emitter.emit('bootloader-loading', true, 'Loading styles... [OK]');
        if (value > 0.3)
          emitter.emit('bootloader-loading', true, 'Loading characters... [OK]');
        if (value > 0.4)
          emitter.emit('bootloader-loading', true, 'Loading map objects... [OK]');
        if (value > 0.5)
          emitter.emit('bootloader-loading', true, 'Loading chats... [OK]');
        if (value == 1)
          emitter.emit('bootloader-loading', false, 'Game loaded!');

      },
      this
    );

    this.load.on(
      "complete",
      () => {
        this.scene.start("game", { map: "mapnew" });
      },
      this
    );
  }

  loadImages() {
    this.load.image("tileset", newTileset);
    this.load.image("tileset_env", tilesetEnv);
    this.load.image("tile_m2", tile_m2);
    this.load.image("tile_v3", tile_v3);
    this.load.image("tile_wall", tile_wall);
    this.load.image("tile_furniture", tile_furniture);
    this.load.image("tile_f1", tile_f1);
    this.load.image("messageIcon", messageIcon);
    this.load.image("messageIcon2", messageIcon2);
    this.load.image("messageIcon3", messageIcon3);
    this.load.image("lightningIcon", lightningIcon);
    this.load.image("lightningGreenIcon", lightningGreenIcon);
    this.load.image("lightningRedIcon", lightningRedIcon);
    this.load.image("directionArrow", directionArrow);
    this.load.image("directionArrow", "/assets/direction-arrow.svg");
  }

  loadMaps() {
    this.load.tilemapTiledJSON(`mapnew`, mapJSON_new);
  }

  loadSpritesheets() {
    this.load.spritesheet("dummy", dummyImage, {
      frameWidth: 60,
      frameHeight: 140,
    });
    // kamin  
    this.load.spritesheet("kamin", anim_kamin, {
      frameWidth: 80,
      frameHeight: 80,
    });

    // cloud1  
    this.load.spritesheet("cloud1", anim_cloud1, {
      frameWidth: 200,
      frameHeight: 200,
    });
    // cloud2  
    this.load.spritesheet("cloud2", anim_cloud2, {
      frameWidth: 280,
      frameHeight: 280,
    });

    this.load.spritesheet("bartable", bartable, { frameWidth: 160, frameHeight: 100, });
    this.load.spritesheet("candleslight", candleslight, { frameWidth: 40, frameHeight: 20, });
    this.load.spritesheet("dancepoll1", dancepoll1, { frameWidth: 80, frameHeight: 40, });
    this.load.spritesheet("dancepoll2", dancepoll2, { frameWidth: 80, frameHeight: 40, });

    this.load.spritesheet("dancepoll_anim1", dancepoll_anim1, { frameWidth: 2000, frameHeight: 1050, });
    this.load.spritesheet("dancepoll_anim2", dancepoll_anim2, { frameWidth: 2000, frameHeight: 1050, });

    this.load.spritesheet("storlight", storlight, { frameWidth: 80, frameHeight: 180, });
    this.load.spritesheet("tablelight", tablelight, { frameWidth: 64, frameHeight: 42, });
    this.load.spritesheet("tableAnim", tableAnim, { frameWidth: 254, frameHeight: 215, });
    this.load.spritesheet("lamplight", lamplight, { frameWidth: 64, frameHeight: 42, });

    this.load.spritesheet("light_arka", light_arka, { frameWidth: 56, frameHeight: 78, });
    this.load.spritesheet("anim_portal", anim_portal, { frameWidth: 500, frameHeight: 500, });
    this.load.spritesheet("Sit", Sit, { frameWidth: 65, frameHeight: 140, });

    this.load.spritesheet("fxp2", fxp2, { frameWidth: 480, frameHeight: 480, });

    // == avatars ==
    const spriteData = {
      frameWidth: 60,
      frameHeight: 140,
    };

    const spriteDataSuper = {
      frameWidth: 80,
      frameHeight: 140,
    };


    spriteMap.forEach((item) => {
      item.sprites.forEach((sprite) => {
        this.load.spritesheet(
          `${item.key}-${sprite.key}`,
          sprite.src,
          //item.key==="GS1" ? spriteDataSuper : spriteData
          (item?.frameWidth && item?.frameHeight) ?
            {
              frameWidth: item.frameWidth,
              frameHeight: item.frameHeight,
            } : spriteData
        );
      });
    });
  }

  createBars() {
    this.loadBar = this.add.graphics();
    this.loadBar.fillStyle(0x00aafb, 1);
    this.loadBar.fillRect(
      this.cameras.main.width / 4 - 2,
      this.cameras.main.height / 2 - 18,
      this.cameras.main.width / 2 + 4,
      20
    );
    this.progressBar = this.add.graphics();
  }
}
