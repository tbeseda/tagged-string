import type { GeneratorConfig } from './types.ts'

/**
 * Generates tagged strings with configured delimiters — a reference
 * implementation for output that TaggedStringParser can read.
 */
export class TaggedStringGenerator {
  private readonly openDelimiter: string
  private readonly closeDelimiter: string
  private readonly typeSeparator: string

  /**
   * @param config - Delimiters and separator; defaults match the parser (`[`, `]`, `:`).
   * @throws Error if a delimiter is empty or open and close are identical.
   */
  constructor(config?: GeneratorConfig) {
    this.openDelimiter = config?.openDelimiter ?? '['
    this.closeDelimiter = config?.closeDelimiter ?? ']'
    this.typeSeparator = config?.typeSeparator ?? ':'
    this.validateConfig()
  }

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
    if (this.typeSeparator.length !== 1) {
      throw new Error('typeSeparator must be a single character')
    }
  }

  private quote(value: string): string {
    return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
  }

  private encodeType(type: string): string {
    if (
      type.includes(this.typeSeparator) ||
      type.includes(this.closeDelimiter) ||
      type.includes('"') ||
      type.trim() !== type
    ) {
      return this.quote(type)
    }

    return type
  }

  private encodeValue(value: unknown): string {
    const stringValue = String(value)
    if (
      stringValue.includes(this.closeDelimiter) ||
      stringValue.includes('"') ||
      stringValue.trim() !== stringValue
    ) {
      return this.quote(stringValue)
    }

    return stringValue
  }

  /**
   * Generate a single tag, e.g. `tag('operation', 'deploy')` → `[operation:deploy]`.
   * The value is coerced to a string.
   */
  tag(type: string, value: unknown): string {
    return `${this.openDelimiter}${this.encodeType(type)}${this.typeSeparator}${this.encodeValue(value)}${this.closeDelimiter}`
  }

  /**
   * Append a tag to a message, e.g. `embed('Starting ', 'operation', 'deploy')`
   * → `Starting [operation:deploy]`.
   */
  embed(message: string, type: string, value: unknown): string {
    return message + this.tag(type, value)
  }
}
