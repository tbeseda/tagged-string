# Requirements Document

## Introduction

The Tagged String library is a lightweight TypeScript string parsing library with zero dependencies. It extracts structured entity information from strings using a tag-based syntax. The parser identifies and extracts tagged entities (such as data models, counts, identifiers, and other structured data) from strings, making them programmatically accessible while maintaining the readability of the original message.

## Glossary

- **Parser**: The system component that processes input strings and extracts tagged entities
- **Entity**: A structured piece of information embedded in a string using tag syntax
- **Tag**: A syntactic marker that identifies the start and type of an entity within a string
- **String**: A human-readable string that may contain zero or more tagged entities
- **Entity Type**: A classification label for an entity (e.g., model, count, identifier)
- **Schema**: A user-defined specification that maps entity type names to their expected data types
- **Known Entity**: An entity whose type is defined in the parser's schema
- **Unknown Entity**: An entity whose type is not defined in the schema, requiring automatic type inference
- **Primitive Type**: A basic data type (string, number, boolean) inferred from entity values

## Requirements

### Requirement 1

**User Story:** As a developer, I want to parse tagged entities from strings, so that I can extract structured data while keeping strings human-readable

#### Acceptance Criteria

1. WHEN the Parser receives a string containing tagged entities, THE Parser SHALL extract all entities with their type and value
2. WHEN the Parser receives a string without any tagged entities, THE Parser SHALL return an empty entity collection
3. THE Parser SHALL preserve the original string text during parsing
4. THE Parser SHALL support multiple entities within a single string
5. WHEN the Parser encounters malformed tag syntax, THE Parser SHALL skip the malformed tag and continue parsing

### Requirement 2

**User Story:** As a developer, I want to define custom tag syntax, so that I can adapt the parser to different conventions

#### Acceptance Criteria

1. THE Parser SHALL accept configuration for tag opening delimiter
2. THE Parser SHALL accept configuration for tag closing delimiter
3. THE Parser SHALL accept configuration for type-value separator syntax
4. WHEN no configuration is provided, THE Parser SHALL use default tag syntax
5. THE Parser SHALL validate configuration parameters before parsing

### Requirement 3

**User Story:** As a developer, I want to access parsed entities by type, so that I can easily retrieve specific kinds of information from strings

#### Acceptance Criteria

1. THE Parser SHALL provide a method to retrieve all entities of a specific type
2. THE Parser SHALL provide a method to retrieve all parsed entities
3. THE Parser SHALL return entities in the order they appear in the string
4. WHEN no entities of a requested type exist, THE Parser SHALL return an empty collection

### Requirement 4

**User Story:** As a developer, I want to define a schema for known entity types, so that the parser can provide typed values for entities I care about

#### Acceptance Criteria

1. THE Parser SHALL accept an optional schema mapping entity type names to expected data types
2. WHEN the Parser encounters a Known Entity, THE Parser SHALL parse the value according to the schema type
3. WHEN the Parser encounters an Unknown Entity, THE Parser SHALL infer the primitive type from the value
4. THE Parser SHALL support string, number, and boolean primitive types for Unknown Entities
5. THE Parser SHALL expose typed values to consumers for programmatic formatting

### Requirement 5

**User Story:** As a developer, I want to apply custom formatters to entity values, so that I can control how entities are displayed in output

#### Acceptance Criteria

1. THE Parser SHALL accept optional formatter functions in the schema for each entity type
2. WHEN a formatter is provided for an entity type, THE Parser SHALL apply the formatter to the parsed value
3. WHEN no formatter is provided, THE Parser SHALL convert the parsed value to string
4. THE Parser SHALL store the formatted result in the Entity formattedValue property
5. THE Parser SHALL provide a format method on ParseResult that reconstructs the message with formatted entities

### Requirement 6

**User Story:** As a developer, I want the parser to have zero runtime dependencies and run directly with Node.js, so that I can use it without compilation overhead

#### Acceptance Criteria

1. THE Parser SHALL be implemented using only TypeScript standard library features
2. THE Parser SHALL not require any third-party runtime dependencies
3. THE Parser SHALL be executable directly with Node.js v24 native TypeScript support
4. THE Parser SHALL not require compilation to JavaScript for execution
