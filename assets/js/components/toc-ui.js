import { pickActiveHeading } from '../lib/toc.js'

export function tocUi() {
  return {
    tocOpen: false,
    toolbarVisible: true,
    init() {
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

      updateActiveTocEntry()
      window.addEventListener('scroll', updateActiveTocEntry, { passive: true })
      window.addEventListener('resize', updateActiveTocEntry)
      window.addEventListener('toolbar:visibility', (event) => {
        this.toolbarVisible = event.detail?.visible ?? true
      })
    },
    toggleToc() {
      this.tocOpen = !this.tocOpen
    },
    closeToc() {
      this.tocOpen = false
    }
  }
}
