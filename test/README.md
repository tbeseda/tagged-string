# Test Suite Organization

This directory contains the test suite for the Tagged String library, organized into logical groups for maintainability and clarity.

## Test Files

### TaggedStringParser Tests (`TaggedStringParser/`)

The TaggedStringParser test files are organized in a subdirectory:

- **basic-parsing.test.ts** - Core parsing functionality including single/multiple entity extraction, empty input handling, and ParseResult validation
- **delimiters.test.ts** - Delimiter configuration, validation, resolution, and mode routing
- **delimiter-free.test.ts** - Delimiter-free mode parsing with key-value patterns, quoted strings, and position tracking
- **quoted-strings.test.ts** - Quoted string extraction in both delimited and delimiter-free modes, including escape sequences
- **unquoted-tokens.test.ts** - Unquoted token extraction with stop characters and whitespace boundaries
- **schema-types.test.ts** - Schema-based type parsing, automatic type inference, and mixed known/unknown entities
- **formatters.test.ts** - Formatter functions and default string conversion
- **malformed-input.test.ts** - Handling of malformed tags, empty tags, and unclosed delimiters
- **position-tracking.test.ts** - Position and endPosition calculation for entities with various delimiter configurations
- **real-world.test.ts** - Real-world IaC log examples demonstrating practical usage
- **property-based.test.ts** - Comprehensive property-based tests using fast-check covering:
  - Delimiter-free parsing properties (key-value extraction, whitespace boundaries, separator handling)
  - Quoted string properties (content preservation, escape sequences, quoted keys)
  - Backward compatibility properties (mode isolation, API compatibility, schema/formatter consistency, error recovery)

### Other Classes (Root Level)

- **ParseResult.test.ts** - ParseResult methods including getEntitiesByType, getAllTypes, and format with custom delimiters
- **TaggedStringGenerator.test.ts** - Tag generation, custom delimiters, value type conversion, edge cases, and parser compatibility

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node --test test/basic-parsing.test.ts

# Run with type checking
npm run pretest && npm test
```

## Test Coverage

The test suite includes:
- **200+ unit tests** covering all public APIs and edge cases
- **Property-based tests** with 100 runs each
- Tests for both delimited mode (`[key:value]`) and delimiter-free mode (`key=value`)
- Backward compatibility tests ensuring API stability
- Real-world usage examples from IaC systems
- Round-trip testing (generate → parse → format)

## Test Organization Principles

1. **Logical grouping** - Tests are organized by feature area, not by implementation details
2. **No redundancy** - Each test validates a specific behavior without duplicating coverage
3. **Clear naming** - Test descriptions clearly state what is being validated
4. **Property-based validation** - Critical parsing properties are validated across thousands of generated inputs
5. **Real-world examples** - Practical usage patterns are tested to ensure library meets actual use cases
