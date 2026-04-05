import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

describe('example site', () => {
  it('uses hugo.yaml and points to the theme', () => {
    const yaml = fs.readFileSync(new URL('../../exampleSite/hugo.yaml', import.meta.url), 'utf8')

    expect(yaml).toContain('theme: mh-blog-theme')
    expect(yaml).toContain('taxonomies:')
    expect(yaml).toContain('series: series')
  })

  it('renders without socials configured', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-site-'))
    const themeDir = fileURLToPath(new URL('../../', import.meta.url))

    fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\n')
    fs.mkdirSync(path.join(siteDir, 'content'), { recursive: true })
    fs.writeFileSync(path.join(siteDir, 'content', '_index.md'), '---\ntitle: Home\n---\n')
    fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))

    execFileSync('hugo', ['--source', siteDir, '--themesDir', themeDir], {
      cwd: themeDir,
      stdio: 'pipe'
    })

    const html = fs.readFileSync(path.join(siteDir, 'public', 'index.html'), 'utf8')
    expect(html).not.toContain('>GitHub<')
  })
})
