import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { filterSearchRecords, collectMatches, loadSearchRecords, highlightText, rankRecord, getMatchedTags, extractContext } from '../../assets/js/lib/search.js'

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

describe('extractContext', () => {
  const record = {
    title: 'Test Post',
    tags: ['webdev'],
    series: [],
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    headings: ['## Introduction', '## Getting Started']
  }

  it('returns first 120 chars for tag match', () => {
    const result = extractContext(record, 'webdev')
    expect(result).toBe(record.content.slice(0, 120))
  })

  it('returns first 120 chars for title match', () => {
    const result = extractContext(record, 'test post')
    expect(result).toBe(record.content.slice(0, 120))
  })

  it('returns heading + content after heading for heading match', () => {
    const recordWithHeadings = {
      ...record,
      content: 'Lorem ipsum dolor sit amet. Introduction This is the intro section with some content following the heading.'
    }
    const result = extractContext(recordWithHeadings, 'introduction')
    expect(result).toContain('Introduction')
    expect(result.length).toBeGreaterThan(10)
  })

  it('returns surrounding context for content match', () => {
    const result = extractContext(record, 'tempor')
    expect(result).toContain('tempor')
    expect(result.length).toBeLessThanOrEqual(140)
  })

  it('trims to word boundaries', () => {
    const record2 = {
      ...record,
      content: 'abcdefghijklmnopqrstuvwxyz now there is tempor incididunt ut'
    }
    const result = extractContext(record2, 'tempor')
    expect(result).toMatch(/^\S/)
    expect(result).toMatch(/\S$/)
  })

  it('returns empty string when query is empty', () => {
    expect(extractContext(record, '')).toBe('')
  })

  it('handles match at start of content', () => {
    const record2 = { ...record, content: 'tempor is at the start of content.' }
    const result = extractContext(record2, 'tempor')
    expect(result).toContain('tempor')
  })

  it('handles match near end of content', () => {
    const short = { ...record, content: 'some text before the tempor word' }
    const result = extractContext(short, 'tempor')
    expect(result).toContain('tempor')
  })
})

describe('filterSearchRecords', () => {
  it('returns enriched results with rank, context, and matchedTags', () => {
    const records = [
      { title: 'First Post', summary: 'Alpha', content: 'Search should find this paragraph.', permalink: '/posts/first-post/', tags: [], series: [], headings: [] },
      { title: 'Second Post', summary: 'Beta', content: 'Nothing relevant here.', permalink: '/posts/second-post/', tags: [], series: [], headings: [] }
    ]

    const results = filterSearchRecords(records, 'search')
    expect(results).toHaveLength(1)
    expect(results[0]._rank).toBe(2)
    expect(results[0]._context).toMatch(/search/i)
    expect(results[0]._matchedTags).toEqual([])
  })

  it('sorts by rank then alphabetically by title', () => {
    const records = [
      { title: 'Content Match', summary: '', content: 'The search word is here.', permalink: '/a/', tags: [], series: [], headings: [] },
      { title: 'Alpha search', summary: '', content: 'No match here.', permalink: '/b/', tags: [], series: [], headings: [] },
      { title: 'Beta search', summary: '', content: 'No match here.', permalink: '/c/', tags: [], series: [], headings: [] },
      { title: 'Zeta Tag Match', summary: '', content: 'No match here.', permalink: '/d/', tags: ['search'], series: [], headings: [] }
    ]

    const results = filterSearchRecords(records, 'search')
    expect(results.map(r => r.title)).toEqual(['Alpha search', 'Beta search', 'Zeta Tag Match', 'Content Match'])
  })

  it('returns empty array when query is empty', () => {
    expect(filterSearchRecords([], '')).toEqual([])
    expect(filterSearchRecords([{ title: 'Test', content: 'x' }], '  ')).toEqual([])
  })

  it('includes matched tags in _matchedTags', () => {
    const records = [
      { title: 'Post', summary: '', content: 'text', permalink: '/p/', tags: ['hugo', 'web'], series: ['tutorial'], headings: [] }
    ]

    const results = filterSearchRecords(records, 'web')
    expect(results[0]._matchedTags).toEqual(['web'])
  })

  it('includes matched series in _matchedTags', () => {
    const records = [
      { title: 'Post', summary: '', content: 'text', permalink: '/p/', tags: [], series: ['tutorial'], headings: [] }
    ]

    const results = filterSearchRecords(records, 'tutorial')
    expect(results[0]._matchedTags).toEqual(['tutorial'])
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
