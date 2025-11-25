import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'

// Helper to access private method for testing
type ParserWithExtractUnquotedToken = {
  extractUnquotedToken: (
    message: string,
    startPos: number,
    stopChars: string[],
  ) => { content: string; endPosition: number }
}

describe('Unquoted Token Extraction', () => {
  test('should extract token until whitespace', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('hello world', 0, [])
    assert.strictEqual(result.content, 'hello')
    assert.strictEqual(result.endPosition, 5)
  })

  test('should extract token until stop character', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('key=value', 0, ['='])
    assert.strictEqual(result.content, 'key')
    assert.strictEqual(result.endPosition, 3)
  })

  test('should extract token until colon stop character', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('type:value', 0, [':'])
    assert.strictEqual(result.content, 'type')
    assert.strictEqual(result.endPosition, 4)
  })

  test('should extract token with multiple stop characters', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('key=value:other', 0, ['=', ':'])
    assert.strictEqual(result.content, 'key')
    assert.strictEqual(result.endPosition, 3)
  })

  test('should extract entire token when no whitespace or stop chars found', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('token', 0, [])
    assert.strictEqual(result.content, 'token')
    assert.strictEqual(result.endPosition, 5)
  })

  test('should extract token from middle of string', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('prefix token suffix', 7, [])
    assert.strictEqual(result.content, 'token')
    assert.strictEqual(result.endPosition, 12)
  })

  test('should return empty token when starting at whitespace', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract(' token', 0, [])
    assert.strictEqual(result.content, '')
    assert.strictEqual(result.endPosition, 0)
  })

  test('should return empty token when starting at stop character', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('=value', 0, ['='])
    assert.strictEqual(result.content, '')
    assert.strictEqual(result.endPosition, 0)
  })

  test('should handle tab as whitespace boundary', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('token\tother', 0, [])
    assert.strictEqual(result.content, 'token')
    assert.strictEqual(result.endPosition, 5)
  })

  test('should handle newline as whitespace boundary', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('token\nother', 0, [])
    assert.strictEqual(result.content, 'token')
    assert.strictEqual(result.endPosition, 5)
  })

  test('should extract token with special characters (not stop chars)', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('key-name_123 rest', 0, ['='])
    assert.strictEqual(result.content, 'key-name_123')
    assert.strictEqual(result.endPosition, 12)
  })

  test('should stop at first occurrence of stop character', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('key=value=other', 0, ['='])
    assert.strictEqual(result.content, 'key')
    assert.strictEqual(result.endPosition, 3)
  })

  test('should extract empty string when at end of input', () => {
    const parser = new TaggedStringParser()
    const extract = (
      parser as unknown as ParserWithExtractUnquotedToken
    ).extractUnquotedToken.bind(parser)

    const result = extract('token', 5, [])
    assert.strictEqual(result.content, '')
    assert.strictEqual(result.endPosition, 5)
  })
})
