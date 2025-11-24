import { ParseResult } from './ParseResult.ts'
import type {
  Entity,
  EntitySchema,
  ParserConfig,
  PrimitiveType,
} from './types.ts'

/**
 * TaggedStringParser extracts tagged entities from strings
 * Supports configurable delimiters, schema-based type parsing, and automatic type inference
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

    // Escape special regex characters in delimiters
    const escapeRegex = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const openEscaped = escapeRegex(this.openDelimiter)
    const closeEscaped = escapeRegex(this.closeDelimiter)

    // Build regex to match tags: openDelimiter + content + closeDelimiter
    const tagRegex = new RegExp(
      `${openEscaped}([^${closeEscaped}]+?)${closeEscaped}`,
      'g',
    )

    const entities: Entity[] = []

    for (const match of message.matchAll(tagRegex)) {
      const tagContent = match[1].trim()

      if (tagContent !== '' && match.index !== undefined) {
        const entity = this.processTag(
          tagContent,
          match.index,
          match.index + match[0].length,
        )
        if (entity) {
          entities.push(entity)
        }
      }
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
    // Find the type separator
    const separatorIndex = tagContent.indexOf(this.typeSeparator)

    let type: string
    let value: string

    if (separatorIndex === -1) {
      // No separator - treat entire content as value with empty type
      type = ''
      value = tagContent
    } else {
      // Split by separator
      type = tagContent.substring(0, separatorIndex)
      value = tagContent.substring(separatorIndex + 1)
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
