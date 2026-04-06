import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('Mermaid feature partial', () => {
  it('loads Mermaid from a pinned local asset instead of a floating CDN import', () => {
    const partial = fs.readFileSync(new URL('../../layouts/_partials/features/mermaid.html', import.meta.url), 'utf8')
    const packageJson = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')

    expect(partial).toContain('resources.Get "js/lib/mermaid.js"')
    expect(partial).not.toContain('cdn.jsdelivr.net/npm/mermaid')
    expect(packageJson).toContain('"mermaid": "11.14.0"')
  })
})
