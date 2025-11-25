import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'

// Helper type for accessing private properties in tests
type ParserWithPrivates = {
  isDelimiterFree: boolean
  openDelimiter: string
  closeDelimiter: string
}

describe('Delimiter Configuration', () => {
  describe('custom delimiters', () => {
    test('should use custom delimiters', () => {
      const parser = new TaggedStringParser({
        openDelimiter: '{',
        closeDelimiter: '}',
      })
      const result = parser.parse('{operation:OP-123} started')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'OP-123')
    })

    test('should use custom type separator', () => {
      const parser = new TaggedStringParser({
        typeSeparator: '=',
      })
      const result = parser.parse('[operation=OP-123]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'OP-123')
    })

    test('should use multiple custom configurations together', () => {
      const parser = new TaggedStringParser({
        openDelimiter: '<',
        closeDelimiter: '>',
        typeSeparator: '|',
      })
      const result = parser.parse('<operation|OP-123> started')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'OP-123')
    })
  })

  describe('validation', () => {
    test('should throw error for empty open delimiter', () => {
      assert.throws(
        () => new TaggedStringParser({ openDelimiter: '' }),
        /Open delimiter cannot be empty/,
      )
    })

    test('should throw error for empty close delimiter', () => {
      assert.throws(
        () => new TaggedStringParser({ closeDelimiter: '' }),
        /Close delimiter cannot be empty/,
      )
    })

    test('should throw error when delimiters are the same', () => {
      assert.throws(
        () =>
          new TaggedStringParser({ openDelimiter: '|', closeDelimiter: '|' }),
        /Open and close delimiters cannot be the same/,
      )
    })

    test('should throw error for invalid delimiters configuration', () => {
      assert.throws(
        () =>
          new TaggedStringParser({
            delimiters: ['['] as unknown as [string, string],
          }),
        /Invalid delimiters configuration/,
      )
    })

    test('should throw error for delimiters array with more than 2 elements', () => {
      assert.throws(
        () =>
          new TaggedStringParser({
            delimiters: ['[', ']', '{'] as unknown as [string, string],
          }),
        /Invalid delimiters configuration/,
      )
    })

    test('should throw error for empty string delimiters in array', () => {
      assert.throws(
        () => new TaggedStringParser({ delimiters: ['', ']'] }),
        /Open delimiter cannot be empty/,
      )
    })

    test('should throw error for same delimiters in array', () => {
      assert.throws(
        () => new TaggedStringParser({ delimiters: ['|', '|'] }),
        /Open and close delimiters cannot be the same/,
      )
    })
  })

  describe('configuration resolution', () => {
    test('should enable delimiter-free mode with delimiters: false', () => {
      const parser = new TaggedStringParser({ delimiters: false })
      const isDelimiterFree = (parser as unknown as ParserWithPrivates)
        .isDelimiterFree
      assert.strictEqual(isDelimiterFree, true)
    })

    test('should enable delimiter-free mode with delimiters: []', () => {
      const parser = new TaggedStringParser({ delimiters: [] })
      const isDelimiterFree = (parser as unknown as ParserWithPrivates)
        .isDelimiterFree
      assert.strictEqual(isDelimiterFree, true)
    })

    test('should enable delimited mode with delimiters: ["[", "]"]', () => {
      const parser = new TaggedStringParser({ delimiters: ['[', ']'] })
      const isDelimiterFree = (parser as unknown as ParserWithPrivates)
        .isDelimiterFree
      assert.strictEqual(isDelimiterFree, false)
      const openDelimiter = (parser as unknown as ParserWithPrivates)
        .openDelimiter
      const closeDelimiter = (parser as unknown as ParserWithPrivates)
        .closeDelimiter
      assert.strictEqual(openDelimiter, '[')
      assert.strictEqual(closeDelimiter, ']')
    })

    test('should enable delimited mode with custom delimiters array', () => {
      const parser = new TaggedStringParser({ delimiters: ['{{', '}}'] })
      const isDelimiterFree = (parser as unknown as ParserWithPrivates)
        .isDelimiterFree
      assert.strictEqual(isDelimiterFree, false)
      const openDelimiter = (parser as unknown as ParserWithPrivates)
        .openDelimiter
      const closeDelimiter = (parser as unknown as ParserWithPrivates)
        .closeDelimiter
      assert.strictEqual(openDelimiter, '{{')
      assert.strictEqual(closeDelimiter, '}}')
    })

    test('should maintain backward compatibility with openDelimiter/closeDelimiter', () => {
      const parser = new TaggedStringParser({
        openDelimiter: '<',
        closeDelimiter: '>',
      })
      const isDelimiterFree = (parser as unknown as ParserWithPrivates)
        .isDelimiterFree
      assert.strictEqual(isDelimiterFree, false)
      const openDelimiter = (parser as unknown as ParserWithPrivates)
        .openDelimiter
      const closeDelimiter = (parser as unknown as ParserWithPrivates)
        .closeDelimiter
      assert.strictEqual(openDelimiter, '<')
      assert.strictEqual(closeDelimiter, '>')
    })

    test('should use default delimiters when no configuration provided', () => {
      const parser = new TaggedStringParser()
      const isDelimiterFree = (parser as unknown as ParserWithPrivates)
        .isDelimiterFree
      assert.strictEqual(isDelimiterFree, false)
      const openDelimiter = (parser as unknown as ParserWithPrivates)
        .openDelimiter
      const closeDelimiter = (parser as unknown as ParserWithPrivates)
        .closeDelimiter
      assert.strictEqual(openDelimiter, '[')
      assert.strictEqual(closeDelimiter, ']')
    })

    test('should prioritize delimiters option over individual delimiter options', () => {
      const parser = new TaggedStringParser({
        delimiters: ['{{', '}}'],
        openDelimiter: '<',
        closeDelimiter: '>',
      })
      const openDelimiter = (parser as unknown as ParserWithPrivates)
        .openDelimiter
      const closeDelimiter = (parser as unknown as ParserWithPrivates)
        .closeDelimiter
      assert.strictEqual(openDelimiter, '{{')
      assert.strictEqual(closeDelimiter, '}}')
    })

    test('should prioritize delimiters: false over individual delimiter options', () => {
      const parser = new TaggedStringParser({
        delimiters: false,
        openDelimiter: '[',
        closeDelimiter: ']',
      })
      const isDelimiterFree = (parser as unknown as ParserWithPrivates)
        .isDelimiterFree
      assert.strictEqual(isDelimiterFree, true)
    })
  })

  describe('mode routing', () => {
    test('should route to delimiter-free mode when delimiters: false', () => {
      const parser = new TaggedStringParser({
        delimiters: false,
        typeSeparator: '=',
      })
      const result = parser.parse('order=1337')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'order')
      assert.strictEqual(result.entities[0].value, '1337')
    })

    test('should route to delimiter-free mode when delimiters: []', () => {
      const parser = new TaggedStringParser({
        delimiters: [],
        typeSeparator: '=',
      })
      const result = parser.parse('status=pending')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'status')
      assert.strictEqual(result.entities[0].value, 'pending')
    })

    test('should route to delimited mode when delimiters: ["[", "]"]', () => {
      const parser = new TaggedStringParser({
        delimiters: ['[', ']'],
        typeSeparator: ':',
      })
      const result = parser.parse('[operation:OP-123]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'OP-123')
    })

    test('should route to delimited mode with default configuration', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse('[operation:OP-123]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'OP-123')
    })

    test('should route to delimited mode with custom delimiters', () => {
      const parser = new TaggedStringParser({
        delimiters: ['{{', '}}'],
        typeSeparator: '=',
      })
      const result = parser.parse('{{order=1337}}')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'order')
      assert.strictEqual(result.entities[0].value, '1337')
    })

    test('should not extract delimiter-free patterns in delimited mode', () => {
      const parser = new TaggedStringParser({
        delimiters: ['[', ']'],
        typeSeparator: '=',
      })
      const result = parser.parse('order=1337 [status=pending]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'status')
      assert.strictEqual(result.entities[0].value, 'pending')
    })

    test('should treat brackets as regular characters in delimiter-free mode', () => {
      const parser = new TaggedStringParser({
        delimiters: false,
        typeSeparator: '=',
      })
      const result = parser.parse('[status=pending] order=1337')

      assert.strictEqual(result.entities.length, 2)
      assert.strictEqual(result.entities[0].type, '[status')
      assert.strictEqual(result.entities[0].value, 'pending]')
      assert.strictEqual(result.entities[1].type, 'order')
      assert.strictEqual(result.entities[1].value, '1337')
    })
  })
})
