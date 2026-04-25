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

  if ((record.title || '').toLowerCase().includes(needle)) return 0
  if ((record.series || []).some((item) => item.toLowerCase().includes(needle))) return 1
  if ((record.tags || []).some((item) => item.toLowerCase().includes(needle))) return 1
  if (decodeText(record.summary || '').toLowerCase().includes(needle)) return 2
  return 3
}

function matchesMetadataItem(item, needle) {
  return item.toLowerCase().includes(needle)
}

function orderMetadata(items = [], needle) {
  const matching = []
  const rest = []

  for (const item of items) {
    if (matchesMetadataItem(item, needle)) {
      matching.push(item)
    } else {
      rest.push(item)
    }
  }

  return [...matching, ...rest]
}

function buildOrderedMetadata(orderedSeries, orderedTags, needle) {
  return [
    ...orderedSeries
      .filter((item) => matchesMetadataItem(item, needle))
      .map((label) => ({ kind: 'series', label, matched: true })),
    ...orderedTags
      .filter((item) => matchesMetadataItem(item, needle))
      .map((label) => ({ kind: 'tag', label, matched: true })),
    ...orderedSeries
      .filter((item) => !matchesMetadataItem(item, needle))
      .map((label) => ({ kind: 'series', label, matched: false })),
    ...orderedTags
      .filter((item) => !matchesMetadataItem(item, needle))
      .map((label) => ({ kind: 'tag', label, matched: false }))
  ]
}

const CONTEXT_LENGTH = 120

export function extractContext(record, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return ''

  const summary = decodeText(record.summary || '')
  const content = decodeText(record.content || '')
  const rank = rankRecord(record, query)

  if (rank <= 1) {
    return (summary || content).slice(0, CONTEXT_LENGTH)
  }

  if (rank === 2) {
    return summary.slice(0, CONTEXT_LENGTH)
  }

  const lowerContent = content.toLowerCase()
  const matchIndex = lowerContent.indexOf(needle)
  if (matchIndex === -1) return content.slice(0, CONTEXT_LENGTH)

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

  return context
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
        decodeText(record.summary || ''),
        decodeText(record.content || '')
      ].join(' ').toLowerCase()

      return haystack.includes(needle)
    })
    .map((record) => {
      const orderedSeries = orderMetadata(record.series || [], needle)
      const orderedTags = orderMetadata(record.tags || [], needle)

      return {
        ...record,
        _rank: rankRecord(record, needle),
        _context: extractContext(record, needle),
        _orderedSeries: orderedSeries,
        _orderedTags: orderedTags,
        _orderedMetadata: buildOrderedMetadata(orderedSeries, orderedTags, needle)
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

export function buildHighlightedPostUrl(permalink, query, baseUrl = window.location.origin) {
  const needle = query.trim()
  if (!needle) return permalink

  const url = new URL(permalink, baseUrl)
  url.searchParams.set('highlight', needle)

  return `${url.pathname}${url.search}${url.hash}`
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
