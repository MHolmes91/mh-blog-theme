import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const partial = readFileSync(new URL('../../layouts/_partials/features/mermaid.html', import.meta.url), 'utf8')

describe('mermaid feature partial', () => {
  it('renders mermaid diagrams after the initial body theme is available', () => {
    expect(partial).toContain('document.body.getAttribute("data-theme")')
    expect(partial).toContain('await waitForTheme();')
    expect(partial).toContain('await renderMermaid(".mermaid");')
    expect(partial).not.toContain('window.addEventListener("themeChanged"')
    expect(partial).not.toContain('storeOriginalCode')
    expect(partial).not.toContain('data-original-code')
    expect(partial).not.toContain('data-mermaid-diagram')
  })
})
