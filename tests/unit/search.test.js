import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { filterSearchRecords, collectMatches, loadSearchRecords, highlightText, rankRecord, getMatchedTags } from '../../assets/js/lib/search.js'

describe('highlightText', () => {
  it('returns escaped text when query is empty', () => {
    expect(highlightText('hello <world>', '')).toBe('hello &lt;world&gt;')
  })

  it('wraps case-insensitive matches in <mark> tags', () => {
    expect(highlightText('Hello World', 'hello')).toBe('<mark>Hello</mark> World')
  })

  it('preserves original casing', () => {
    expect(highlightText('HELLO world', 'hello')).toBe('<mark>HELLO</mark> world')
  })

  it('escapes HTML before highlighting', () => {
    expect(highlightText('<b>bold</b> text', 'bold')).toBe('&lt;b&gt;<mark>bold</mark>&lt;/b&gt; text')
  })

  it('highlights multiple occurrences', () => {
    expect(highlightText('foo bar foo', 'foo')).toBe('<mark>foo</mark> bar <mark>foo</mark>')
  })

  it('escapes special regex characters in query', () => {
    expect(highlightText('a+b', 'a+b')).toBe('<mark>a+b</mark>')
  })
})

describe('rankRecord', () => {
  const record = {
    title: 'Hugo Tutorial',
    tags: ['webdev', 'hugo'],
    series: ['Getting Started'],
    content: 'This is some content about Hugo.',
    headings: ['## Setup', '## Usage']
  }

  it('returns 0 for title match', () => {
    expect(rankRecord(record, 'tutorial')).toBe(0)
  })

  it('returns 1 for tag match', () => {
    expect(rankRecord(record, 'webdev')).toBe(1)
  })

  it('returns 1 for series match', () => {
    expect(rankRecord(record, 'started')).toBe(1)
  })

  it('returns 2 for content match', () => {
    expect(rankRecord(record, 'content')).toBe(2)
  })

  it('returns 2 for heading match', () => {
    expect(rankRecord(record, 'setup')).toBe(2)
  })

  it('returns -1 when query is empty', () => {
    expect(rankRecord(record, '')).toBe(-1)
  })

  it('returns 0 for title match even when other fields also match', () => {
    expect(rankRecord({ ...record, title: 'Setup Guide' }, 'setup')).toBe(0)
  })
})

describe('getMatchedTags', () => {
  const record = {
    tags: ['webdev', 'hugo'],
    series: ['Getting Started']
  }

  it('returns matching tags', () => {
    expect(getMatchedTags(record, 'webdev')).toEqual(['webdev'])
  })

  it('returns matching series', () => {
    expect(getMatchedTags(record, 'started')).toEqual(['Getting Started'])
  })

  it('returns empty array when no match', () => {
    expect(getMatchedTags(record, 'python')).toEqual([])
  })

  it('returns all matching tags and series', () => {
    expect(getMatchedTags(record, 'hugo')).toEqual(['hugo'])
  })
})

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

describe('search index template', () => {
  it('uses the markdown heading regex expected by Hugo findRE', () => {
    const template = readFileSync(new URL('../../layouts/index.json', import.meta.url), 'utf8')

    expect(template).toContain('(?m)^##+\\s+.+$')
  })
})

describe('loadSearchRecords', () => {
  it('returns an empty array when the search index request fails', async () => {
    const fetchImpl = async () => ({ ok: false, json: async () => [] })

    await expect(loadSearchRecords(fetchImpl, '/index.json')).resolves.toEqual([])
  })
})
