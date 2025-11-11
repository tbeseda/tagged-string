---
inclusion: always
---

# Product Overview

Tagged String is a zero-dependency TypeScript library for extracting structured entities from strings using tag syntax like `[operation:OP-123]`.

## Purpose

Parse tagged entities from text while maintaining readability. Enables programmatic access to structured data embedded in strings. Primary use case: IaC systems and applications needing typed information extraction from string output.

## Capabilities

- Tag-based entity extraction with configurable delimiters (default: `[` and `]`)
- Schema-based type parsing with optional custom formatters
- Automatic type inference (string, number, boolean) for unknown entities
- Entity filtering by type
- Message reconstruction with formatted values
- Zero runtime dependencies

## Design Philosophy

Lenient parsing: Never fail on malformed input. Skip bad tags and continue.

Single-pass efficiency: Extract all entities in one iteration.

Type safety: Full TypeScript support with strict mode.
