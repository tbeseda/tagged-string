# Design Document

## Overview

The TaggedStringGenerator provides a minimal, focused utility for producing correctly formatted tagged strings. It serves as the complement to TaggedStringParser, enabling producers to generate strings that consumers can parse. The design emphasizes simplicity and serves as a reference implementation rather than a feature-rich toolkit.

## Architecture

### Class Structure

The generator follows the same architectural patterns as the existing parser:

- **Class-based design**: `TaggedStringGenerator` class with configuration
- **Immutable configuration**: Config set at construction time
- **Type-first**: All types defined in `src/types.ts`
- **Co-located tests**: `TaggedStringGenerator.test.ts` alongside implementation

### Configuration Alignment

The generator uses the same configuration interface as the parser to ensure compatibility:

```typescript
interface GeneratorConfig {
  openDelimiter?: string
  closeDelimiter?: string
  typeSeparator?: string
}
```

Default values match parser defaults:
- `openDelimiter`: `[`
- `closeDelimiter`: `]`
- `typeSeparator`: `:`

## Components and Interfaces

### TaggedStringGenerator Class

**Constructor**
```typescript
constructor(config?: GeneratorConfig)
```
- Accepts optional configuration
- Sets defaults matching parser
- Validates configuration (non-empty delimiters, different open/close)

**Public Methods**

1. `tag(type: string, value: unknown): string`
   - Generates a single tagged entity
   - Converts value to string if needed
   - Returns formatted tag: `${openDelimiter}${type}${typeSeparator}${value}${closeDelimiter}`
   - Example: `tag('operation', 'deploy')` → `[operation:deploy]`

2. `embed(message: string, type: string, value: unknown): string`
   - Convenience method for embedding a tag in a message
   - Returns: `${message}${tag(type, value)}`
   - Example: `embed('Starting ', 'operation', 'deploy')` → `Starting [operation:deploy]`

**Private Methods**

1. `validateConfig(): void`
   - Validates delimiter configuration
   - Throws on invalid config (empty delimiters, same open/close)

2. `valueToString(value: unknown): string`
   - Converts any value to string representation
   - Handles primitives, objects, arrays
   - Uses `String(value)` for simple conversion

### Type Definitions

Add to `src/types.ts`:

```typescript
/**
 * Configuration options for the generator
 */
export interface GeneratorConfig {
  openDelimiter?: string
  closeDelimiter?: string
  typeSeparator?: string
}
```

## Data Models

No new data models required. The generator produces strings that conform to the existing `Entity` structure when parsed.

## Error Handling

Following the library's lenient philosophy:

**Configuration Errors** (throw at construction):
- Empty delimiters
- Identical open/close delimiters

**Runtime Behavior** (never throw):
- Empty type: generates tag with empty type (e.g., `[:value]`)
- Empty value: generates tag with empty value (e.g., `[type:]`)
- Special characters in values: passed through as-is (no escaping)
- Null/undefined values: converted to string `"null"` or `"undefined"`

**Rationale**: The parser is lenient and handles malformed input gracefully. The generator should allow producers to generate any string format, even if unconventional. Escaping is intentionally omitted to keep the implementation minimal and avoid assumptions about producer needs.

## Integration Points

### Export from index.ts

```typescript
export { TaggedStringGenerator } from './TaggedStringGenerator.ts'
export type { GeneratorConfig } from './types.ts'
```

### Parser Compatibility

The generator output must be parseable by TaggedStringParser with matching configuration:

```typescript
const config = { openDelimiter: '{{', closeDelimiter: '}}' }
const generator = new TaggedStringGenerator(config)
const parser = new TaggedStringParser(config)

const tagged = generator.tag('operation', 'deploy')
const result = parser.parse(tagged)
// result.entities[0].type === 'operation'
// result.entities[0].value === 'deploy'
```

## Testing Strategy

### Unit Tests (TaggedStringGenerator.test.ts)

**Basic Generation**
- Default configuration generates correct format
- Type and value are properly separated
- Multiple tags can be generated independently

**Custom Delimiters**
- Custom open/close delimiters work correctly
- Custom type separator works correctly
- Mixed custom configurations work

**Value Conversion**
- Numbers converted to strings
- Booleans converted to strings
- Objects/arrays converted to strings
- Null/undefined handled

**Edge Cases**
- Empty type generates valid tag
- Empty value generates valid tag
- Special characters in values pass through
- Whitespace in values preserved

**Parser Compatibility**
- Generated tags can be parsed with matching config
- Parsed entities match original type and value
- Round-trip (generate → parse → generate) produces same output

### Integration with Examples

Update `src/examples.ts` to include:

**Example: Producer-Consumer Pattern**
- Show generator creating tagged strings
- Show parser consuming those strings
- Demonstrate matching configurations

**Example: Custom Delimiters with Generator**
- Generate tags with custom delimiters
- Parse them with matching parser config

**Constraint**: Only add 1-2 focused examples. Most existing examples should remain unchanged since they demonstrate parsing, not production.

### Test Coverage Goals

- 100% line coverage for TaggedStringGenerator
- All public methods tested
- All configuration options tested
- Parser compatibility verified

## Design Decisions

### Minimal API Surface

**Decision**: Provide only `tag()` and `embed()` methods

**Rationale**: 
- Keeps implementation simple and focused
- Serves as reference without becoming a framework
- Producers can compose these primitives for complex needs
- Avoids feature creep (templates, batch operations, etc.)

### No Escaping Logic

**Decision**: Pass values through without escaping delimiters

**Rationale**:
- Parser is lenient and handles malformed input
- Escaping adds complexity and assumptions
- Producers can implement their own escaping if needed
- Keeps generator minimal and predictable

### No Formatting/Transformation

**Decision**: No formatter functions or value transformation

**Rationale**:
- Generator is for production, not presentation
- Formatters belong in parser schema for consumption
- Producers control their own value formatting
- Maintains clear separation of concerns

### Configuration Validation

**Decision**: Validate config at construction, throw on invalid

**Rationale**:
- Matches parser behavior
- Fails fast on misconfiguration
- Invalid config would produce unparseable output
- Better developer experience than silent failures

## Non-Goals

Explicitly out of scope:

- Template systems or string interpolation
- Batch generation of multiple entities
- Schema validation or type checking
- Value escaping or sanitization
- Integration with logging frameworks
- Serialization/deserialization helpers
- Builder patterns or fluent APIs

These features would add complexity without serving the core goal of providing a minimal reference implementation.
