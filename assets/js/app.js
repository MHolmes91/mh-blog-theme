import Alpine from 'alpinejs'
import { filterSearchRecords } from './lib/search.js'
import { resolveTheme } from './lib/theme.js'

window.Alpine = Alpine

Alpine.data('siteUi', () => ({
  query: '',
  records: [],
  searchOpen: false,
  async openSearch() {
    this.searchOpen = true
    if (!this.records.length) {
      this.records = await fetch('/index.json').then((response) => response.json())
    }
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
