import { describe, expect, it } from 'vitest'
import { pickActiveHeading } from '../../assets/js/lib/toc.js'

describe('pickActiveHeading', () => {
  it('returns the last heading above the viewport threshold', () => {
    const headings = [
      { id: 'intro', top: -10 },
      { id: 'details', top: 120 },
      { id: 'summary', top: 400 }
    ]

    expect(pickActiveHeading(headings, 160)).toBe('details')
  })
})
