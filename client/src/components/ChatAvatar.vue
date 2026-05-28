<script setup>
defineProps({
  src: { type: String, required: true },
  size: { type: Number, default: 32 },
})

const defaultAvatar =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#cbd5e1"/><text x="50" y="62" text-anchor="middle" font-size="40" fill="#64748b">?</text></svg>'
  )
</script>

<template>
  <div class="avatar" :style="{ width: size + 'px', height: size + 'px' }">
    <img :src="src || defaultAvatar" :alt="'头像'" />
  </div>
</template>

<style scoped>
.avatar {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
