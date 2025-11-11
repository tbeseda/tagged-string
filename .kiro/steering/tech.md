---
inclusion: always
---

# Technology Stack

## Runtime Environment

- Node.js v24+ with native TypeScript support (no transpilation needed for development)
- Zero runtime dependencies (core architectural principle)
- TypeScript standard library only

## TypeScript Configuration

- Target: ES2022
- Module: ESNext with Node16 resolution
- Strict mode enabled (all strict flags on)
- No build step required during development

## Commands

```bash
npm t                    # Run tests
node src/file.ts         # Execute TypeScript directly
npm run build            # Build for release
```

## Build Process & Release Artifacts

### Build Tool

- tsup: Zero-config TypeScript bundler
- Single entry point: `src/index.ts`
- Output format: ESM only
- Type declarations generated automatically

### Build Output

```
dist/
├── index.js           # Bundled ESM module
└── index.d.ts         # TypeScript type declarations
```

### Package Distribution

- Main entry: `./dist/index.js` (ESM)
- Types entry: `./dist/index.d.ts`
- Published files: `dist/` and `src/` directories
- Source access: Consumers can import from `tagged-string/src` for direct TS usage

### Release Process

1. `npm run build` - Bundles code and generates types
2. `prepublishOnly` hook runs build automatically before publishing
3. Clean build on each run (previous `dist/` removed)

## Development Constraints

When writing code for this project:
- Never add runtime dependencies to package.json
- Use only TypeScript/JavaScript standard library features
- Prefer simple, readable implementations over clever optimizations
- Direct TS execution is supported; no build step needed for dev work
