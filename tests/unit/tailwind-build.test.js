import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

describe('tailwind build output', () => {
  it('includes utility classes used by Hugo templates', () => {
    const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-build-'))

    execFileSync('npm', ['run', 'build', '--', '--destination', destination], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe'
    })

    const cssDir = path.join(destination, 'css')
    const cssFile = fs.readdirSync(cssDir).find((file) => file.endsWith('.css'))

    expect(cssFile).toBeTruthy()

    const css = fs.readFileSync(path.join(cssDir, cssFile), 'utf8')

    expect(css).toContain('.mx-auto')
    expect(css).toContain('.grid')
    expect(css).toContain('.text-3xl')
    expect(css).toContain('.sticky')
    expect(css).toContain('.group-hover\\:text-slate-700')
    expect(css).toContain('.hover\\:text-slate-700')
  })

  it('includes theme utilities when consumed as a Hugo module', () => {
    const site = fs.mkdtempSync(path.join(os.tmpdir(), 'mh-theme-consumer-'))
    const destination = path.join(site, 'public')
    const themeSource = path.resolve(__dirname, '../..')
    const theme = path.join(site, 'node_modules', 'mh-blog-theme')

    fs.mkdirSync(path.join(site, 'content'))
    fs.cpSync(themeSource, theme, {
      recursive: true,
      filter: (source) => !source.endsWith('/.git') && !source.endsWith('/.worktrees') && !source.endsWith('/node_modules')
    })
    for (const dependency of ['alpinejs', 'entities', 'tailwindcss']) {
      fs.symlinkSync(path.join(themeSource, 'node_modules', dependency), path.join(site, 'node_modules', dependency), 'dir')
    }
    fs.symlinkSync(path.join(themeSource, 'node_modules'), path.join(theme, 'node_modules'), 'dir')
    fs.writeFileSync(path.join(site, 'content', '_index.md'), '---\ntitle: Test\n---')
    fs.writeFileSync(
      path.join(site, 'hugo.yaml'),
      `build:\n  buildStats:\n    enable: true\nmodule:\n  imports:\n    - path: github.com/MHolmes91/mh-blog-theme\n  replacements: github.com/MHolmes91/mh-blog-theme -> ${theme}\n  mounts:\n    - source: assets\n      target: assets\n    - source: hugo_stats.json\n      target: assets/notwatching/hugo_stats.json\n`
    )

    execFileSync('hugo', ['--source', site, '--destination', destination, '--gc', '--minify'], {
      cwd: site,
      stdio: 'pipe'
    })

    const cssDir = path.join(destination, 'css')
    const cssFile = fs.readdirSync(cssDir).find((file) => file.endsWith('.css'))
    const css = fs.readFileSync(path.join(cssDir, cssFile), 'utf8')

    expect(css).toContain('.sticky')
  })
})
