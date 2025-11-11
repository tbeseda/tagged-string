---
inclusion: always
---

# Architecture & Code Conventions

## File Structure

```
src/
├── types.ts                 # All type definitions (single source of truth)
├── TaggedStringParser.ts    # Main parser class
├── ParseResult.ts           # Result wrapper with utilities
├── index.ts                 # Public API exports only
└── *.test.ts                # Tests co-located with implementation
```

## Core Architecture

Single-pass parsing: Extract all entities in one iteration, no multiple passes.

Lenient by design: Skip malformed tags silently. Never throw during parsing. Return empty results for invalid input.

Type-first: Define types in `src/types.ts` before implementation. All public APIs must have complete TypeScript types.

## Key Types

- `Entity`: Parsed entity with `type`, `value`, `parsedValue`, `formattedValue`, `inferredType`, `position`
- `EntityDefinition`: Schema entry with optional `formatter` function
- `EntitySchema`: Map of entity type to definition
- `ParserConfig`: Config with `schema`, `openDelimiter`, `closeDelimiter`
- `ParseResult`: Wrapper with filtering and reconstruction methods

## Code Style

JSDoc required: All public methods and interfaces need JSDoc comments.

Position tracking: Every entity must include `{ start, end }` position in original string.

Immutability: Never mutate input strings or config objects.

Class-based: Use classes for parser and result. Pure functions for utilities.

Export control: Only export public API through `src/index.ts`. Internal implementations stay private.

## Error Handling Rules

- Malformed tags → skip silently, continue parsing
- Unknown entity types → infer type (string/number/boolean)
- Missing delimiters → return empty result
- Formatter throws → fall back to original value

## Testing

Co-locate tests: `*.test.ts` files live alongside implementation files.

## Maintenance

Update `TODO.md` when discovering bugs, missing features, or completing major tasks.
