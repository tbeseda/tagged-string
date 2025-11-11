# Technology Stack

## Runtime

- **Node.js**: v24+ with native TypeScript support
- **Dependencies**: Zero runtime dependencies (core principle)

## TS Configuration

- **Target**: ES2022
- **Module System**: ESNext with Node resolution
- **Strict Mode**: Enabled for type safety

## Common Commands

```bash
# Run tests; no flags required
npm t

# Run TypeScript directly (Node v24+)
node src/parser.ts
```

## Development Principles

- No third-party runtime dependencies
- Direct TypeScript execution without build step during development
- TypeScript standard library only
- Simple, maintainable implementations over complex optimizations
