# Requirements Document

## Introduction

This feature extends the Tagged String library to support delimiter-free parsing, enabling extraction of key-value pairs from strings without requiring explicit tag delimiters. This allows parsing of natural language-style strings like "order=1337 was placed" or "'store order'=42 was cancelled". The feature also introduces support for quoted values to handle spaces and special characters within entity types and values, such as "store order"="number 42" or ["linux server"=home].

## Glossary

- **Parser**: The system component that processes input strings and extracts tagged entities
- **Entity**: A structured piece of information embedded in a string, either delimited or delimiter-free
- **Delimiter-Free Mode**: A parsing mode where entities are identified by key-value patterns without surrounding delimiters
- **Delimited Mode**: The traditional parsing mode where entities are surrounded by opening and closing delimiters
- **Key-Value Pattern**: A pattern matching `key=value` or `key:value` syntax in delimiter-free mode
- **Quoted Value**: A string value enclosed in double quotes to preserve spaces and special characters
- **Quoted Key**: An entity type name enclosed in double quotes to allow spaces in type names
- **Escape Sequence**: A backslash followed by a character to include literal quotes within quoted strings
- **Type Separator**: The character separating entity type from value (`:` or `=`)
- **Schema**: A user-defined specification that maps entity type names to their expected data types
- **Whitespace Boundary**: Word boundaries used to identify where delimiter-free entities begin and end

## Requirements

### Requirement 1

**User Story:** As a developer, I want to configure the parser to operate without delimiters, so that I can parse natural key-value syntax from strings

#### Acceptance Criteria

1. WHEN the Parser is configured with empty string delimiters, THE Parser SHALL operate in delimiter-free mode
2. WHEN the Parser is configured with `delimiters: false`, THE Parser SHALL operate in delimiter-free mode
3. WHEN the Parser is configured with `delimiters: []`, THE Parser SHALL operate in delimiter-free mode
4. WHEN the Parser operates in delimiter-free mode, THE Parser SHALL extract key-value patterns from the string
5. WHEN the Parser is configured with non-empty delimiters, THE Parser SHALL operate in delimited mode

### Requirement 2

**User Story:** As a developer, I want the parser to extract key-value pairs without delimiters, so that I can parse strings like "order=1337 was placed"

#### Acceptance Criteria

1. WHEN the Parser operates in delimiter-free mode, THE Parser SHALL identify entities using the pattern `key<separator>value` where separator is the configured typeSeparator
2. WHEN the Parser encounters whitespace before a key, THE Parser SHALL treat it as an entity boundary
3. WHEN the Parser encounters whitespace after a value, THE Parser SHALL treat it as an entity boundary
4. THE Parser SHALL use the configured typeSeparator character in delimiter-free mode
5. WHEN multiple key-value pairs exist in a string, THE Parser SHALL extract all pairs

### Requirement 3

**User Story:** As a developer, I want to use quoted values in delimiter-free mode, so that I can include spaces and special characters in entity values

#### Acceptance Criteria

1. WHEN the Parser encounters a value starting with a double quote in delimiter-free mode, THE Parser SHALL extract the entire quoted string as the value
2. WHEN a quoted value contains spaces, THE Parser SHALL preserve the spaces in the extracted value
3. WHEN a quoted value contains the type separator character, THE Parser SHALL include it in the value without treating it as a separator
4. WHEN a quoted value contains a backslash followed by a double quote, THE Parser SHALL treat it as a literal quote character
5. WHEN a quoted value is not properly closed before the end of the string, THE Parser SHALL skip the malformed entity

### Requirement 4

**User Story:** As a developer, I want to use quoted keys in both delimited and delimiter-free modes, so that I can include spaces in entity type names

#### Acceptance Criteria

1. WHEN the Parser encounters a key starting with a double quote, THE Parser SHALL extract the entire quoted string as the entity type
2. WHEN a quoted key contains spaces, THE Parser SHALL preserve the spaces in the entity type
3. WHEN a quoted key contains a backslash followed by a double quote, THE Parser SHALL treat it as a literal quote character
4. WHEN a quoted key is not properly closed before the type separator, THE Parser SHALL skip the malformed entity
5. THE Parser SHALL support quoted keys in both delimited mode (e.g., `["linux server"=home]`) and delimiter-free mode (e.g., `"store order"=42`)

### Requirement 5

**User Story:** As a developer, I want escape sequences to work in quoted strings, so that I can include literal quote characters in keys and values

#### Acceptance Criteria

1. WHEN the Parser encounters `\"` within a quoted string, THE Parser SHALL include a literal double quote in the extracted text
2. WHEN the Parser encounters `\\` within a quoted string, THE Parser SHALL include a literal backslash in the extracted text
3. THE Parser SHALL process escape sequences during extraction before type inference or formatting
4. WHEN a backslash appears at the end of a quoted string, THE Parser SHALL treat it as a literal backslash
5. THE Parser SHALL only recognize escape sequences within quoted strings, not in unquoted text

### Requirement 6

**User Story:** As a developer, I want delimiter-free parsing to maintain backward compatibility, so that existing delimited parsing functionality continues to work

#### Acceptance Criteria

1. WHEN the Parser is configured with explicit non-empty delimiters, THE Parser SHALL use delimited mode exclusively
2. WHEN the Parser uses delimited mode, THE Parser SHALL not extract delimiter-free key-value patterns outside of tags
3. THE Parser SHALL maintain all existing entity extraction, type inference, and formatting behavior in delimited mode
4. THE Parser SHALL support schema-based parsing in both delimited and delimiter-free modes
5. THE Parser SHALL support custom formatters in both delimited and delimiter-free modes

### Requirement 7

**User Story:** As a developer, I want clear configuration options for delimiter modes, so that I can easily switch between parsing styles

#### Acceptance Criteria

1. THE Parser SHALL accept a `delimiters` configuration option that can be set to `false`, `[]`, or an array of delimiter strings
2. WHEN `delimiters` is set to `false` or `[]`, THE Parser SHALL ignore `openDelimiter` and `closeDelimiter` configuration
3. WHEN `delimiters` is set to an array with two strings, THE Parser SHALL use them as `[openDelimiter, closeDelimiter]`
4. WHEN both `delimiters` and individual delimiter options are provided, THE Parser SHALL prioritize the `delimiters` option
5. THE Parser SHALL validate that delimiter configuration is consistent and throw an error for invalid combinations

### Requirement 8

**User Story:** As a developer, I want the parser to handle edge cases gracefully in delimiter-free mode, so that malformed input does not cause failures

#### Acceptance Criteria

1. WHEN the Parser encounters a key without a value in delimiter-free mode, THE Parser SHALL skip the malformed entity
2. WHEN the Parser encounters consecutive type separators, THE Parser SHALL treat the value as empty and skip the entity
3. WHEN the Parser encounters an unclosed quoted string at the end of input, THE Parser SHALL skip the malformed entity
4. WHEN the Parser encounters a type separator without a preceding key, THE Parser SHALL skip the malformed pattern
5. THE Parser SHALL continue parsing after encountering malformed entities in delimiter-free mode
