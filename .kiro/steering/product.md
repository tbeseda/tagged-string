# Product Overview

Tagged String is a lightweight, zero-dependency TypeScript library for extracting structured entity information from strings using tag-based syntax (e.g., `[operation:OP-123]`).

## Core Purpose

Parse tagged entities from strings while maintaining readability, enabling programmatic access to structured data embedded in text. Designed for IaC systems and other applications that need to extract typed information from string output.

## Key Features

- Tag-based entity extraction with configurable delimiters
- Schema-based type parsing for known entities with optional formatters
- Automatic type inference (string, number, boolean) for unknown entities
- Entity filtering and message reconstruction with formatted values
- Zero runtime dependencies, runs natively on Node.js v24
