// Методы для управления стрелками-указателями
// Этот файл содержит методы, которые нужно добавить в класс Game в game.js

// Метод для создания и отображения стрелки-указателя
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
      this.removeDirectionArrow(`path_${index-1}_${index}`);
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
      `path_${i}_${i+1}`, // уникальный ID для стрелки
      arrowX,
      arrowY,
      endPoint.x,
      endPoint.y,
      options
    );
  }
}
