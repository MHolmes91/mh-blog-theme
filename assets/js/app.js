import Alpine from 'alpinejs'
import { getReadingProgress } from './lib/progress.js'
import { filterSearchRecords, loadSearchRecords } from './lib/search.js'
import { resolveTheme } from './lib/theme.js'

window.Alpine = Alpine

Alpine.data('siteUi', (searchUrl) => ({
  query: '',
  records: [],
  searchOpen: false,
  init() {
    const updateReadingProgress = () => {
      const progressBar = document.getElementById('reading-progress')
      if (!progressBar) return

      const scrollTop = window.scrollY
      const progress = getReadingProgress({
        scrollTop,
        contentTop: 0,
        contentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight
      })

      progressBar.style.width = `${progress}%`
    }

    updateReadingProgress()
    window.addEventListener('scroll', updateReadingProgress, { passive: true })
    window.addEventListener('resize', updateReadingProgress)
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
  },
  get results() {
    return filterSearchRecords(this.records, this.query)
  },
  backToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
  theme: resolveTheme({
    storedTheme: null,
    systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
  })
}))

Alpine.start()
