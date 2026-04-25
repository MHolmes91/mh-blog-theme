import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { filterSearchRecords, collectMatches, loadSearchRecords, highlightText, rankRecord, extractContext, buildHighlightedPostUrl, highlightFirstTextMatch } from '../../assets/js/lib/search.js'

const SEARCH_INDEX_TEMPLATE = readFileSync(new URL('../../layouts/index.json', import.meta.url), 'utf8')
const HEADING_LINK_HASH_REGEX_SOURCE = String.raw`(?m)\s+#\s*$`
const headingLinkHashPattern = /\s+#\s*$/gm

class TestHTMLElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase()
    this.children = []
    this.parentNode = null
  }

  set innerHTML(value) {
    this.children = []
    for (const match of value.matchAll(/<p>(.*?)<\/p>/g)) {
      const paragraph = document.createElement('p')
      paragraph.appendChild(new TestText(match[1]))
      this.appendChild(paragraph)
    }
  }

  get textContent() {
    return this.children.map((child) => child.textContent).join('')
  }

  appendChild(child) {
    child.parentNode = this
    this.children.push(child)
    return child
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null
  }

  querySelectorAll(selector) {
    const tagName = selector.toUpperCase()
    const results = []
    const visit = (node) => {
      if (node instanceof TestHTMLElement && node.tagName === tagName) results.push(node)
      for (const child of node.children || []) visit(child)
    }
    visit(this)
    return results
  }
}

class TestText {
  constructor(value) {
    this.nodeValue = value
    this.parentNode = null
  }

  get textContent() {
    return this.nodeValue
  }
}

globalThis.HTMLElement = TestHTMLElement
globalThis.NodeFilter = { SHOW_TEXT: 4 }
globalThis.document = {
  createElement(tagName) {
    return new TestHTMLElement(tagName)
  },
  createRange() {
    return {
      setStart(node, index) {
        this.node = node
        this.start = index
      },
      setEnd(node, index) {
        this.node = node
        this.end = index
      },
      surroundContents(mark) {
        const parent = this.node.parentNode
        const siblings = parent.children
        const siblingIndex = siblings.indexOf(this.node)
        const text = this.node.nodeValue
        mark.appendChild(new TestText(text.slice(this.start, this.end)))

        const nodes = [
          new TestText(text.slice(0, this.start)),
          mark,
          new TestText(text.slice(this.end))
        ].filter((node) => node instanceof TestHTMLElement || node.textContent)

        for (const node of nodes) node.parentNode = parent
        siblings.splice(siblingIndex, 1, ...nodes)
      }
    }
  },
  createTreeWalker(root) {
    const textNodes = []
    const visit = (node) => {
      if (node instanceof TestText) textNodes.push(node)
      for (const child of node.children || []) visit(child)
    }
    visit(root)

    return {
      nextNode() {
        return textNodes.shift() || null
      }
    }
  }
}

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
    summary: 'A short summary about setup.',
    content: 'This is some content about Hugo.'
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

  it('returns 2 for summary match', () => {
    expect(rankRecord(record, 'setup')).toBe(2)
  })

  it('returns 3 for content match', () => {
    expect(rankRecord(record, 'content')).toBe(3)
  })

  it('returns -1 when query is empty', () => {
    expect(rankRecord(record, '')).toBe(-1)
  })

  it('returns 0 for title match even when other fields also match', () => {
    expect(rankRecord({ ...record, title: 'Setup Guide' }, 'setup')).toBe(0)
  })
})

