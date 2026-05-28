import { ref, watch, onUnmounted } from 'vue'

export function useTypewriter(speed = 35) {
  const displayedText = ref('')
  const isTyping = ref(false)
  let timer = null
  let index = 0
  let targetText = ''

  function start(text) {
    stop()
    if (!text) {
      displayedText.value = ''
      return
    }
    targetText = text
    index = 0
    displayedText.value = ''
    isTyping.value = true

    const type = () => {
      if (index < targetText.length) {
        displayedText.value += targetText.charAt(index)
        index++
        timer = setTimeout(type, speed)
      } else {
        isTyping.value = false
      }
    }
    type()
  }

  function stop() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    isTyping.value = false
  }

  function complete() {
    stop()
    displayedText.value = targetText
    isTyping.value = false
  }

  onUnmounted(stop)

  return { displayedText, isTyping, start, stop, complete }
}
