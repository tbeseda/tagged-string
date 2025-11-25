import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'
import type { EntitySchema } from '../../src/types.ts'

describe('Schema and Type Inference', () => {
  describe('schema-based type parsing', () => {
    test('should parse known entity using schema type', () => {
      const schema: EntitySchema = {
        count: 'number',
        enabled: 'boolean',
        name: 'string',
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[count:42] [enabled:true] [name:test]')

      assert.strictEqual(result.entities[0].parsedValue, 42)
      assert.strictEqual(result.entities[0].inferredType, 'number')
      assert.strictEqual(result.entities[1].parsedValue, true)
      assert.strictEqual(result.entities[1].inferredType, 'boolean')
      assert.strictEqual(result.entities[2].parsedValue, 'test')
      assert.strictEqual(result.entities[2].inferredType, 'string')
    })

    test('should parse number from schema even if value looks like string', () => {
      const schema: EntitySchema = {
        id: 'number',
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[id:123]')

      assert.strictEqual(result.entities[0].parsedValue, 123)
      assert.strictEqual(typeof result.entities[0].parsedValue, 'number')
    })

    test('should parse boolean from schema case-insensitively', () => {
      const schema: EntitySchema = {
        flag: 'boolean',
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[flag:TRUE] [flag:False]')

      assert.strictEqual(result.entities[0].parsedValue, true)
      assert.strictEqual(result.entities[1].parsedValue, false)
    })
  })

  describe('automatic type inference', () => {
    test('should infer number type for numeric values', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[count:42] [price:19.99] [temp:-5]')

      assert.strictEqual(result.entities[0].parsedValue, 42)
      assert.strictEqual(result.entities[0].inferredType, 'number')
      assert.strictEqual(result.entities[1].parsedValue, 19.99)
      assert.strictEqual(result.entities[1].inferredType, 'number')
      assert.strictEqual(result.entities[2].parsedValue, -5)
      assert.strictEqual(result.entities[2].inferredType, 'number')
    })

    test('should infer boolean type for true/false values', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse(
        '[enabled:true] [disabled:false] [active:TRUE]',
      )

      assert.strictEqual(result.entities[0].parsedValue, true)
      assert.strictEqual(result.entities[0].inferredType, 'boolean')
      assert.strictEqual(result.entities[1].parsedValue, false)
      assert.strictEqual(result.entities[1].inferredType, 'boolean')
      assert.strictEqual(result.entities[2].parsedValue, true)
      assert.strictEqual(result.entities[2].inferredType, 'boolean')
    })

    test('should infer string type for other values', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse(
        '[name:test] [id:abc123] [message:hello world]',
      )

      assert.strictEqual(result.entities[0].parsedValue, 'test')
      assert.strictEqual(result.entities[0].inferredType, 'string')
      assert.strictEqual(result.entities[1].parsedValue, 'abc123')
      assert.strictEqual(result.entities[1].inferredType, 'string')
      assert.strictEqual(result.entities[2].parsedValue, 'hello world')
      assert.strictEqual(result.entities[2].inferredType, 'string')
    })
  })

  describe('mixed known and unknown entities', () => {
    test('should handle both schema-defined and inferred entities', () => {
      const schema: EntitySchema = {
        operation: 'string',
        changes: 'number',
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse(
        '[operation:OP-123] with [changes:5] and [unknown:42]',
      )

      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].parsedValue, 'OP-123')
      assert.strictEqual(result.entities[0].inferredType, 'string')

      assert.strictEqual(result.entities[1].type, 'changes')
      assert.strictEqual(result.entities[1].parsedValue, 5)
      assert.strictEqual(result.entities[1].inferredType, 'number')

      assert.strictEqual(result.entities[2].type, 'unknown')
      assert.strictEqual(result.entities[2].parsedValue, 42)
      assert.strictEqual(result.entities[2].inferredType, 'number')
    })
  })

  describe('shorthand vs full EntityDefinition', () => {
    test('should support shorthand schema syntax', () => {
      const schema: EntitySchema = {
        count: 'number',
        name: 'string',
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[count:42] [name:test]')

      assert.strictEqual(result.entities[0].parsedValue, 42)
      assert.strictEqual(result.entities[0].inferredType, 'number')
      assert.strictEqual(result.entities[1].parsedValue, 'test')
      assert.strictEqual(result.entities[1].inferredType, 'string')
    })

    test('should support full EntityDefinition with formatter', () => {
      const schema: EntitySchema = {
        count: {
          type: 'number',
          format: (val) => `Count: ${val}`,
        },
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[count:42]')

      assert.strictEqual(result.entities[0].parsedValue, 42)
      assert.strictEqual(result.entities[0].formattedValue, 'Count: 42')
    })

    test('should mix shorthand and full definitions in same schema', () => {
      const schema: EntitySchema = {
        count: 'number',
        name: {
          type: 'string',
          format: (val) => String(val).toUpperCase(),
        },
      }
      const parser = new TaggedStringParser({ schema })
      const result = parser.parse('[count:42] [name:alice]')

      assert.strictEqual(result.entities[0].parsedValue, 42)
      assert.strictEqual(result.entities[0].formattedValue, '42')
      assert.strictEqual(result.entities[1].parsedValue, 'alice')
      assert.strictEqual(result.entities[1].formattedValue, 'ALICE')
    })
  })

  describe('type inference with quoted values', () => {
    test('should preserve type inference with quoted values', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('[count="42"] [enabled="true"] [name="test"]')

      assert.strictEqual(result.entities[0].parsedValue, 42)
      assert.strictEqual(result.entities[0].inferredType, 'number')
      assert.strictEqual(result.entities[1].parsedValue, true)
      assert.strictEqual(result.entities[1].inferredType, 'boolean')
      assert.strictEqual(result.entities[2].parsedValue, 'test')
      assert.strictEqual(result.entities[2].inferredType, 'string')
    })

    test('should apply schema with quoted keys', () => {
      const schema: EntitySchema = {
        'linux server': 'string',
        'web server': 'string',
      }
      const parser = new TaggedStringParser({ schema, typeSeparator: '=' })
      const result = parser.parse('["linux server"=home] ["web server"=nginx]')

      assert.strictEqual(result.entities.length, 2)
      assert.strictEqual(result.entities[0].type, 'linux server')
      assert.strictEqual(result.entities[0].parsedValue, 'home')
      assert.strictEqual(result.entities[0].inferredType, 'string')
      assert.strictEqual(result.entities[1].type, 'web server')
      assert.strictEqual(result.entities[1].parsedValue, 'nginx')
      assert.strictEqual(result.entities[1].inferredType, 'string')
    })
  })
})
