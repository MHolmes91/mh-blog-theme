export function pickActiveHeading(headings, threshold = 160) {
  const visible = headings.filter((heading) => heading.top <= threshold)
  return visible.length ? visible.at(-1).id : headings[0]?.id ?? null
}
