# Requirements Document

## Introduction

This feature adds a TaggedStringGenerator to the tagged-string library. The generator provides a minimal, reference implementation for producing correctly formatted tagged strings. It serves as a utility for producers of tagged strings and may be inherited by consumers, but intentionally avoids becoming a feature-heavy toolkit.

## Glossary

- **TaggedStringGenerator**: A class that produces tagged strings in the correct format using configured delimiters and type separators
- **Producer**: A system or application that generates tagged strings for consumption by the parser
- **Consumer**: A system or application that uses the TaggedStringParser to extract entities from tagged strings
- **Entity**: A typed key-value pair embedded in a string using tag syntax (e.g., `[operation:deploy]`)
- **Delimiter**: The opening and closing characters that wrap entities (default: `[` and `]`)
- **Type Separator**: The character that separates the entity type from its value (default: `:`)

## Requirements

### Requirement 1

**User Story:** As a producer of tagged strings, I want a simple generator utility, so that I can output correctly formatted tagged strings without manually constructing the syntax

#### Acceptance Criteria

1. THE TaggedStringGenerator SHALL accept a configuration object with openDelimiter, closeDelimiter, and typeSeparator properties
2. THE TaggedStringGenerator SHALL provide a default configuration matching the parser defaults (openDelimiter: `[`, closeDelimiter: `]`, typeSeparator: `:`)
3. THE TaggedStringGenerator SHALL provide a method to generate a single tagged entity from a type and value
4. THE TaggedStringGenerator SHALL convert non-string values to strings when generating entities
5. THE TaggedStringGenerator SHALL escape delimiter characters that appear in entity values

### Requirement 2

**User Story:** As a developer integrating the library, I want the generator to handle custom delimiters, so that I can maintain consistency with my parser configuration

#### Acceptance Criteria

1. WHEN a custom openDelimiter is provided, THE TaggedStringGenerator SHALL use it to wrap generated entities
2. WHEN a custom closeDelimiter is provided, THE TaggedStringGenerator SHALL use it to wrap generated entities
3. WHEN a custom typeSeparator is provided, THE TaggedStringGenerator SHALL use it to separate type from value
4. THE TaggedStringGenerator SHALL produce output that can be parsed by TaggedStringParser with matching configuration

### Requirement 3

**User Story:** As a developer, I want the generator to be minimal and focused, so that it serves as a reference implementation without unnecessary complexity

#### Acceptance Criteria

1. THE TaggedStringGenerator SHALL provide only essential generation methods
2. THE TaggedStringGenerator SHALL NOT include formatting or transformation logic beyond basic string conversion
3. THE TaggedStringGenerator SHALL NOT include batch processing or template features
4. THE TaggedStringGenerator SHALL maintain a simple, readable implementation

### Requirement 4

**User Story:** As a developer, I want comprehensive tests for the generator, so that I can trust its correctness and use it as a reference

#### Acceptance Criteria

1. THE TaggedStringGenerator SHALL have unit tests covering basic entity generation
2. THE TaggedStringGenerator SHALL have unit tests covering custom delimiter configurations
3. THE TaggedStringGenerator SHALL have unit tests covering value type conversion
4. THE TaggedStringGenerator SHALL have unit tests verifying parser compatibility
5. THE TaggedStringGenerator SHALL have unit tests covering edge cases like empty values and special characters

### Requirement 5

**User Story:** As a developer reviewing examples, I want to see the generator used in some examples, so that I understand how producers and consumers work together

#### Acceptance Criteria

1. WHERE the generator demonstrates producer-consumer patterns, THE examples.ts file SHALL include generator usage
2. THE examples.ts file SHALL show generator usage with default configuration
3. THE examples.ts file SHALL show generator usage with custom delimiters
4. THE existing examples SHALL remain unchanged unless they specifically benefit from showing producer patterns
