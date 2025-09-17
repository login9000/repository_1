//import anim_kamin from "/assets/anim/kamin.png";

export default class AnimObject {
    constructor(scene, x, y, spriteKey, animationKey) {
      this.scene = scene;
      this.x = x;
      this.y = y;
      this.spriteKey = spriteKey;
      this.animationKey = animationKey;
      this.init();
    }
  
    init() {
      this.sprite = this.scene.add.sprite(this.x, this.y, this.spriteKey);
      this.addAnimation();
      this.sprite.play(this.animationKey);
    }
  
    addAnimation() {
      this.sprite.anims.create({
        key: this.animationKey,
        frames: this.sprite.anims.generateFrameNames(this.spriteKey, {
          start: 0,
          end: 3,
        }),
        frameRate: 5,
        repeat: -1,
      });
    }
  
    update() {
      this.sprite.setDepth(this.sprite.y);
    }
  }