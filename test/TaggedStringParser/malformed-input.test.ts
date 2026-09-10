import assert from 'node:assert'
import { performance } from 'node:perf_hooks'
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

    test('should recover multiple valid tags after an unclosed quote', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse(
        '[broken:"value] [first:1] text [second:valid]',
      )

      assert.deepStrictEqual(
        result.entities.map(({ type, value }) => ({ type, value })),
        [
          { type: 'first', value: '1' },
          { type: 'second', value: 'valid' },
        ],
      )
    })

    test('should ignore tag-like text inside a closed quote', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[message:"text [not:a-tag] remains"]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'message')
      assert.strictEqual(result.entities[0].value, 'text [not:a-tag] remains')
    })

    test('should scan unterminated input without repeatedly rescanning', () => {
      const parser = new TaggedStringParser()
      const message = `${'['.repeat(20_000)}"${']'.repeat(20_000)}`
      const start = performance.now()

      const result = parser.parse(message)

      assert.deepStrictEqual(result.entities, [])
      assert.ok(performance.now() - start < 500)
    })
  })
})
