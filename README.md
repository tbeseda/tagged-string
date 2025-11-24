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

### Delimiter-Free Mode

Parse key-value patterns without surrounding delimiters:

```typescript
const parser = new TaggedStringParser({
  delimiters: false,  // or delimiters: []
  typeSeparator: '='  // default is ':', use '=' for key=value syntax
});

const result = parser.parse('order=1337 was placed with status=pending');
console.log(result.entities);
// [
//   { type: 'order', value: '1337', parsedValue: 1337, inferredType: 'number', ... },
//   { type: 'status', value: 'pending', parsedValue: 'pending', inferredType: 'string', ... }
// ]
```

Delimiter-free mode extracts `key=value` or `key:value` patterns from natural language strings. Entities are identified by whitespace boundaries.

**Unified delimiter configuration:**

```typescript
// Delimiter-free mode
new TaggedStringParser({ delimiters: false })
new TaggedStringParser({ delimiters: [] })

// Delimited mode with custom delimiters
new TaggedStringParser({ delimiters: ['{{', '}}'] })

// Backward compatible (still works)
new TaggedStringParser({ openDelimiter: '[', closeDelimiter: ']' })
```

### Quoted Strings

Use double quotes to include spaces and special characters in keys or values:

```typescript
const parser = new TaggedStringParser({
  delimiters: false,
  typeSeparator: '='
});

// Quoted values preserve spaces
const result1 = parser.parse('order="number 42" was placed');
console.log(result1.entities[0].value);  // "number 42"

// Quoted keys allow spaces in type names
const result2 = parser.parse('"store order"=1337 was cancelled');
console.log(result2.entities[0].type);   // "store order"

// Works in delimited mode too
const parser2 = new TaggedStringParser({
  delimiters: ['[', ']'],
  typeSeparator: '='
});
const result3 = parser2.parse('Server ["linux server"=home] is running');
console.log(result3.entities[0].type);   // "linux server"
```

### Escape Sequences

Use backslash to include literal quotes within quoted strings:

```typescript
const parser = new TaggedStringParser({
  delimiters: false,
  typeSeparator: '='
});

// Escape quotes with \"
const result1 = parser.parse('msg="say \\"hello\\"" was sent');
console.log(result1.entities[0].value);  // 'say "hello"'

// Escape backslashes with \\
const result2 = parser.parse('path="C:\\\\Users\\\\file.txt" opened');
console.log(result2.entities[0].value);  // 'C:\Users\file.txt'
```

**Supported escape sequences:**
- `\"` → literal double quote (`"`)
- `\\` → literal backslash (`\`)

Escape sequences only work inside quoted strings. Backslashes in unquoted text are treated as literal characters.

## API

### `TaggedStringParser`

```typescript
constructor(config?: ParserConfig)
```

**Config options:**
- `delimiters` - Unified delimiter configuration:
  - `false` or `[]` - Enable delimiter-free mode (parse `key=value` patterns)
  - `[open, close]` - Use specified delimiters (e.g., `['{{', '}}']`)
  - If omitted, uses `openDelimiter` and `closeDelimiter` options
- `openDelimiter` (default: `'['`) - Opening tag delimiter (legacy, use `delimiters` instead)
- `closeDelimiter` (default: `']'`) - Closing tag delimiter (legacy, use `delimiters` instead)
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
  type: string;                           // Entity type name (can contain spaces if quoted)
  value: string;                          // Raw string value (quotes removed, escapes processed)
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

**Delimited mode:**
- Malformed tags are skipped
- Unclosed tags at end of string are ignored
- Empty tag content is skipped

**Delimiter-free mode:**
- Unclosed quoted strings are skipped
- Keys without values are skipped
- Empty keys or values are skipped
- Malformed patterns are ignored, parsing continues

**Configuration errors** (throw on construction):
- Invalid `delimiters` value
- Empty delimiter strings in delimited mode
- Same open and close delimiters

## Complete Examples

### Delimited Mode (Traditional)

```typescript
const parser = new TaggedStringParser({
  schema: {
    operation: { type: 'string', format: (v) => v.toUpperCase() },
    count: { type: 'number', format: (n) => `${n} items` }
  }
});

const result = parser.parse('[operation:deploy] completed with [count:42]');
console.log(result.format());
// "DEPLOY completed with 42 items"
```

### Delimiter-Free Mode

```typescript
const parser = new TaggedStringParser({
  delimiters: false,
  typeSeparator: '=',
  schema: {
    order: 'number',
    status: 'string'
  }
});

const result = parser.parse('Processing order=1337 with status=pending');
console.log(result.entities);
// [
//   { type: 'order', parsedValue: 1337, inferredType: 'number', ... },
//   { type: 'status', parsedValue: 'pending', inferredType: 'string', ... }
// ]
```

### Quoted Strings with Spaces

```typescript
const parser = new TaggedStringParser({
  delimiters: false,
  typeSeparator: '='
});

// Quoted values
const msg1 = 'description="high priority task" created';
const result1 = parser.parse(msg1);
console.log(result1.entities[0].value);  // "high priority task"

// Quoted keys
const msg2 = '"user name"=john logged in';
const result2 = parser.parse(msg2);
console.log(result2.entities[0].type);   // "user name"

// Both quoted
const msg3 = '"store order"="order number 42" processed';
const result3 = parser.parse(msg3);
console.log(result3.entities[0].type);   // "store order"
console.log(result3.entities[0].value);  // "order number 42"
```

### Escape Sequences

```typescript
const parser = new TaggedStringParser({
  delimiters: false,
  typeSeparator: '='
});

// Escaped quotes
const msg1 = 'message="She said \\"hello\\"" sent';
const result1 = parser.parse(msg1);
console.log(result1.entities[0].value);  // 'She said "hello"'

// Escaped backslashes
const msg2 = 'path="C:\\\\Program Files\\\\app.exe" opened';
const result2 = parser.parse(msg2);
console.log(result2.entities[0].value);  // 'C:\Program Files\app.exe'

// Mixed escapes
const msg3 = 'text="Line 1\\nLine 2" contains \\n';
const result3 = parser.parse(msg3);
console.log(result3.entities[0].value);  // 'Line 1\nLine 2'
```

### Mixed Mode Usage

```typescript
// Delimited mode for structured logs
const delimitedParser = new TaggedStringParser({
  delimiters: ['[', ']'],
  schema: { level: 'string', code: 'number' }
});

// Delimiter-free for natural language
const freeParser = new TaggedStringParser({
  delimiters: false,
  typeSeparator: '=',
  schema: { order: 'number', user: 'string' }
});

const log = delimitedParser.parse('[level:ERROR] [code:500] Server error');
const event = freeParser.parse('User user=alice placed order=1337');

console.log(log.getEntitiesByType('level')[0].value);    // "ERROR"
console.log(event.getEntitiesByType('order')[0].value);  // "1337"
```

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
