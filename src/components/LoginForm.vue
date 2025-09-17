<script setup>
import { ref } from 'vue';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
const username = ref('');
const password = ref('');
const error = ref('');

await userStore.login();

</script>
