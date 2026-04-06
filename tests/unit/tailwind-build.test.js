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
  })
})
