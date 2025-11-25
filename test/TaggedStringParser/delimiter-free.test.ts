import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'

describe('Delimiter-Free Parsing', () => {
  test('should extract simple key-value: order=1337', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('order=1337')

    assert.strictEqual(result.entities.length, 1)
    assert.strictEqual(result.entities[0].type, 'order')
    assert.strictEqual(result.entities[0].value, '1337')
    assert.strictEqual(result.entities[0].parsedValue, 1337)
    assert.strictEqual(result.entities[0].inferredType, 'number')
  })

  test('should extract multiple entities: order=1337 status=pending', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('order=1337 status=pending')

    assert.strictEqual(result.entities.length, 2)
    assert.strictEqual(result.entities[0].type, 'order')
    assert.strictEqual(result.entities[0].value, '1337')
    assert.strictEqual(result.entities[0].parsedValue, 1337)
    assert.strictEqual(result.entities[1].type, 'status')
    assert.strictEqual(result.entities[1].value, 'pending')
    assert.strictEqual(result.entities[1].parsedValue, 'pending')
  })

  test('should extract entities mixed with text: an order=1337 was placed', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('an order=1337 was placed')

    assert.strictEqual(result.entities.length, 1)
    assert.strictEqual(result.entities[0].type, 'order')
    assert.strictEqual(result.entities[0].value, '1337')
    assert.strictEqual(result.entities[0].parsedValue, 1337)
  })

  test('should extract quoted values: order="number 42"', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('order="number 42"')

    assert.strictEqual(result.entities.length, 1)
    assert.strictEqual(result.entities[0].type, 'order')
    assert.strictEqual(result.entities[0].value, 'number 42')
    assert.strictEqual(result.entities[0].parsedValue, 'number 42')
  })

  test('should extract quoted keys: "store order"=42', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('"store order"=42')

    assert.strictEqual(result.entities.length, 1)
    assert.strictEqual(result.entities[0].type, 'store order')
    assert.strictEqual(result.entities[0].value, '42')
    assert.strictEqual(result.entities[0].parsedValue, 42)
  })

  test('should skip malformed entities with unclosed quoted key', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('"unclosed key=42 valid=123')

    assert.strictEqual(result.entities.length, 2)
    assert.strictEqual(result.entities[0].type, 'key')
    assert.strictEqual(result.entities[0].value, '42')
    assert.strictEqual(result.entities[1].type, 'valid')
    assert.strictEqual(result.entities[1].value, '123')
  })

  test('should skip malformed entities with unclosed quoted value', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('key="unclosed value')

    assert.strictEqual(result.entities.length, 0)
  })

  test('should skip entities with key but no value', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('key= valid=123')

    assert.strictEqual(result.entities.length, 1)
    assert.strictEqual(result.entities[0].type, 'valid')
  })

  test('should handle custom type separator in delimiter-free mode', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: ':',
    })
    const result = parser.parse('order:1337 status:pending')

    assert.strictEqual(result.entities.length, 2)
    assert.strictEqual(result.entities[0].type, 'order')
    assert.strictEqual(result.entities[0].value, '1337')
    assert.strictEqual(result.entities[1].type, 'status')
    assert.strictEqual(result.entities[1].value, 'pending')
  })

  test('should track positions correctly in delimiter-free mode', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('order=1337 status=pending')

    assert.strictEqual(result.entities[0].position, 0)
    assert.strictEqual(result.entities[0].endPosition, 10)
    assert.strictEqual(result.entities[1].position, 11)
    assert.strictEqual(result.entities[1].endPosition, 25)
  })

  test('should handle multiple whitespace between entities', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('order=1337    status=pending')

    assert.strictEqual(result.entities.length, 2)
    assert.strictEqual(result.entities[0].type, 'order')
    assert.strictEqual(result.entities[1].type, 'status')
  })

  test('should handle entities at start and end of string', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('first=1 middle text last=2')

    assert.strictEqual(result.entities.length, 2)
    assert.strictEqual(result.entities[0].type, 'first')
    assert.strictEqual(result.entities[0].value, '1')
    assert.strictEqual(result.entities[1].type, 'last')
    assert.strictEqual(result.entities[1].value, '2')
  })

  test('should handle quoted key and quoted value together', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('"store order"="number 42"')

    assert.strictEqual(result.entities.length, 1)
    assert.strictEqual(result.entities[0].type, 'store order')
    assert.strictEqual(result.entities[0].value, 'number 42')
  })

  test('should handle escape sequences in quoted values', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('msg="say \\"hello\\""')

    assert.strictEqual(result.entities.length, 1)
    assert.strictEqual(result.entities[0].type, 'msg')
    assert.strictEqual(result.entities[0].value, 'say "hello"')
  })

  test('should handle escape sequences in quoted keys', () => {
    const parser = new TaggedStringParser({
      delimiters: false,
      typeSeparator: '=',
    })
    const result = parser.parse('"key\\"name"=value')

    assert.strictEqual(result.entities.length, 1)
    assert.strictEqual(result.entities[0].type, 'key"name')
    assert.strictEqual(result.entities[0].value, 'value')
  })
})
