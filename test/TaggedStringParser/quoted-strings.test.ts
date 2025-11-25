import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'

// Helper to access private method for testing
type ParserWithExtractQuotedString = {
  extractQuotedString: (
    message: string,
    startPos: number,
  ) => { content: string; endPosition: number } | null
}

describe('Quoted String Extraction', () => {
  describe('basic extraction', () => {
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

  describe('escape sequences', () => {
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

    test('should handle backslash before non-escapable character', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('"test\\nvalue"', 0)
      assert.notStrictEqual(result, null)
      assert.strictEqual(result?.content, 'test\\nvalue')
    })
  })

  describe('error cases', () => {
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
      assert.strictEqual(result, null)
    })

    test('should return null when not starting at a quote', () => {
      const parser = new TaggedStringParser()
      const extract = (
        parser as unknown as ParserWithExtractQuotedString
      ).extractQuotedString.bind(parser)

      const result = extract('not a quote', 0)
      assert.strictEqual(result, null)
    })
  })

  describe('quoted strings in delimited mode', () => {
    test('should extract quoted key: ["linux server"=home]', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('["linux server"=home]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'linux server')
      assert.strictEqual(result.entities[0].value, 'home')
      assert.strictEqual(result.entities[0].parsedValue, 'home')
    })

    test('should extract quoted value: [server="web server"]', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('[server="web server"]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'server')
      assert.strictEqual(result.entities[0].value, 'web server')
      assert.strictEqual(result.entities[0].parsedValue, 'web server')
    })

    test('should extract both quoted key and quoted value', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('["linux server"="web server"]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'linux server')
      assert.strictEqual(result.entities[0].value, 'web server')
      assert.strictEqual(result.entities[0].parsedValue, 'web server')
    })

    test('should handle escape sequences in quoted key: ["key\\"name"=value]', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('["key\\"name"=value]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'key"name')
      assert.strictEqual(result.entities[0].value, 'value')
    })

    test('should handle escape sequences in quoted value: [key="say \\"hello\\""]', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('[key="say \\"hello\\""]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'key')
      assert.strictEqual(result.entities[0].value, 'say "hello"')
    })

    test('should handle backslash escape sequences: [path="C:\\\\Users\\\\file"]', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('[path="C:\\\\Users\\\\file"]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'path')
      assert.strictEqual(result.entities[0].value, 'C:\\Users\\file')
    })

    test('should handle mixed escape sequences in delimited mode', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('[msg="test\\\\\\"mixed\\""]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'msg')
      assert.strictEqual(result.entities[0].value, 'test\\"mixed"')
    })

    test('should skip malformed tag with unclosed quoted key', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('["unclosed key=value] [valid=123]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'valid')
      assert.strictEqual(result.entities[0].value, '123')
    })

    test('should skip malformed tag with unclosed quoted value', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('[key="unclosed value] [valid=123]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'valid')
      assert.strictEqual(result.entities[0].value, '123')
    })

    test('should handle quoted keys with spaces and special characters', () => {
      const parser = new TaggedStringParser({ typeSeparator: ':' })
      const result = parser.parse('["store order":"number 42"]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'store order')
      assert.strictEqual(result.entities[0].value, 'number 42')
    })

    test('should handle quoted values with separator character', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse('[formula="a=b+c"]')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'formula')
      assert.strictEqual(result.entities[0].value, 'a=b+c')
    })

    test('should work with custom delimiters and quoted strings', () => {
      const parser = new TaggedStringParser({
        delimiters: ['{{', '}}'],
        typeSeparator: '=',
      })
      const result = parser.parse('{{"linux server"="web server"}}')

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'linux server')
      assert.strictEqual(result.entities[0].value, 'web server')
    })

    test('should handle multiple entities with quoted strings', () => {
      const parser = new TaggedStringParser({ typeSeparator: '=' })
      const result = parser.parse(
        '["server name"="web server"] [count=5] ["status"="active"]',
      )

      assert.strictEqual(result.entities.length, 3)
      assert.strictEqual(result.entities[0].type, 'server name')
      assert.strictEqual(result.entities[0].value, 'web server')
      assert.strictEqual(result.entities[1].type, 'count')
      assert.strictEqual(result.entities[1].value, '5')
      assert.strictEqual(result.entities[2].type, 'status')
      assert.strictEqual(result.entities[2].value, 'active')
    })
  })
})
