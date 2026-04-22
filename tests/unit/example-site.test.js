import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

function createSiteFixture(prefix) {
  const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  const themeDir = fileURLToPath(new URL('../../', import.meta.url))
  const themesDir = path.join(siteDir, 'themes')

  fs.mkdirSync(path.join(siteDir, 'content', 'posts'), { recursive: true })
  fs.mkdirSync(themesDir, { recursive: true })
  fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\ntaxonomies:\n  series: series\n')
  fs.writeFileSync(path.join(siteDir, 'content', '_index.md'), '---\ntitle: Home\n---\n')
  fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))
  fs.symlinkSync(themeDir, path.join(themesDir, 'mh-blog-theme'))

  return { siteDir, themeDir, themesDir }
}

function renderSite(themeDir, siteDir, themesDir) {
  execFileSync('hugo', ['--source', siteDir, '--themesDir', themesDir], {
    cwd: themeDir,
    stdio: 'pipe'
  })
}

function writePost(siteDir, name, content) {
  fs.writeFileSync(path.join(siteDir, 'content', 'posts', `${name}.md`), content)
}

function readPostHtml(siteDir, name) {
  return fs.readFileSync(path.join(siteDir, 'public', 'posts', name, 'index.html'), 'utf8')
}

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
    const themesDir = path.join(siteDir, 'themes')

    fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\n')
    fs.mkdirSync(path.join(siteDir, 'content'), { recursive: true })
    fs.mkdirSync(themesDir, { recursive: true })
    fs.writeFileSync(path.join(siteDir, 'content', '_index.md'), '---\ntitle: Home\n---\n')
    fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))
    fs.symlinkSync(themeDir, path.join(themesDir, 'mh-blog-theme'))

    execFileSync('hugo', ['--source', siteDir, '--themesDir', themesDir], {
      cwd: themeDir,
      stdio: 'pipe'
    })

    const html = fs.readFileSync(path.join(siteDir, 'public', 'index.html'), 'utf8')
    expect(html).not.toContain('>GitHub<')
  })

  it('renders the home archives link under the configured base path', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-site-'))
    const themeDir = fileURLToPath(new URL('../../', import.meta.url))
    const themesDir = path.join(siteDir, 'themes')

    fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/blog/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\nparams:\n  intro:\n    title: Home\n    body: Subpath fixture.\n')
    fs.mkdirSync(path.join(siteDir, 'content', 'archives'), { recursive: true })
    fs.mkdirSync(path.join(siteDir, 'content', 'posts'), { recursive: true })
    fs.mkdirSync(themesDir, { recursive: true })
    fs.writeFileSync(path.join(siteDir, 'content', '_index.md'), '---\ntitle: Home\n---\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'archives', '_index.md'), '---\ntitle: Archives\nlayout: archives\n---\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'posts', 'post.md'), '---\ntitle: Post\ndate: 2026-04-01\nsummary: Summary\n---\n')
    fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))
    fs.symlinkSync(themeDir, path.join(themesDir, 'mh-blog-theme'))

    execFileSync('hugo', ['--source', siteDir, '--themesDir', themesDir], {
      cwd: themeDir,
      stdio: 'pipe'
    })

    const html = fs.readFileSync(path.join(siteDir, 'public', 'index.html'), 'utf8')
    expect(html).toContain('href="/blog/archives/"')
  })

  it('omits the home archives link when no archives page exists', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-site-'))
    const themeDir = fileURLToPath(new URL('../../', import.meta.url))
    const themesDir = path.join(siteDir, 'themes')

    fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\nparams:\n  intro:\n    title: Home\n    body: No archives fixture.\n')
    fs.mkdirSync(path.join(siteDir, 'content', 'posts'), { recursive: true })
    fs.mkdirSync(themesDir, { recursive: true })
    fs.writeFileSync(path.join(siteDir, 'content', '_index.md'), '---\ntitle: Home\n---\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'posts', 'post.md'), '---\ntitle: Post\ndate: 2026-04-01\nsummary: Summary\n---\n')
    fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))
    fs.symlinkSync(themeDir, path.join(themesDir, 'mh-blog-theme'))

    execFileSync('hugo', ['--source', siteDir, '--themesDir', themesDir], {
      cwd: themeDir,
      stdio: 'pipe'
    })

    const html = fs.readFileSync(path.join(siteDir, 'public', 'index.html'), 'utf8')
    expect(html).not.toContain('href="/archives/"')
    expect(html).not.toContain('View All posts')
  })

  it('renders the archives page without a hub column when no taxonomies exist', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-archives-empty-'))
    const themeDir = fileURLToPath(new URL('../../', import.meta.url))
    const themesDir = path.join(siteDir, 'themes')

    fs.mkdirSync(path.join(siteDir, 'content', 'archives'), { recursive: true })
    fs.mkdirSync(themesDir, { recursive: true })
    fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'archives', '_index.md'), '---\ntitle: Archives\nlayout: archives\n---\n')
    fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))
    fs.symlinkSync(themeDir, path.join(themesDir, 'mh-blog-theme'))

    execFileSync('hugo', ['--source', siteDir, '--themesDir', themesDir], {
      cwd: themeDir,
      stdio: 'pipe'
    })

    const html = fs.readFileSync(path.join(siteDir, 'public', 'archives', 'index.html'), 'utf8')

    expect(html).not.toContain('>Series<')
    expect(html).not.toContain('>Tags<')
    expect(html).not.toContain('lg:border-r')
  })

  it('renders archive hubs from post taxonomies only', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-archives-posts-only-'))
    const themeDir = fileURLToPath(new URL('../../', import.meta.url))
    const themesDir = path.join(siteDir, 'themes')

    fs.mkdirSync(path.join(siteDir, 'content', 'archives'), { recursive: true })
    fs.mkdirSync(path.join(siteDir, 'content', 'posts'), { recursive: true })
    fs.mkdirSync(path.join(siteDir, 'content', 'notes'), { recursive: true })
    fs.mkdirSync(themesDir, { recursive: true })
    fs.writeFileSync(path.join(siteDir, 'hugo.yaml'), 'baseURL: https://example.org/\nlanguageCode: en-us\ntitle: Minimal Site\ntheme: mh-blog-theme\ntaxonomies:\n  tag: tags\n  series: series\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'archives', '_index.md'), '---\ntitle: Archives\nlayout: archives\n---\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'posts', 'post.md'), '---\ntitle: Post\ndate: 2026-04-01\ntags: [post-tag]\nseries: [post-series]\nsummary: Summary\n---\n')
    fs.writeFileSync(path.join(siteDir, 'content', 'notes', 'note.md'), '---\ntitle: Note\ndate: 2026-04-02\ntags: [note-tag]\nseries: [note-series]\nsummary: Summary\n---\n')
    fs.symlinkSync(path.join(themeDir, 'node_modules'), path.join(siteDir, 'node_modules'))
    fs.symlinkSync(themeDir, path.join(themesDir, 'mh-blog-theme'))

    execFileSync('hugo', ['--source', siteDir, '--themesDir', themesDir], {
      cwd: themeDir,
      stdio: 'pipe'
    })

    const html = fs.readFileSync(path.join(siteDir, 'public', 'archives', 'index.html'), 'utf8')

    expect(html).toContain('post-series')
    expect(html).toContain('post-tag')
    expect(html).not.toContain('note-series')
    expect(html).not.toContain('note-tag')
  })

  it('renders series navigation from date order with edge placeholders', () => {
    const { siteDir, themeDir, themesDir } = createSiteFixture('mh-theme-series-date-')

    writePost(siteDir, 'first', '---\ntitle: First Post\ndate: 2026-04-01\nseries: [alpha-series]\nsummary: First summary\n---\n')
    writePost(siteDir, 'middle', '---\ntitle: Middle Post\ndate: 2026-04-02\nseries: [alpha-series]\nsummary: Middle summary\n---\n')
    writePost(siteDir, 'last', '---\ntitle: Last Post\ndate: 2026-04-03\nseries: [alpha-series]\nsummary: Last summary\n---\n')

    renderSite(themeDir, siteDir, themesDir)

    const middleHtml = readPostHtml(siteDir, 'middle')
    const firstHtml = readPostHtml(siteDir, 'first')
    const lastHtml = readPostHtml(siteDir, 'last')

    expect(middleHtml).toContain('Previous')
    expect(middleHtml).toContain('href="/posts/first/"')
    expect(middleHtml).toContain('First Post')
    expect(middleHtml).toContain('Next')
    expect(middleHtml).toContain('href="/posts/last/"')
    expect(middleHtml).toContain('Last Post')

    expect(firstHtml).toContain('No Previous')
    expect(firstHtml).toContain('Next')
    expect(firstHtml).toContain('href="/posts/middle/"')
    expect(firstHtml).toContain('Middle Post')
    expect(firstHtml).not.toContain('href="/posts/last/"')

    expect(lastHtml).toContain('Previous')
    expect(lastHtml).toContain('href="/posts/middle/"')
    expect(lastHtml).toContain('Middle Post')
    expect(lastHtml).toContain('No Next')
    expect(lastHtml).not.toContain('href="/posts/first/"')
  })

  it('renders series navigation using series_order before date order', () => {
    const { siteDir, themeDir, themesDir } = createSiteFixture('mh-theme-series-order-')

    writePost(siteDir, 'date-first', '---\ntitle: Date First\ndate: 2026-04-01\nseries: [ordered-series]\nseries_order: 2\nsummary: Date first summary\n---\n')
    writePost(siteDir, 'date-middle', '---\ntitle: Date Middle\ndate: 2026-04-02\nseries: [ordered-series]\nseries_order: 3\nsummary: Date middle summary\n---\n')
    writePost(siteDir, 'date-last', '---\ntitle: Date Last\ndate: 2026-04-03\nseries: [ordered-series]\nseries_order: 1\nsummary: Date last summary\n---\n')

    renderSite(themeDir, siteDir, themesDir)

    const middleHtml = readPostHtml(siteDir, 'date-first')

    expect(middleHtml).toContain('Previous')
    expect(middleHtml).toContain('href="/posts/date-last/"')
    expect(middleHtml).toContain('Date Last')
    expect(middleHtml).toContain('Next')
    expect(middleHtml).toContain('href="/posts/date-middle/"')
    expect(middleHtml).toContain('Date Middle')
  })
})
