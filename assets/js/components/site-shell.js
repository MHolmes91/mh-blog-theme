import { resolveTheme } from '../lib/theme.js'

export function siteShell() {
  return {
    searchOpen: false,
    theme: resolveTheme({
      systemPrefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
    }),
    init() {
      window.addEventListener('search:open', () => { this.searchOpen = true })
      window.addEventListener('search:close', () => { this.searchOpen = false })
    }
  }
}