describe('extractContext', () => {
  const record = {
    title: 'Test Post',
    tags: ['webdev'],
    series: ['Guides'],
    summary: 'Summary text that mentions setup clearly.',
    content: 'Longer body content that also mentions setup later in the article.'
  }

  it('uses summary for metadata matches when summary exists', () => {
    expect(extractContext(record, 'webdev')).toBe('Summary text that mentions setup clearly.')
  })

  it('uses summary for title matches when summary exists', () => {
    expect(extractContext(record, 'test post')).toBe('Summary text that mentions setup clearly.')
  })

  it('uses summary when the summary matches', () => {
    expect(extractContext(record, 'setup')).toBe('Summary text that mentions setup clearly.')
  })

  it('falls back to opening content when summary is empty', () => {
    expect(extractContext({ ...record, summary: '' }, 'webdev')).toBe(record.content.slice(0, 120))
  })

  it('returns decoded summary text for summary matches', () => {
    const recordWithQuotedContent = {
      title: 'Content Post',
      tags: [],
      series: [],
      summary: 'A short &quot;quoted&quot; summary.',
      content: 'A paragraph with quoted content in the middle of the snippet.'
    }

    expect(extractContext(recordWithQuotedContent, 'quoted')).toBe('A short "quoted" summary.')
  })

  it('returns surrounding context for content match', () => {
    const recordWithLongContent = {
      ...record,
      summary: 'Concise intro.',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
    }
    const result = extractContext(recordWithLongContent, 'tempor')
    expect(result).toContain('tempor')
    expect(result.length).toBeLessThanOrEqual(140)
  })

  it('trims to word boundaries', () => {
    const record2 = {
      ...record,
      summary: '',
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
    const record2 = { ...record, summary: '', content: 'tempor is at the start of content.' }
    const result = extractContext(record2, 'tempor')
    expect(result).toContain('tempor')
  })

  it('handles match near end of content', () => {
    const short = { ...record, summary: '', content: 'some text before the tempor word' }
    const result = extractContext(short, 'tempor')
    expect(result).toContain('tempor')
  })
})

describe('buildHighlightedPostUrl', () => {
  it('adds the highlight parameter to a post permalink', () => {
    expect(buildHighlightedPostUrl('/posts/example/', 'search term', 'https://example.org')).toBe('/posts/example/?highlight=search+term')
  })

  it('adds the highlight parameter without an explicit base URL', () => {
    expect(buildHighlightedPostUrl('/posts/example/', 'search term')).toBe('/posts/example/?highlight=search+term')
  })

  it('preserves existing query strings and hash fragments', () => {
    expect(buildHighlightedPostUrl('/posts/example/?page=2#section', 'alpha beta', 'https://example.org')).toBe('/posts/example/?page=2&highlight=alpha+beta#section')
  })

  it('returns the clean permalink for empty queries', () => {
    expect(buildHighlightedPostUrl('/posts/example/', '   ', 'https://example.org')).toBe('/posts/example/')
  })
})

describe('highlightFirstTextMatch', () => {
  it('wraps only the first matching body text occurrence', () => {
    const body = document.createElement('div')
    body.innerHTML = '<p>Alpha body text.</p><p>Second alpha body text.</p>'

    const mark = highlightFirstTextMatch(body, 'alpha')

    expect(mark).toBeInstanceOf(HTMLElement)
    expect(body.querySelectorAll('mark')).toHaveLength(1)
    expect(body.querySelector('mark')?.textContent).toBe('Alpha')
    expect(body.textContent).toBe('Alpha body text.Second alpha body text.')
  })

  it('returns null when the query is missing from body text', () => {
    const body = document.createElement('div')
    body.innerHTML = '<p>Body paragraph.</p>'

    expect(highlightFirstTextMatch(body, 'metadata')).toBeNull()
    expect(body.querySelector('mark')).toBeNull()
  })

  it('returns null for empty queries', () => {
    const body = document.createElement('div')
    body.innerHTML = '<p>Body paragraph.</p>'

    expect(highlightFirstTextMatch(body, '   ')).toBeNull()
    expect(body.querySelector('mark')).toBeNull()
  })
})

describe('filterSearchRecords', () => {
  it('returns enriched results with rank, context, and ordered metadata only', () => {
    const records = [
      { title: 'First Post', summary: 'Alpha', content: 'Search should find this paragraph.', permalink: '/posts/first-post/', tags: [], series: [] },
      { title: 'Second Post', summary: 'Beta', content: 'Nothing relevant here.', permalink: '/posts/second-post/', tags: [], series: [] }
    ]

    const results = filterSearchRecords(records, 'search')
    expect(results).toHaveLength(1)
    expect(results[0]._rank).toBe(3)
    expect(results[0]._context).toMatch(/search/i)
    expect(results[0]._orderedSeries).toEqual([])
    expect(results[0]._orderedTags).toEqual([])
    expect(results[0]._orderedMetadata).toEqual([])
    expect(results[0]).not.toHaveProperty('_snippetKind')
    expect(results[0]).not.toHaveProperty('_heading')
    expect(results[0]).not.toHaveProperty('_matchedTags')
    expect(results[0]).not.toHaveProperty('_matchedSeries')
  })

  it('sorts by rank then alphabetically by title', () => {
    const records = [
      { title: 'Content Match', summary: '', content: 'The search word is here.', permalink: '/a/', tags: [], series: [] },
      { title: 'Alpha search', summary: '', content: 'No match here.', permalink: '/b/', tags: [], series: [] },
      { title: 'Beta search', summary: '', content: 'No match here.', permalink: '/c/', tags: [], series: [] },
      { title: 'Zeta Tag Match', summary: '', content: 'No match here.', permalink: '/d/', tags: ['search'], series: [] }
    ]

    const results = filterSearchRecords(records, 'search')
    expect(results.map(r => r.title)).toEqual(['Alpha search', 'Beta search', 'Zeta Tag Match', 'Content Match'])
  })

  it('returns empty array when query is empty', () => {
    expect(filterSearchRecords([], '')).toEqual([])
    expect(filterSearchRecords([{ title: 'Test', content: 'x' }], '  ')).toEqual([])
  })

  it('returns empty array when query is shorter than 3 characters', () => {
    const records = [{ title: 'Test Post', content: 'test content', tags: [], series: [] }]
    expect(filterSearchRecords(records, 'te')).toEqual([])
    expect(filterSearchRecords(records, 't')).toEqual([])
  })

  it('keeps all series and tags and moves matching items first', () => {
    const records = [{
      title: 'Post',
      summary: 'Summary',
      content: 'Body',
      permalink: '/post/',
      tags: ['alpha', 'needle tag', 'omega'],
      series: ['guide', 'needle series']
    }]

    const [result] = filterSearchRecords(records, 'needle')

    expect(result._orderedSeries).toEqual(['needle series', 'guide'])
    expect(result._orderedTags).toEqual(['needle tag', 'alpha', 'omega'])
    expect(result._orderedMetadata).toEqual([
      { kind: 'series', label: 'needle series', matched: true },
      { kind: 'tag', label: 'needle tag', matched: true },
      { kind: 'series', label: 'guide', matched: false },
      { kind: 'tag', label: 'alpha', matched: false },
      { kind: 'tag', label: 'omega', matched: false }
    ])
  })

  it('matches summary before content in rank ordering', () => {
    const records = [
      { title: 'Content Match', summary: '', content: 'setup appears only in content', permalink: '/content/', tags: [], series: [] },
      { title: 'Summary Match', summary: 'setup appears in summary', content: 'nothing else', permalink: '/summary/', tags: [], series: [] }
    ]

    const results = filterSearchRecords(records, 'setup')
    expect(results.map((result) => result.title)).toEqual(['Summary Match', 'Content Match'])
    expect(results[0]._context).toBe('setup appears in summary')
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
    expect(SEARCH_INDEX_TEMPLATE).not.toContain('"headings"')
    expect(SEARCH_INDEX_TEMPLATE).not.toContain('findRE')
  })

  it('uses the sanitized content variable in the emitted search index', () => {
    expect(SEARCH_INDEX_TEMPLATE).toContain(`replaceRE \`${HEADING_LINK_HASH_REGEX_SOURCE}\` ""`)
    expect(SEARCH_INDEX_TEMPLATE).toContain('"content" $content')
  })

  it('strips only the trailing single heading-link hash artifact from content lines', () => {
    const flattenedContent = ['Linked Heading #', 'Keep ## markdown markers', 'Keep trailing ###'].join('\n')

    expect(flattenedContent.replace(headingLinkHashPattern, '')).toBe([
      'Linked Heading',
      'Keep ## markdown markers',
      'Keep trailing ###'
    ].join('\n'))
  })
})

describe('loadSearchRecords', () => {
  it('returns an empty array when the search index request fails', async () => {
    const fetchImpl = async () => ({ ok: false, json: async () => [] })

    await expect(loadSearchRecords(fetchImpl, '/index.json')).resolves.toEqual([])
  })
})
