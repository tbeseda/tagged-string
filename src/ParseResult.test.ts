import assert from 'node:assert'
import { describe, test } from 'node:test'
import { ParseResult } from './ParseResult.ts'
import type { Entity } from './types.ts'

describe('ParseResult', () => {
  describe('getEntitiesByType', () => {
    test('should return entities matching the specified type', () => {
      const entities: Entity[] = [
        {
          type: 'operation',
          value: 'OP-123',
          parsedValue: 'OP-123',
          formattedValue: 'OP-123',
          inferredType: 'string',
          position: 0,
          endPosition: 18,
        },
        {
          type: 'count',
          value: '5',
          parsedValue: 5,
          formattedValue: '5',
          inferredType: 'number',
          position: 20,
          endPosition: 28,
        },
        {
          type: 'operation',
          value: 'OP-456',
          parsedValue: 'OP-456',
          formattedValue: 'OP-456',
          inferredType: 'string',
          position: 30,
          endPosition: 48,
        },
      ]
      const result = new ParseResult(
        '[operation:OP-123] [count:5] [operation:OP-456]',
        entities,
      )

      const operations = result.getEntitiesByType('operation')

      assert.strictEqual(operations.length, 2)
      assert.strictEqual(operations[0].value, 'OP-123')
      assert.strictEqual(operations[1].value, 'OP-456')
    })

    test('should return empty array for non-matching type', () => {
      const entities: Entity[] = [
        {
          type: 'operation',
          value: 'OP-123',
          parsedValue: 'OP-123',
          formattedValue: 'OP-123',
          inferredType: 'string',
          position: 0,
          endPosition: 18,
        },
      ]
      const result = new ParseResult('[operation:OP-123]', entities)

      const stacks = result.getEntitiesByType('stack')

      assert.strictEqual(stacks.length, 0)
      assert.ok(Array.isArray(stacks))
    })

    test('should preserve entity order', () => {
      const entities: Entity[] = [
        {
          type: 'item',
          value: 'first',
          parsedValue: 'first',
          formattedValue: 'first',
          inferredType: 'string',
          position: 0,
          endPosition: 12,
        },
        {
          type: 'item',
          value: 'second',
          parsedValue: 'second',
          formattedValue: 'second',
          inferredType: 'string',
          position: 10,
          endPosition: 23,
        },
        {
          type: 'item',
          value: 'third',
          parsedValue: 'third',
          formattedValue: 'third',
          inferredType: 'string',
          position: 20,
          endPosition: 32,
        },
      ]
      const result = new ParseResult(
        '[item:first] [item:second] [item:third]',
        entities,
      )

      const items = result.getEntitiesByType('item')

      assert.strictEqual(items[0].value, 'first')
      assert.strictEqual(items[1].value, 'second')
      assert.strictEqual(items[2].value, 'third')
    })
  })

  describe('getAllTypes', () => {
    test('should return all unique entity types', () => {
      const entities: Entity[] = [
        {
          type: 'operation',
          value: 'OP-123',
          parsedValue: 'OP-123',
          formattedValue: 'OP-123',
          inferredType: 'string',
          position: 0,
          endPosition: 18,
        },
        {
          type: 'count',
          value: '5',
          parsedValue: 5,
          formattedValue: '5',
          inferredType: 'number',
          position: 20,
          endPosition: 28,
        },
        {
          type: 'stack',
          value: 'ST-456',
          parsedValue: 'ST-456',
          formattedValue: 'ST-456',
          inferredType: 'string',
          position: 30,
          endPosition: 43,
        },
        {
          type: 'operation',
          value: 'OP-789',
          parsedValue: 'OP-789',
          formattedValue: 'OP-789',
          inferredType: 'string',
          position: 45,
          endPosition: 63,
        },
      ]
      const result = new ParseResult(
        '[operation:OP-123] [count:5] [stack:ST-456] [operation:OP-789]',
        entities,
      )

      const types = result.getAllTypes()

      assert.strictEqual(types.length, 3)
      assert.ok(types.includes('operation'))
      assert.ok(types.includes('count'))
      assert.ok(types.includes('stack'))
    })

    test('should return empty array when no entities exist', () => {
      const result = new ParseResult('No entities here', [])

      const types = result.getAllTypes()

      assert.strictEqual(types.length, 0)
      assert.ok(Array.isArray(types))
    })
  })

  describe('format', () => {
    test('should reconstruct message with formatted entity values', () => {
      const entities: Entity[] = [
        {
          type: 'operation',
          value: 'OP-123',
          parsedValue: 'OP-123',
          formattedValue: 'OP-123',
          inferredType: 'string',
          position: 0,
          endPosition: 18,
        },
        {
          type: 'count',
          value: '5',
          parsedValue: 5,
          formattedValue: '5',
          inferredType: 'number',
          position: 32,
          endPosition: 41,
        },
      ]
      const result = new ParseResult(
        '[operation:OP-123] started with [count:5]',
        entities,
      )

      const formatted = result.format()

      assert.strictEqual(formatted, 'OP-123 started with 5')
    })

    test('should apply custom formatters to entity values', () => {
      const entities: Entity[] = [
        {
          type: 'operation',
          value: 'OP-123',
          parsedValue: 'OP-123',
          formattedValue: '**OP-123**',
          inferredType: 'string',
          position: 0,
          endPosition: 18,
        },
        {
          type: 'count',
          value: '5',
          parsedValue: 5,
          formattedValue: '[5 items]',
          inferredType: 'number',
          position: 32,
          endPosition: 41,
        },
      ]
      const result = new ParseResult(
        '[operation:OP-123] started with [count:5]',
        entities,
      )

      const formatted = result.format()

      assert.strictEqual(formatted, '**OP-123** started with [5 items]')
    })

    test('should handle multiple entities with different formatters', () => {
      const entities: Entity[] = [
        {
          type: 'name',
          value: 'alice',
          parsedValue: 'alice',
          formattedValue: 'ALICE',
          inferredType: 'string',
          position: 0,
          endPosition: 12,
        },
        {
          type: 'count',
          value: '5',
          parsedValue: 5,
          formattedValue: '5 items',
          inferredType: 'number',
          position: 17,
          endPosition: 26,
        },
      ]
      const result = new ParseResult(
        '[name:alice] has [count:5] total',
        entities,
      )

      const formatted = result.format()

      assert.strictEqual(formatted, 'ALICE has 5 items total')
    })

    test('should return original message when no entities exist', () => {
      const result = new ParseResult('No entities here', [])

      const formatted = result.format()

      assert.strictEqual(formatted, 'No entities here')
    })

    test('should preserve text between and around entities', () => {
      const entities: Entity[] = [
        {
          type: 'a',
          value: '1',
          parsedValue: 1,
          formattedValue: 'ONE',
          inferredType: 'number',
          position: 7,
          endPosition: 12,
        },
        {
          type: 'b',
          value: '2',
          parsedValue: 2,
          formattedValue: 'TWO',
          inferredType: 'number',
          position: 20,
          endPosition: 25,
        },
      ]
      const result = new ParseResult('Start: [a:1] middle [b:2] end', entities)

      const formatted = result.format()

      assert.strictEqual(formatted, 'Start: ONE middle TWO end')
    })
  })

  describe('format with custom delimiters', () => {
    test('should format message with custom single-character delimiters', () => {
      const entities: Entity[] = [
        {
          type: 'operation',
          value: 'OP-123',
          parsedValue: 'OP-123',
          formattedValue: 'OP-123',
          inferredType: 'string',
          position: 0,
          endPosition: 18,
        },
        {
          type: 'count',
          value: '5',
          parsedValue: 5,
          formattedValue: '5',
          inferredType: 'number',
          position: 32,
          endPosition: 41,
        },
      ]
      const result = new ParseResult(
        '<operation:OP-123> started with <count:5>',
        entities,
        '>',
      )

      const formatted = result.format()

      assert.strictEqual(formatted, 'OP-123 started with 5')
    })

    test('should format message with custom multi-character delimiters', () => {
      const entities: Entity[] = [
        {
          type: 'user',
          value: 'john',
          parsedValue: 'john',
          formattedValue: '@john',
          inferredType: 'string',
          position: 5,
          endPosition: 18,
        },
        {
          type: 'count',
          value: '10',
          parsedValue: 10,
          formattedValue: '10',
          inferredType: 'number',
          position: 29,
          endPosition: 41,
        },
      ]
      const result = new ParseResult(
        'User {{user:john}} performed {{count:10}} actions',
        entities,
        '}}',
      )

      const formatted = result.format()

      assert.strictEqual(formatted, 'User @john performed 10 actions')
    })

    test('should format message with custom type separator', () => {
      const entities: Entity[] = [
        {
          type: 'operation',
          value: 'OP-123',
          parsedValue: 'OP-123',
          formattedValue: 'OP-123',
          inferredType: 'string',
          position: 0,
          endPosition: 18,
        },
      ]
      const result = new ParseResult('[operation=OP-123]', entities, ']')

      const formatted = result.format()

      assert.strictEqual(formatted, 'OP-123')
    })

    test('should format message with all custom delimiters combined', () => {
      const entities: Entity[] = [
        {
          type: 'operation',
          value: 'OP-123',
          parsedValue: 'OP-123',
          formattedValue: '**OP-123**',
          inferredType: 'string',
          position: 0,
          endPosition: 20,
        },
        {
          type: 'count',
          value: '5',
          parsedValue: 5,
          formattedValue: '[5 items]',
          inferredType: 'number',
          position: 34,
          endPosition: 46,
        },
      ]
      const result = new ParseResult(
        '<<operation|OP-123>> started with <<count|5>>',
        entities,
        '>>',
      )

      const formatted = result.format()

      assert.strictEqual(formatted, '**OP-123** started with [5 items]')
    })

    test('should maintain backward compatibility with default delimiters', () => {
      const entities: Entity[] = [
        {
          type: 'operation',
          value: 'OP-123',
          parsedValue: 'OP-123',
          formattedValue: 'OP-123',
          inferredType: 'string',
          position: 0,
          endPosition: 18,
        },
      ]
      const result = new ParseResult('[operation:OP-123]', entities)

      const formatted = result.format()

      assert.strictEqual(formatted, 'OP-123')
    })

    test('should correctly apply formatters with custom delimiters', () => {
      const entities: Entity[] = [
        {
          type: 'user',
          value: 'alice',
          parsedValue: 'alice',
          formattedValue: 'ALICE',
          inferredType: 'string',
          position: 0,
          endPosition: 12,
        },
        {
          type: 'count',
          value: '42',
          parsedValue: 42,
          formattedValue: '42 items',
          inferredType: 'number',
          position: 17,
          endPosition: 27,
        },
      ]
      const result = new ParseResult(
        '{user:alice} has {count:42}',
        entities,
        '}',
      )

      const formatted = result.format()

      assert.strictEqual(formatted, 'ALICE has 42 items')
    })

    test('should format multiple entities using custom delimiters', () => {
      const entities: Entity[] = [
        {
          type: 'a',
          value: '1',
          parsedValue: 1,
          formattedValue: 'ONE',
          inferredType: 'number',
          position: 7,
          endPosition: 12,
        },
        {
          type: 'b',
          value: '2',
          parsedValue: 2,
          formattedValue: 'TWO',
          inferredType: 'number',
          position: 20,
          endPosition: 25,
        },
        {
          type: 'c',
          value: '3',
          parsedValue: 3,
          formattedValue: 'THREE',
          inferredType: 'number',
          position: 30,
          endPosition: 35,
        },
      ]
      const result = new ParseResult(
        'Start: <a:1> middle <b:2> and <c:3> end',
        entities,
        '>',
      )

      const formatted = result.format()

      assert.strictEqual(formatted, 'Start: ONE middle TWO and THREE end')
    })

    test('should handle real-world example from TODO.md with curly brace delimiters', () => {
      const entities: Entity[] = [
        {
          type: 'user',
          value: 'john',
          parsedValue: 'john',
          formattedValue: '@john',
          inferredType: 'string',
          position: 5,
          endPosition: 18,
        },
        {
          type: 'count',
          value: '10',
          parsedValue: 10,
          formattedValue: '10',
          inferredType: 'number',
          position: 29,
          endPosition: 41,
        },
      ]
      const result = new ParseResult(
        'User {{user=john}} performed {{count=10}} actions',
        entities,
        '}}',
      )

      const formatted = result.format()

      assert.strictEqual(formatted, 'User @john performed 10 actions')
    })
  })
})
