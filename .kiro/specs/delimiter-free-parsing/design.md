# Design Document

## Overview

This design extends the Tagged String library to support delimiter-free parsing, enabling extraction of key-value pairs from natural language-style strings. The feature introduces three major capabilities:

1. **Delimiter-free mode**: Parse `key=value` or `key:value` patterns without surrounding delimiters
2. **Quoted strings**: Support double-quoted keys and values to handle spaces and special characters
3. **Escape sequences**: Allow literal quotes within quoted strings using backslash escapes

The design maintains full backward compatibility with existing delimited parsing while providing a clean configuration API for switching between modes.

## Architecture

### Parsing Modes

The parser will operate in one of two mutually exclusive modes:

**Delimited Mode (existing behavior)**:
- Entities are surrounded by opening and closing delimiters (e.g., `[key:value]`)
- Uses regex-based matching to find complete tags
- Ignores text outside of delimiters

**Delimiter-Free Mode (new behavior)**:
- Entities are identified by key-value patterns with whitespace boundaries
- Uses character-by-character scanning to handle quoted strings
- Processes the entire input string looking for patterns

### Configuration Strategy

The parser configuration will be extended with a new `delimiters` option that provides a unified way to configure delimiter behavior:

```typescript
// Delimiter-free mode
new TaggedStringParser({ delimiters: false })
new TaggedStringParser({ delimiters: [] })

// Delimited mode (explicit)
new TaggedStringParser({ delimiters: ['[', ']'] })

// Delimited mode (backward compatible)
new TaggedStringParser({ openDelimiter: '[', closeDelimiter: ']' })
```

Configuration precedence:
1. If `delimiters` is provided, it takes precedence
2. Otherwise, use `openDelimiter` and `closeDelimiter` (defaults to `['[', ']']`)

### Quote Handling

Both modes will support quoted strings for keys and values:

- **Quoted keys**: `"store order":42` or `["linux server"=home]`
- **Quoted values**: `order:"number 42"` or `[server="web server"]`
- **Escape sequences**: `"say \"hello\""` → `say "hello"`

Quote processing will be handled by a dedicated string extraction utility that:
1. Detects opening quote
2. Scans character-by-character
3. Processes escape sequences (`\"` and `\\`)
4. Returns extracted content and end position

## Components and Interfaces

### Type Definitions

New types to add to `src/types.ts`:

```typescript
/**
 * Delimiter configuration options
 * - false or []: Enable delimiter-free mode
 * - [open, close]: Use specified delimiters
 */
export type DelimiterConfig = false | [] | [string, string]

/**
 * Extended parser configuration with delimiter options
 */
export interface ParserConfig {
  openDelimiter?: string
  closeDelimiter?: string
  typeSeparator?: string
  schema?: EntitySchema
  delimiters?: DelimiterConfig  // New option
}
```

### Parser Class Changes

The `TaggedStringParser` class will be modified to:

1. **Configuration resolution**: Determine parsing mode from config
2. **Mode selection**: Route to appropriate parsing method
3. **Delimiter-free parsing**: New method for scanning key-value patterns
4. **Quote extraction**: Utility method for processing quoted strings

### New Methods

```typescript
class TaggedStringParser {
  private readonly isDelimiterFree: boolean
  
  // Existing methods remain unchanged
  
  /**
   * Parse in delimiter-free mode
   */
  private parseDelimiterFree(message: string): ParseResult
  
  /**
   * Extract a quoted string starting at position
   * Returns { content, endPosition } or null if malformed
   */
  private extractQuotedString(message: string, startPos: number): 
    { content: string; endPosition: number } | null
  
  /**
   * Extract an unquoted token (key or value) starting at position
   * Returns { content, endPosition }
   */
  private extractUnquotedToken(message: string, startPos: number, 
    stopChars: string[]): { content: string; endPosition: number }
}
```

## Data Models

### Entity Structure

The existing `Entity` interface remains unchanged. Both parsing modes produce the same entity structure:

```typescript
interface Entity {
  type: string                            // Can contain spaces if quoted
  value: string                           // Raw value (quotes removed)
  parsedValue: string | number | boolean  // Typed value
  formattedValue: string                  // Formatted display value
  inferredType: PrimitiveType
  position: number                        // Start of entity in original string
  endPosition: number                     // End of entity in original string
}
```

### Configuration Resolution

The parser will resolve configuration in the constructor:

