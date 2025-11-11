# Implementation Plan

- [x] 1. Add GeneratorConfig type definition
  - Add `GeneratorConfig` interface to `src/types.ts` with openDelimiter, closeDelimiter, and typeSeparator properties
  - Ensure all properties are optional to support defaults
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement TaggedStringGenerator class
  - [x] 2.1 Create src/TaggedStringGenerator.ts with class structure
    - Define class with private readonly properties for delimiters and separator
    - Implement constructor accepting optional GeneratorConfig
    - Set default values matching parser defaults ([ ] :)
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_
  
  - [x] 2.2 Implement configuration validation
    - Add private `validateConfig()` method
    - Throw error if openDelimiter or closeDelimiter is empty
    - Throw error if openDelimiter equals closeDelimiter
    - Call validation in constructor
    - _Requirements: 1.1_
  
  - [x] 2.3 Implement tag generation method
    - Add public `tag(type: string, value: unknown): string` method
    - Convert value to string using private helper method
    - Return formatted tag using configured delimiters and separator
    - _Requirements: 1.3, 1.4, 2.4_
  
  - [x] 2.4 Implement value conversion helper
    - Add private `valueToString(value: unknown): string` method
    - Use `String(value)` for conversion
    - Handle null and undefined explicitly
    - _Requirements: 1.4_
  
  - [x] 2.5 Implement embed convenience method
    - Add public `embed(message: string, type: string, value: unknown): string` method
    - Concatenate message with result of `tag()` call
    - _Requirements: 1.3_

- [x] 3. Write comprehensive unit tests
  - [x] 3.1 Create src/TaggedStringGenerator.test.ts
    - Set up test file structure with imports
    - _Requirements: 4.1_
  
  - [x] 3.2 Test basic generation with defaults
    - Test tag generation with default delimiters
    - Test type and value separation
    - Test embed method
    - _Requirements: 4.1_
  
  - [x] 3.3 Test custom delimiter configurations
    - Test custom openDelimiter and closeDelimiter
    - Test custom typeSeparator
    - Test mixed custom configurations
    - _Requirements: 2.1, 2.2, 2.3, 4.2_
  
  - [x] 3.4 Test value type conversion
    - Test number to string conversion
    - Test boolean to string conversion
    - Test object/array to string conversion
    - Test null and undefined handling
    - _Requirements: 1.4, 4.3_
  
  - [x] 3.5 Test edge cases
    - Test empty type string
    - Test empty value string
    - Test special characters in values
    - Test whitespace preservation
    - _Requirements: 4.5_
  
  - [x] 3.6 Test parser compatibility
    - Test round-trip with default config (generate → parse)
    - Test round-trip with custom delimiters
    - Verify parsed entities match original type and value
    - _Requirements: 2.4, 4.4_
  
  - [x] 3.7 Test configuration validation
    - Test error thrown for empty openDelimiter
    - Test error thrown for empty closeDelimiter
    - Test error thrown for identical delimiters
    - _Requirements: 1.1_

- [ ] 4. Export from public API
  - Update `src/index.ts` to export TaggedStringGenerator class
  - Update `src/index.ts` to export GeneratorConfig type
  - _Requirements: 1.1_

- [x] 5. Add generator examples to examples.ts
  - [x] 5.1 Add producer-consumer pattern example
    - Show generator creating tagged strings
    - Show parser consuming generated strings
    - Demonstrate matching configurations
    - _Requirements: 5.1, 5.2_
  
  - [x] 5.2 Add custom delimiter generation example
    - Show generator with custom delimiters
    - Show parser with matching custom config
    - _Requirements: 5.3_
