<script setup>
</script>

<template>
  <div class="typing-indicator">
    <span /><span /><span />
  </div>
</template>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: var(--bubble-ai);
  border-radius: var(--radius-md);
  max-width: 70px;
  align-self: flex-start;
  margin-bottom: 4px;
}
.typing-indicator span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: pulse 1.2s infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
</style>
