import { describe, expect, it } from 'vitest'
import { resolveTheme } from '../../assets/js/lib/theme.js'

describe('resolveTheme', () => {
  it('falls back to the browser preference', () => {
    expect(resolveTheme({ storedTheme: null, systemPrefersDark: true })).toBe('dark')
  })
})
