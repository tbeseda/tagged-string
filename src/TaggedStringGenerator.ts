import type { GeneratorConfig } from './types.ts'

/**
 * Generates tagged strings in the correct format using configured delimiters.
 * Provides a minimal reference implementation for producing tagged strings
 * that can be parsed by TaggedStringParser.
 */
export class TaggedStringGenerator {
  private readonly openDelimiter: string
  private readonly closeDelimiter: string
  private readonly typeSeparator: string

  /**
   * Creates a new TaggedStringGenerator with optional configuration.
   * Defaults match the parser defaults: [ ] :
   *
   * @param config - Optional configuration for delimiters and separator
   * @throws Error if delimiters are empty or identical
   */
  constructor(config?: GeneratorConfig) {
    this.openDelimiter = config?.openDelimiter ?? '['
    this.closeDelimiter = config?.closeDelimiter ?? ']'
    this.typeSeparator = config?.typeSeparator ?? ':'

    this.validateConfig()
  }

  /**
   * Validates the configuration.
   * Throws an error if delimiters are invalid.
   *
   * @throws Error if openDelimiter or closeDelimiter is empty
   * @throws Error if openDelimiter equals closeDelimiter
   */
  private validateConfig(): void {
    if (this.openDelimiter === '') {
      throw new Error('openDelimiter cannot be empty')
    }
    if (this.closeDelimiter === '') {
      throw new Error('closeDelimiter cannot be empty')
    }
    if (this.openDelimiter === this.closeDelimiter) {
      throw new Error('openDelimiter and closeDelimiter must be different')
    }
  }

  /**
   * Converts any value to its string representation.
   * Handles null and undefined explicitly.
   *
   * @param value - The value to convert
   * @returns String representation of the value
   */
  private valueToString(value: unknown): string {
    return String(value)
  }

  /**
   * Generates a single tagged entity from a type and value.
   *
   * @param type - The entity type
   * @param value - The entity value (will be converted to string)
   * @returns Formatted tag string
   * @example
   * ```ts
   * const generator = new TaggedStringGenerator()
   * generator.tag('operation', 'deploy') // Returns: [operation:deploy]
   * ```
   */
  tag(type: string, value: unknown): string {
    const stringValue = this.valueToString(value)
    return `${this.openDelimiter}${type}${this.typeSeparator}${stringValue}${this.closeDelimiter}`
  }

  /**
   * Convenience method for embedding a tag in a message.
   * Concatenates the message with the generated tag.
   *
   * @param message - The message to prepend
   * @param type - The entity type
   * @param value - The entity value (will be converted to string)
   * @returns Message with embedded tag
   * @example
   * ```ts
   * const generator = new TaggedStringGenerator()
   * generator.embed('Starting ', 'operation', 'deploy') // Returns: Starting [operation:deploy]
   * ```
   */
  embed(message: string, type: string, value: unknown): string {
    return message + this.tag(type, value)
  }
}
