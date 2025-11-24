# Implementation Plan

- [x] 1. Update type definitions for delimiter configuration
  - Add `DelimiterConfig` type to `src/types.ts`
  - Add `delimiters` option to `ParserConfig` interface
  - _Requirements: 1.1, 1.2, 1.3, 7.1_

- [x] 2. Implement configuration resolution logic
  - Add `isDelimiterFree` property to parser class
  - Implement delimiter configuration resolution in constructor
  - Handle `delimiters: false`, `delimiters: []`, and `delimiters: [string, string]`
  - Maintain backward compatibility with `openDelimiter`/`closeDelimiter`
  - Update validation to handle delimiter-free mode
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 7.2, 7.3, 7.4, 7.5_

- [x] 2.1 Write unit tests for configuration resolution
  - Test `delimiters: false` enables delimiter-free mode
  - Test `delimiters: []` enables delimiter-free mode
  - Test `delimiters: ['[', ']']` enables delimited mode
  - Test backward compatibility with individual delimiter options
  - Test configuration precedence
  - Test invalid configuration errors
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 3. Implement quoted string extraction utility
  - Create `extractQuotedString` method that handles escape sequences
  - Process `\"` as literal quote
  - Process `\\` as literal backslash
  - Handle unclosed quotes gracefully (return null)
  - Handle backslash at end of string
  - _Requirements: 3.4, 4.3, 5.1, 5.2, 5.4_

- [ ] 3.1 Write unit tests for quoted string extraction
  - Test basic quoted string extraction
  - Test escape sequence processing (`\"` and `\\`)
  - Test unclosed quotes return null
  - Test backslash at end of string
  - Test quotes with spaces and special characters
  - _Requirements: 3.4, 4.3, 5.1, 5.2, 5.4_

- [ ] 3.2 Write property test for escape sequence processing
  - **Property 5: Escape sequences are processed**
  - **Validates: Requirements 3.4, 4.3, 5.1, 5.2, 5.3**

- [ ] 4. Implement unquoted token extraction utility
  - Create `extractUnquotedToken` method
  - Stop at whitespace or specified stop characters
  - Return content and end position
  - _Requirements: 2.2, 2.3_

- [ ] 4.1 Write unit tests for unquoted token extraction
  - Test token extraction with whitespace boundaries
  - Test token extraction with stop characters
  - Test empty tokens
  - _Requirements: 2.2, 2.3_

- [ ] 5. Implement delimiter-free parsing algorithm
  - Create `parseDelimiterFree` method
  - Scan string character-by-character
  - Extract keys (quoted or unquoted)
  - Check for type separator
  - Extract values (quoted or unquoted)
  - Create entities with correct positions
  - Skip malformed entities gracefully
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 5.1 Write unit tests for delimiter-free parsing
  - Test simple key-value extraction: `"order=1337"`
  - Test multiple entities: `"order=1337 status=pending"`
  - Test mixed with text: `"an order=1337 was placed"`
  - Test quoted values: `order="number 42"`
  - Test quoted keys: `"store order"=42`
  - Test malformed entities are skipped
  - _Requirements: 1.4, 2.1, 2.5, 3.1, 4.1_

- [ ] 5.2 Write property test for delimiter-free key-value extraction
  - **Property 1: Delimiter-free mode extracts key-value patterns**
  - **Validates: Requirements 1.4, 2.1, 2.5**

- [ ] 5.3 Write property test for whitespace boundaries
  - **Property 2: Whitespace defines entity boundaries**
  - **Validates: Requirements 2.2, 2.3**

- [ ] 5.4 Write property test for type separator usage
  - **Property 3: Type separator is respected**
  - **Validates: Requirements 2.4**

- [ ] 6. Update main parse method to route by mode
  - Check `isDelimiterFree` flag
  - Route to `parseDelimiterFree` or existing `parse` logic
  - Ensure both paths return consistent `ParseResult`
  - _Requirements: 1.4, 1.5_

- [ ] 6.1 Write unit tests for parse method routing
  - Test delimiter-free mode routes correctly
  - Test delimited mode routes correctly
  - Test both modes return ParseResult
  - _Requirements: 1.4, 1.5_

- [ ] 7. Add quoted string support to delimited mode
  - Update `processTag` to handle quoted keys
  - Update `processTag` to handle quoted values
  - Ensure escape sequences work in delimited mode
  - _Requirements: 4.5_

- [ ] 7.1 Write unit tests for quoted strings in delimited mode
  - Test quoted keys: `["linux server"=home]`
  - Test quoted values: `[server="web server"]`
  - Test escape sequences in delimited mode
  - _Requirements: 4.5_

- [ ] 7.2 Write property test for quoted string content preservation
  - **Property 4: Quoted strings preserve content**
  - **Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.2**

- [ ] 7.3 Write property test for quoted keys in both modes
  - **Property 7: Quoted keys work in both modes**
  - **Validates: Requirements 4.5**

- [ ] 8. Ensure escape sequences only apply in quoted strings
  - Verify unquoted text with backslashes is not processed
  - Add tests for backslashes in unquoted context
  - _Requirements: 5.5_

- [ ] 8.1 Write property test for escape sequence scope
  - **Property 6: Escape sequences only apply in quoted strings**
  - **Validates: Requirements 5.5**

- [ ] 9. Verify backward compatibility
  - Run all existing tests
  - Ensure delimited mode behavior is unchanged
  - Verify schema and formatters work in both modes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9.1 Write property test for delimited mode isolation
  - **Property 8: Delimited mode ignores delimiter-free patterns**
  - **Validates: Requirements 6.2**

- [ ] 9.2 Write property test for backward compatibility
  - **Property 9: Backward compatibility is maintained**
  - **Validates: Requirements 6.3**

- [ ] 9.3 Write property test for schema and formatter parity
  - **Property 10: Schema and formatters work in both modes**
  - **Validates: Requirements 6.4, 6.5**

- [ ] 9.4 Write property test for error recovery
  - **Property 11: Parser continues after malformed entities**
  - **Validates: Requirements 8.5**

- [ ] 10. Update documentation
  - Add delimiter-free mode examples to README
  - Document `delimiters` configuration option
  - Add quoted string examples
  - Add escape sequence examples
  - Update API documentation
  - _Requirements: All_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
