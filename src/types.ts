/**
 * Primitive types supported by the parser
 */
export type PrimitiveType = 'string' | 'number' | 'boolean'

/**
 * Entity definition with optional formatter function
 */
export interface EntityDefinition {
  type: PrimitiveType
  format?: (value: unknown) => string
}

/**
 * Schema mapping entity type names to their definitions
 * Can use shorthand (just the type) or full definition with formatter
 */
export type EntitySchema = Record<string, PrimitiveType | EntityDefinition>

/**
 * Parsed entity extracted from a string
 */
export interface Entity {
  type: string
  value: string
  parsedValue: string | number | boolean
  formattedValue: string
  inferredType: PrimitiveType
  /** The starting position of the tag in the original message */
  position: number
  /** The ending position of the tag in the original message (after the closing delimiter) */
  endPosition: number
}

/**
 * Configuration options for the parser
 */
export interface ParserConfig {
  openDelimiter?: string
  closeDelimiter?: string
  typeSeparator?: string
  schema?: EntitySchema
}

/**
 * Result of parsing a string
 */
export interface ParseResult {
  originalMessage: string
  entities: Entity[]

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type: string): Entity[]

  /**
   * Get all unique entity types found in the message
   */
  getAllTypes(): string[]

  /**
   * Reconstruct the message with formatted entity values
   */
  format(): string
}
