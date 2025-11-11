# Design Document

## Overview

The Tagged String library is a simple, zero-dependency TypeScript library that extracts tagged entities from strings. The design focuses on simplicity and minimal API surface while providing flexible configuration options.

**Example Usage:**
```typescript
import chalk from 'chalk'; // Example formatter (not a dependency of parser)

// Define schema for known entity types with formatters
const schema = {
  operation: { type: 'string', format: chalk.yellow },
  stack: { type: 'string', format: chalk.blue },
  changes: { type: 'number', format: (n) => chalk.green(n.toString()) },
  create: 'number',  // Can use shorthand without formatter
  update: 'number',
  destroy: 'number'
};

const parser = new TaggedStringParser({ schema });
const result = parser.parse('[operation:OP-123] started with [changes:5] to [stack:ST-456]');

// Access parsed entities
// result.entities: [
//   { type: 'operation', value: 'OP-123', parsedValue: 'OP-123', formattedValue: '\x1b[33mOP-123\x1b[39m', inferredType: 'string', position: 0 },
//   { type: 'changes', value: '5', parsedValue: 5, formattedValue: '\x1b[32m5\x1b[39m', inferredType: 'number', position: 32 },
//   { type: 'stack', value: 'ST-456', parsedValue: 'ST-456', formattedValue: '\x1b[34mST-456\x1b[39m', inferredType: 'string', position: 48 }
// ]

// Get formatted message with all entities formatted
console.log(result.format());
// Output: "\x1b[33mOP-123\x1b[39m started with \x1b[32m5\x1b[39m to \x1b[34mST-456\x1b[39m"

// Unknown entity types are automatically inferred (no formatting)
const result2 = parser.parse('[count:42] [enabled:true] [name:test]');
// result2.entities: [
//   { type: 'count', value: '42', parsedValue: 42, formattedValue: '42', inferredType: 'number', position: 0 },
//   { type: 'enabled', value: 'true', parsedValue: true, formattedValue: 'true', inferredType: 'boolean', position: 11 },
//   { type: 'name', value: 'test', parsedValue: 'test', formattedValue: 'test', inferredType: 'string', position: 26 }
// ]

// Filter by type
result.getEntitiesByType('operation'); // [{ type: 'operation', value: 'OP-123', ... }]

// Get all types
result.getAllTypes(); // ['operation', 'changes', 'stack']
```

## Architecture

The parser follows a simple single-pass scanning architecture:

1. **Input**: Raw string + optional configuration
2. **Scanning**: Character-by-character traversal identifying tag boundaries
3. **Extraction**: Parse entity type and value from tag content
4. **Output**: Collection of parsed entities with original message preserved

The design uses a state machine approach during scanning to track whether the parser is inside or outside a tag.

## Components and Interfaces

### Entity Interface
```typescript
interface Entity {
  type: string;              // Entity type name (e.g., 'operation', 'count')
  value: string;             // Raw string value from tag
  parsedValue: string | number | boolean; // Typed value based on schema or inference
  formattedValue: string;    // Formatted string (via formatter or toString of parsedValue)
  inferredType: 'string' | 'number' | 'boolean'; // The determined type
  position: number;          // Character position in original string
}
```

### EntitySchema Type
```typescript
type PrimitiveType = 'string' | 'number' | 'boolean';

interface EntityDefinition {
  type: PrimitiveType;
  format?: (value: any) => string; // Optional formatter function
}

type EntitySchema = Record<string, PrimitiveType | EntityDefinition>;
```

### ParserConfig Interface
```typescript
interface ParserConfig {
  openDelimiter?: string;   // Default: '['
  closeDelimiter?: string;  // Default: ']'
  typeSeparator?: string;   // Default: ':'
  schema?: EntitySchema;    // Optional schema for known entity types
}
```

### ParseResult Interface
```typescript
interface ParseResult {
  originalMessage: string;
  entities: Entity[];
  
  // Utility methods
  getEntitiesByType(type: string): Entity[];
  getAllTypes(): string[];
  format(): string; // Returns message with all entities replaced by their formattedValue
}
```

### TaggedStringParser Class
```typescript
class TaggedStringParser {
  constructor(config?: ParserConfig);
  parse(message: string): ParseResult;
  
  // Internal helper methods
  private parseValue(type: string, rawValue: string): { 
    parsedValue: string | number | boolean, 
    formattedValue: string,
    inferredType: 'string' | 'number' | 'boolean' 
  };
  private inferType(value: string): 'string' | 'number' | 'boolean';
  private applyFormatter(type: string, parsedValue: any): string;
}
```

## Data Models

### Internal Scanner State
The parser maintains minimal state during scanning:
- Current position in string
- Whether currently inside a tag
- Current tag content buffer
- Accumulated entities array

### Entity Representation
Entities are plain objects with six properties:
- `type`: The classification/name of the entity (e.g., 'operation', 'count')
- `value`: The raw string value extracted from the tag
- `parsedValue`: The typed value (string, number, or boolean) based on schema or inference
- `formattedValue`: The string representation after applying formatter (or toString of parsedValue)
- `inferredType`: The determined primitive type
- `position`: Where in the original string the tag started (useful for debugging)

### Schema, Type Inference, and Formatting
The parser supports three layers of entity processing:

1. **Schema-based Type Parsing (Known Entities)**: When a schema is provided and an entity type matches a schema key, the parser uses the schema's specified type to parse the value.

