import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'

describe('Malformed Input Handling', () => {
  describe('malformed tags in delimited mode', () => {
    test('should skip unclosed tag at end of string', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[operation:OP-123] started [incomplete')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'OP-123')
    })

    test('should handle tag without type separator', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[justvalue]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, '')
      assert.strictEqual(result.entities[0].value, 'justvalue')
    })

    test('should skip empty tags', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[operation:OP-123] [] [stack:ST-456]')

      assert.strictEqual(result.entities.length, 2)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[1].type, 'stack')
    })

    test('should skip tags with only whitespace', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[operation:OP-123] [   ] [stack:ST-456]')

      assert.strictEqual(result.entities.length, 2)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[1].type, 'stack')
    })
  })
})
