<script setup>
import { ref, computed } from 'vue'
import { useAudioPlayback } from '../composables/useAudioPlayback.js'

const props = defineProps({
  audioUrl: { type: String, required: true },
  messageId: { type: String, default: '' },
})

const { isPlaying, volume, currentTime, duration, currentUrl, togglePlay, setVolume, seek } =
  useAudioPlayback()

const isThisTrack = computed(() => currentUrl.value === props.audioUrl)
const isThisPlaying = computed(() => isThisTrack.value && isPlaying.value)

const progress = computed(() =>
  duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
)

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function handleVolumeChange(e) {
  setVolume(parseFloat(e.target.value))
}

function handleSeek(e) {
  const rect = e.target.getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  seek(pct * duration.value)
}
</script>

<template>
  <div class="audio-player">
    <button class="play-btn" @click="togglePlay(audioUrl)">
      <svg v-if="isThisPlaying" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>

    <div class="progress-bar" @click="handleSeek">
      <div class="progress-fill" :style="{ width: progress + '%' }" />
    </div>

    <span class="time">{{ formatTime(isThisTrack ? currentTime : 0) }}</span>

    <div class="volume-control">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="volume-icon">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
      </svg>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="volume"
        class="volume-slider"
        @input="handleVolumeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.audio-player {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);
}

.play-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}
.play-btn:hover {
  background: rgba(255, 255, 255, 0.8);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}
.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
  min-width: 32px;
  text-align: center;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
}
.volume-icon {
  color: rgba(255, 255, 255, 0.6);
}
.volume-slider {
  width: 60px;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
}
</style>
