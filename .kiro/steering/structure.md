---
inclusion: always
---

# Architecture & Code Conventions

## File Organization

All type definitions belong in `src/types.ts` as the single source of truth. Test files use the `*.test.ts` pattern and live alongside their implementation files. Only export public APIs through `src/index.ts` - keep internal implementations private.

```
src/
├── types.ts                 # All type definitions
├── TaggedStringParser.ts    # Main parser class
├── ParseResult.ts           # Result wrapper with utilities
├── index.ts                 # Public API exports only
└── *.test.ts                # Co-located tests
```

## Architectural Principles

**Single-pass parsing**: Process the entire input string once. Never iterate multiple times over the same content.

**Lenient parsing**: Skip malformed tags silently and continue. Never throw exceptions during parsing. Return empty results for invalid input rather than errors.

**Type-first development**: Define all types in `src/types.ts` before implementing features. Every public API must have complete TypeScript type annotations.

**Immutability**: Never mutate input strings, config objects, or parsed results. Return new objects instead.

## Core Type Definitions

When working with the codebase, these are the key types defined in `src/types.ts`:

- `Entity`: Parsed entity containing `type`, `value`, `parsedValue`, `formattedValue`, `inferredType`, and `position` (with `start` and `end` indices)
- `EntityDefinition`: Schema entry with optional `formatter` function for value transformation
- `EntitySchema`: Map from entity type string to `EntityDefinition`
- `ParserConfig`: Configuration object with `schema`, `openDelimiter`, and `closeDelimiter`
- `ParseResult`: Wrapper class providing filtering and message reconstruction methods

## Code Style Requirements

**Documentation**: Add JSDoc comments to all public methods, classes, and interfaces. Include parameter descriptions and return types.

**Position tracking**: Every parsed entity must include `position: { start: number, end: number }` indicating its location in the original string.

**Class vs function**: Use classes for stateful components (parser, result wrapper). Use pure functions for stateless utilities.

**Exports**: Only export through `src/index.ts`. Mark internal implementations as unexported or use private class members.

## Error Handling Strategy

The library follows a fail-safe approach:

- Malformed tags (missing colon, incomplete delimiters) → skip silently, continue parsing
- Unknown entity types (not in schema) → parse anyway, infer type as string/number/boolean
- Missing or invalid delimiters → return empty `ParseResult`
- Formatter function throws → catch exception, use original `parsedValue` as `formattedValue`

Never throw exceptions during parsing. Handle all edge cases gracefully.

## Implementation Guidelines

When adding features or fixing bugs:

1. Define or update types in `src/types.ts` first
2. Implement the feature following single-pass parsing principles
3. Add JSDoc comments to public APIs
4. Ensure position tracking for all parsed entities
5. Handle errors silently per the fail-safe strategy
6. Add tests in co-located `*.test.ts` files
7. Update `TODO.md` if discovering new issues or completing major tasks
8. Export new public APIs through `src/index.ts` only
