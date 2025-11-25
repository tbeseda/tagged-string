import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'

describe('Basic Parsing', () => {
  test('should extract single entity', () => {
    const parser = new TaggedStringParser()
    const result = parser.parse('[operation:OP-123]')

    assert.strictEqual(result.entities.length, 1)
    assert.strictEqual(result.entities[0].type, 'operation')
    assert.strictEqual(result.entities[0].value, 'OP-123')
    assert.strictEqual(result.entities[0].position, 0)
  })

  test('should extract multiple entities in one message', () => {
    const parser = new TaggedStringParser()
    const result = parser.parse(
      '[operation:OP-123] started with [changes:5] to [stack:ST-456]',
    )

    assert.strictEqual(result.entities.length, 3)
    assert.strictEqual(result.entities[0].type, 'operation')
    assert.strictEqual(result.entities[0].value, 'OP-123')
    assert.strictEqual(result.entities[1].type, 'changes')
    assert.strictEqual(result.entities[1].value, '5')
    assert.strictEqual(result.entities[2].type, 'stack')
    assert.strictEqual(result.entities[2].value, 'ST-456')
  })

  test('should handle messages without entities', () => {
    const parser = new TaggedStringParser()
    const result = parser.parse('This is a plain log message')

    assert.strictEqual(result.entities.length, 0)
    assert.strictEqual(result.originalMessage, 'This is a plain log message')
  })

  test('should handle empty string', () => {
    const parser = new TaggedStringParser()
    const result = parser.parse('')

    assert.strictEqual(result.entities.length, 0)
    assert.strictEqual(result.originalMessage, '')
  })

  test('should return ParseResult in delimiter-free mode', () => {
    const parser = new TaggedStringParser({ delimiters: false })
    const result = parser.parse('key=value')

    assert.ok(result)
    assert.ok(result.entities)
    assert.ok(result.originalMessage)
    assert.strictEqual(result.originalMessage, 'key=value')
  })

  test('should return ParseResult in delimited mode', () => {
    const parser = new TaggedStringParser()
    const result = parser.parse('[key:value]')

    assert.ok(result)
    assert.ok(result.entities)
    assert.ok(result.originalMessage)
    assert.strictEqual(result.originalMessage, '[key:value]')
  })

  test('should handle empty string in both modes', () => {
    const delimiterFreeParser = new TaggedStringParser({ delimiters: false })
    const delimitedParser = new TaggedStringParser()

    const result1 = delimiterFreeParser.parse('')
    const result2 = delimitedParser.parse('')

    assert.strictEqual(result1.entities.length, 0)
    assert.strictEqual(result1.originalMessage, '')
    assert.strictEqual(result2.entities.length, 0)
    assert.strictEqual(result2.originalMessage, '')
  })
})
