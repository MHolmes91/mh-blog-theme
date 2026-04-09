import { decodeHTML } from 'entities'

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function decodeText(text = '') {
  return decodeHTML(text)
}

function normalizeHeading(heading = '') {
  return decodeText(heading)
    .replace(/^##+\s+/, '')
    .replace(/\s+#+\s*$/, '')
    .trim()
}

function createTextSnippet(text = '') {
  return { kind: 'text', heading: '', text }
}

function extractHeadingText(content, headingText) {
  const headingPos = content.toLowerCase().lastIndexOf(headingText.toLowerCase())
  const bodyText = headingPos === -1
    ? content
    : content.slice(headingPos + headingText.length).trimStart()

  return (bodyText || content).slice(0, CONTEXT_LENGTH).trim()
}

export function highlightText(text, query) {
  const needle = query.trim()
  const safeText = escapeHtml(decodeText(text))
  if (!needle) return safeText
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(["'])${escaped}\\1|(${escaped})`, 'gi')
  return safeText.replace(regex, '<mark>$&</mark>')
}

export function rankRecord(record, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return -1

  if (record.title.toLowerCase().includes(needle)) return 0
  if ((record.tags || []).some(t => t.toLowerCase().includes(needle))) return 1
  if ((record.series || []).some(s => s.toLowerCase().includes(needle))) return 1
  return 2
}

export function getMatchedTags(record, needle) {
  return (record.tags || []).filter(t => t.toLowerCase().includes(needle))
}

export function getMatchedSeries(record, needle) {
  return (record.series || []).filter(s => s.toLowerCase().includes(needle))
}

const CONTEXT_LENGTH = 120

export function extractContext(record, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return createTextSnippet('')

  const content = decodeText(record.content || '')
  const lowerContent = content.toLowerCase()

  const rank = rankRecord(record, query)

  if (rank <= 1) {
    return createTextSnippet(content.slice(0, CONTEXT_LENGTH))
  }

  for (const heading of (record.headings || [])) {
    const headingText = normalizeHeading(heading)
    if (headingText.toLowerCase().includes(needle)) {
      return {
        kind: 'heading',
        heading: headingText,
        // Prefer the section-looking occurrence; otherwise fall back to the opening body copy.
        text: extractHeadingText(content, headingText)
      }
    }
  }

  const matchIndex = lowerContent.indexOf(needle)
  if (matchIndex === -1) return createTextSnippet(content.slice(0, CONTEXT_LENGTH))

  let start = Math.max(0, matchIndex - 60)
  let end = Math.min(content.length, matchIndex + needle.length + 60)

  // Snap excerpts to nearby word boundaries so the snippet reads naturally around the match.
  if (start > 0 && content[start] !== ' ' && content[start - 1] !== ' ') {
    const nextSpace = content.indexOf(' ', start)
    if (nextSpace !== -1) start = nextSpace + 1
  }
  if (end < content.length && content[end - 1] !== ' ' && content[end] !== ' ') {
    const prevSpace = content.lastIndexOf(' ', end)
    if (prevSpace > start) end = prevSpace
  }

  let context = content.slice(start, end).trim()
  if (start > 0) context = '\u2026' + context
  if (end < content.length) context = context + '\u2026'

  return createTextSnippet(context)
}

const MIN_QUERY_LENGTH = 3

export function filterSearchRecords(records, query) {
  const needle = query.trim().toLowerCase()
  if (!needle || needle.length < MIN_QUERY_LENGTH) return []

  return records
    .filter((record) => {
      const haystack = [
        record.title,
        ...(record.tags || []),
        ...(record.series || []),
        decodeText(record.content || ''),
        ...(record.headings || []).map(normalizeHeading)
      ].join(' ').toLowerCase()

      return haystack.includes(needle)
    })
    .map((record) => {
      const snippet = extractContext(record, needle)

      // Keep the UI-facing fields flat while preserving how the snippet was chosen.
      return {
        ...record,
        _rank: rankRecord(record, needle),
        _context: snippet.text,
        _snippetKind: snippet.kind,
        _heading: snippet.heading,
        _matchedTags: getMatchedTags(record, needle),
        _matchedSeries: getMatchedSeries(record, needle)
      }
    })
    .sort((a, b) => {
      if (a._rank !== b._rank) return a._rank - b._rank
      return a.title.localeCompare(b.title)
    })
}

export async function loadSearchRecords(fetchImpl, searchUrl) {
  try {
    const response = await fetchImpl(searchUrl)
    if (!response.ok) return []

    const records = await response.json()
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

export function collectMatches(text, query) {
  const source = text.toLowerCase()
  const needle = query.trim().toLowerCase()
  const matches = []
  let index = source.indexOf(needle)

  while (needle && index !== -1) {
    matches.push({ start: index, end: index + needle.length })
    index = source.indexOf(needle, index + needle.length)
  }

  return matches
}
