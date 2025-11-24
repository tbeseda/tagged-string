---
inclusion: always
---

# Product Overview

Tagged String is a zero-dependency TypeScript library for extracting structured entities from strings using tag syntax like `[type:value]`.

## What It Does

Parses tagged entities from text (e.g., `[operation:OP-123]`, `[user:alice]`) and extracts them as structured data while preserving the original message context. Designed for IaC systems and applications that need typed information extraction from string output.

## Tag Syntax

Standard format: `[entityType:entityValue]`
- Entity type: Identifier before the colon (e.g., `operation`, `user`, `count`)
- Entity value: Content after the colon (e.g., `OP-123`, `alice`, `42`)
- Delimiters: Configurable (default `[` and `]`)

Examples:
- `[operation:OP-123]` → type: "operation", value: "OP-123"
- `[count:42]` → type: "count", value: "42", inferredType: "number"
- `[active:true]` → type: "active", value: "true", inferredType: "boolean"

## Core Features

Entity extraction: Parse all tagged entities in a single pass with position tracking.

Schema-based parsing: Define entity types with optional custom formatters for value transformation.

Type inference: Automatically detect string, number, or boolean types for unknown entities.

Filtering: Query parsed entities by type.

Reconstruction: Rebuild messages with formatted values replacing original tags.

Lenient parsing: Skip malformed tags silently, never throw errors during parsing.

## API Surface

`TaggedStringParser`: Main parser class accepting schema and delimiter configuration.

`ParseResult`: Wrapper with methods for filtering entities and reconstructing messages.

`Entity`: Parsed entity object with type, value, parsedValue, formattedValue, inferredType, and position.

## Behavioral Rules

When implementing features:
- Never throw exceptions during parsing (return empty results instead)
- Always track entity positions (start/end indices) in the original string
- Skip malformed tags silently and continue parsing
- Infer types for unknown entity types (don't require schema entries)
- Process the entire string in a single pass (no multiple iterations)
- Preserve immutability (never mutate input strings or config objects)

When formatters fail:
- Catch exceptions silently
- Fall back to the original parsed value
- Continue processing remaining entities

## Non-Goals

This library does NOT:
- Validate entity values against schemas (validation is user responsibility)
- Support nested or hierarchical tags
- Parse complex markup languages (HTML, XML, Markdown)
- Provide tag escaping mechanisms
- Support multi-line tag syntax
