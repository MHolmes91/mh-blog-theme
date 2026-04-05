import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('example site', () => {
  it('uses hugo.yaml and points to the theme', () => {
    const yaml = fs.readFileSync(new URL('../../exampleSite/hugo.yaml', import.meta.url), 'utf8')

    expect(yaml).toContain('theme: mh-blog-theme')
    expect(yaml).toContain('taxonomies:')
    expect(yaml).toContain('series: series')
  })
})
