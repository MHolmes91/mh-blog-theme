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

export function filterSearchRecords(records, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  return records.filter((record) => {
    const haystack = [record.title, record.summary, record.content, ...(record.headings || [])].join(' ').toLowerCase()
    return haystack.includes(needle)
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
