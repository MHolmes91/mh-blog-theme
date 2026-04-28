export function backToTopDock() {
  return {
    showBackToTop: false,
    dockStyle: '',
    init() {
      const isPostPage = Boolean(document.getElementById('post-content'))
      const updateBackToTopVisibility = () => {
        this.showBackToTop = isPostPage && window.scrollY > 320
      }
      const updateDockOffset = () => {
        const footer = document.querySelector('footer[role="contentinfo"]')
        const baseOffset = 24
        const rightInset = 'max(1.5rem,calc((100vw - 72rem) / 2 + 1.5rem))'

        if (!footer) {
          this.dockStyle = `right:${rightInset};bottom:${baseOffset}px;`
          return
        }

        const footerRect = footer.getBoundingClientRect()
        const overlap = Math.max(0, window.innerHeight - footerRect.top)
        const bottomOffset = baseOffset + overlap

        this.dockStyle = `right:${rightInset};bottom:${bottomOffset}px;`
      }

      updateBackToTopVisibility()
      updateDockOffset()
      window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
      window.addEventListener('resize', updateBackToTopVisibility)
      window.addEventListener('scroll', updateDockOffset, { passive: true })
      window.addEventListener('resize', updateDockOffset)
    },
    backToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
