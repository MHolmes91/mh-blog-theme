import Alpine from 'alpinejs'
import { getReadingProgress } from './lib/progress.js'
import { filterSearchRecords, loadSearchRecords } from './lib/search.js'
import { pickActiveHeading } from './lib/toc.js'
import { resolveTheme } from './lib/theme.js'

window.Alpine = Alpine

Alpine.data('siteUi', (searchUrl) => ({
  query: '',
  records: [],
  searchOpen: false,
  init() {
    const updateActiveTocEntry = () => {
      const toc = document.getElementById('TableOfContents')
      if (!toc) return

      const tocEntries = [...toc.querySelectorAll('a[href^="#"]')]
        .map((link) => {
          const id = decodeURIComponent(link.getAttribute('href')?.slice(1) ?? '')
          const heading = id ? document.getElementById(id) : null
          if (!heading) return null

          return { id, link, heading }
        })
        .filter(Boolean)

      if (!tocEntries.length) return

      const activeId = pickActiveHeading(
        tocEntries.map(({ id, heading }) => ({ id, top: heading.getBoundingClientRect().top }))
      )

      for (const { id, link } of tocEntries) {
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

    updateReadingProgress()
    updateActiveTocEntry()
    window.addEventListener('scroll', updateReadingProgress, { passive: true })
    window.addEventListener('resize', updateReadingProgress)
    window.addEventListener('scroll', updateActiveTocEntry, { passive: true })
    window.addEventListener('resize', updateActiveTocEntry)
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
