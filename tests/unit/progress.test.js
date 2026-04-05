import { describe, expect, it } from 'vitest'
import { getReadingProgress } from '../../assets/js/lib/progress.js'

describe('getReadingProgress', () => {
  it('returns progress across the article scroll range', () => {
    expect(getReadingProgress({ scrollTop: 100, contentTop: 100, contentHeight: 800, viewportHeight: 400 })).toBe(0)
    expect(getReadingProgress({ scrollTop: 250, contentTop: 100, contentHeight: 800, viewportHeight: 400 })).toBe(38)
    expect(getReadingProgress({ scrollTop: 500, contentTop: 100, contentHeight: 800, viewportHeight: 400 })).toBe(100)
  })

  it('clamps the returned percentage to bounds', () => {
    expect(getReadingProgress({ scrollTop: 0, contentTop: 100, contentHeight: 800, viewportHeight: 400 })).toBe(0)
    expect(getReadingProgress({ scrollTop: 800, contentTop: 100, contentHeight: 800, viewportHeight: 400 })).toBe(100)
  })
})
