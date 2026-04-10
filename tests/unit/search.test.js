import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { filterSearchRecords, collectMatches, loadSearchRecords, highlightText, rankRecord, getMatchedTags, getMatchedSeries, extractContext } from '../../assets/js/lib/search.js'

describe('highlightText', () => {
  it('returns escaped text when query is empty', () => {
    expect(highlightText('hello <world>', '')).toBe('hello &lt;world&gt;')
  })

  it('renders decoded punctuation before highlighting', () => {
    expect(highlightText('&quot;quoted&quot; text', 'quoted')).toBe('<mark>"quoted"</mark> text')
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

  it('returns matching tags only', () => {
    expect(getMatchedTags(record, 'webdev')).toEqual(['webdev'])
  })

  it('does not include matching series', () => {
    expect(getMatchedTags(record, 'started')).toEqual([])
  })

  it('returns empty array when no match', () => {
    expect(getMatchedTags(record, 'python')).toEqual([])
  })

  it('returns matching tags', () => {
    expect(getMatchedTags(record, 'hugo')).toEqual(['hugo'])
  })
})

describe('getMatchedSeries', () => {
  const record = {
    tags: ['webdev', 'hugo'],
    series: ['Getting Started']
  }

  it('returns matching series only', () => {
    expect(getMatchedSeries(record, 'started')).toEqual(['Getting Started'])
  })

  it('does not include matching tags', () => {
    expect(getMatchedSeries(record, 'webdev')).toEqual([])
  })

  it('returns empty array when no match', () => {
    expect(getMatchedSeries(record, 'python')).toEqual([])
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
    expect(result).toEqual({
      kind: 'text',
      heading: '',
      text: record.content.slice(0, 120)
    })
  })

  it('returns first 120 chars for title match', () => {
    const result = extractContext(record, 'test post')
    expect(result).toEqual({
      kind: 'text',
      heading: '',
      text: record.content.slice(0, 120)
    })
  })

  it('returns heading + content after heading for heading match', () => {
    const recordWithHeadings = {
      ...record,
      content: 'Lorem ipsum dolor sit amet. Introduction This is the intro section with some content following the heading.'
    }
    const result = extractContext(recordWithHeadings, 'introduction')
    expect(result).toEqual({
      kind: 'heading',
      heading: 'Introduction',
      text: 'This is the intro section with some content following the heading.'
    })
  })

  it('returns structured heading snippets without markdown or trailing hash', () => {
    const recordWithHeadings = {
      title: 'Heading Post',
      tags: [],
      series: [],
      content: 'Intro text. Linked Heading This excerpt follows the heading in plain text.',
      headings: ['## Linked Heading #']
    }

    expect(extractContext(recordWithHeadings, 'linked')).toEqual({
      kind: 'heading',
      heading: 'Linked Heading',
      text: 'This excerpt follows the heading in plain text.'
    })
  })

  it('falls back to the opening content when the heading label is not embedded in content', () => {
    const recordWithDetachedHeading = {
      title: 'Detached Heading Post',
      tags: [],
      series: [],
      content: 'Body copy starts immediately without repeating the section heading in the flattened content.',
      headings: ['## Missing Heading']
    }

    expect(extractContext(recordWithDetachedHeading, 'missing')).toEqual({
      kind: 'heading',
      heading: 'Missing Heading',
      text: 'Body copy starts immediately without repeating the section heading in the flattened content.'
    })
  })

  it('uses the later heading occurrence instead of earlier prose mentions', () => {
    const recordWithRepeatedHeadingText = {
      title: 'Repeated Heading Post',
      tags: [],
      series: [],
      content: 'Linked Heading is referenced in the introduction. More setup text. Linked Heading Body copy after the real heading.',
      headings: ['## Linked Heading']
    }

    expect(extractContext(recordWithRepeatedHeadingText, 'linked')).toEqual({
      kind: 'heading',
      heading: 'Linked Heading',
      text: 'Body copy after the real heading.'
    })
  })

  it('returns structured text snippets for content matches', () => {
    const recordWithQuotedContent = {
      title: 'Content Post',
      tags: [],
      series: [],
      content: 'A paragraph with &quot;quoted&quot; content in the middle of the snippet.',
      headings: []
    }

    expect(extractContext(recordWithQuotedContent, 'quoted')).toEqual({
      kind: 'text',
      heading: '',
      text: expect.stringContaining('"quoted"')
    })
  })

  it('returns surrounding context for content match', () => {
    const result = extractContext(record, 'tempor')
    expect(result.kind).toBe('text')
    expect(result.heading).toBe('')
    expect(result.text).toContain('tempor')
    expect(result.text.length).toBeLessThanOrEqual(140)
  })

  it('trims to word boundaries', () => {
    const record2 = {
      ...record,
      content: 'abcdefghijklmnopqrstuvwxyz now there is tempor incididunt ut'
    }
    const result = extractContext(record2, 'tempor')
    expect(result.text).toMatch(/^\S/)
    expect(result.text).toMatch(/\S$/)
  })

  it('returns empty string when query is empty', () => {
    expect(extractContext(record, '')).toEqual({
      kind: 'text',
      heading: '',
      text: ''
    })
  })

  it('handles match at start of content', () => {
    const record2 = { ...record, content: 'tempor is at the start of content.' }
    const result = extractContext(record2, 'tempor')
    expect(result.text).toContain('tempor')
  })

  it('handles match near end of content', () => {
    const short = { ...record, content: 'some text before the tempor word' }
    const result = extractContext(short, 'tempor')
    expect(result.text).toContain('tempor')
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

  it('returns empty array when query is shorter than 3 characters', () => {
    const records = [{ title: 'Test Post', content: 'test content', tags: [], series: [], headings: [] }]
    expect(filterSearchRecords(records, 'te')).toEqual([])
    expect(filterSearchRecords(records, 't')).toEqual([])
  })

  it('includes matched tags in _matchedTags', () => {
    const records = [
      { title: 'Post', summary: '', content: 'text', permalink: '/p/', tags: ['hugo', 'web'], series: ['tutorial'], headings: [] }
    ]

    const results = filterSearchRecords(records, 'web')
    expect(results[0]._matchedTags).toEqual(['web'])
  })

  it('includes matched series in _matchedSeries', () => {
    const records = [
      { title: 'Post', summary: '', content: 'text', permalink: '/p/', tags: [], series: ['tutorial'], headings: [] }
    ]

    const results = filterSearchRecords(records, 'tutorial')
    expect(results[0]._matchedSeries).toEqual(['tutorial'])
    expect(results[0]._matchedTags).toEqual([])
  })

  it('returns structured snippet metadata for heading matches', () => {
    const records = [{
      title: 'Heading Post',
      summary: '',
      content: 'Intro text. Linked Heading Body copy after the heading.',
      permalink: '/heading/',
      tags: [],
      series: [],
      headings: ['## Linked Heading #']
    }]

    const [result] = filterSearchRecords(records, 'linked')

    expect(result._snippetKind).toBe('heading')
    expect(result._heading).toBe('Linked Heading')
    expect(result._context).toContain('Body copy after the heading.')
  })

  it('returns structured snippet metadata for text matches', () => {
    const records = [{
      title: 'Content Post',
      summary: '',
      content: 'A paragraph with &quot;quoted&quot; content in the middle of the snippet.',
      permalink: '/content/',
      tags: [],
      series: [],
      headings: []
    }]

    const [result] = filterSearchRecords(records, 'quoted')

    expect(result._snippetKind).toBe('text')
    expect(result._heading).toBe('')
    expect(result._context).toContain('"quoted"')
  })
})

describe('collectMatches', () => {
  it('returns ordered text matches for highlighting', () => {
    const matches = collectMatches('Search should find this paragraph.', 'find')
    expect(matches[0]).toEqual({ start: 14, end: 18 })
  })
})

describe('search index template', () => {
  it('does not emit a headings field in the search index', () => {
    const template = readFileSync(new URL('../../layouts/index.json', import.meta.url), 'utf8')

    expect(template).not.toContain('"headings"')
    expect(template).not.toContain('findRE')
  })

  it('sanitizes heading-link hashes from emitted content', () => {
    const template = readFileSync(new URL('../../layouts/index.json', import.meta.url), 'utf8')

    expect(template).toContain('replaceRE')
    expect(template).toContain('\\s+#+\\s*$')
  })
})

describe('loadSearchRecords', () => {
  it('returns an empty array when the search index request fails', async () => {
    const fetchImpl = async () => ({ ok: false, json: async () => [] })

    await expect(loadSearchRecords(fetchImpl, '/index.json')).resolves.toEqual([])
  })
})
