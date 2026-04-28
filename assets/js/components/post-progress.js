import { getReadingProgress } from '../lib/progress.js'

export function postProgress() {
  return {
    init() {
      const progressBar = document.getElementById('reading-progress')
      const postContent = document.getElementById('post-content')
      const updateReadingProgress = () => {
        if (!progressBar || !postContent) return

        const { top } = postContent.getBoundingClientRect()
        const scrollTop = window.scrollY
        const contentTop = scrollTop + top
        const progress = getReadingProgress({
          scrollTop,
          contentTop,
          contentHeight: postContent.offsetHeight,
          viewportHeight: window.innerHeight
        })

        progressBar.style.width = `${progress}%`
      }

      updateReadingProgress()
      window.addEventListener('scroll', updateReadingProgress, { passive: true })
      window.addEventListener('resize', updateReadingProgress)
    }
  }
}
