export function headerChrome() {
  return {
    toolbarVisible: true,
    searchOpen: false,
    clearToolbarHideTimer() {
      clearTimeout(this._toolbarTimer)
      this._toolbarTimer = null
    },
    scheduleToolbarHide() {
      this.clearToolbarHideTimer()
      this._toolbarTimer = setTimeout(() => {
        if (!this.searchOpen) {
          this.toolbarVisible = false
          this.dispatchToolbarVisibility()
        }
      }, 3000)
    },
    dispatchToolbarVisibility() {
      window.dispatchEvent(new CustomEvent('toolbar:visibility', {
        detail: { visible: this.toolbarVisible }
      }))
    },
    init() {
      const isPostPage = Boolean(document.getElementById('post-content'))
      const updateToolbarVisibility = () => {
        if (!isPostPage) {
          this.clearToolbarHideTimer()
          this.toolbarVisible = true
          this.dispatchToolbarVisibility()
          return
        }

        const main = document.querySelector('main')
        const isAboveThreshold = !main || main.getBoundingClientRect().top > 0
        const scrollY = window.scrollY
        const isScrollingUp = scrollY < (this._lastScrollY ?? scrollY)
        this._lastScrollY = scrollY

        this.clearToolbarHideTimer()

        if (this.searchOpen) {
          this.toolbarVisible = true
          this.dispatchToolbarVisibility()
          return
        }

        if (isAboveThreshold || isScrollingUp || this.toolbarVisible) {
          this.toolbarVisible = true
          this.dispatchToolbarVisibility()
          this.scheduleToolbarHide()
        }
      }

      updateToolbarVisibility()
      window.addEventListener('scroll', updateToolbarVisibility, { passive: true })
      window.addEventListener('resize', updateToolbarVisibility)
      window.addEventListener('search:open', (event) => {
        this._scrollYBeforeSearch = event.detail?.scrollY ?? window.scrollY
        this._toolbarVisibleBeforeSearch = this.toolbarVisible
        this._toolbarTimerWasActiveBeforeSearch = Boolean(this._toolbarTimer)
        this.clearToolbarHideTimer()
        this.searchOpen = true
        this.toolbarVisible = true
        this.dispatchToolbarVisibility()
      })
      window.addEventListener('search:close', (event) => {
        this.clearToolbarHideTimer()
        this.searchOpen = false

        const scrollYBeforeSearch = this._scrollYBeforeSearch ?? window.scrollY
        const currentScrollY = event.detail?.scrollY ?? window.scrollY

        if (currentScrollY < scrollYBeforeSearch) {
          this.toolbarVisible = true
          if (currentScrollY > 0) this.scheduleToolbarHide()
        } else if (currentScrollY > scrollYBeforeSearch) {
          this.toolbarVisible = false
        } else {
          this.toolbarVisible = this._toolbarVisibleBeforeSearch ?? true
          if (this.toolbarVisible && this._toolbarTimerWasActiveBeforeSearch) {
            this.scheduleToolbarHide()
          }
        }

        this._scrollYBeforeSearch = undefined
        this._toolbarVisibleBeforeSearch = undefined
        this._toolbarTimerWasActiveBeforeSearch = false
        this._lastScrollY = currentScrollY
        this.dispatchToolbarVisibility()
      })
      document.addEventListener('focusin', () => {
        this.clearToolbarHideTimer()
        this.toolbarVisible = true
        this.dispatchToolbarVisibility()
      })
    }
  }
}
