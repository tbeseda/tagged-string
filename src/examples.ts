import { TaggedStringGenerator } from './TaggedStringGenerator.ts'
import { TaggedStringParser } from './TaggedStringParser.ts'
import type { EntitySchema } from './types.ts'

const schema: EntitySchema = {
  operation: {
    type: 'string',
    format: (value) => String(value).toUpperCase(),
  },
  changes: {
    type: 'number',
    format: (value) => `${value} changes`,
  },
  stack: 'string',
}

const parser = new TaggedStringParser({ schema })
const result = parser.parse(
  '[operation:deploy] started with [changes:5] to [stack:production]',
)

console.log(result.entities)
console.log(result.format())

const delimiterFreeParser = new TaggedStringParser({
  delimiters: false,
  typeSeparator: '=',
})

console.log(
  delimiterFreeParser.parse('order=1337 status="in progress"').entities,
)

const generator = new TaggedStringGenerator()
const generated = generator.tag('message', 'wait [here]')

console.log(generated)
console.log(parser.parse(generated).entities)
