import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export function createHugoArgs(commandArgs = [], cwd = process.cwd()) {
  return [
    ...commandArgs,
    '--source',
    'exampleSite',
    '--theme',
    path.basename(cwd),
    '--themesDir',
    path.dirname(cwd)
  ]
}

function run() {
  const child = spawn('hugo', createHugoArgs(process.argv.slice(2)), {
    stdio: 'inherit'
  })

  child.on('exit', (code) => {
    process.exit(code ?? 1)
  })

  child.on('error', (error) => {
    console.error(error)
    process.exit(1)
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run()
}
