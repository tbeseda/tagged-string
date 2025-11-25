import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'

describe('Position Tracking', () => {
  describe('position field', () => {
    test('should track position of single entity', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[operation:OP-123]')

      assert.strictEqual(result.entities[0].position, 0)
    })

    test('should track positions of multiple entities', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[operation:OP-123] started with [changes:5]')

      assert.strictEqual(result.entities[0].position, 0)
      assert.strictEqual(result.entities[1].position, 32)
    })

    test('should track position with text before entity', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('Starting [operation:OP-123] now')

      assert.strictEqual(result.entities[0].position, 9)
    })
  })

  describe('endPosition calculation', () => {
    test('should calculate endPosition with single-character delimiters (default)', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[operation:OP-123]')

      assert.strictEqual(result.entities[0].position, 0)
      assert.strictEqual(result.entities[0].endPosition, 18)
    })

    test('should calculate endPosition with multi-character delimiters', () => {
      const parser = new TaggedStringParser({
        openDelimiter: '{{',
        closeDelimiter: '}}',
      })
      const result = parser.parse('{{operation:OP-123}}')

      assert.strictEqual(result.entities[0].position, 0)
      assert.strictEqual(result.entities[0].endPosition, 20)
    })

    test('should calculate endPosition for multiple entities in one message', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse(
        '[operation:OP-123] started with [changes:5] to [stack:ST-456]',
      )

      assert.strictEqual(result.entities.length, 3)

      assert.strictEqual(result.entities[0].position, 0)
      assert.strictEqual(result.entities[0].endPosition, 18)

      assert.strictEqual(result.entities[1].position, 32)
      assert.strictEqual(result.entities[1].endPosition, 43)

      assert.strictEqual(result.entities[2].position, 47)
      assert.strictEqual(result.entities[2].endPosition, 61)
    })

    test('should calculate endPosition for entity at start of message', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[operation:OP-123] started')

      assert.strictEqual(result.entities[0].position, 0)
      assert.strictEqual(result.entities[0].endPosition, 18)
    })

    test('should calculate endPosition for entity in middle of message', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('Starting [operation:OP-123] now')

      assert.strictEqual(result.entities[0].position, 9)
      assert.strictEqual(result.entities[0].endPosition, 27)
    })

    test('should calculate endPosition for entity at end of message', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('Completed [operation:OP-123]')

      assert.strictEqual(result.entities[0].position, 10)
      assert.strictEqual(result.entities[0].endPosition, 28)
    })

    test('should calculate endPosition correctly with custom single-character delimiters', () => {
      const parser = new TaggedStringParser({
        openDelimiter: '<',
        closeDelimiter: '>',
      })
      const result = parser.parse('<operation:OP-123>')

      assert.strictEqual(result.entities[0].position, 0)
      assert.strictEqual(result.entities[0].endPosition, 18)
    })

    test('should calculate endPosition correctly with longer multi-character delimiters', () => {
      const parser = new TaggedStringParser({
        openDelimiter: '<<<',
        closeDelimiter: '>>>',
      })
      const result = parser.parse('<<<operation:OP-123>>>')

      assert.strictEqual(result.entities[0].position, 0)
      assert.strictEqual(result.entities[0].endPosition, 22)
    })

    test('should calculate endPosition for multiple entities with custom delimiters', () => {
      const parser = new TaggedStringParser({
        openDelimiter: '{{',
        closeDelimiter: '}}',
      })
      const result = parser.parse(
        'User {{user:john}} performed {{count:10}} actions',
      )

      assert.strictEqual(result.entities.length, 2)

      assert.strictEqual(result.entities[0].position, 5)
      assert.strictEqual(result.entities[0].endPosition, 18)

      assert.strictEqual(result.entities[1].position, 29)
      assert.strictEqual(result.entities[1].endPosition, 41)
    })
  })
})
