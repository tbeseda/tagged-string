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

The library focuses on parsing — extracting typed entities from plain strings. Generating tagged strings is trivial (just string interpolation), but a `TaggedStringGenerator` class is included as a reference implementation.

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

```typescript
const parser = new TaggedStringParser({
  delimiters: ['{{', '}}'],
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

Parse `key=value` / `key:value` patterns without surrounding delimiters. Entities are bounded by whitespace:

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

The `delimiters` option is unified: `false`/`[]` enables delimiter-free mode, `[open, close]` sets custom delimiters. The legacy `openDelimiter`/`closeDelimiter` options still work.

### Quoted Strings

Use double quotes to include spaces and special characters in keys or values:

```typescript
const parser = new TaggedStringParser({ delimiters: false, typeSeparator: '=' });

parser.parse('order="number 42" was placed').entities[0].value;    // "number 42"  (spaces in value)
parser.parse('"store order"=1337 was cancelled').entities[0].type; // "store order" (spaces in key)
```

Quoting works in delimited mode too, e.g. `["linux server"=home]`.

### Escape Sequences

Inside quoted strings, `\"` is a literal quote and `\\` is a literal backslash:

```typescript
const parser = new TaggedStringParser({ delimiters: false, typeSeparator: '=' });

parser.parse('msg="say \\"hello\\"" was sent').entities[0].value;   // 'say "hello"'
parser.parse('path="C:\\\\Users\\\\file.txt" opened').entities[0].value; // 'C:\Users\file.txt'
```

Escapes only apply inside quotes; backslashes in unquoted text are literal.

## API

### `TaggedStringParser`

```typescript
constructor(config?: ParserConfig)
parse(message: string): ParseResult
```

**Config options:**
- `delimiters` — `false`/`[]` for delimiter-free mode, or `[open, close]` for custom delimiters. Takes precedence over `openDelimiter`/`closeDelimiter`.
- `openDelimiter` / `closeDelimiter` (default `'['` / `']'`) — legacy delimiter options.
- `typeSeparator` (default `':'`) — separator between type and value.
- `schema` — entity type definitions with optional formatters.

### `ParseResult`

- `originalMessage: string` / `entities: Entity[]` — the input and extracted entities (in order).
- `getEntitiesByType(type: string): Entity[]` — filter by type.
- `getAllTypes(): string[]` — unique entity types.
- `format(): string` — reconstruct the message with formatted values.

### `Entity`

```typescript
interface Entity {
  type: string;                            // type name (may contain spaces if quoted)
  value: string;                           // raw value (quotes removed, escapes processed)
  parsedValue: string | number | boolean;  // typed value
  formattedValue: string;                   // formatted display value
  inferredType: 'string' | 'number' | 'boolean';
  position: number;                         // start index in the message
  endPosition: number;                      // end index in the message
}
```

### `EntitySchema`

```typescript
type EntitySchema = Record<string, PrimitiveType | EntityDefinition>;

interface EntityDefinition {
  type: 'string' | 'number' | 'boolean';
  format?: (value: unknown) => string;
}
```

## Type Inference

Without a schema, the parser infers types:

- **number** — matches `/^-?\d+(\.\d+)?$/` (integers and decimals)
- **boolean** — `'true'` or `'false'` (case-insensitive)
- **string** — everything else

## Error Handling

Parsing is lenient and never throws: malformed tags, unclosed tags/quotes, and empty keys or values are skipped, and parsing continues. The constructor throws only on invalid configuration (bad `delimiters`, empty delimiter strings, or identical open/close delimiters).

## Generating Tagged Strings

`TaggedStringGenerator` is a reference implementation for producing tags with consistent delimiters:

```typescript
import { TaggedStringGenerator } from 'tagged-string';

const generator = new TaggedStringGenerator();
generator.tag('operation', 'deploy');      // "[operation:deploy]"
generator.embed('started ', 'changes', 5); // "started [changes:5]"
```

`constructor(config?: GeneratorConfig)` accepts `openDelimiter`, `closeDelimiter`, and `typeSeparator`. For most cases a template literal (`` `[operation:deploy]` ``) is enough.

## Development

```bash
npm test              # typecheck, run tests, lint
npm run build         # compile to dist/ with tsc
node src/examples.ts  # run the examples
```

## License

MIT
