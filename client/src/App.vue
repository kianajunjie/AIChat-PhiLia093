<script setup>
import Sidebar from './components/Sidebar.vue'
import ChatWindow from './components/ChatWindow.vue'
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <ChatWindow />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
