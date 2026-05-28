import { ref } from 'vue'

// Singleton audio element shared across components
const audioElement = ref(null)
const currentUrl = ref(null)
const isPlaying = ref(false)
const volume = ref(1)
const currentTime = ref(0)
const duration = ref(0)

export function useAudioPlayback() {
  function ensureAudio() {
    if (!audioElement.value) {
      audioElement.value = new Audio()
      audioElement.value.addEventListener('timeupdate', () => {
        currentTime.value = audioElement.value.currentTime
      })
      audioElement.value.addEventListener('loadedmetadata', () => {
        duration.value = audioElement.value.duration
      })
      audioElement.value.addEventListener('play', () => {
        isPlaying.value = true
      })
      audioElement.value.addEventListener('pause', () => {
        isPlaying.value = false
      })
      audioElement.value.addEventListener('ended', () => {
        isPlaying.value = false
      })
    }
    return audioElement.value
  }

  function play(url) {
    const audio = ensureAudio()
    // If same audio, toggle play/pause
    if (currentUrl.value === url) {
      if (audio.paused) {
        audio.play().catch(() => {})
      } else {
        audio.pause()
      }
      return
    }

    // New audio source
    audio.pause()
    currentUrl.value = url
    audio.src = url
    audio.volume = volume.value
    audio.play().catch(() => {})
  }

  function pause() {
    const audio = audioElement.value
    if (audio) audio.pause()
  }

  function togglePlay(url) {
    if (currentUrl.value === url && isPlaying.value) {
      pause()
    } else {
      play(url)
    }
  }

  function setVolume(val) {
    volume.value = Math.max(0, Math.min(1, val))
    if (audioElement.value) {
      audioElement.value.volume = volume.value
    }
  }

  function seek(time) {
    if (audioElement.value && currentUrl.value) {
      audioElement.value.currentTime = time
    }
  }

  return {
    isPlaying,
    volume,
    currentTime,
    duration,
    currentUrl,
    play,
    pause,
    togglePlay,
    setVolume,
    seek,
  }
}
