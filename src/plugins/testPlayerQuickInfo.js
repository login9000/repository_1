// Этот файл используется для тестирования функциональности PlayerQuickInfo
import emitter from "./emitter";

// Функция для симуляции клика на молнию
export function simulatePlayerQuickInfo(playerId = 123) {
  // console.log("Simulating player-quick-info event with playerId:", playerId);
  
  // Эмитим событие с тестовыми данными
  emitter.emit("player-quick-info", { 
    x: 100, 
    y: 100, 
    playerID: playerId 
  });
  
  return "Событие player-quick-info отправлено с ID: " + playerId;
}

// Экспортируем для использования в консоли браузера
window.testPlayerQuickInfo = simulatePlayerQuickInfo;
