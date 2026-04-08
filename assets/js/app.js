import Alpine from 'alpinejs'
import { getReadingProgress } from './lib/progress.js'
import { filterSearchRecords, loadSearchRecords, highlightText } from './lib/search.js'
import { pickActiveHeading } from './lib/toc.js'
import { resolveTheme } from './lib/theme.js'

window.Alpine = Alpine

Alpine.data('siteUi', (searchUrl) => ({
  query: '',
  records: [],
  searchOpen: false,
  showBackToTop: false,
  dockStyle: '',
  toolbarVisible: true,
  tocOpen: false,
  activeResultIndex: -1,
  highlightText,
  theme: resolveTheme({
    systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
  }),
  init() {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const syncTheme = ({ matches }) => {
      this.theme = resolveTheme({ systemPrefersDark: matches })
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: this.theme }
      }))
    }

    const updateActiveTocEntry = () => {
      const navIds = ['TableOfContents', 'TableOfContentsMobile']
      const allEntries = []

      for (const navId of navIds) {
        const toc = document.getElementById(navId)
        if (!toc) continue

        const entries = [...toc.querySelectorAll('a[href^="#"]')]
          .map((link) => {
            const id = decodeURIComponent(link.getAttribute('href')?.slice(1) ?? '')
            const heading = id ? document.getElementById(id) : null
            if (!heading) return null

            return { id, link, heading }
          })
          .filter(Boolean)

        allEntries.push(...entries)
      }

      if (!allEntries.length) return

      const activeId = pickActiveHeading(
        allEntries.map(({ id, heading }) => ({ id, top: heading.getBoundingClientRect().top }))
      )

      for (const { id, link } of allEntries) {
        if (id === activeId) {
          link.setAttribute('aria-current', 'location')
        } else {
          link.removeAttribute('aria-current')
        }
      }
    }

    const updateReadingProgress = () => {
      const progressBar = document.getElementById('reading-progress')
      const postContent = document.getElementById('post-content')
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

    const updateBackToTopVisibility = () => {
      const isSinglePost = Boolean(document.getElementById('post-content'))
      this.showBackToTop = isSinglePost && window.scrollY > 320
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

    const updateToolbarVisibility = () => {
      const main = document.querySelector('main')
      const isAboveThreshold = !main || main.getBoundingClientRect().top > 0
      const scrollY = window.scrollY
      const isScrollingUp = scrollY < (this._lastScrollY ?? scrollY)
      this._lastScrollY = scrollY

      clearTimeout(this._toolbarTimer)

      if (isAboveThreshold || isScrollingUp || this.toolbarVisible) {
        this.toolbarVisible = true
        this._toolbarTimer = setTimeout(() => {
          this.toolbarVisible = false
        }, 3000)
      }
    }

    syncTheme(colorSchemeQuery)
    colorSchemeQuery.addEventListener('change', syncTheme)
    updateReadingProgress()
    updateActiveTocEntry()
    updateBackToTopVisibility()
    updateDockOffset()
    window.addEventListener('scroll', updateReadingProgress, { passive: true })
    window.addEventListener('resize', updateReadingProgress)
    window.addEventListener('scroll', updateActiveTocEntry, { passive: true })
    window.addEventListener('resize', updateActiveTocEntry)
    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
    window.addEventListener('resize', updateBackToTopVisibility)
    window.addEventListener('scroll', updateDockOffset, { passive: true })
    window.addEventListener('resize', updateDockOffset)
    window.addEventListener('scroll', updateToolbarVisibility, { passive: true })
    window.addEventListener('resize', updateToolbarVisibility)
    document.addEventListener('focusin', () => {
      clearTimeout(this._toolbarTimer)
      this.toolbarVisible = true
    })
    this.$watch('query', () => { this.activeResultIndex = -1 })
  },
  async openSearch() {
    this.searchOpen = true
    if (!this.records.length) {
      this.records = await loadSearchRecords(fetch, searchUrl)
    }
  },
  closeSearch() {
    this.searchOpen = false
    this.query = ''
    this.activeResultIndex = -1
  },
  toggleToc() {
    this.tocOpen = !this.tocOpen
  },
  closeToc() {
    this.tocOpen = false
  },
  selectNextResult() {
    if (!this.results.length) return
    this.activeResultIndex = this.activeResultIndex < this.results.length - 1
      ? this.activeResultIndex + 1
      : 0
    this.scrollActiveResultIntoView()
  },
  selectPrevResult() {
    if (!this.results.length) return
    this.activeResultIndex = this.activeResultIndex > 0
      ? this.activeResultIndex - 1
      : this.results.length - 1
    this.scrollActiveResultIntoView()
  },
  navigateToActiveResult() {
    const target = this.results[this.activeResultIndex] || this.results[0]
    if (target) window.location.href = target.permalink
  },
  scrollActiveResultIntoView() {
    this.$nextTick(() => {
      const active = document.querySelector(`[data-result-index="${this.activeResultIndex}"]`)
      active?.scrollIntoView({ block: 'nearest' })
    })
  },
  get results() {
    return filterSearchRecords(this.records, this.query)
  },
  backToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}))

Alpine.start()
