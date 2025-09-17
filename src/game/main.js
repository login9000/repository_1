// game/main.js
import Bootloader from "./scenes/bootloader";
import Game from "./scenes/game";
import Transition from "./scenes/transition";
import Phaser from "phaser";

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  scale: {
    parent: "game-container",
    autoCenter: Phaser.Scale.CENTER_BOTH,
    mode: Phaser.Scale.RESIZE,
    width: 1280,
    height: 800,
  },
  physics: {
    default: "matter",
    matter: {
      gravity: {
        y: 0,
      },
      debug: false,
    },
  },
  scene: [Bootloader, Game, Transition],
};


const StartGame = (parent, userData) => {
  return new Phaser.Game({
    ...config,
    parent,
    callbacks: {
      preBoot: (game) => {
        //game.userData = userData; // Передаем данные пользователя в экземпляр игры
        game.registry.set('userData', userData);
        
      }
    }
  });
};

export default StartGame;