2. **Inference-based Type Parsing (Unknown Entities)**: When no schema is provided or an entity type is not in the schema, the parser automatically infers the type:
   - Numbers: Values matching `/^-?\d+(\.\d+)?$/` are parsed as numbers
   - Booleans: Values matching `true` or `false` (case-insensitive) are parsed as booleans
   - Strings: Everything else defaults to string type

3. **Formatting**: After parsing, entities can be formatted:
   - If a formatter function is provided in the schema, it's applied to the parsedValue
   - If no formatter is provided, the parsedValue is converted to string
   - The formattedValue is used when calling `result.format()` to reconstruct the message

This three-layer approach allows users to:
- Define expected entity types explicitly
- Handle ad-hoc entities automatically
- Apply custom formatting (colors, trimming, etc.) per entity type

## Error Handling

The parser follows a lenient error handling strategy:

1. **Malformed Tags**: Skip and continue parsing
   - Unclosed tags: Ignore the incomplete tag
   - Missing type separator: Treat entire content as value with empty type
   - Empty tags: Skip entirely

2. **Invalid Configuration**: Throw errors during construction
   - Empty delimiters
   - Delimiter conflicts (open === close)
   - Multi-character delimiters that could cause ambiguity

3. **Edge Cases**:
   - Empty strings: Return empty entity array
   - Nested tags: Not supported, inner delimiters treated as literal characters
   - Escaped delimiters: Not supported in v1 (future enhancement)

## Testing Strategy

### Unit Tests
Focus on core parsing logic:
- Single entity extraction
- Multiple entities in one message
- Messages without entities
- Malformed tag handling
- Custom delimiter configuration
- Entity ordering preservation
- Type-based filtering
- Schema-based type parsing
- Automatic type inference for unknown entities
- Number, boolean, and string type detection

### Test Structure
```typescript
describe('TaggedStringParser', () => {
  describe('parse', () => {
    it('should extract single entity');
    it('should extract multiple entities');
    it('should handle messages without entities');
    it('should skip malformed tags');
    it('should preserve entity order');
  });
  
  describe('schema and type inference', () => {
    it('should parse known entities using schema');
    it('should infer number type for numeric values');
    it('should infer boolean type for true/false values');
    it('should default to string type for other values');
    it('should handle mixed known and unknown entities');
  });
  
  describe('configuration', () => {
    it('should use custom delimiters');
    it('should throw on invalid config');
  });
  
  describe('ParseResult', () => {
    it('should filter entities by type');
    it('should return all entity types');
  });
});
```

## Real-World Examples

Based on IaC system logging patterns:

```typescript
// Operation lifecycle
parser.parse('[operation:OP-123] started with [changes:5] to [stack:ST-456]');
parser.parse('[operation:OP-123] completed [changes:5] to [stack:ST-456]');
parser.parse('[operation:OP-123] failed: [reason:"Error message"]');

// Planning
parser.parse('[blueprint:BP-123] planning for [stack:ST-456]');
parser.parse('[blueprint:BP-123] plan complete with [create:2] [update:3] [destroy:1] for [stack:ST-456]');

// Resource commands
parser.parse('[action:create] executing for [resource:RS-123] [resourceName:"my-function"] [type:function]');
parser.parse('[action:create] completed for [resource:RS-123] [externalId:EXT-789]');
parser.parse('[action:create] failed for [resource:RS-123]: [error:"Error message"]');

// Resource type-specific
parser.parse('[resourceType:function] creating [resourceName:"my-function"]');
parser.parse('[resourceType:database] updating [resourceName:"user-db"]');
```

### Handling Quoted Values
Note that values may contain quotes (e.g., `[resourceName:"my-function"]`). The parser treats everything between the type separator and closing delimiter as the value, including quotes. This keeps the implementation simple while preserving the original data format.

## Runtime Environment

### Node.js v24 Native TypeScript Support
The parser is designed to run directly with Node.js v24's native TypeScript execution:

```bash
# Run directly without compilation
node --experimental-strip-types parser.ts

# Or with the simpler flag (Node v24+)
node parser.ts
```

No build step or compilation to JavaScript is required. The parser can be developed and executed as pure TypeScript files.

## Implementation Notes

### Performance Considerations
- Single-pass parsing: O(n) time complexity
- Type inference uses simple string checks (no regex for numbers/booleans)
- Minimal memory allocation (reuse buffers where possible)
- Schema lookup is O(1) using object property access

### Design Decisions

**Why character-by-character scanning?**
- Simpler to understand and maintain
- No regex complexity
- Easier to handle edge cases
- Predictable performance

**Why lenient error handling?**
- Strings should never break parsing
- Partial data is better than no data
- Aligns with robustness principle: "Be liberal in what you accept"

**Why include position in Entity?**
- Useful for debugging
- Minimal overhead
- Enables future features (e.g., highlighting in UI)

**Why no nested tag support?**
- Keeps implementation simple
- Rare use case for strings
- Can be added later if needed

**Why both schema and inference?**
- Schema provides explicit control for important entity types
- Inference handles ad-hoc entities without configuration
- Consumers get typed values for better formatting control
- Balances flexibility with type safety

**Why Node v24 without compilation?**
- Faster development iteration (no build step)
- Simpler project setup
- Native TypeScript support is stable in Node v24
- Reduces tooling complexity