```typescript
constructor(config?: ParserConfig) {
  // Resolve delimiter configuration
  if (config?.delimiters !== undefined) {
    if (config.delimiters === false || 
        (Array.isArray(config.delimiters) && config.delimiters.length === 0)) {
      this.isDelimiterFree = true
      this.openDelimiter = ''
      this.closeDelimiter = ''
    } else if (Array.isArray(config.delimiters) && config.delimiters.length === 2) {
      this.isDelimiterFree = false
      this.openDelimiter = config.delimiters[0]
      this.closeDelimiter = config.delimiters[1]
    } else {
      throw new Error('Invalid delimiters configuration')
    }
  } else {
    // Backward compatible: use individual delimiter options
    this.isDelimiterFree = false
    this.openDelimiter = config?.openDelimiter ?? '['
    this.closeDelimiter = config?.closeDelimiter ?? ']'
  }
  
  this.typeSeparator = config?.typeSeparator ?? ':'
  this.schema = config?.schema
  
  this.validateConfig()
}
```

## Delimiter-Free Parsing Algorithm

The delimiter-free parsing algorithm scans the input string character-by-character:

```
1. Initialize position = 0, entities = []
2. While position < message.length:
   a. Skip whitespace
   b. Try to extract key (quoted or unquoted)
   c. If no key found, advance position and continue
   d. Check for type separator at current position
   e. If no separator, this isn't an entity, continue
   f. Advance past separator
   g. Try to extract value (quoted or unquoted)
   h. If no value found, skip this entity
   i. Create entity from key, value, and positions
   j. Add entity to results
   k. Update position
3. Return ParseResult with entities
```

### Quote Extraction Algorithm

```
extractQuotedString(message, startPos):
  1. Verify message[startPos] === '"'
  2. Initialize result = '', pos = startPos + 1
  3. While pos < message.length:
     a. If message[pos] === '\\':
        - If pos + 1 < length and message[pos+1] in ['"', '\\']:
          - Add message[pos+1] to result
          - Advance pos by 2
        - Else:
          - Add '\\' to result
          - Advance pos by 1
     b. Else if message[pos] === '"':
        - Return { content: result, endPosition: pos + 1 }
     c. Else:
        - Add message[pos] to result
        - Advance pos by 1
  4. Return null (unclosed quote)
```

### Unquoted Token Extraction

```
extractUnquotedToken(message, startPos, stopChars):
  1. Initialize result = '', pos = startPos
  2. While pos < message.length:
     a. If message[pos] is whitespace or in stopChars:
        - Break
     b. Add message[pos] to result
     c. Advance pos by 1
  3. Return { content: result, endPosition: pos }
```

## Error Handling

The parser maintains its lenient error handling philosophy:

**Delimiter-Free Mode Errors**:
- Unclosed quoted string → Skip entity, continue parsing
- Key without separator → Not an entity, continue scanning
- Separator without value → Skip entity, continue parsing
- Empty key or value → Skip entity, continue parsing

**Delimited Mode Errors** (unchanged):
- Malformed tags → Skip tag, continue parsing
- Unclosed tags → Ignore, continue parsing
- Empty tag content → Skip tag, continue parsing

**Configuration Errors** (throw on construction):
- Invalid `delimiters` value (not false, [], or [string, string])
- Empty delimiter strings in delimited mode
- Same open and close delimiters in delimited mode

## Testing Strategy

### Unit Tests

Unit tests will cover:

1. **Configuration resolution**:
   - `delimiters: false` enables delimiter-free mode
   - `delimiters: []` enables delimiter-free mode
   - `delimiters: ['[', ']']` enables delimited mode
   - Backward compatibility with `openDelimiter`/`closeDelimiter`
   - Invalid configurations throw errors

2. **Delimiter-free parsing examples**:
   - Simple key-value: `"order=1337"` → `{ type: 'order', value: '1337' }`
   - Multiple entities: `"order=1337 status=pending"`
   - Mixed with text: `"an order=1337 was placed"`

3. **Quoted string examples**:
   - Quoted value: `order="number 42"` → value is `"number 42"`
   - Quoted key: `"store order"=42` → type is `"store order"`
   - Escape sequences: `msg="say \"hello\""` → value is `say "hello"`
   - Delimited with quotes: `["linux server"=home]`

4. **Edge cases**:
   - Unclosed quotes
   - Empty keys or values
   - Consecutive separators
   - Separator without key
   - Backslash at end of quoted string

5. **Backward compatibility**:
   - Existing delimited tests continue to pass
   - Schema and formatters work in both modes
   - Type inference works in both modes

