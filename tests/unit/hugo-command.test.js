import { describe, expect, it } from 'vitest'

import { createHugoArgs } from '../../scripts/hugo.mjs'

describe('createHugoArgs', () => {
  it('uses the current checkout name as the theme and its parent as themesDir', () => {
    expect(createHugoArgs(['server'], '/Users/mark/Repositories/mh-blog-theme')).toEqual([
      'server',
      '--source',
      'exampleSite',
      '--theme',
      'mh-blog-theme',
      '--themesDir',
      '/Users/mark/Repositories'
    ])

    expect(createHugoArgs(['server'], '/Users/mark/Repositories/mh-blog-theme/.worktrees/pass-1-fixtures')).toEqual([
      'server',
      '--source',
      'exampleSite',
      '--theme',
      'pass-1-fixtures',
      '--themesDir',
      '/Users/mark/Repositories/mh-blog-theme/.worktrees'
    ])
  })
})
