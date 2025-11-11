# Implementation Plan

- [x] 1. Set up project structure and type definitions
  - Create TypeScript configuration file (tsconfig.json) for Node v24 native execution
  - Define Entity interface with type, value, parsedValue, formattedValue, inferredType, and position properties
  - Define PrimitiveType and EntityDefinition types for schema with optional formatters
  - Define EntitySchema type for mapping entity types to primitive types or definitions with formatters
  - Define ParserConfig interface with delimiter, separator, and schema options
  - Define ParseResult interface with utility methods including format()
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 2. Implement ParseResult class
  - [x] 2.1 Create ParseResult class with constructor accepting original message and entities array
    - Store original message and entities as properties
    - _Requirements: 1.3_
  
  - [x] 2.2 Implement getEntitiesByType method
    - Filter entities array by type parameter
    - Return filtered array in original order
    - Return empty array when no matches found
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 2.3 Implement getAllTypes method
    - Extract unique entity types from entities array
    - Return array of type strings
    - _Requirements: 3.2_
  
  - [x] 2.4 Implement format method
    - Reconstruct original message replacing tags with formattedValue from entities
    - Use entity position to correctly place formatted values
    - Return formatted string
    - _Requirements: 5.5_

- [x] 3. Implement TaggedStringParser class
  - [x] 3.1 Create parser class with configuration support
    - Accept optional ParserConfig in constructor (including schema)
    - Set default delimiters: '[' and ']'
    - Set default type separator: ':'
    - Store schema for entity type lookup
    - Validate configuration (no empty delimiters, no delimiter conflicts)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 5.1_
  
  - [x] 3.2 Implement type inference and parsing helpers
    - Create inferType method to detect number, boolean, or string from raw value
    - Create parseValue method that uses schema (if available) or falls back to inference
    - Handle number parsing (including decimals and negatives)
    - Handle boolean parsing (case-insensitive true/false)
    - Default to string for all other values
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  
  - [x] 3.3 Implement formatter application
    - Create applyFormatter method that checks schema for formatter function
    - If formatter exists, apply it to parsedValue and return result
    - If no formatter, convert parsedValue to string
    - Store result as formattedValue in entity
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 3.4 Implement core parsing logic in parse method
    - Create character-by-character scanner
    - Track parser state (inside/outside tag)
    - Accumulate tag content when inside tag boundaries
    - Extract entity type and raw value from tag content using separator
    - Call parseValue to get typed parsedValue and inferredType
    - Call applyFormatter to get formattedValue
    - Record entity position in original string
    - Handle malformed tags by skipping and continuing
    - Return ParseResult with original message and extracted entities
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.3, 4.2, 4.5, 5.4_
  
  - [x] 3.5 Handle edge cases in parsing
    - Return empty entities array for empty input strings
    - Skip unclosed tags at end of string
    - Handle tags without type separator (treat as value with empty type)
    - Skip empty tags
    - Preserve quoted values in entity values
    - _Requirements: 1.2, 1.5_

- [x] 4. Write unit tests for ParseResult
  - Test getEntitiesByType with matching and non-matching types
  - Test getAllTypes with multiple and zero entities
  - Test entity order preservation
  - Test format method reconstructs message with formatted entities
  - Test format method with entities that have custom formatters
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.5_

- [x] 5. Write unit tests for TaggedStringParser
  - Test single entity extraction
  - Test multiple entities in one message
  - Test messages without entities
  - Test custom delimiter configuration
  - Test configuration validation (invalid delimiters)
  - Test malformed tag handling (unclosed, missing separator, empty)
  - Test entity position tracking
  - Test schema-based type parsing for known entities
  - Test automatic type inference for unknown entities (numbers, booleans, strings)
  - Test mixed known and unknown entities in same message
  - Test formatter functions applied to entity values
  - Test entities without formatters default to string conversion
  - Test shorthand schema syntax (just type) vs full EntityDefinition with formatter
  - Test real-world IaC log examples from design document
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

- [x] 6. Create example usage file
  - Create examples.ts demonstrating basic usage with schema
  - Show schema definition for known entity types with formatters
  - Include example with chalk or simple string formatters (String.trim, toUpperCase, etc.)
  - Include IaC logging examples from design document
  - Show custom configuration usage
  - Show entity filtering by type
  - Demonstrate accessing parsedValue, formattedValue, and inferredType properties
  - Show examples of automatic type inference for unknown entities
  - Demonstrate format() method to get fully formatted message
  - _Requirements: 1.1, 2.1, 3.1, 4.2, 4.5, 5.1, 5.5_

- [x] 7. Create package.json and Node v24 configuration
  - Set up package.json with TypeScript as dev dependency only
  - Configure for Node v24 native TypeScript execution
  - Add script to run examples directly without compilation
  - Set module type and entry points
  - Verify zero runtime dependencies
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
