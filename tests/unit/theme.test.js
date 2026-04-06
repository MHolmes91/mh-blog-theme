import { describe, expect, it } from 'vitest'
import { resolveTheme } from '../../assets/js/lib/theme.js'

describe('resolveTheme', () => {
  it('returns dark when the browser prefers dark mode', () => {
    expect(resolveTheme({ systemPrefersDark: true })).toBe('dark')
  })

  it('returns light when the browser does not prefer dark mode', () => {
    expect(resolveTheme({ systemPrefersDark: false })).toBe('light')
  })
})
