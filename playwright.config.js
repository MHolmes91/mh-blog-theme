import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:1313'
  },
  webServer: {
    command: 'hugo server --source exampleSite --theme "$(basename "$PWD")" --themesDir "$(dirname "$PWD")"',
    url: 'http://127.0.0.1:1313'
  }
})
