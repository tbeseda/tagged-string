# Tagged String

Extract typed values from tagged text. The package has no runtime dependencies and supports Node.js 24 or later.

```typescript
import { TaggedStringParser } from 'tagged-string'

const parser = new TaggedStringParser()
const result = parser.parse(
  '[operation:deploy] started with [changes:5] to [stack:production]',
)

result.entities.map(({ type, parsedValue }) => ({ type, parsedValue }))
// [
//   { type: 'operation', parsedValue: 'deploy' },
//   { type: 'changes', parsedValue: 5 },
//   { type: 'stack', parsedValue: 'production' },
// ]
```

## Install

```bash
npm install tagged-string
```

## Schemas and formatting

Without a schema, values matching `/^-?\d+(\.\d+)?$/` become numbers and `true` or `false` become booleans. Other values remain strings.

A schema can select a type and format the value when reconstructing the message:

```typescript
const parser = new TaggedStringParser({
  schema: {
    operation: {
      type: 'string',
      format: (value) => String(value).toUpperCase(),
    },
    changes: {
      type: 'number',
      format: (value) => `${value} changes`,
    },
    stack: 'string',
  },
})

const result = parser.parse(
  '[operation:deploy] started with [changes:5] to [stack:production]',
)

result.format()
// 'DEPLOY started with 5 changes to production'
```

`format()` replaces each tag with its formatted value and preserves the text around it.

## Custom delimiters

Use `delimiters` to replace the default `[` and `]`. A type separator must be one nonempty character.

```typescript
const parser = new TaggedStringParser({
  delimiters: ['{{', '}}'],
  typeSeparator: '=',
})

parser.parse('User {{name=Taylor}} changed {{count=3}} files').entities
```

The older `openDelimiter` and `closeDelimiter` options remain available. `delimiters` takes precedence when both forms are provided.

## Delimiter-free parsing

Set `delimiters` to `false` or `[]` to parse whitespace-bounded tokens:

```typescript
const parser = new TaggedStringParser({
  delimiters: false,
  typeSeparator: '=',
})

parser.parse('order=1337 status="in progress"').entities
```

Double quotes allow spaces or syntax characters in keys and values. Within quotes, `\"` represents a quote and `\\` represents a backslash. Other backslashes remain literal.

## Generating tags

`TaggedStringGenerator` uses the same default delimiters as the parser. It quotes and escapes values when necessary so its output can be parsed with matching configuration.

```typescript
import { TaggedStringGenerator } from 'tagged-string'

const generator = new TaggedStringGenerator()

generator.tag('operation', 'deploy')
// '[operation:deploy]'

generator.tag('message', 'wait [here]')
// '[message:"wait [here]"]'

generator.embed('Starting ', 'changes', 5)
// 'Starting [changes:5]'
```

## API

### `TaggedStringParser`

```typescript
new TaggedStringParser(config?: ParserConfig)
parser.parse(message: string): ParseResult
```

`ParserConfig` accepts:

- `delimiters`: `[open, close]`, `false`, or `[]`
- `openDelimiter` and `closeDelimiter`: legacy alternatives to `delimiters`
- `typeSeparator`: one character, defaulting to `:`
- `schema`: a record of entity names to primitive types or formatter definitions

Parsing is lenient. Empty and unterminated tags are ignored, and parsing continues when possible. A delimited tag without a type separator, such as `[value]`, produces an entity with an empty type. Constructors throw for invalid configuration.

### `ParseResult`

- `originalMessage`: the input string
- `entities`: parsed entities in source order
- `getEntitiesByType(type)`: entities with the requested type
- `getAllTypes()`: unique types in source order
- `format()`: the message with tags replaced by formatted values

Each entity contains:

```typescript
interface Entity {
  type: string
  value: string
  parsedValue: string | number | boolean
  formattedValue: string
  inferredType: 'string' | 'number' | 'boolean'
  position: number
  endPosition: number
}
```

`value` has surrounding quotes removed and supported escapes decoded. `position` is inclusive; `endPosition` is exclusive.

## Development

```bash
npm test          # typecheck, test, and lint
npm run build     # compile dist
npm run lint:fix  # apply formatting and lint fixes
npm run examples  # run the examples
```

## License

MIT
