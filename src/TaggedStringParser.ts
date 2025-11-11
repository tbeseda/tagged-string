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

  /**
   * Create a new TaggedStringParser with optional configuration
   * @param config - Parser configuration options
   * @throws Error if configuration is invalid
   */
  constructor(config?: ParserConfig) {
    // Set defaults
    this.openDelimiter = config?.openDelimiter ?? '['
    this.closeDelimiter = config?.closeDelimiter ?? ']'
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
}
