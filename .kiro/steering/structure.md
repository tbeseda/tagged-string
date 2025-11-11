# Project Structure

## Directory Layout

```
.
├── .kiro/
│   ├── specs/          # Feature specifications (requirements, design, tasks)
│   └── steering/       # AI assistant guidance documents
├── src/
│   └── types.ts        # Core type definitions and interfaces
├── dist/               # Compiled output (generated)
├── TODO.md             # Project task list (keep updated)
└── tsconfig.json       # TypeScript configuration
```

## Code Organization

### Type Definitions (`src/types.ts`)

Central location for all TypeScript interfaces and types:
- `PrimitiveType`: Supported primitive types (string, number, boolean)
- `EntityDefinition`: Entity schema with optional formatter
- `EntitySchema`: Schema mapping for entity types
- `Entity`: Parsed entity structure with type, value, parsedValue, formattedValue, inferredType, position
- `ParserConfig`: Parser configuration options
- `ParseResult`: Parse result with utility methods

### Implementation Files (to be created)

- Parser class implementation
- ParseResult class implementation
- Helper functions for type inference and formatting

## Conventions

- All interfaces and types defined before implementation
- Comprehensive JSDoc comments on public interfaces
- Single-pass parsing architecture
- Lenient error handling (skip malformed input, don't throw)
- Position tracking for all extracted entities
- Keep TODO.md updated with current tasks and progress
- Add issues, bugs, and important features to TODO.md when discovered
