import { defineStore } from "pinia";
import { ref } from "vue";

const menuStates = ["personal", "user", "external"];

export const useMenuStore = defineStore("menu", () => {
  const menuState = ref("");
  const currentUserId = ref(null);
  const isMenuOpen = ref(false);

  function setMenuState(value) {
    menuState.value = value;
  }
  
  // Установка текущего ID пользователя для просмотра внешнего профиля
  function setCurrentUser(userId) {
    currentUserId.value = userId;
  }

  return { menuState, currentUserId, setMenuState, setCurrentUser };
});
