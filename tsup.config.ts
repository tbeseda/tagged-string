import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/TaggedStringParser.ts', 'src/types.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
})
