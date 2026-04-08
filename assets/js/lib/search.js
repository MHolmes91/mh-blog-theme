function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function highlightText(text, query) {
  const needle = query.trim()
  if (!needle) return escapeHtml(text)
  const safeText = escapeHtml(text)
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return safeText.replace(regex, '<mark>$1</mark>')
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
  return [
    ...(record.tags || []).filter(t => t.toLowerCase().includes(needle)),
    ...(record.series || []).filter(s => s.toLowerCase().includes(needle))
  ]
}

const CONTEXT_LENGTH = 120

export function extractContext(record, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return ''

  const rank = rankRecord(record, query)

  if (rank <= 1) {
    return record.content.slice(0, CONTEXT_LENGTH)
  }

  const lowerContent = record.content.toLowerCase()

  for (const heading of (record.headings || [])) {
    const headingText = heading.replace(/^##+\s+/, '')
    if (headingText.toLowerCase().includes(needle)) {
      const headingPos = lowerContent.indexOf(headingText.toLowerCase())
      if (headingPos !== -1) {
        const afterHeading = record.content.slice(headingPos + headingText.length).trimStart()
        return headingText + ' ' + afterHeading.slice(0, CONTEXT_LENGTH)
      }
    }
  }

  const matchIndex = lowerContent.indexOf(needle)
  if (matchIndex === -1) return record.content.slice(0, CONTEXT_LENGTH)

  let start = Math.max(0, matchIndex - 60)
  let end = Math.min(record.content.length, matchIndex + needle.length + 60)

  if (start > 0 && record.content[start] !== ' ' && record.content[start - 1] !== ' ') {
    const nextSpace = record.content.indexOf(' ', start)
    if (nextSpace !== -1) start = nextSpace + 1
  }
  if (end < record.content.length && record.content[end - 1] !== ' ' && record.content[end] !== ' ') {
    const prevSpace = record.content.lastIndexOf(' ', end)
    if (prevSpace > start) end = prevSpace
  }

  let context = record.content.slice(start, end).trim()
  if (start > 0) context = '\u2026' + context
  if (end < record.content.length) context = context + '\u2026'

  return context
}

export function filterSearchRecords(records, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  return records
    .filter((record) => {
      const haystack = [record.title, ...(record.tags || []), ...(record.series || []), record.content, ...(record.headings || [])].join(' ').toLowerCase()
      return haystack.includes(needle)
    })
    .map(record => ({
      ...record,
      _rank: rankRecord(record, needle),
      _context: extractContext(record, needle),
      _matchedTags: getMatchedTags(record, needle)
    }))
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
