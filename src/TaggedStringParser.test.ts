import assert from 'node:assert'
import { describe, test } from 'node:test'
import * as fc from 'fast-check'
import { TaggedStringParser } from './TaggedStringParser.ts'
import type { EntitySchema } from './types.ts'

// Helper type for accessing private properties in tests
type ParserWithPrivates = {
  isDelimiterFree: boolean
  openDelimiter: string
  closeDelimiter: string
}

describe('TaggedStringParser', () => {
  describe('basic parsing', () => {
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
  })

  describe('custom delimiter configuration', () => {
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

  describe('configuration validation', () => {
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
  })

  describe('delimiter configuration resolution', () => {
    test('should enable delimiter-free mode with delimiters: false', () => {
      const parser = new TaggedStringParser({ delimiters: false })
      // Access private property through type assertion for testing
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

  describe('malformed tag handling', () => {
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

  describe('entity position tracking', () => {
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

      // Schema-defined entities
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].parsedValue, 'OP-123')
      assert.strictEqual(result.entities[0].inferredType, 'string')

      assert.strictEqual(result.entities[1].type, 'changes')
      assert.strictEqual(result.entities[1].parsedValue, 5)
      assert.strictEqual(result.entities[1].inferredType, 'number')

      // Unknown entity with inference
      assert.strictEqual(result.entities[2].type, 'unknown')
      assert.strictEqual(result.entities[2].parsedValue, 42)
      assert.strictEqual(result.entities[2].inferredType, 'number')
    })
  })

  describe('formatter functions', () => {
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

      // First entity
      assert.strictEqual(result.entities[0].position, 0)
      assert.strictEqual(result.entities[0].endPosition, 18)

      // Second entity
      assert.strictEqual(result.entities[1].position, 32)
      assert.strictEqual(result.entities[1].endPosition, 43)

      // Third entity
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

      // First entity
      assert.strictEqual(result.entities[0].position, 5)
      assert.strictEqual(result.entities[0].endPosition, 18)

      // Second entity
      assert.strictEqual(result.entities[1].position, 29)
      assert.strictEqual(result.entities[1].endPosition, 41)
    })
  })

  describe('quoted string extraction', () => {
    // Helper to access private method for testing
    type ParserWithExtractQuotedString = {
      extractQuotedString: (
        message: string,
        startPos: number,
      ) => { content: string; endPosition: number } | null
    }

    test('should extract basic quoted string', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"hello world"', 0)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, 'hello world')
      assert.strictEqual(result?.endPosition, 13)
    })

    test('should extract quoted string with spaces', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"store order"', 0)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, 'store order')
      assert.strictEqual(result?.endPosition, 13)
    })

    test('should extract quoted string with special characters', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"hello:world=test"', 0)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, 'hello:world=test')
      assert.strictEqual(result?.endPosition, 18)
    })

    test('should process escaped quote (\\") as literal quote', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"say \\"hello\\""', 0)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, 'say "hello"')
    })

    test('should process escaped backslash (\\\\) as literal backslash', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"path\\\\to\\\\file"', 0)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, 'path\\to\\file')
    })

    test('should process mixed escape sequences', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"test\\\\\\"mixed\\""', 0)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, 'test\\"mixed"')
    })

    test('should return null for unclosed quote', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"unclosed string', 0)
      assert.strictEqual(result, null)
    })

    test('should return null for unclosed quote at end of string', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"no closing', 0)
      assert.strictEqual(result, null)
    })

    test('should handle backslash at end of quoted string', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"ends with\\"', 0)
      assert.strictEqual(result, null) // Unclosed because backslash escapes the closing quote
    })

    test('should handle backslash before non-escapable character', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"test\\nvalue"', 0)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, 'test\\nvalue') // Backslash treated as literal
    })

    test('should extract quoted string from middle of larger string', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('key="quoted value" rest', 4)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, 'quoted value')
      assert.strictEqual(result?.endPosition, 18)
    })

    test('should return null when not starting at a quote', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('not a quote', 0)
      assert.strictEqual(result, null)
    })

    test('should handle empty quoted string', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('""', 0)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, '')
      assert.strictEqual(result?.endPosition, 2)
    })
  })

  describe('property-based tests for quoted string extraction', () => {
    // Helper to access private method for testing
    type ParserWithExtractQuotedString = {
      extractQuotedString: (
        message: string,
        startPos: number,
      ) => { content: string; endPosition: number } | null
    }

    /**
     * Feature: delimiter-free-parsing, Property 5: Escape sequences are processed
     * Validates: Requirements 3.4, 4.3, 5.1, 5.2, 5.3
     */
    test('Property 5: Escape sequences are processed correctly', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      // Generator for strings that may contain quotes and backslashes
      const contentArbitrary = fc.string({
        minLength: 0,
        maxLength: 50,
      })

      fc.assert(
        fc.property(contentArbitrary, (content) => {
          // Build a properly escaped quoted string
          // Replace \ with \\ and " with \"
          const escaped = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
          const quotedString = `"${escaped}"`

          // Extract the quoted string
          const result = extract(quotedString, 0)

          // Property: extraction should succeed and return the original content
          assert.notStrictEqual(
            result,
            null,
            `Failed to extract quoted string: ${quotedString}`,
          )
          assert.strictEqual(
            result?.content,
            content,
            `Escape sequences not processed correctly. Expected: ${content}, Got: ${result?.content}`,
          )

          // Property: endPosition should be at the closing quote
          assert.strictEqual(
            result?.endPosition,
            quotedString.length,
            'End position should be at closing quote',
          )
        }),
        { numRuns: 100 },
      )
    })

    test('Property 5 (edge case): Escaped quotes within content', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      // Generator specifically for strings with quotes
      const stringWithQuotesArbitrary = fc
        .array(fc.constantFrom('"', '\\', 'a', 'b', ' ', ':', '=', 'x', 'y'), {
          minLength: 0,
          maxLength: 20,
        })
        .map((chars) => chars.join(''))

      fc.assert(
        fc.property(stringWithQuotesArbitrary, (content) => {
          // Escape the content properly
          const escaped = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
          const quotedString = `"${escaped}"`

          const result = extract(quotedString, 0)

          // Should successfully extract and unescape
          assert.notStrictEqual(result, null)
          assert.strictEqual(result?.content, content)
        }),
        { numRuns: 100 },
      )
    })

    test('Property 5 (edge case): Backslashes at various positions', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      // Generator for strings with backslashes
      const stringWithBackslashesArbitrary = fc
        .array(fc.constantFrom('\\', 'a', 'b', 'c', ' ', 'd', 'e'), {
          minLength: 0,
          maxLength: 20,
        })
        .map((chars) => chars.join(''))

      fc.assert(
        fc.property(stringWithBackslashesArbitrary, (content) => {
          // Properly escape backslashes and quotes
          const escaped = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
          const quotedString = `"${escaped}"`

          const result = extract(quotedString, 0)

          // Should successfully extract with backslashes preserved
          assert.notStrictEqual(result, null)
          assert.strictEqual(result?.content, content)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('unquoted token extraction', () => {
    // Helper to access private method for testing
    type ParserWithExtractUnquotedToken = {
      extractUnquotedToken: (
        message: string,
        startPos: number,
        stopChars: string[],
      ) => { content: string; endPosition: number }
    }

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

  describe('real-world IaC log examples', () => {
    test('should parse operation lifecycle logs', () => {
      const schema: EntitySchema = {
        operation: 'string',
        changes: 'number',
        stack: 'string',
      }
      const parser = new TaggedStringParser({ schema })

      const result1 = parser.parse(
        '[operation:OP-123] started with [changes:5] to [stack:ST-456]',
      )
      assert.strictEqual(result1.entities.length, 3)
      assert.strictEqual(result1.entities[0].parsedValue, 'OP-123')
      assert.strictEqual(result1.entities[1].parsedValue, 5)
      assert.strictEqual(result1.entities[2].parsedValue, 'ST-456')

      const result2 = parser.parse(
        '[operation:OP-123] completed [changes:5] to [stack:ST-456]',
      )
      assert.strictEqual(result2.entities.length, 3)
    })

    test('should parse planning logs', () => {
      const schema: EntitySchema = {
        blueprint: 'string',
        stack: 'string',
        create: 'number',
        update: 'number',
        destroy: 'number',
      }
      const parser = new TaggedStringParser({ schema })

      const result = parser.parse(
        '[blueprint:BP-123] plan complete with [create:2] [update:3] [destroy:1] for [stack:ST-456]',
      )

      assert.strictEqual(result.entities.length, 5)
      assert.strictEqual(result.entities[0].parsedValue, 'BP-123')
      assert.strictEqual(result.entities[1].parsedValue, 2)
      assert.strictEqual(result.entities[2].parsedValue, 3)
      assert.strictEqual(result.entities[3].parsedValue, 1)
      assert.strictEqual(result.entities[4].parsedValue, 'ST-456')
    })

    test('should parse resource command logs', () => {
      const schema: EntitySchema = {
        action: 'string',
        resource: 'string',
        resourceName: 'string',
        type: 'string',
        externalId: 'string',
      }
      const parser = new TaggedStringParser({ schema })

      const result1 = parser.parse(
        '[action:create] executing for [resource:RS-123] [resourceName:"my-function"] [type:function]',
      )
      assert.strictEqual(result1.entities.length, 4)
      assert.strictEqual(result1.entities[0].parsedValue, 'create')
      assert.strictEqual(result1.entities[2].parsedValue, '"my-function"')

      const result2 = parser.parse(
        '[action:create] completed for [resource:RS-123] [externalId:EXT-789]',
      )
      assert.strictEqual(result2.entities.length, 3)
    })

    test('should preserve quoted values in entity values', () => {
      const parser = new TaggedStringParser()
      const result = parser.parse(
        '[resourceName:"my-function"] [error:"Error message"]',
      )

      assert.strictEqual(result.entities[0].value, '"my-function"')
      assert.strictEqual(result.entities[1].value, '"Error message"')
    })

    test('should parse resource type-specific logs', () => {
      const schema: EntitySchema = {
        resourceType: 'string',
        resourceName: 'string',
      }
      const parser = new TaggedStringParser({ schema })

      const result1 = parser.parse(
        '[resourceType:function] creating [resourceName:"my-function"]',
      )
      assert.strictEqual(result1.entities[0].parsedValue, 'function')
      assert.strictEqual(result1.entities[1].parsedValue, '"my-function"')

      const result2 = parser.parse(
        '[resourceType:database] updating [resourceName:"user-db"]',
      )
      assert.strictEqual(result2.entities[0].parsedValue, 'database')
      assert.strictEqual(result2.entities[1].parsedValue, '"user-db"')
    })
  })
})
