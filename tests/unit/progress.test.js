import { describe, expect, it } from 'vitest'
import { getReadingProgress } from '../../assets/js/lib/progress.js'

describe('getReadingProgress', () => {
  it('returns a bounded percentage', () => {
    expect(getReadingProgress({ scrollTop: 250, contentTop: 100, contentHeight: 800, viewportHeight: 400 })).toBe(30)
  })
})
