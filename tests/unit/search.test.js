import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { filterSearchRecords, collectMatches, loadSearchRecords, highlightText } from '../../assets/js/lib/search.js'

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
