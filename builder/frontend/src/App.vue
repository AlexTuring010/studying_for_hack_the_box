<script setup>
import { ref } from 'vue';
import { onMounted } from 'vue';

const data = ref(null);

async function getData() {
  const response = await fetch('http://localhost:8000/api/test-php-array');
  const jsonData = await response.json();
  return jsonData;
}

onMounted(async () => {
  data.value = await getData();
})

</script>

<template>
  <p v-if="data">{{ data.name }}, {{ data.age }}, {{ data.email }}</p>
  <p v-else>Loading...</p>
</template>

<style scoped>
</style>
