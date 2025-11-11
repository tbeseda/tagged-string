import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringGenerator } from './TaggedStringGenerator.ts'
import { TaggedStringParser } from './TaggedStringParser.ts'

describe('TaggedStringGenerator', () => {
  describe('basic generation with defaults', () => {
    test('should generate tag with default delimiters', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('operation', 'deploy')

      assert.strictEqual(result, '[operation:deploy]')
    })

    test('should separate type and value correctly', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('count', '5')

      assert.strictEqual(result, '[count:5]')
    })

    test('should embed tag in message', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.embed('Starting ', 'operation', 'deploy')

      assert.strictEqual(result, 'Starting [operation:deploy]')
    })

    test('should generate multiple independent tags', () => {
      const generator = new TaggedStringGenerator()
      const tag1 = generator.tag('operation', 'OP-123')
      const tag2 = generator.tag('stack', 'ST-456')

      assert.strictEqual(tag1, '[operation:OP-123]')
      assert.strictEqual(tag2, '[stack:ST-456]')
    })

    test('should embed multiple tags in message', () => {
      const generator = new TaggedStringGenerator()
      const message = generator.embed('', 'operation', 'OP-123')
      const fullMessage = `${message} started with ${generator.tag('changes', '5')}`

      assert.strictEqual(
        fullMessage,
        '[operation:OP-123] started with [changes:5]',
      )
    })
  })

  describe('custom delimiter configurations', () => {
    test('should use custom openDelimiter', () => {
      const generator = new TaggedStringGenerator({
        openDelimiter: '{',
      })
      const result = generator.tag('operation', 'deploy')

      assert.strictEqual(result, '{operation:deploy]')
    })

    test('should use custom closeDelimiter', () => {
      const generator = new TaggedStringGenerator({
        closeDelimiter: '}',
      })
      const result = generator.tag('operation', 'deploy')

      assert.strictEqual(result, '[operation:deploy}')
    })

    test('should use custom typeSeparator', () => {
      const generator = new TaggedStringGenerator({
        typeSeparator: '=',
      })
      const result = generator.tag('operation', 'deploy')

      assert.strictEqual(result, '[operation=deploy]')
    })

    test('should use all custom delimiters together', () => {
      const generator = new TaggedStringGenerator({
        openDelimiter: '{{',
        closeDelimiter: '}}',
        typeSeparator: '|',
      })
      const result = generator.tag('operation', 'deploy')

      assert.strictEqual(result, '{{operation|deploy}}')
    })

    test('should use custom single-character delimiters', () => {
      const generator = new TaggedStringGenerator({
        openDelimiter: '<',
        closeDelimiter: '>',
      })
      const result = generator.tag('operation', 'OP-123')

      assert.strictEqual(result, '<operation:OP-123>')
    })

    test('should use custom multi-character delimiters', () => {
      const generator = new TaggedStringGenerator({
        openDelimiter: '<<<',
        closeDelimiter: '>>>',
      })
      const result = generator.tag('operation', 'OP-123')

      assert.strictEqual(result, '<<<operation:OP-123>>>')
    })
  })

  describe('value type conversion', () => {
    test('should convert number to string', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('count', 42)

      assert.strictEqual(result, '[count:42]')
    })

    test('should convert boolean to string', () => {
      const generator = new TaggedStringGenerator()
      const resultTrue = generator.tag('enabled', true)
      const resultFalse = generator.tag('disabled', false)

      assert.strictEqual(resultTrue, '[enabled:true]')
      assert.strictEqual(resultFalse, '[disabled:false]')
    })

    test('should convert object to string', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('data', { key: 'value' })

      assert.strictEqual(result, '[data:[object Object]]')
    })

    test('should convert array to string', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('items', [1, 2, 3])

      assert.strictEqual(result, '[items:1,2,3]')
    })

    test('should handle null value', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('value', null)

      assert.strictEqual(result, '[value:null]')
    })

    test('should handle undefined value', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('value', undefined)

      assert.strictEqual(result, '[value:undefined]')
    })

    test('should convert negative numbers', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('temp', -5)

      assert.strictEqual(result, '[temp:-5]')
    })

    test('should convert decimal numbers', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('price', 19.99)

      assert.strictEqual(result, '[price:19.99]')
    })
  })

  describe('edge cases', () => {
    test('should handle empty type string', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('', 'value')

      assert.strictEqual(result, '[:value]')
    })

    test('should handle empty value string', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('type', '')

      assert.strictEqual(result, '[type:]')
    })

    test('should handle special characters in values', () => {
      const generator = new TaggedStringGenerator()
      const result1 = generator.tag('message', 'hello world!')
      const result2 = generator.tag('path', '/usr/bin/node')
      const result3 = generator.tag('email', 'user@example.com')

      assert.strictEqual(result1, '[message:hello world!]')
      assert.strictEqual(result2, '[path:/usr/bin/node]')
      assert.strictEqual(result3, '[email:user@example.com]')
    })

    test('should preserve whitespace in values', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('message', '  spaces  ')

      assert.strictEqual(result, '[message:  spaces  ]')
    })

    test('should handle delimiter characters in values', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('message', 'value [with] brackets')

      assert.strictEqual(result, '[message:value [with] brackets]')
    })

    test('should handle type separator in values', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('ratio', '3:2')

      assert.strictEqual(result, '[ratio:3:2]')
    })

    test('should handle newlines in values', () => {
      const generator = new TaggedStringGenerator()
      const result = generator.tag('message', 'line1\nline2')

      assert.strictEqual(result, '[message:line1\nline2]')
    })
  })

  describe('parser compatibility', () => {
    test('should generate tags parseable with default config', () => {
      const generator = new TaggedStringGenerator()
      const parser = new TaggedStringParser()

      const tagged = generator.tag('operation', 'deploy')
      const result = parser.parse(tagged)

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'deploy')
    })

    test('should generate tags parseable with custom delimiters', () => {
      const config = {
        openDelimiter: '{{',
        closeDelimiter: '}}',
        typeSeparator: '|',
      }
      const generator = new TaggedStringGenerator(config)
      const parser = new TaggedStringParser(config)

      const tagged = generator.tag('operation', 'deploy')
      const result = parser.parse(tagged)

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'deploy')
    })

    test('should verify parsed entities match original type and value', () => {
      const generator = new TaggedStringGenerator()
      const parser = new TaggedStringParser()

      const type = 'count'
      const value = 42
      const tagged = generator.tag(type, value)
      const result = parser.parse(tagged)

      assert.strictEqual(result.entities[0].type, type)
      assert.strictEqual(result.entities[0].value, String(value))
      assert.strictEqual(result.entities[0].parsedValue, value)
    })

    test('should support round-trip with multiple entities', () => {
      const generator = new TaggedStringGenerator()
      const parser = new TaggedStringParser()

      const message =
        generator.embed('', 'operation', 'OP-123') +
        ' started with ' +
        generator.tag('changes', 5)
      const result = parser.parse(message)

      assert.strictEqual(result.entities.length, 2)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'OP-123')
      assert.strictEqual(result.entities[1].type, 'changes')
      assert.strictEqual(result.entities[1].value, '5')
    })

    test('should support round-trip with custom single-character delimiters', () => {
      const config = {
        openDelimiter: '<',
        closeDelimiter: '>',
      }
      const generator = new TaggedStringGenerator(config)
      const parser = new TaggedStringParser(config)

      const tagged = generator.tag('operation', 'OP-123')
      const result = parser.parse(tagged)

      assert.strictEqual(result.entities.length, 1)
      assert.strictEqual(result.entities[0].type, 'operation')
      assert.strictEqual(result.entities[0].value, 'OP-123')
    })

    test('should support round-trip with boolean values', () => {
      const generator = new TaggedStringGenerator()
      const parser = new TaggedStringParser()

      const tagged = generator.tag('enabled', true)
      const result = parser.parse(tagged)

      assert.strictEqual(result.entities[0].type, 'enabled')
      assert.strictEqual(result.entities[0].value, 'true')
      assert.strictEqual(result.entities[0].parsedValue, true)
    })
  })

  describe('configuration validation', () => {
    test('should throw error for empty openDelimiter', () => {
      assert.throws(
        () => new TaggedStringGenerator({ openDelimiter: '' }),
        /openDelimiter cannot be empty/,
      )
    })

    test('should throw error for empty closeDelimiter', () => {
      assert.throws(
        () => new TaggedStringGenerator({ closeDelimiter: '' }),
        /closeDelimiter cannot be empty/,
      )
    })

    test('should throw error for identical delimiters', () => {
      assert.throws(
        () =>
          new TaggedStringGenerator({
            openDelimiter: '|',
            closeDelimiter: '|',
          }),
        /openDelimiter and closeDelimiter must be different/,
      )
    })

    test('should allow empty typeSeparator', () => {
      const generator = new TaggedStringGenerator({ typeSeparator: '' })
      const result = generator.tag('operation', 'deploy')

      assert.strictEqual(result, '[operationdeploy]')
    })
  })
})
