export function getDockBottomOffset({ footerTop, viewportHeight, baseOffset = 24 }) {
  return baseOffset + Math.max(0, viewportHeight - footerTop)
}

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
        const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight

        this.dockStyle = `bottom:${getDockBottomOffset({ footerTop, viewportHeight: window.innerHeight })}px;`
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
