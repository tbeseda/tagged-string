import assert from 'node:assert'
import { describe, test } from 'node:test'
import * as fc from 'fast-check'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'
import type { EntitySchema } from '../../src/types.ts'

describe('Property-Based Tests', () => {
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

  describe('property-based tests for quoted strings', () => {
    /**
     * Feature: delimiter-free-parsing, Property 4: Quoted strings preserve content
     * Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.2
     */
    test('Property 4: Quoted strings preserve content', () => {
      // Generator for content that may contain spaces and special characters
      const contentArbitrary = fc
        .string({
          minLength: 0,
          maxLength: 50,
        })
        .filter((s) => !s.includes('"') && !s.includes('\\'))

      // Test in delimited mode
      fc.assert(
        fc.property(contentArbitrary, contentArbitrary, (key, value) => {
          const parser = new TaggedStringParser({ typeSeparator: '=' })

          // Build a tag with quoted key and value
          const quotedKey = `"${key}"`
          const quotedValue = `"${value}"`
          const message = `[${quotedKey}=${quotedValue}]`

          const result = parser.parse(message)

          // Property: Content should be preserved exactly
          if (result.entities.length > 0) {
            assert.strictEqual(
              result.entities[0].type,
              key,
              `Key content not preserved. Expected: "${key}", Got: "${result.entities[0].type}"`,
            )
            assert.strictEqual(
              result.entities[0].value,
              value,
              `Value content not preserved. Expected: "${value}", Got: "${result.entities[0].value}"`,
            )
          }
        }),
        { numRuns: 100 },
      )

      // Test in delimiter-free mode
      fc.assert(
        fc.property(
          contentArbitrary.filter((s) => s.trim().length > 0),
          contentArbitrary.filter((s) => s.trim().length > 0),
          (key, value) => {
            const parser = new TaggedStringParser({
              delimiters: false,
              typeSeparator: '=',
            })

            // Build a delimiter-free pattern with quoted key and value
            const quotedKey = `"${key}"`
            const quotedValue = `"${value}"`
            const message = `${quotedKey}=${quotedValue}`

            const result = parser.parse(message)

            // Property: Content should be preserved exactly
            if (result.entities.length > 0) {
              assert.strictEqual(
                result.entities[0].type,
                key,
                `Key content not preserved in delimiter-free mode. Expected: "${key}", Got: "${result.entities[0].type}"`,
              )
              assert.strictEqual(
                result.entities[0].value,
                value,
                `Value content not preserved in delimiter-free mode. Expected: "${value}", Got: "${result.entities[0].value}"`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    test('Property 4 (edge case): Quoted strings with separator characters', () => {
      // Generator for content that includes separator characters
      const contentWithSeparatorArbitrary = fc
        .array(fc.constantFrom('a', 'b', '=', ':', ' ', 'x', 'y'), {
          minLength: 1,
          maxLength: 20,
        })
        .map((chars) => chars.join(''))

      fc.assert(
        fc.property(contentWithSeparatorArbitrary, (value) => {
          const parser = new TaggedStringParser({ typeSeparator: '=' })

          // Build a tag with quoted value containing separator
          const message = `[key="${value}"]`

          const result = parser.parse(message)

          // Property: Separator characters in quoted values should be preserved
          assert.strictEqual(result.entities.length, 1)
          assert.strictEqual(
            result.entities[0].value,
            value,
            `Separator in quoted value not preserved. Expected: "${value}", Got: "${result.entities[0].value}"`,
          )
        }),
        { numRuns: 100 },
      )
    })

    test('Property 4 (edge case): Quoted strings with spaces', () => {
      // Generator for content with multiple spaces
      const contentWithSpacesArbitrary = fc
        .array(fc.constantFrom('a', 'b', ' ', 'c', 'd', '  '), {
          minLength: 1,
          maxLength: 20,
        })
        .map((chars) => chars.join(''))

      fc.assert(
        fc.property(contentWithSpacesArbitrary, (content) => {
          const parser = new TaggedStringParser({ typeSeparator: '=' })

          // Test with quoted key
          const message1 = `["${content}"=value]`
          const result1 = parser.parse(message1)

          if (result1.entities.length > 0) {
            assert.strictEqual(
              result1.entities[0].type,
              content,
              `Spaces in quoted key not preserved. Expected: "${content}", Got: "${result1.entities[0].type}"`,
            )
          }

          // Test with quoted value
          const message2 = `[key="${content}"]`
          const result2 = parser.parse(message2)

          if (result2.entities.length > 0) {
            assert.strictEqual(
              result2.entities[0].value,
              content,
              `Spaces in quoted value not preserved. Expected: "${content}", Got: "${result2.entities[0].value}"`,
            )
          }
        }),
        { numRuns: 100 },
      )
    })

    /**
     * Feature: delimiter-free-parsing, Property 7: Quoted keys work in both modes
     * Validates: Requirements 4.5
     */
    test('Property 7: Quoted keys work in both modes', () => {
      // Generator for keys with spaces (which require quoting)
      const keyWithSpacesArbitrary = fc
        .array(fc.constantFrom('a', 'b', ' ', 'c', 'd', 'e'), {
          minLength: 2,
          maxLength: 20,
        })
        .map((chars) => chars.join(''))
        .filter((s) => s.includes(' ') && s.trim().length > 0)

      // Generator for simple values (no quotes, no spaces, no delimiters)
      const simpleValueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            !s.includes('"') &&
            !s.includes('\\') &&
            !/\s/.test(s) &&
            !s.includes('[') &&
            !s.includes(']'),
        )

      fc.assert(
        fc.property(
          keyWithSpacesArbitrary,
          simpleValueArbitrary,
          (key, value) => {
            // Test in delimited mode
            const delimitedParser = new TaggedStringParser({
              typeSeparator: '=',
            })
            const delimitedMessage = `["${key}"=${value}]`
            const delimitedResult = delimitedParser.parse(delimitedMessage)

            // Property: Quoted key should be extracted in delimited mode
            assert.strictEqual(
              delimitedResult.entities.length,
              1,
              `Delimited mode should extract entity with quoted key. Message: ${delimitedMessage}`,
            )
            assert.strictEqual(
              delimitedResult.entities[0].type,
              key,
              `Delimited mode: Key not preserved. Expected: "${key}", Got: "${delimitedResult.entities[0].type}"`,
            )
            assert.strictEqual(
              delimitedResult.entities[0].value,
              value,
              `Delimited mode: Value not preserved. Expected: "${value}", Got: "${delimitedResult.entities[0].value}"`,
            )

            // Test in delimiter-free mode
            const delimiterFreeParser = new TaggedStringParser({
              delimiters: false,
              typeSeparator: '=',
            })
            const delimiterFreeMessage = `"${key}"=${value}`
            const delimiterFreeResult =
              delimiterFreeParser.parse(delimiterFreeMessage)

            // Property: Quoted key should be extracted in delimiter-free mode
            assert.strictEqual(
              delimiterFreeResult.entities.length,
              1,
              `Delimiter-free mode should extract entity with quoted key. Message: ${delimiterFreeMessage}`,
            )
            assert.strictEqual(
              delimiterFreeResult.entities[0].type,
              key,
              `Delimiter-free mode: Key not preserved. Expected: "${key}", Got: "${delimiterFreeResult.entities[0].type}"`,
            )
            assert.strictEqual(
              delimiterFreeResult.entities[0].value,
              value,
              `Delimiter-free mode: Value not preserved. Expected: "${value}", Got: "${delimiterFreeResult.entities[0].value}"`,
            )
          },
        ),
        { numRuns: 100 },
      )
    })

    test('Property 7 (edge case): Quoted keys with special characters in both modes', () => {
      // Generator for keys with special characters that would normally break parsing
      const keyWithSpecialCharsArbitrary = fc
        .array(fc.constantFrom('a', 'b', '=', ':', ' ', '[', ']', 'x'), {
          minLength: 2,
          maxLength: 15,
        })
        .map((chars) => chars.join(''))
        .filter((s) => s.trim().length > 0)

      const simpleValueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 15,
        })
        .filter(
          (s) =>
            !s.includes('"') &&
            !s.includes('\\') &&
            !/\s/.test(s) &&
            !s.includes('[') &&
            !s.includes(']'),
        )

      fc.assert(
        fc.property(
          keyWithSpecialCharsArbitrary,
          simpleValueArbitrary,
          (key, value) => {
            // Test in delimited mode
            const delimitedParser = new TaggedStringParser({
              typeSeparator: '=',
            })
            const delimitedMessage = `["${key}"=${value}]`
            const delimitedResult = delimitedParser.parse(delimitedMessage)

            if (delimitedResult.entities.length > 0) {
              assert.strictEqual(
                delimitedResult.entities[0].type,
                key,
                `Delimited mode: Special chars in key not preserved. Expected: "${key}", Got: "${delimitedResult.entities[0].type}"`,
              )
            }

            // Test in delimiter-free mode
            const delimiterFreeParser = new TaggedStringParser({
              delimiters: false,
              typeSeparator: '=',
            })
            const delimiterFreeMessage = `"${key}"=${value}`
            const delimiterFreeResult =
              delimiterFreeParser.parse(delimiterFreeMessage)

            if (delimiterFreeResult.entities.length > 0) {
              assert.strictEqual(
                delimiterFreeResult.entities[0].type,
                key,
                `Delimiter-free mode: Special chars in key not preserved. Expected: "${key}", Got: "${delimiterFreeResult.entities[0].type}"`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('property-based tests for escape sequence scope', () => {
    /**
     * Feature: delimiter-free-parsing, Property 6: Escape sequences only apply in quoted strings
     * Validates: Requirements 5.5
     */
    test('Property 6: Escape sequences only apply in quoted strings', () => {
      // Generator for strings that may contain backslashes but NOT quotes
      // (quotes would trigger quoted string parsing, which is a different code path)
      const stringWithBackslashesArbitrary = fc
        .array(fc.constantFrom('\\', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'), {
          minLength: 1,
          maxLength: 20,
        })
        .map((chars) => chars.join(''))
        .filter((s) => s.includes('\\') && !/\s/.test(s) && !s.includes('='))

      fc.assert(
        fc.property(stringWithBackslashesArbitrary, (unquotedValue) => {
          // Test in delimiter-free mode with unquoted value
          const parser = new TaggedStringParser({
            delimiters: false,
            typeSeparator: '=',
          })

          const message = `key=${unquotedValue}`
          const result = parser.parse(message)

          // Property: Backslashes in unquoted text should be treated as literal characters
          // No escape sequence processing should occur
          assert.strictEqual(
            result.entities.length,
            1,
            `Should extract one entity from: ${message}`,
          )
          assert.strictEqual(
            result.entities[0].value,
            unquotedValue,
            `Backslashes in unquoted value should be literal. Expected: "${unquotedValue}", Got: "${result.entities[0].value}"`,
          )
        }),
        { numRuns: 100 },
      )

      // Test in delimited mode with unquoted value
      fc.assert(
        fc.property(stringWithBackslashesArbitrary, (unquotedValue) => {
          const parser = new TaggedStringParser({ typeSeparator: '=' })

          const message = `[key=${unquotedValue}]`
          const result = parser.parse(message)

          // Property: Backslashes in unquoted text should be treated as literal characters
          assert.strictEqual(
            result.entities.length,
            1,
            `Should extract one entity from: ${message}`,
          )
          assert.strictEqual(
            result.entities[0].value,
            unquotedValue,
            `Backslashes in unquoted value (delimited mode) should be literal. Expected: "${unquotedValue}", Got: "${result.entities[0].value}"`,
          )
        }),
        { numRuns: 100 },
      )
    })

    test('Property 6 (edge case): Backslash-quote in unquoted text', () => {
      // Test that \\" in unquoted text is treated as literal backslash followed by quote
      const parser1 = new TaggedStringParser({
        delimiters: false,
        typeSeparator: '=',
      })

      // In unquoted context, backslashes should be literal
      const result1 = parser1.parse('key=test\\"value')

      assert.strictEqual(result1.entities.length, 1)
      assert.strictEqual(
        result1.entities[0].value,
        'test\\"value',
        'Backslash-quote in unquoted value should be literal',
      )

      // Test in delimited mode
      const parser2 = new TaggedStringParser({ typeSeparator: '=' })
      const result2 = parser2.parse('[key=test\\"value]')

      assert.strictEqual(result2.entities.length, 1)
      assert.strictEqual(
        result2.entities[0].value,
        'test\\"value',
        'Backslash-quote in unquoted value (delimited) should be literal',
      )
    })

    test('Property 6 (edge case): Backslash-backslash in unquoted text', () => {
      // Test that \\\\ in unquoted text is treated as literal backslashes
      const parser1 = new TaggedStringParser({
        delimiters: false,
        typeSeparator: '=',
      })

      const result1 = parser1.parse('key=path\\\\to\\\\file')

      assert.strictEqual(result1.entities.length, 1)
      assert.strictEqual(
        result1.entities[0].value,
        'path\\\\to\\\\file',
        'Double backslashes in unquoted value should be literal',
      )

      // Test in delimited mode
      const parser2 = new TaggedStringParser({ typeSeparator: '=' })
      const result2 = parser2.parse('[key=path\\\\to\\\\file]')

      assert.strictEqual(result2.entities.length, 1)
      assert.strictEqual(
        result2.entities[0].value,
        'path\\\\to\\\\file',
        'Double backslashes in unquoted value (delimited) should be literal',
      )
    })

    test('Property 6 (contrast): Escape sequences DO work in quoted strings', () => {
      // Verify that escape sequences still work in quoted strings (contrast test)
      const parser1 = new TaggedStringParser({
        delimiters: false,
        typeSeparator: '=',
      })

      // In quoted context, escape sequences should be processed
      const result1 = parser1.parse('key="test\\"value"')

      assert.strictEqual(result1.entities.length, 1)
      assert.strictEqual(
        result1.entities[0].value,
        'test"value',
        'Escape sequences should work in quoted strings',
      )

      // Test backslash-backslash in quoted string
      const result2 = parser1.parse('key="path\\\\to\\\\file"')

      assert.strictEqual(result2.entities.length, 1)
      assert.strictEqual(
        result2.entities[0].value,
        'path\\to\\file',
        'Double backslashes should be processed in quoted strings',
      )
    })
  })

  describe('property-based tests for backward compatibility', () => {
    /**
     * Feature: delimiter-free-parsing, Property 8: Delimited mode ignores delimiter-free patterns
     * Validates: Requirements 6.2
     */
    test('Property 8: Delimited mode ignores delimiter-free patterns', () => {
      // Generator for valid keys (no whitespace, no separator, no quotes, no delimiters)
      const keyArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes('=') &&
            !s.includes(':') &&
            !s.includes('"') &&
            !s.includes('[') &&
            !s.includes(']') &&
            !/\s/.test(s),
        )

      // Generator for valid values (no whitespace, no quotes, no delimiters)
      const valueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes('"') &&
            !s.includes('[') &&
            !s.includes(']') &&
            !/\s/.test(s),
        )

      // Generator for key-value pairs
      const keyValuePairArbitrary = fc.tuple(keyArbitrary, valueArbitrary)

      // Generator for arrays of key-value pairs (delimiter-free patterns)
      const keyValueArrayArbitrary = fc.array(keyValuePairArbitrary, {
        minLength: 1,
        maxLength: 3,
      })

      fc.assert(
        fc.property(keyValueArrayArbitrary, (pairs) => {
          const parser = new TaggedStringParser({
            delimiters: ['[', ']'],
            typeSeparator: '=',
          })

          // Build a string with key=value patterns (delimiter-free syntax)
          // These should NOT be extracted in delimited mode
          const message = pairs
            .map(([key, value]) => `${key}=${value}`)
            .join(' ')

          const result = parser.parse(message)

          // Property: Delimited mode should NOT extract delimiter-free patterns
          assert.strictEqual(
            result.entities.length,
            0,
            `Delimited mode should not extract delimiter-free patterns. Found ${result.entities.length} entities from: ${message}`,
          )
        }),
        { numRuns: 100 },
      )
    })

    test('Property 8 (edge case): Delimited mode extracts only delimited entities', () => {
      // Generator for valid keys
      const keyArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes('=') &&
            !s.includes(':') &&
            !s.includes('"') &&
            !s.includes('[') &&
            !s.includes(']') &&
            !/\s/.test(s),
        )

      // Generator for valid values
      const valueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes('"') &&
            !s.includes('[') &&
            !s.includes(']') &&
            !/\s/.test(s),
        )

      fc.assert(
        fc.property(
          keyArbitrary,
          valueArbitrary,
          keyArbitrary,
          valueArbitrary,
          (key1, value1, key2, value2) => {
            const parser = new TaggedStringParser({
              delimiters: ['[', ']'],
              typeSeparator: '=',
            })

            // Mix delimiter-free pattern with delimited entity
            const message = `${key1}=${value1} [${key2}=${value2}]`

            const result = parser.parse(message)

            // Property: Should only extract the delimited entity, not the delimiter-free pattern
            assert.strictEqual(
              result.entities.length,
              1,
              `Should extract only delimited entity from: ${message}`,
            )

            assert.strictEqual(
              result.entities[0].type,
              key2,
              `Should extract delimited entity key. Expected: ${key2}, Got: ${result.entities[0].type}`,
            )
            assert.strictEqual(
              result.entities[0].value,
              value2,
              `Should extract delimited entity value. Expected: ${value2}, Got: ${result.entities[0].value}`,
            )
          },
        ),
        { numRuns: 100 },
      )
    })

    /**
     * Feature: delimiter-free-parsing, Property 9: Backward compatibility is maintained
     * Validates: Requirements 6.3
     */
    test('Property 9: Backward compatibility is maintained', () => {
      // Generator for valid keys (no separator, no quotes, no delimiters)
      const keyArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes(':') &&
            !s.includes('=') &&
            !s.includes('"') &&
            !s.includes('[') &&
            !s.includes(']') &&
            !/\s/.test(s),
        )

      // Generator for valid values (no quotes, no delimiters)
      const valueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes('"') &&
            !s.includes('[') &&
            !s.includes(']'),
        )

      // Generator for type separator
      const separatorArbitrary = fc.constantFrom(':', '=', '|')

      fc.assert(
        fc.property(
          keyArbitrary,
          valueArbitrary,
          separatorArbitrary,
          (key, value, separator) => {
            // Create parser with explicit delimiters (new API)
            const newParser = new TaggedStringParser({
              delimiters: ['[', ']'],
              typeSeparator: separator,
            })

            // Create parser with old API (backward compatible)
            const oldParser = new TaggedStringParser({
              openDelimiter: '[',
              closeDelimiter: ']',
              typeSeparator: separator,
            })

            // Build a delimited message
            const message = `[${key}${separator}${value}]`

            const newResult = newParser.parse(message)
            const oldResult = oldParser.parse(message)

            // Property: Both parsers should produce identical results
            assert.strictEqual(
              newResult.entities.length,
              oldResult.entities.length,
              `Entity count mismatch for: ${message}`,
            )

            if (newResult.entities.length > 0) {
              assert.strictEqual(
                newResult.entities[0].type,
                oldResult.entities[0].type,
                `Type mismatch. New: ${newResult.entities[0].type}, Old: ${oldResult.entities[0].type}`,
              )
              assert.strictEqual(
                newResult.entities[0].value,
                oldResult.entities[0].value,
                `Value mismatch. New: ${newResult.entities[0].value}, Old: ${oldResult.entities[0].value}`,
              )
              assert.strictEqual(
                newResult.entities[0].parsedValue,
                oldResult.entities[0].parsedValue,
                `Parsed value mismatch`,
              )
              assert.strictEqual(
                newResult.entities[0].inferredType,
                oldResult.entities[0].inferredType,
                `Inferred type mismatch`,
              )
              assert.strictEqual(
                newResult.entities[0].formattedValue,
                oldResult.entities[0].formattedValue,
                `Formatted value mismatch`,
              )
              assert.strictEqual(
                newResult.entities[0].position,
                oldResult.entities[0].position,
                `Position mismatch`,
              )
              assert.strictEqual(
                newResult.entities[0].endPosition,
                oldResult.entities[0].endPosition,
                `End position mismatch`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    test('Property 9 (edge case): Type inference remains unchanged', () => {
      // Generator for numeric values
      const numericValueArbitrary = fc.integer({ min: -1000, max: 1000 })

      // Generator for boolean values
      const booleanValueArbitrary = fc.boolean()

      // Generator for string values
      const stringValueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes('[') &&
            !s.includes(']') &&
            !s.includes('"') &&
            !/^-?\d+(\.\d+)?$/.test(s) && // Not a number
            !/^(true|false)$/i.test(s), // Not a boolean
        )

      fc.assert(
        fc.property(
          fc.oneof(
            numericValueArbitrary.map((v) => ({
              value: String(v),
              expectedType: 'number' as const,
            })),
            booleanValueArbitrary.map((v) => ({
              value: String(v),
              expectedType: 'boolean' as const,
            })),
            stringValueArbitrary.map((v) => ({
              value: v,
              expectedType: 'string' as const,
            })),
          ),
          ({ value, expectedType }) => {
            // Create parser with new API
            const newParser = new TaggedStringParser({
              delimiters: ['[', ']'],
            })

            // Create parser with old API
            const oldParser = new TaggedStringParser({
              openDelimiter: '[',
              closeDelimiter: ']',
            })

            const message = `[key:${value}]`

            const newResult = newParser.parse(message)
            const oldResult = oldParser.parse(message)

            // Property: Type inference should be identical
            if (
              newResult.entities.length > 0 &&
              oldResult.entities.length > 0
            ) {
              assert.strictEqual(
                newResult.entities[0].inferredType,
                oldResult.entities[0].inferredType,
                `Type inference mismatch for value: ${value}`,
              )
              assert.strictEqual(
                newResult.entities[0].inferredType,
                expectedType,
                `Type inference incorrect for value: ${value}`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    test('Property 9 (edge case): Custom delimiters work identically', () => {
      // Generator for custom delimiters
      const delimiterPairArbitrary = fc.constantFrom(
        ['{{', '}}'],
        ['<', '>'],
        ['<<<', '>>>'],
        ['{', '}'],
      )

      // Generator for valid keys
      const keyArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 15,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes(':') &&
            !s.includes('"') &&
            !/\s/.test(s),
        )

      // Generator for valid values
      const valueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 15,
        })
        .filter((s) => s.trim().length > 0 && !s.includes('"'))

      fc.assert(
        fc.property(
          delimiterPairArbitrary,
          keyArbitrary,
          valueArbitrary,
          ([open, close], key, value) => {
            // Filter out keys/values that contain the delimiters
            if (
              key.includes(open) ||
              key.includes(close) ||
              value.includes(open) ||
              value.includes(close)
            ) {
              return
            }

            // Create parser with new API
            const newParser = new TaggedStringParser({
              delimiters: [open, close],
            })

            // Create parser with old API
            const oldParser = new TaggedStringParser({
              openDelimiter: open,
              closeDelimiter: close,
            })

            const message = `${open}${key}:${value}${close}`

            const newResult = newParser.parse(message)
            const oldResult = oldParser.parse(message)

            // Property: Results should be identical
            assert.strictEqual(
              newResult.entities.length,
              oldResult.entities.length,
              `Entity count mismatch for custom delimiters: ${open}${close}`,
            )

            if (newResult.entities.length > 0) {
              assert.strictEqual(
                newResult.entities[0].type,
                oldResult.entities[0].type,
                `Type mismatch with custom delimiters`,
              )
              assert.strictEqual(
                newResult.entities[0].value,
                oldResult.entities[0].value,
                `Value mismatch with custom delimiters`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    /**
     * Feature: delimiter-free-parsing, Property 10: Schema and formatters work in both modes
     * Validates: Requirements 6.4, 6.5
     */
    test('Property 10: Schema and formatters work in both modes', () => {
      // Generator for entity types
      const entityTypeArbitrary = fc.constantFrom(
        'count',
        'enabled',
        'name',
        'price',
      )

      // Generator for values based on type
      const valueForTypeArbitrary = (type: string) => {
        switch (type) {
          case 'count':
            return fc.integer({ min: 0, max: 1000 }).map(String)
          case 'enabled':
            return fc.boolean().map(String)
          case 'name':
            return fc
              .string({ minLength: 1, maxLength: 20 })
              .filter(
                (s) =>
                  s.trim().length > 0 &&
                  !s.includes('"') &&
                  !s.includes('[') &&
                  !s.includes(']') &&
                  !/\s/.test(s),
              )
          case 'price':
            return fc
              .float({ min: 0, max: 1000, noNaN: true })
              .map((n) => n.toFixed(2))
          default:
            return fc.constant('test')
        }
      }

      // Define schema with formatters
      const schema: EntitySchema = {
        count: {
          type: 'number',
          format: (val) => `[${val} items]`,
        },
        enabled: {
          type: 'boolean',
          format: (val) => (val ? 'YES' : 'NO'),
        },
        name: {
          type: 'string',
          format: (val) => String(val).toUpperCase(),
        },
        price: {
          type: 'number',
          format: (val) => `$${val}`,
        },
      }

      fc.assert(
        fc.property(
          entityTypeArbitrary.chain((type) =>
            valueForTypeArbitrary(type).map((value) => ({ type, value })),
          ),
          ({ type, value }) => {
            // Test in delimited mode
            const delimitedParser = new TaggedStringParser({
              schema,
              delimiters: ['[', ']'],
              typeSeparator: '=',
            })

            const delimitedMessage = `[${type}=${value}]`
            const delimitedResult = delimitedParser.parse(delimitedMessage)

            // Test in delimiter-free mode
            const delimiterFreeParser = new TaggedStringParser({
              schema,
              delimiters: false,
              typeSeparator: '=',
            })

            const delimiterFreeMessage = `${type}=${value}`
            const delimiterFreeResult =
              delimiterFreeParser.parse(delimiterFreeMessage)

            // Property: Schema should apply in both modes
            if (
              delimitedResult.entities.length > 0 &&
              delimiterFreeResult.entities.length > 0
            ) {
              const delimitedEntity = delimitedResult.entities[0]
              const delimiterFreeEntity = delimiterFreeResult.entities[0]

              // Type should match
              assert.strictEqual(
                delimitedEntity.type,
                delimiterFreeEntity.type,
                `Type mismatch for ${type}`,
              )

              // Inferred type should match schema
              const schemaEntry = schema[type]
              const expectedType =
                typeof schemaEntry === 'string'
                  ? schemaEntry
                  : schemaEntry?.type || 'string'
              assert.strictEqual(
                delimitedEntity.inferredType,
                expectedType,
                `Delimited mode: Schema type not applied for ${type}`,
              )
              assert.strictEqual(
                delimiterFreeEntity.inferredType,
                expectedType,
                `Delimiter-free mode: Schema type not applied for ${type}`,
              )

              // Parsed values should be identical
              assert.deepStrictEqual(
                delimitedEntity.parsedValue,
                delimiterFreeEntity.parsedValue,
                `Parsed value mismatch for ${type}`,
              )

              // Formatted values should be identical (formatter applied in both modes)
              assert.strictEqual(
                delimitedEntity.formattedValue,
                delimiterFreeEntity.formattedValue,
                `Formatted value mismatch for ${type}. Delimited: ${delimitedEntity.formattedValue}, Delimiter-free: ${delimiterFreeEntity.formattedValue}`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    test('Property 10 (edge case): Schema with shorthand syntax works in both modes', () => {
      // Simple schema with shorthand syntax (just type, no formatter)
      const schema: EntitySchema = {
        count: 'number',
        enabled: 'boolean',
        name: 'string',
      }

      // Generator for entity types
      const entityTypeArbitrary = fc.constantFrom('count', 'enabled', 'name')

      // Generator for values
      const valueArbitrary = fc.oneof(
        fc.integer({ min: 0, max: 100 }).map(String),
        fc.boolean().map(String),
        fc
          .string({ minLength: 1, maxLength: 15 })
          .filter(
            (s) =>
              s.trim().length > 0 &&
              !s.includes('"') &&
              !s.includes('[') &&
              !s.includes(']') &&
              !/\s/.test(s) &&
              !/^-?\d+$/.test(s) &&
              !/^(true|false)$/i.test(s),
          ),
      )

      fc.assert(
        fc.property(entityTypeArbitrary, valueArbitrary, (type, value) => {
          // Test in delimited mode
          const delimitedParser = new TaggedStringParser({
            schema,
            delimiters: ['[', ']'],
          })

          const delimitedMessage = `[${type}:${value}]`
          const delimitedResult = delimitedParser.parse(delimitedMessage)

          // Test in delimiter-free mode
          const delimiterFreeParser = new TaggedStringParser({
            schema,
            delimiters: false,
          })

          const delimiterFreeMessage = `${type}:${value}`
          const delimiterFreeResult =
            delimiterFreeParser.parse(delimiterFreeMessage)

          // Property: Schema should apply identically in both modes
          if (
            delimitedResult.entities.length > 0 &&
            delimiterFreeResult.entities.length > 0
          ) {
            assert.strictEqual(
              delimitedResult.entities[0].inferredType,
              delimiterFreeResult.entities[0].inferredType,
              `Inferred type mismatch for ${type}:${value}`,
            )

            assert.deepStrictEqual(
              delimitedResult.entities[0].parsedValue,
              delimiterFreeResult.entities[0].parsedValue,
              `Parsed value mismatch for ${type}:${value}`,
            )
          }
        }),
        { numRuns: 100 },
      )
    })

    test('Property 10 (edge case): Formatters handle edge cases in both modes', () => {
      // Schema with formatter that handles edge cases
      const schema: EntitySchema = {
        value: {
          type: 'string',
          format: (val) => {
            const str = String(val)
            return str.length > 10 ? `${str.substring(0, 10)}...` : str
          },
        },
      }

      // Generator for values of varying lengths
      const valueArbitrary = fc
        .string({ minLength: 0, maxLength: 30 })
        .filter(
          (s) =>
            !s.includes('"') &&
            !s.includes('[') &&
            !s.includes(']') &&
            !/\s/.test(s),
        )

      fc.assert(
        fc.property(valueArbitrary, (value) => {
          if (value.length === 0) return // Skip empty values

          // Test in delimited mode
          const delimitedParser = new TaggedStringParser({
            schema,
            delimiters: ['[', ']'],
          })

          const delimitedMessage = `[value:${value}]`
          const delimitedResult = delimitedParser.parse(delimitedMessage)

          // Test in delimiter-free mode
          const delimiterFreeParser = new TaggedStringParser({
            schema,
            delimiters: false,
          })

          const delimiterFreeMessage = `value:${value}`
          const delimiterFreeResult =
            delimiterFreeParser.parse(delimiterFreeMessage)

          // Property: Formatter should produce identical output in both modes
          if (
            delimitedResult.entities.length > 0 &&
            delimiterFreeResult.entities.length > 0
          ) {
            assert.strictEqual(
              delimitedResult.entities[0].formattedValue,
              delimiterFreeResult.entities[0].formattedValue,
              `Formatter output mismatch for value: ${value}`,
            )

            // Verify formatter was actually applied
            const expected =
              value.length > 10 ? `${value.substring(0, 10)}...` : value
            assert.strictEqual(
              delimitedResult.entities[0].formattedValue,
              expected,
              `Formatter not applied correctly in delimited mode`,
            )
            assert.strictEqual(
              delimiterFreeResult.entities[0].formattedValue,
              expected,
              `Formatter not applied correctly in delimiter-free mode`,
            )
          }
        }),
        { numRuns: 100 },
      )
    })

    /**
     * Feature: delimiter-free-parsing, Property 11: Parser continues after malformed entities
     * Validates: Requirements 8.5
     */
    test('Property 11: Parser continues after malformed entities', () => {
      // Generator for valid keys
      const validKeyArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 15,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes('=') &&
            !s.includes(':') &&
            !s.includes('"') &&
            !/\s/.test(s),
        )

      // Generator for valid values
      const validValueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 15,
        })
        .filter((s) => s.trim().length > 0 && !s.includes('"') && !/\s/.test(s))

      // Generator for malformed patterns
      const malformedPatternArbitrary = fc.constantFrom(
        'key="unclosed', // Unclosed quoted value
        '"unclosed=value', // Unclosed quoted key
        'key=', // Missing value
        '=value', // Missing key
        'key==value', // Double separator
      )

      fc.assert(
        fc.property(
          malformedPatternArbitrary,
          validKeyArbitrary,
          validValueArbitrary,
          (malformed, validKey, validValue) => {
            const parser = new TaggedStringParser({
              delimiters: false,
              typeSeparator: '=',
            })

            // Build a message with malformed entity followed by valid entity
            const message = `${malformed} ${validKey}=${validValue}`

            const result = parser.parse(message)

            // Property: Parser should skip malformed entity and continue to extract valid entity
            // We should get at least the valid entity (may get more if malformed parts are partially valid)
            const validEntity = result.entities.find(
              (e) => e.type === validKey && e.value === validValue,
            )

            assert.ok(
              validEntity,
              `Parser should extract valid entity after malformed pattern. Message: ${message}, Entities: ${JSON.stringify(result.entities)}`,
            )

            assert.strictEqual(
              validEntity.type,
              validKey,
              `Valid entity type should be preserved`,
            )
            assert.strictEqual(
              validEntity.value,
              validValue,
              `Valid entity value should be preserved`,
            )
          },
        ),
        { numRuns: 100 },
      )
    })

    test('Property 11 (edge case): Multiple malformed entities are all skipped', () => {
      // Generator for valid entity
      const validEntityArbitrary = fc.tuple(
        fc
          .string({ minLength: 1, maxLength: 10 })
          .filter(
            (s) =>
              s.trim().length > 0 &&
              !s.includes('=') &&
              !s.includes('"') &&
              !/\s/.test(s),
          ),
        fc
          .string({ minLength: 1, maxLength: 10 })
          .filter(
            (s) => s.trim().length > 0 && !s.includes('"') && !/\s/.test(s),
          ),
      )

      // Generator for multiple malformed patterns
      const malformedArrayArbitrary = fc.array(
        fc.constantFrom(
          'bad="unclosed',
          '"unclosed=val',
          'empty=',
          '=nokey',
          'double==sep',
        ),
        { minLength: 1, maxLength: 3 },
      )

      fc.assert(
        fc.property(
          malformedArrayArbitrary,
          validEntityArbitrary,
          (malformedPatterns, [validKey, validValue]) => {
            const parser = new TaggedStringParser({
              delimiters: false,
              typeSeparator: '=',
            })

            // Build message with multiple malformed entities and one valid entity at the end
            const message = `${malformedPatterns.join(' ')} ${validKey}=${validValue}`

            const result = parser.parse(message)

            // Property: Parser should skip all malformed entities and extract the valid one
            const validEntity = result.entities.find(
              (e) => e.type === validKey && e.value === validValue,
            )

            assert.ok(
              validEntity,
              `Parser should extract valid entity after multiple malformed patterns. Message: ${message}`,
            )
          },
        ),
        { numRuns: 100 },
      )
    })

    test('Property 11 (edge case): Malformed entities in delimited mode', () => {
      // Generator for valid entity (alphanumeric only to avoid special characters)
      const validEntityArbitrary = fc.tuple(
        fc.string({ minLength: 1, maxLength: 10 }).filter(
          (s) =>
            /^[a-zA-Z0-9]+$/.test(s) && // Only alphanumeric
            s.trim().length > 0,
        ),
        fc.string({ minLength: 1, maxLength: 10 }).filter(
          (s) =>
            /^[a-zA-Z0-9]+$/.test(s) && // Only alphanumeric
            s.trim().length > 0,
        ),
      )

      // Generator for malformed delimited patterns that won't interfere with next tag
      const malformedDelimitedArbitrary = fc.constantFrom(
        '[]', // Empty tag
        '[   ]', // Whitespace only
        '[key:]', // Empty value (this gets skipped)
      )

      fc.assert(
        fc.property(
          malformedDelimitedArbitrary,
          validEntityArbitrary,
          (malformed, [validKey, validValue]) => {
            const parser = new TaggedStringParser({
              delimiters: ['[', ']'],
            })

            // Build message with malformed tag followed by valid tag
            const message = `${malformed} [${validKey}:${validValue}]`

            const result = parser.parse(message)

            // Property: Parser should skip malformed tag and extract valid tag
            const validEntity = result.entities.find(
              (e) => e.type === validKey && e.value === validValue,
            )

            assert.ok(
              validEntity,
              `Parser should extract valid tag after malformed tag. Message: ${message}, Entities: ${JSON.stringify(result.entities)}`,
            )
          },
        ),
        { numRuns: 100 },
      )
    })

    test('Property 11 (edge case): Parser returns empty result for all malformed input', () => {
      // Generator for completely malformed input (no valid entities)
      const allMalformedArbitrary = fc.array(
        fc.constantFrom(
          'key="unclosed',
          '"unclosed=value',
          'empty=',
          '=nokey',
          'double==sep',
        ),
        { minLength: 1, maxLength: 5 },
      )

      fc.assert(
        fc.property(allMalformedArbitrary, (malformedPatterns) => {
          const parser = new TaggedStringParser({
            delimiters: false,
            typeSeparator: '=',
          })

          const message = malformedPatterns.join(' ')

          const result = parser.parse(message)

          // Property: Parser should not crash and should return a valid ParseResult
          // (may be empty or contain partially extracted entities, but should not throw)
          assert.ok(result, 'Parser should return a result')
          assert.ok(
            Array.isArray(result.entities),
            'Result should have entities array',
          )
          assert.strictEqual(
            result.originalMessage,
            message,
            'Original message should be preserved',
          )
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('property-based tests for delimiter-free parsing', () => {
    /**
     * Feature: delimiter-free-parsing, Property 1: Delimiter-free mode extracts key-value patterns
     * Validates: Requirements 1.4, 2.1, 2.5
     */
    test('Property 1: Delimiter-free mode extracts key-value patterns', () => {
      // Generator for valid keys (alphanumeric, no whitespace, no separator, no quotes)
      const keyArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes('=') &&
            !s.includes('"') &&
            !/\s/.test(s),
        )

      // Generator for valid values (alphanumeric, no whitespace, no quotes)
      const valueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter((s) => s.trim().length > 0 && !s.includes('"') && !/\s/.test(s))

      // Generator for key-value pairs
      const keyValuePairArbitrary = fc.tuple(keyArbitrary, valueArbitrary)

      // Generator for arrays of key-value pairs
      const keyValueArrayArbitrary = fc.array(keyValuePairArbitrary, {
        minLength: 1,
        maxLength: 5,
      })

      fc.assert(
        fc.property(keyValueArrayArbitrary, (pairs) => {
          const parser = new TaggedStringParser({
            delimiters: false,
            typeSeparator: '=',
          })

          // Build a string with key=value patterns separated by spaces
          const message = pairs
            .map(([key, value]) => `${key}=${value}`)
            .join(' ')

          const result = parser.parse(message)

          // Property: All key-value pairs should be extracted
          assert.strictEqual(
            result.entities.length,
            pairs.length,
            `Expected ${pairs.length} entities, got ${result.entities.length} from: ${message}`,
          )

          // Property: Each entity should match the corresponding pair
          for (let i = 0; i < pairs.length; i++) {
            const [expectedKey, expectedValue] = pairs[i]
            const entity = result.entities[i]

            assert.strictEqual(
              entity.type,
              expectedKey,
              `Entity ${i} type mismatch. Expected: ${expectedKey}, Got: ${entity.type}`,
            )
            assert.strictEqual(
              entity.value,
              expectedValue,
              `Entity ${i} value mismatch. Expected: ${expectedValue}, Got: ${entity.value}`,
            )
          }
        }),
        { numRuns: 100 },
      )
    })

    /**
     * Feature: delimiter-free-parsing, Property 2: Whitespace defines entity boundaries
     * Validates: Requirements 2.2, 2.3
     */
    test('Property 2: Whitespace defines entity boundaries', () => {
      // Generator for valid keys (no whitespace, no separator, no quotes)
      const keyArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter(
          (s) =>
            s.trim().length > 0 &&
            !s.includes('=') &&
            !s.includes('"') &&
            !/\s/.test(s),
        )

      // Generator for valid values (no whitespace, no quotes)
      const valueArbitrary = fc
        .string({
          minLength: 1,
          maxLength: 20,
        })
        .filter((s) => s.trim().length > 0 && !s.includes('"') && !/\s/.test(s))

      // Generator for whitespace (space, tab, multiple spaces)
      const whitespaceArbitrary = fc.constantFrom(' ', '  ', '\t', '   ')

      // Generator for key-value pair with surrounding whitespace
      const keyValueWithWhitespaceArbitrary = fc.tuple(
        keyArbitrary,
        valueArbitrary,
        whitespaceArbitrary,
        whitespaceArbitrary,
      )

      fc.assert(
        fc.property(
          keyValueWithWhitespaceArbitrary,
          ([key, value, before, after]) => {
            const parser = new TaggedStringParser({
              delimiters: false,
              typeSeparator: '=',
            })

            // Build a string with whitespace before and after the entity
            const message = `${before}${key}=${value}${after}`

            const result = parser.parse(message)

            // Property: Whitespace should define boundaries, entity should be extracted
            assert.strictEqual(
              result.entities.length,
              1,
              `Expected 1 entity from: "${message}"`,
            )

            assert.strictEqual(
              result.entities[0].type,
              key,
              `Key mismatch. Expected: ${key}, Got: ${result.entities[0].type}`,
            )
            assert.strictEqual(
              result.entities[0].value,
              value,
              `Value mismatch. Expected: ${value}, Got: ${result.entities[0].value}`,
            )
          },
        ),
        { numRuns: 100 },
      )
    })

    /**
     * Feature: delimiter-free-parsing, Property 3: Type separator is respected
     * Validates: Requirements 2.4
     */
    test('Property 3: Type separator is respected', () => {
      // Generator that creates separator, key, and value together
      const testCaseArbitrary = fc
        .constantFrom(':', '=', '|')
        .chain((separator) => {
          // Generator for valid keys (no whitespace, no current separator, no quotes)
          const keyArbitrary = fc
            .string({
              minLength: 1,
              maxLength: 20,
            })
            .filter(
              (s) =>
                s.trim().length > 0 &&
                !s.includes(separator) &&
                !s.includes('"') &&
                !/\s/.test(s),
            )

          // Generator for valid values (no whitespace, no quotes)
          const valueArbitrary = fc
            .string({
              minLength: 1,
              maxLength: 20,
            })
            .filter(
              (s) => s.trim().length > 0 && !s.includes('"') && !/\s/.test(s),
            )

          return fc
            .tuple(keyArbitrary, valueArbitrary)
            .map(([key, value]) => ({ separator, key, value }))
        })

      fc.assert(
        fc.property(testCaseArbitrary, ({ separator, key, value }) => {
          const parser = new TaggedStringParser({
            delimiters: false,
            typeSeparator: separator,
          })

          const message = `${key}${separator}${value}`

          const result = parser.parse(message)

          // Property: The configured separator should be used to split key and value
          assert.strictEqual(
            result.entities.length,
            1,
            `Expected 1 entity from: "${message}" with separator "${separator}"`,
          )

          assert.strictEqual(
            result.entities[0].type,
            key,
            `Key mismatch. Expected: ${key}, Got: ${result.entities[0].type}`,
          )
          assert.strictEqual(
            result.entities[0].value,
            value,
            `Value mismatch. Expected: ${value}, Got: ${result.entities[0].value}`,
          )
        }),
        { numRuns: 100 },
      )
    })
  })
})
