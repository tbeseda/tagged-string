# Tagged String

Extract structured data from strings using tag-based syntax. Zero dependencies, runs natively on Node.js v24+.

```typescript
import { TaggedStringParser } from 'tagged-string';

const parser = new TaggedStringParser();
const result = parser.parse('[operation:deploy] started with [changes:5] to [stack:prod-stack]');

console.log(result.entities);
// [
//   { type: 'operation', value: 'deploy', parsedValue: 'deploy', inferredType: 'string', ... },
//   { type: 'changes', value: '5', parsedValue: 5, inferredType: 'number', ... },
//   { type: 'stack', value: 'prod-stack', parsedValue: 'prod-stack', inferredType: 'string', ... }
// ]
```

The library focuses on parsing - extracting typed entities from plain strings. Generating tagged strings is trivial (just string interpolation); however, there is a `TaggedStringGenerator` class available as a reference or parent for your own implementation.

## Installation

```bash
npm install tagged-string
```

Requires Node.js v24 or later for native TypeScript support.

## Usage

### Basic Parsing

The parser extracts `[type:value]` tags from strings and automatically infers types:

```typescript
const parser = new TaggedStringParser();
const result = parser.parse('[count:42] items processed, [enabled:true] flag set');

result.entities.forEach(entity => {
  console.log(entity.type, entity.parsedValue, entity.inferredType);
});
// count 42 number
// enabled true boolean
```

### Schema-Based Parsing

Define a schema to enforce types and add formatters:

```typescript
const parser = new TaggedStringParser({
  schema: {
    operation: { type: 'string', format: (v) => v.toUpperCase() },
    changes: { type: 'number', format: (n) => `${n} changes` },
    stack: 'string', // shorthand without formatter
  }
});

const result = parser.parse('[operation:deploy] started with [changes:5] to [stack:prod-stack]');
console.log(result.format());
// "DEPLOY started with 5 changes to prod-stack"
```

### Filtering Entities

```typescript
const result = parser.parse('[action:create] [resource:function] with [count:3] instances');

result.getEntitiesByType('action');  // [{ type: 'action', parsedValue: 'create', ... }]
result.getAllTypes();                // ['action', 'resource', 'count']
```

### Custom Delimiters

Configure the parser to use different delimiters:

```typescript
const parser = new TaggedStringParser({
  openDelimiter: '{{',
  closeDelimiter: '}}',
  typeSeparator: '=',
  schema: {
    user: { type: 'string', format: (v) => `@${v}` }
  }
});

const result = parser.parse('User {{user=john}} performed {{count=10}} actions');
console.log(result.format());
// "User @john performed 10 actions"
```

## API

### `TaggedStringParser`

```typescript
constructor(config?: ParserConfig)
```

**Config options:**
- `openDelimiter` (default: `'['`) - Opening tag delimiter
- `closeDelimiter` (default: `']'`) - Closing tag delimiter  
- `typeSeparator` (default: `':'`) - Separator between type and value
- `schema` - Entity type definitions with optional formatters

```typescript
parse(message: string): ParseResult
```

Extracts all tagged entities from the message.

### `ParseResult`

**Properties:**
- `originalMessage: string` - The input message
- `entities: Entity[]` - Extracted entities in order

**Methods:**
- `getEntitiesByType(type: string): Entity[]` - Filter entities by type
- `getAllTypes(): string[]` - Get unique entity types
- `format(): string` - Reconstruct message with formatted values

### `Entity`

```typescript
interface Entity {
  type: string;                           // Entity type name
  value: string;                          // Raw string value
  parsedValue: string | number | boolean; // Typed value
  formattedValue: string;                 // Formatted display value
  inferredType: 'string' | 'number' | 'boolean';
  position: number;                       // Start position in message
  endPosition: number;                    // End position in message
}
```

### `EntitySchema`

```typescript
type EntitySchema = Record<string, PrimitiveType | EntityDefinition>;

interface EntityDefinition {
  type: 'string' | 'number' | 'boolean';
  format?: (value: any) => string;
}
```

## Type Inference

Without a schema, the parser infers types automatically:

- **number**: Matches `/^-?\d+(\.\d+)?$/` (integers and decimals)
- **boolean**: `'true'` or `'false'` (case-insensitive)
- **string**: Everything else

## Error Handling

The parser is lenient by design:
- Malformed tags are skipped
- Unclosed tags at end of string are ignored
- Empty tag content is skipped
- Invalid config throws on construction

## Generating Tagged Strings

While you can create tagged strings with simple string interpolation, `TaggedStringGenerator` provides a reference implementation:

```typescript
import { TaggedStringGenerator } from 'tagged-string';

const generator = new TaggedStringGenerator();

// Simple tag generation
const tag = generator.tag('operation', 'deploy');
// "[operation:deploy]"

// Or just use template literals
const message = `[operation:deploy] started with [changes:${5}]`;
```

The generator is useful when you need to ensure delimiter consistency across a system.

### `TaggedStringGenerator`

```typescript
constructor(config?: GeneratorConfig)
```

**Config options:**
- `openDelimiter` (default: `'['`) - Opening tag delimiter
- `closeDelimiter` (default: `']'`) - Closing tag delimiter  
- `typeSeparator` (default: `':'`) - Separator between type and value

```typescript
tag(type: string, value: unknown): string
```

Generates a single tagged entity. Values are converted to strings automatically.

```typescript
embed(message: string, type: string, value: unknown): string
```

Convenience method that concatenates a message with a generated tag.

## Examples

Run the included examples:

```bash
node src/examples.ts
```

## Development

```bash
npm test                    # Run tests
node src/examples.ts        # Run examples
```

## License

MIT