### Property-Based Tests

Property-based tests will use `fast-check` (already used in the project based on existing test files) to verify universal properties.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Delimiter-free mode extracts key-value patterns
*For any* string containing key-value patterns with the configured separator, when parsed in delimiter-free mode, all valid key-value pairs should be extracted as entities.
**Validates: Requirements 1.4, 2.1, 2.5**

### Property 2: Whitespace defines entity boundaries
*For any* string with key-value patterns, whitespace before a key or after a value should correctly delimit where entities begin and end in delimiter-free mode.
**Validates: Requirements 2.2, 2.3**

### Property 3: Type separator is respected
*For any* configured type separator character, the parser should use that character to split keys from values in both delimited and delimiter-free modes.
**Validates: Requirements 2.4**

### Property 4: Quoted strings preserve content
*For any* quoted string (key or value), all content within the quotes including spaces and separator characters should be preserved in the extracted entity.
**Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.2**

### Property 5: Escape sequences are processed
*For any* quoted string containing escape sequences (`\"` or `\\`), the escape sequences should be converted to their literal characters (quote or backslash) in the extracted content.
**Validates: Requirements 3.4, 4.3, 5.1, 5.2, 5.3**

### Property 6: Escape sequences only apply in quoted strings
*For any* string with backslashes in unquoted text, the backslashes should be treated as literal characters without escape sequence processing.
**Validates: Requirements 5.5**

### Property 7: Quoted keys work in both modes
*For any* quoted key with spaces, the parser should correctly extract the key in both delimited mode (e.g., `["linux server"=home]`) and delimiter-free mode (e.g., `"store order"=42`).
**Validates: Requirements 4.5**

### Property 8: Delimited mode ignores delimiter-free patterns
*For any* string containing key-value patterns outside of delimiters, when parsed in delimited mode, those patterns should not be extracted as entities.
**Validates: Requirements 6.2**

### Property 9: Backward compatibility is maintained
*For any* existing test case using delimited mode, the parser should produce the same results with the new implementation, maintaining all entity extraction, type inference, and formatting behavior.
**Validates: Requirements 6.3**

### Property 10: Schema and formatters work in both modes
*For any* schema with type definitions and custom formatters, the parser should apply them correctly in both delimited and delimiter-free modes.
**Validates: Requirements 6.4, 6.5**

### Property 11: Parser continues after malformed entities
*For any* string containing malformed entities (unclosed quotes, missing values, etc.), the parser should skip the malformed entity and continue parsing the rest of the string.
**Validates: Requirements 8.5**

### Examples to Test

The following specific examples should be tested as unit tests to verify configuration and edge cases:

**Example 1: Configuration modes**
- `delimiters: false` enables delimiter-free mode
- `delimiters: []` enables delimiter-free mode
- `delimiters: ['[', ']']` enables delimited mode
- Backward compatibility with `openDelimiter`/`closeDelimiter`
**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

**Example 2: Configuration precedence**
- `delimiters` option takes precedence over individual delimiter options
- `delimiters: ['{{', '}}']` sets both delimiters
- Invalid configurations throw errors
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

**Example 3: Delimited mode with explicit delimiters**
- Parser uses delimited mode exclusively when configured with non-empty delimiters
**Validates: Requirements 6.1**

**Edge Cases** (to be covered by property test generators):
- Unclosed quoted values at end of string
- Unclosed quoted keys before separator
- Keys without values
- Consecutive type separators
- Type separator without preceding key
- Backslash at end of quoted string
**Validates: Requirements 3.5, 4.4, 5.4, 8.1, 8.2, 8.3, 8.4**

## Implementation Notes

### Performance Considerations

**Delimiter-free mode** requires character-by-character scanning, which is inherently slower than regex-based delimited parsing. However:
- Most strings will be short (< 1000 characters)
- Single-pass algorithm minimizes overhead
- No backtracking or lookahead required

**Quote processing** adds minimal overhead:
- Only triggered when quotes are detected
- Simple state machine with no recursion
- Escape sequences processed inline

### Backward Compatibility

All existing functionality must remain unchanged:
- Default configuration still uses `['[', ']']` delimiters
- Existing tests must pass without modification
- Public API remains the same (only config options added)

### Future Extensions

This design enables future enhancements:
- Custom quote characters (currently hardcoded to `"`)
- Alternative escape character (currently hardcoded to `\`)
- Mixed-mode parsing (both delimited and delimiter-free in same string)
- Configurable whitespace handling (currently any whitespace is a boundary)
