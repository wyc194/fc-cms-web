import { ref, onMounted, onUnmounted } from 'vue'

export function useResponsive() {
  const isMobile = ref(false)
  const isTablet = ref(false)

  const checkResponsive = () => {
    isMobile.value = window.innerWidth <= 768
    isTablet.value = window.innerWidth > 768 && window.innerWidth <= 1024
  }

  onMounted(() => {
    checkResponsive()
    window.addEventListener('resize', checkResponsive)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkResponsive)
  })

  return {
    isMobile,
    isTablet
  }
}
