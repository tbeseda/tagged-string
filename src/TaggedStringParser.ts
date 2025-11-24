import { ParseResult } from './ParseResult.ts'
import type {
  Entity,
  EntitySchema,
  ParserConfig,
  PrimitiveType,
} from './types.ts'

/**
 * TaggedStringParser extracts tagged entities from strings
 *
 * Supports two parsing modes:
 * - Delimited mode: Extract entities surrounded by delimiters (e.g., [key:value])
 * - Delimiter-free mode: Extract key=value patterns from natural language strings
 *
 * Features:
 * - Configurable delimiters and type separators
 * - Schema-based type parsing with custom formatters
 * - Automatic type inference (string, number, boolean)
 * - Quoted strings with escape sequences (\", \\)
 * - Lenient error handling (skips malformed entities)
 */
export class TaggedStringParser {
  private readonly openDelimiter: string
  private readonly closeDelimiter: string
  private readonly typeSeparator: string
  private readonly schema?: EntitySchema
  private readonly isDelimiterFree: boolean

  /**
   * Create a new TaggedStringParser with optional configuration
   * @param config - Parser configuration options
   * @param config.delimiters - Unified delimiter configuration:
   *   - `false` or `[]` enables delimiter-free mode (parse key=value patterns)
   *   - `[open, close]` uses specified delimiters (e.g., ['{{', '}}'])
   *   - If omitted, uses openDelimiter and closeDelimiter options
   * @param config.openDelimiter - Opening tag delimiter (default: '[', legacy option)
   * @param config.closeDelimiter - Closing tag delimiter (default: ']', legacy option)
   * @param config.typeSeparator - Separator between type and value (default: ':')
   * @param config.schema - Entity type definitions with optional formatters
   * @throws Error if configuration is invalid
   */
  constructor(config?: ParserConfig) {
    // Resolve delimiter configuration
    if (config?.delimiters !== undefined) {
      // delimiters option takes precedence
      if (
        config.delimiters === false ||
        (Array.isArray(config.delimiters) && config.delimiters.length === 0)
      ) {
        // Delimiter-free mode
        this.isDelimiterFree = true
        this.openDelimiter = ''
        this.closeDelimiter = ''
      } else if (
        Array.isArray(config.delimiters) &&
        config.delimiters.length === 2
      ) {
        // Delimited mode with specified delimiters
        this.isDelimiterFree = false
        this.openDelimiter = config.delimiters[0]
        this.closeDelimiter = config.delimiters[1]
      } else {
        // Invalid configuration
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

    // Validate configuration
    this.validateConfig()
  }

  /**
   * Validate parser configuration
   * @throws Error if configuration is invalid
   */
  private validateConfig(): void {
    // Skip delimiter validation in delimiter-free mode
    if (this.isDelimiterFree) {
      return
    }

    if (this.openDelimiter === '') {
      throw new Error('Open delimiter cannot be empty')
    }
    if (this.closeDelimiter === '') {
      throw new Error('Close delimiter cannot be empty')
    }
    if (this.openDelimiter === this.closeDelimiter) {
      throw new Error('Open and close delimiters cannot be the same')
    }
  }

  /**
   * Parse a string and extract all tagged entities
   * @param message - The string to parse
   * @returns ParseResult containing original message and extracted entities
   */
  parse(message: string): ParseResult {
    if (message === '') {
      return new ParseResult(message, [])
    }

    // Route to appropriate parsing method based on mode
    if (this.isDelimiterFree) {
      return this.parseDelimiterFree(message)
    }

    return this.parseDelimited(message)
  }

  /**
   * Parse a string in delimited mode, extracting tags with proper quoted string handling
   * @param message - The string to parse
   * @returns ParseResult containing original message and extracted entities
   */
  private parseDelimited(message: string): ParseResult {
    const entities: Entity[] = []
    let pos = 0

    while (pos < message.length) {
      // Find the opening delimiter
      const openIndex = message.indexOf(this.openDelimiter, pos)
      if (openIndex === -1) {
        // No more tags
        break
      }

      // Start scanning for tag content after the opening delimiter
      const contentStart = openIndex + this.openDelimiter.length
      let contentEnd = contentStart
      let inQuote = false

      // Scan character by character to find the closing delimiter
      // while respecting quoted strings
      while (contentEnd < message.length) {
        const char = message[contentEnd]

        if (char === '"') {
          // Toggle quote state (simplified - doesn't handle escapes during scan)
          // We'll handle escapes properly in processTag
          if (contentEnd > contentStart && message[contentEnd - 1] === '\\') {
            // This is an escaped quote, don't toggle
            // But we need to check if the backslash itself is escaped
            let backslashCount = 0
            let checkPos = contentEnd - 1
            while (checkPos >= contentStart && message[checkPos] === '\\') {
              backslashCount++
              checkPos--
            }
            // If odd number of backslashes, the quote is escaped
            if (backslashCount % 2 === 1) {
              contentEnd++
              continue
            }
          }
          inQuote = !inQuote
          contentEnd++
        } else if (
          !inQuote &&
          message.substring(
            contentEnd,
            contentEnd + this.closeDelimiter.length,
          ) === this.closeDelimiter
        ) {
          // Found closing delimiter outside of quotes
          const tagContent = message.substring(contentStart, contentEnd).trim()

          if (tagContent !== '') {
            const entity = this.processTag(
              tagContent,
              openIndex,
              contentEnd + this.closeDelimiter.length,
            )
            if (entity) {
              entities.push(entity)
            }
          }

          // Move past this tag
          pos = contentEnd + this.closeDelimiter.length
          break
        } else {
          contentEnd++
        }
      }

      // If we reached the end without finding a closing delimiter, skip this opening
      if (contentEnd >= message.length) {
        pos = openIndex + this.openDelimiter.length
      }
    }

    return new ParseResult(message, entities, this.closeDelimiter)
  }

  /**
   * Parse a string in delimiter-free mode, extracting key-value patterns
   * @param message - The string to parse
   * @returns ParseResult containing original message and extracted entities
   */
  private parseDelimiterFree(message: string): ParseResult {
    const entities: Entity[] = []
    let pos = 0

    while (pos < message.length) {
      // Skip whitespace
      while (pos < message.length && /\s/.test(message[pos])) {
        pos++
      }

      if (pos >= message.length) {
        break
      }

      // Try to extract key (quoted or unquoted)
      const keyStart = pos
      let key: string
      let keyEnd: number

      if (message[pos] === '"') {
        // Quoted key
        const quotedKey = this.extractQuotedString(message, pos)
        if (!quotedKey) {
          // Malformed quoted key - skip this character and continue
          pos++
          continue
        }
        key = quotedKey.content
        keyEnd = quotedKey.endPosition
      } else {
        // Unquoted key - extract until separator or whitespace
        const unquotedKey = this.extractUnquotedToken(message, pos, [
          this.typeSeparator,
        ])
        if (unquotedKey.content === '') {
          // No key found - advance and continue
          pos++
          continue
        }
        key = unquotedKey.content
        keyEnd = unquotedKey.endPosition
      }

      // Check for type separator
      if (keyEnd >= message.length || message[keyEnd] !== this.typeSeparator) {
        // No separator - this isn't an entity, continue from after the key
        pos = keyEnd + 1
        continue
      }

      // Advance past separator
      pos = keyEnd + 1

      // Try to extract value (quoted or unquoted)
      let value: string
      let valueEnd: number

      if (pos < message.length && message[pos] === '"') {
        // Quoted value
        const quotedValue = this.extractQuotedString(message, pos)
        if (!quotedValue) {
          // Malformed quoted value - skip this entity
          continue
        }
        value = quotedValue.content
        valueEnd = quotedValue.endPosition
      } else {
        // Unquoted value - extract until whitespace
        const unquotedValue = this.extractUnquotedToken(message, pos, [])
        if (unquotedValue.content === '') {
          // No value found - skip this entity
          continue
        }
        value = unquotedValue.content
        valueEnd = unquotedValue.endPosition
      }

      // Create entity
      const { parsedValue, inferredType } = this.parseValue(key, value)
      const formattedValue = this.applyFormatter(key, parsedValue)

      entities.push({
        type: key,
        value,
        parsedValue,
        formattedValue,
        inferredType,
        position: keyStart,
        endPosition: valueEnd,
      })

      // Update position to continue scanning
      pos = valueEnd
    }

    return new ParseResult(message, entities, this.closeDelimiter)
  }

  /**
   * Process a tag's content and create an Entity
   * @param tagContent - The content between delimiters
   * @param position - The position of the tag in the original message
   * @param endPosition - The position after the closing delimiter
   * @returns Entity or null if tag is malformed
   */
  private processTag(
    tagContent: string,
    position: number,
    endPosition: number,
  ): Entity | null {
    let type: string
    let value: string
    let pos = 0

    // Extract type (key) - can be quoted or unquoted
    if (tagContent[pos] === '"') {
      // Quoted key
      const quotedKey = this.extractQuotedString(tagContent, pos)
      if (!quotedKey) {
        // Malformed quoted key - skip this tag
        return null
      }
      type = quotedKey.content
      pos = quotedKey.endPosition
    } else {
      // Unquoted key - find separator
      const separatorIndex = tagContent.indexOf(this.typeSeparator)
      if (separatorIndex === -1) {
        // No separator - treat entire content as value with empty type
        type = ''
        value = tagContent

        // Parse the value and get typed result
        const { parsedValue, inferredType } = this.parseValue(type, value)

        // Apply formatter to get formatted value
        const formattedValue = this.applyFormatter(type, parsedValue)

        return {
          type,
          value,
          parsedValue,
          formattedValue,
          inferredType,
          position,
          endPosition,
        }
      }
      type = tagContent.substring(0, separatorIndex)
      pos = separatorIndex
    }

    // Check for separator
    if (pos >= tagContent.length || tagContent[pos] !== this.typeSeparator) {
      // No separator found after key - malformed
      return null
    }

    // Skip separator
    pos++

    // Extract value - can be quoted or unquoted
    if (pos < tagContent.length && tagContent[pos] === '"') {
      // Quoted value
      const quotedValue = this.extractQuotedString(tagContent, pos)
      if (!quotedValue) {
        // Malformed quoted value - skip this tag
        return null
      }
      value = quotedValue.content
    } else {
      // Unquoted value - rest of the content
      value = tagContent.substring(pos)
    }

    // Parse the value and get typed result
    const { parsedValue, inferredType } = this.parseValue(type, value)

    // Apply formatter to get formatted value
    const formattedValue = this.applyFormatter(type, parsedValue)

    return {
      type,
      value,
      parsedValue,
      formattedValue,
      inferredType,
      position,
      endPosition,
    }
  }

  /**
   * Infer the primitive type from a raw string value
   * @param value - The raw string value
   * @returns The inferred primitive type
   */
  private inferType(value: string): PrimitiveType {
    // Check for number (including decimals and negatives)
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return 'number'
    }

    // Check for boolean (case-insensitive)
    const lowerValue = value.toLowerCase()
    if (lowerValue === 'true' || lowerValue === 'false') {
      return 'boolean'
    }

    // Default to string
    return 'string'
  }

  /**
   * Parse a value using schema (if available) or type inference
   * @param type - The entity type
   * @param rawValue - The raw string value
   * @returns Object with parsedValue and inferredType
   */
  private parseValue(
    type: string,
    rawValue: string,
  ): {
    parsedValue: string | number | boolean
    inferredType: PrimitiveType
  } {
    let targetType: PrimitiveType

    // Check if type is in schema
    if (this.schema && type in this.schema) {
      const schemaEntry = this.schema[type]
      // Handle both shorthand (just type) and full definition
      targetType =
        typeof schemaEntry === 'string' ? schemaEntry : schemaEntry.type
    } else {
      // Use inference for unknown types
      targetType = this.inferType(rawValue)
    }

    // Parse based on target type
    let parsedValue: string | number | boolean

    switch (targetType) {
      case 'number':
        parsedValue = parseFloat(rawValue)
        break
      case 'boolean':
        parsedValue = rawValue.toLowerCase() === 'true'
        break
      case 'string':
        parsedValue = rawValue
        break
      default:
        parsedValue = rawValue
        break
    }

    return {
      parsedValue,
      inferredType: targetType,
    }
  }

  /**
   * Apply formatter function to a parsed value
   * @param type - The entity type
   * @param parsedValue - The parsed value
   * @returns Formatted string
   */
  private applyFormatter(
    type: string,
    parsedValue: string | number | boolean,
  ): string {
    // Check if schema has a formatter for this type
    if (this.schema && type in this.schema) {
      const schemaEntry = this.schema[type]

      // Only full EntityDefinition can have a formatter
      if (typeof schemaEntry !== 'string' && schemaEntry.format) {
        return schemaEntry.format(parsedValue)
      }
    }

    // No formatter - convert to string
    return String(parsedValue)
  }

  /**
   * Extract a quoted string starting at the given position
   * Processes escape sequences: \" becomes " and \\ becomes \
   * @param message - The string to extract from
   * @param startPos - The position of the opening quote
   * @returns Object with content and endPosition, or null if unclosed
   */
  private extractQuotedString(
    message: string,
    startPos: number,
  ): { content: string; endPosition: number } | null {
    // Verify we're starting at a quote
    if (message[startPos] !== '"') {
      return null
    }

    let result = ''
    let pos = startPos + 1

    while (pos < message.length) {
      const char = message[pos]

      if (char === '\\') {
        // Check if there's a next character
        if (pos + 1 < message.length) {
          const nextChar = message[pos + 1]
          // Process escape sequences for quote and backslash
          if (nextChar === '"' || nextChar === '\\') {
            result += nextChar
            pos += 2
            continue
          }
        }
        // Backslash at end or before non-escapable char - treat as literal
        result += char
        pos += 1
      } else if (char === '"') {
        // Found closing quote
        return { content: result, endPosition: pos + 1 }
      } else {
        // Regular character
        result += char
        pos += 1
      }
    }

    // Reached end of string without finding closing quote
    return null
  }

  /**
   * Extract an unquoted token starting at the given position
   * Stops at whitespace or any of the specified stop characters
   * @param message - The string to extract from
   * @param startPos - The position to start extraction
   * @param stopChars - Array of characters that should stop extraction
   * @returns Object with content and endPosition
   */
  private extractUnquotedToken(
    message: string,
    startPos: number,
    stopChars: string[],
  ): { content: string; endPosition: number } {
    let result = ''
    let pos = startPos

    while (pos < message.length) {
      const char = message[pos]

      // Check if we hit whitespace
      if (/\s/.test(char)) {
        break
      }

      // Check if we hit a stop character
      if (stopChars.includes(char)) {
        break
      }

      // Add character to result
      result += char
      pos += 1
    }

    return { content: result, endPosition: pos }
  }
}
