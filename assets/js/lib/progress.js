export function getReadingProgress({ scrollTop, contentTop, contentHeight, viewportHeight }) {
  const total = Math.max(contentHeight - viewportHeight, 1)
  const raw = ((scrollTop - contentTop) / total) * 100
  return Math.max(0, Math.min(100, Math.round(raw)))
}
