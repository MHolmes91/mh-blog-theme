import { describe, expect, it } from 'vitest'
import { filterSearchRecords, collectMatches } from '../../assets/js/lib/search.js'

describe('filterSearchRecords', () => {
  it('returns matching posts by title, summary, and content', () => {
    const records = [
      { title: 'First Post', summary: 'Alpha', content: 'Search should find this paragraph.', permalink: '/posts/first-post/' },
      { title: 'Second Post', summary: 'Beta', content: 'Nothing relevant here.', permalink: '/posts/second-post/' }
    ]

    expect(filterSearchRecords(records, 'search')).toHaveLength(1)
  })
})

describe('collectMatches', () => {
  it('returns ordered text matches for highlighting', () => {
    const matches = collectMatches('Search should find this paragraph.', 'find')
    expect(matches[0]).toEqual({ start: 14, end: 18 })
  })
})
