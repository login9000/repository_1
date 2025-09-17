// src/game/gameobjects/direction-arrow.js
export default class DirectionArrow {
  constructor(scene, x, y, options = {}) {
    this.scene = scene;
    
    // Опции со значениями по умолчанию
    this.options = {
      scale: options.scale || 0.5,
      alpha: options.alpha || 0.8,
      rotation: options.rotation || 0, // в радианах
      tint: options.tint || 0xFFFFFF, // белый цвет по умолчанию
      pulseMinScale: options.pulseMinScale || 0.8,
      pulseMaxScale: options.pulseMaxScale || 1.2,
      pulseDuration: options.pulseDuration || 1000, // 1 секунда на полный цикл пульсации
      depth: options.depth || 1000 // высокое значение для отображения над другими объектами
    };
    
    // Создаем спрайт стрелки
    this.sprite = this.scene.add.image(x, y, 'directionArrow');
    this.sprite.setScale(this.options.scale);
    this.sprite.setAlpha(this.options.alpha);
    this.sprite.setRotation(this.options.rotation);
    this.sprite.setTint(this.options.tint);
    this.sprite.setDepth(this.options.depth);
    
    // Запускаем анимацию пульсации
    this.startPulseAnimation();
  }
  
  // Метод для запуска анимации пульсации
  startPulseAnimation() {
    // Останавливаем предыдущую анимацию, если она существует
    if (this.pulseTween) {
      this.pulseTween.stop();
    }
    
    // Создаем новую анимацию пульсации
    this.pulseTween = this.scene.tweens.add({
      targets: this.sprite,
      scale: this.options.pulseMaxScale * this.options.scale,
      duration: this.options.pulseDuration / 2,
      ease: 'Sine.easeInOut',
      yoyo: true, // анимация будет идти в обратную сторону после завершения
      repeat: -1, // бесконечное повторение
      onUpdate: () => {
        // Если нужна дополнительная логика во время обновления анимации
      }
    });
  }
  
  // Метод для остановки анимации
  stopPulseAnimation() {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.sprite.setScale(this.options.scale);
    }
  }
  
  // Метод для изменения позиции стрелки
  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }
  
  // Метод для изменения угла поворота стрелки (в радианах)
  setRotation(rotation) {
    this.sprite.setRotation(rotation);
  }
  
  // Метод для изменения угла поворота стрелки (в градусах)
  setAngle(angle) {
    this.sprite.setAngle(angle);
  }
  
  // Метод для изменения цвета стрелки
  setTint(color) {
    this.sprite.setTint(color);
  }
  
  // Метод для изменения прозрачности
  setAlpha(alpha) {
    this.sprite.setAlpha(alpha);
  }
  
  // Метод для уничтожения стрелки
  destroy() {
    this.stopPulseAnimation();
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
