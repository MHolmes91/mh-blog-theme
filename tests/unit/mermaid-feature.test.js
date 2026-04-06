import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('Mermaid feature partial', () => {
  it('follows the hugo-narrow loading pattern with body theme detection', () => {
    const partial = fs.readFileSync(new URL('../../layouts/_partials/features/mermaid.html', import.meta.url), 'utf8')
    const packageJson = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')

    expect(partial).toContain('import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"')
    expect(partial).toContain('document.body.getAttribute("data-theme")')
    expect(partial).toContain('window.addEventListener("themeChanged"')
    expect(partial).not.toContain('resources.Get "js/lib/mermaid.js"')
    expect(packageJson).not.toContain('"mermaid": "11.14.0"')
  })
})
