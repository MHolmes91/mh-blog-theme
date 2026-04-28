import {
  buildHighlightedPostUrl,
  filterSearchRecords,
  highlightFirstTextMatch,
  highlightText,
  loadSearchRecords
} from '../lib/search.js'

export function searchUi(searchUrl) {
  return {
    query: '',
    records: [],
    searchOpen: false,
    activeResultIndex: -1,
    highlightText,
    buildHighlightedPostUrl,
    init() {
      this.highlightPostBodyMatch()
      this.$watch('query', () => { this.activeResultIndex = -1 })
    },
    async openSearch() {
      window.dispatchEvent(new CustomEvent('search:open', {
        detail: { scrollY: window.scrollY }
      }))
      this.searchOpen = true

      this.$nextTick(() => {
        this.$refs.searchInput?.focus()
      })

      if (!this.records.length) {
        this.records = await loadSearchRecords(fetch, searchUrl)
      }
    },
    closeSearch() {
      if (!this.searchOpen) return
      this.searchOpen = false
      window.dispatchEvent(new CustomEvent('search:close', {
        detail: { scrollY: window.scrollY }
      }))
      this.query = ''
      this.activeResultIndex = -1
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
      if (target) window.location.href = this.buildHighlightedPostUrl(target.permalink, this.query)
    },
    scrollActiveResultIntoView() {
      this.$nextTick(() => {
        const active = document.querySelector(`[data-result-index="${this.activeResultIndex}"]`)
        active?.scrollIntoView({ block: 'nearest' })
      })
    },
    highlightPostBodyMatch() {
      const query = new URLSearchParams(window.location.search).get('highlight') || ''
      const body = document.querySelector('[data-content-body]')
      const mark = highlightFirstTextMatch(body, query)
      mark?.scrollIntoView({ block: 'center' })
    },
    get results() {
      return filterSearchRecords(this.records, this.query)
    }
  }
}
