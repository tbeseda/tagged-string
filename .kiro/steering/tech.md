---
inclusion: always
---

# Technology Stack & Development Rules

## Runtime & Dependencies

**Zero runtime dependencies** - This is a core architectural principle. Never add dependencies to `package.json` under `dependencies`. Use only TypeScript/JavaScript standard library features.

**Node.js v24+** with native TypeScript support - No transpilation needed during development. Execute TypeScript files directly with `node src/file.ts`.

## TypeScript Configuration

- Target: ES2022
- Module: ESNext with Node16 resolution  
- Strict mode: All strict flags enabled
- No build step required for development

## Essential Commands

```bash
npm t                    # Run tests (use this to verify changes)
node src/file.ts         # Execute TypeScript directly
npm run build            # Build for release (creates dist/)
```

## Build & Distribution

**Build tool**: tsup (zero-config bundler)
- Entry: `src/index.ts`
- Output: ESM only (`dist/index.js` + `dist/index.d.ts`)
- Auto-runs on publish via `prepublishOnly` hook

**Package exports**:
- Main: `./dist/index.js` (bundled ESM)
- Types: `./dist/index.d.ts`
- Published: `dist/` and `src/` directories

## Development Constraints

When implementing features or fixing bugs:

1. **Never add runtime dependencies** - Only use standard library APIs
2. **Prefer simplicity** - Readable code over clever optimizations
3. **Test changes** - Run `npm t` to verify your implementation
4. **Direct execution** - No build step needed; run TS files with `node` directly
5. **ESM only** - Use ES module syntax (`import`/`export`), not CommonJS
