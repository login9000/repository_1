<script setup>
import { ref } from "vue";

const isModal = ref(false);

function toggleModal() {
    isModal.value = !isModal.value
}

defineExpose({toggleModal})
</script>
<template>
<v-dialog v-model="isModal" width="500">
      <v-card
        title="Профиль пользователя"
      >
        <v-card-text>
          <v-row>
            <v-col cols="12" class="message-box">
                профиль
                профиль
                профиль
                профиль
                профиль
                профиль
                профиль
                профиль
                профиль
                профиль
                профиль
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="9">
            </v-col>
            <v-col cols="3">
              <v-btn color="red" @click="toggleModal">Закрыть</v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
</template>
<style scoped>
.message {
  margin: 0.5rem;
  padding: 0.5rem;
  background-color: blue;
  border-radius: 0.5rem;
  color: white;
  width: 80%;
  height: fit-content;
}

.message-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  height: 500px;
  overflow-y: scroll;
}
</style>