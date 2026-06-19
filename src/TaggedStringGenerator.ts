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
  }

  /**
   * Generate a single tag, e.g. `tag('operation', 'deploy')` → `[operation:deploy]`.
   * The value is coerced to a string.
   */
  tag(type: string, value: unknown): string {
    return `${this.openDelimiter}${type}${this.typeSeparator}${String(value)}${this.closeDelimiter}`
  }

  /**
   * Append a tag to a message, e.g. `embed('Starting ', 'operation', 'deploy')`
   * → `Starting [operation:deploy]`.
   */
  embed(message: string, type: string, value: unknown): string {
    return message + this.tag(type, value)
  }
}
