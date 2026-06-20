import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'
import type { EntitySchema } from '../../src/types.ts'

describe('Formatter Functions', () => {
  describe('basic formatters', () => {
    test('should apply formatter to entity values', () => {
      const schema: EntitySchema = {
        operation: {
          type: 'string',
          format: (val) => `**${val}**`,
        },
        count: {
          type: 'number',
          format: (val) => `[${val} items]`,
        },
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[operation:OP-123] has [count:5]')

      assert.strictEqual(result.entities[0].formattedValue, '**OP-123**')
      assert.strictEqual(result.entities[1].formattedValue, '[5 items]')
    })

    test('should apply formatter with uppercase transformation', () => {
      const schema: EntitySchema = {
        name: {
          type: 'string',
          format: (val) => String(val).toUpperCase(),
        },
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[name:alice]')

      assert.strictEqual(result.entities[0].formattedValue, 'ALICE')
    })
  })

  describe('entities without formatters', () => {
    test('should default to string conversion when no formatter provided', () => {
      const schema: EntitySchema = {
        count: 'number',
        enabled: 'boolean',
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[count:42] [enabled:true]')

      assert.strictEqual(result.entities[0].formattedValue, '42')
      assert.strictEqual(result.entities[1].formattedValue, 'true')
    })

    test('should convert unknown entities to string', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[count:42] [enabled:true] [name:test]')

      assert.strictEqual(result.entities[0].formattedValue, '42')
      assert.strictEqual(result.entities[1].formattedValue, 'true')
      assert.strictEqual(result.entities[2].formattedValue, 'test')
    })
  })

  describe('formatter error handling', () => {
    test('should fall back to String(value) when a formatter throws', () => {
      const schema: EntitySchema = {
        operation: {
          type: 'string',
          format: () => {
            throw new Error('boom')
          },
        },
      }
      const parser = new TaggedStringParser({ schema })

      // parse() must not throw even though the formatter does.
      const result = parser.parse('[operation:deploy]')

      assert.strictEqual(result.entities[0].formattedValue, 'deploy')
      assert.strictEqual(result.format(), 'deploy')
    })

    test('should keep parsing remaining entities after a formatter throws', () => {
      const schema: EntitySchema = {
        bad: {
          type: 'string',
          format: () => {
            throw new Error('boom')
          },
        },
        good: {
          type: 'string',
          format: (val) => `**${val}**`,
        },
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[bad:x] [good:y]')

      assert.strictEqual(result.entities.length, 2)
      assert.strictEqual(result.entities[0].formattedValue, 'x')
      assert.strictEqual(result.entities[1].formattedValue, '**y**')
    })
  })
})
