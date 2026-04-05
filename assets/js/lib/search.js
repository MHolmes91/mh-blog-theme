export function filterSearchRecords(records, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []

  return records.filter((record) => {
    const haystack = [record.title, record.summary, record.content, ...(record.headings || [])].join(' ').toLowerCase()
    return haystack.includes(needle)
  })
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
