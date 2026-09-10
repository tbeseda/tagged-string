/** Primitive values produced by the parser. */
export type PrimitiveType = 'string' | 'number' | 'boolean'

/** A schema entry with an optional display formatter. */
export interface EntityDefinition {
  type: PrimitiveType
  format?: (value: unknown) => string
}

/** Maps entity names to shorthand types or full definitions. */
export type EntitySchema = Record<string, PrimitiveType | EntityDefinition>

/**
 * `false` or `[]` enables delimiter-free mode. A pair supplies custom
 * opening and closing delimiters.
 */
export type DelimiterConfig = false | [] | [string, string]

/** An entity extracted from a message. */
export interface Entity {
  /** Entity type name. */
  type: string
  /** Decoded string value, before schema conversion. */
  value: string
  /** Value after inference or schema conversion. */
  parsedValue: string | number | boolean
  /** Schema-formatted value, or `String(parsedValue)`. */
  formattedValue: string
  /** Inferred or schema-defined primitive type. */
  inferredType: PrimitiveType
  /** Inclusive start offset in the original message. */
  position: number
  /** Exclusive end offset in the original message. */
  endPosition: number
}

/** Parser configuration. */
export interface ParserConfig {
  /** Legacy opening delimiter option. */
  openDelimiter?: string
  /** Legacy closing delimiter option. */
  closeDelimiter?: string
  /** One-character separator between type and value. Defaults to `:`. */
  typeSeparator?: string
  /** Entity definitions and formatters. */
  schema?: EntitySchema
  /**
   * Custom delimiters or delimiter-free mode. Takes precedence over the
   * legacy delimiter options.
   */
  delimiters?: DelimiterConfig
}

/** Generator configuration. */
export interface GeneratorConfig {
  openDelimiter?: string
  closeDelimiter?: string
  typeSeparator?: string
}

/** A parsed message and its entities. */
export interface ParseResult {
  originalMessage: string
  entities: Entity[]

  /** Return entities with the requested type. */
  getEntitiesByType(type: string): Entity[]

  /** Return unique entity types in source order. */
  getAllTypes(): string[]

  /** Replace tags with their formatted values. */
  format(): string
}
