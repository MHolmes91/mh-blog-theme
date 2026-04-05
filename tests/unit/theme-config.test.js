import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('theme bootstrap files', () => {
  it('declares the theme metadata and test scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url)))
    const themeToml = fs.readFileSync(new URL('../../theme.toml', import.meta.url), 'utf8')

    expect(pkg.scripts.test).toBe('vitest run')
    expect(pkg.scripts['test:e2e']).toBe('playwright test')
    expect(themeToml).toContain('name = "MH Blog Theme"')
    expect(themeToml).toContain('min_version = "0.146.0"')
  })
})
