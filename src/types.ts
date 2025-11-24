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
 * Delimiter configuration options
 * - false or []: Enable delimiter-free mode
 * - [open, close]: Use specified delimiters
 */
export type DelimiterConfig = false | [] | [string, string]

/**
 * Parsed entity extracted from a string
 */
export interface Entity {
  /** Entity type name (can contain spaces if quoted) */
  type: string
  /** Raw string value (quotes removed, escape sequences processed) */
  value: string
  /** Typed value after parsing (string, number, or boolean) */
  parsedValue: string | number | boolean
  /** Formatted display value (uses schema formatter if available) */
  formattedValue: string
  /** Inferred or schema-defined type */
  inferredType: PrimitiveType
  /** The starting position of the entity in the original message */
  position: number
  /** The ending position of the entity in the original message */
  endPosition: number
}

/**
 * Configuration options for the parser
 */
export interface ParserConfig {
  /** Opening tag delimiter (default: '[', legacy option - use delimiters instead) */
  openDelimiter?: string
  /** Closing tag delimiter (default: ']', legacy option - use delimiters instead) */
  closeDelimiter?: string
  /** Separator between type and value (default: ':') */
  typeSeparator?: string
  /** Entity type definitions with optional formatters */
  schema?: EntitySchema
  /**
   * Unified delimiter configuration (takes precedence over openDelimiter/closeDelimiter):
   * - false or [] enables delimiter-free mode (parse key=value patterns)
   * - [open, close] uses specified delimiters (e.g., ['{{', '}}'])
   */
  delimiters?: DelimiterConfig
}

/**
 * Configuration options for the generator
 */
export interface GeneratorConfig {
  openDelimiter?: string
  closeDelimiter?: string
  typeSeparator?: string
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
