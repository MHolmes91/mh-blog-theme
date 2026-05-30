import { describe, expect, it } from 'vitest'
import { getDockBottomOffset } from '../../assets/js/components/back-to-top-dock.js'

describe('getDockBottomOffset', () => {
  it('returns the base offset when the footer is below the viewport', () => {
    expect(getDockBottomOffset({ footerTop: 900, viewportHeight: 800 })).toBe(24)
  })

  it('adds footer overlap to keep the dock above the footer', () => {
    expect(getDockBottomOffset({ footerTop: 700, viewportHeight: 800 })).toBe(124)
  })
})
