#!/usr/bin/env node
import { execSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const tempDir = join(rootDir, '.build-temp')

// Clean up any previous temp directory and dist
if (statSync(tempDir, { throwIfNoEntry: false })) {
  rmSync(tempDir, { recursive: true, force: true })
}
if (statSync(join(rootDir, 'dist'), { throwIfNoEntry: false })) {
  rmSync(join(rootDir, 'dist'), { recursive: true, force: true })
}

// Create temp directory and copy source files
console.log('Preparing source files...')
mkdirSync(tempDir, { recursive: true })
cpSync(join(rootDir, 'src'), tempDir, { recursive: true })

// Fix .ts extensions to .js in the temp source files
function fixSourceImports(dir) {
  const files = readdirSync(dir)

  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      fixSourceImports(filePath)
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      let content = readFileSync(filePath, 'utf8')
      // Replace .ts extensions with .js in import/export statements
      content = content.replace(/(from\s+['"])(.+?)\.ts(['"])/g, '$1$2.js$3')
      writeFileSync(filePath, content, 'utf8')
    }
  }
}

fixSourceImports(tempDir)

// Create temp tsconfig
const tempTsConfig = {
  extends: './tsconfig.json',
  compilerOptions: {
    declaration: true,
    declarationMap: true,
    outDir: './dist',
    rootDir: './.build-temp',
    noEmit: false,
    allowImportingTsExtensions: false,
  },
  include: ['.build-temp/**/*'],
  exclude: ['node_modules', '.build-temp/**/*.test.ts'],
}

writeFileSync(
  join(rootDir, 'tsconfig.temp.json'),
  JSON.stringify(tempTsConfig, null, 2),
  'utf8',
)

// Run TypeScript compiler on temp directory
console.log('Building TypeScript...')
try {
  execSync('tsc -p tsconfig.temp.json', {
    stdio: 'inherit',
    cwd: rootDir,
  })
} finally {
  // Clean up temp files
  rmSync(tempDir, { recursive: true, force: true })
  rmSync(join(rootDir, 'tsconfig.temp.json'), { force: true })
}

console.log('Build complete!')
