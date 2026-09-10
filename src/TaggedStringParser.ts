import { ParseResult } from './ParseResult.ts'
import type {
  Entity,
  EntitySchema,
  ParserConfig,
  PrimitiveType,
} from './types.ts'

/**
 * Extracts tagged entities from strings in two modes:
 * - Delimited: tags wrapped in delimiters, e.g. `[key:value]`
 * - Delimiter-free: bare `key=value` patterns split on whitespace
 *
 * Supports custom delimiters/separators, schema-based typing with formatters,
 * type inference, quoted strings with `\"`/`\\` escapes, and lenient parsing
 * (malformed entities are skipped).
 */
export class TaggedStringParser {
  private readonly openDelimiter: string
  private readonly closeDelimiter: string
  private readonly typeSeparator: string
  private readonly schema?: EntitySchema
  private readonly isDelimiterFree: boolean

  /**
   * @param config - Parser configuration. `delimiters` (`false`/`[]` for
   *   delimiter-free mode, or `[open, close]`) takes precedence over the legacy
   *   `openDelimiter`/`closeDelimiter` options.
   * @throws Error if the delimiter configuration is invalid.
   */
  constructor(config?: ParserConfig) {
    if (config?.delimiters !== undefined) {
      // `delimiters` takes precedence over the legacy individual options.
      if (
        config.delimiters === false ||
        (Array.isArray(config.delimiters) && config.delimiters.length === 0)
      ) {
        this.isDelimiterFree = true
        this.openDelimiter = ''
        this.closeDelimiter = ''
      } else if (
        Array.isArray(config.delimiters) &&
        config.delimiters.length === 2
      ) {
        this.isDelimiterFree = false
        this.openDelimiter = config.delimiters[0]
        this.closeDelimiter = config.delimiters[1]
      } else {
        throw new Error('Invalid delimiters configuration')
      }
    } else {
      this.isDelimiterFree = false
      this.openDelimiter = config?.openDelimiter ?? '['
      this.closeDelimiter = config?.closeDelimiter ?? ']'
    }

    this.typeSeparator = config?.typeSeparator ?? ':'
    this.schema = config?.schema

    this.validateConfig()
  }

  /** @throws Error if delimiters are empty or identical (delimited mode only). */
  private validateConfig(): void {
    if (this.typeSeparator.length !== 1) {
      throw new Error('Type separator must be a single character')
    }

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

  /** Parse a message and extract all tagged entities. */
  parse(message: string): ParseResult {
    if (message === '') {
      return new ParseResult(message, [])
    }

    if (this.isDelimiterFree) {
      return this.parseDelimiterFree(message)
    }

    return this.parseDelimited(message)
  }

  /** Extract `[key:value]`-style tags, respecting quoted strings. */
  private parseDelimited(message: string): ParseResult {
    const entities: Entity[] = []
    let pos = 0

    while (pos < message.length) {
      const openIndex = message.indexOf(this.openDelimiter, pos)
      if (openIndex === -1) {
        break
      }

      const contentStart = openIndex + this.openDelimiter.length
      let contentEnd = contentStart
      let inQuote = false
      let recoveryStart = -1
      let recoveryContentStart = -1
      let recoveryInQuote = false
      const recoveredEntities: Entity[] = []

      while (contentEnd < message.length) {
        const char = message[contentEnd]

        if (char === '"') {
          if (!this.isEscapedQuote(message, contentEnd, contentStart)) {
            inQuote = !inQuote
          }
          if (
            recoveryStart !== -1 &&
            !this.isEscapedQuote(message, contentEnd, recoveryContentStart)
          ) {
            recoveryInQuote = !recoveryInQuote
          }
          contentEnd++
          continue
        }

        if (
          inQuote &&
          recoveryStart === -1 &&
          message.startsWith(this.openDelimiter, contentEnd)
        ) {
          recoveryStart = contentEnd
          recoveryContentStart = contentEnd + this.openDelimiter.length
          recoveryInQuote = false
          contentEnd = recoveryContentStart
          continue
        }

        if (message.startsWith(this.closeDelimiter, contentEnd)) {
          const endPosition = contentEnd + this.closeDelimiter.length

          if (inQuote) {
            if (recoveryStart !== -1 && !recoveryInQuote) {
              const recoveredContent = message
                .substring(recoveryContentStart, contentEnd)
                .trim()
              if (recoveredContent !== '') {
                const recoveredEntity = this.processTag(
                  recoveredContent,
                  recoveryStart,
                  endPosition,
                )
                if (recoveredEntity) {
                  recoveredEntities.push(recoveredEntity)
                }
              }
              recoveryStart = -1
              recoveryContentStart = -1
            }
            contentEnd = endPosition
            continue
          }

          const tagContent = message.substring(contentStart, contentEnd).trim()

          if (tagContent !== '') {
            const entity = this.processTag(tagContent, openIndex, endPosition)
            if (entity) {
              entities.push(entity)
            }
          }

          pos = endPosition
          break
        }

        contentEnd++
      }

      if (contentEnd >= message.length) {
        entities.push(...recoveredEntities)
        break
      }
    }

    return new ParseResult(message, entities)
  }

  private isEscapedQuote(
    message: string,
    quotePosition: number,
    contentStart: number,
  ): boolean {
    let backslashCount = 0
    let pos = quotePosition - 1
    while (pos >= contentStart && message[pos] === '\\') {
      backslashCount++
      pos--
    }
    return backslashCount % 2 === 1
  }

  /** Extract bare `key=value` / `key:value` patterns bounded by whitespace. */
  private parseDelimiterFree(message: string): ParseResult {
    const entities: Entity[] = []
    let pos = 0

    while (pos < message.length) {
      while (pos < message.length && /\s/.test(message[pos])) {
        pos++
      }

      if (pos >= message.length) {
        break
      }

      // Key: quoted, or unquoted up to the separator/whitespace.
      const keyStart = pos
      let key: string
      let keyEnd: number

      if (message[pos] === '"') {
        const quotedKey = this.extractQuotedString(message, pos)
        if (!quotedKey) {
          pos++
          continue
        }
        key = quotedKey.content
        keyEnd = quotedKey.endPosition
      } else {
        const unquotedKey = this.extractUnquotedToken(message, pos, [
          this.typeSeparator,
        ])
        if (unquotedKey.content === '') {
          pos++
          continue
        }
        key = unquotedKey.content
        keyEnd = unquotedKey.endPosition
      }

      // No separator after the key → not an entity; continue past it.
      if (keyEnd >= message.length || message[keyEnd] !== this.typeSeparator) {
        pos = keyEnd + 1
        continue
      }

      pos = keyEnd + 1

      // Value: quoted, or unquoted up to whitespace.
      let value: string
      let valueEnd: number

      if (pos < message.length && message[pos] === '"') {
        const quotedValue = this.extractQuotedString(message, pos)
        if (!quotedValue) {
          continue
        }
        value = quotedValue.content
        valueEnd = quotedValue.endPosition
      } else {
        const unquotedValue = this.extractUnquotedToken(message, pos, [])
        if (unquotedValue.content === '') {
          continue
        }
        value = unquotedValue.content
        valueEnd = unquotedValue.endPosition
      }

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

      pos = valueEnd
    }

    return new ParseResult(message, entities)
  }

  /** Parse a tag's inner content into an Entity, or null if malformed. */
  private processTag(
    tagContent: string,
    position: number,
    endPosition: number,
  ): Entity | null {
    let type: string
    let value: string
    let pos = 0

    // Type (key): quoted, or up to the separator.
    if (tagContent[pos] === '"') {
      const quotedKey = this.extractQuotedString(tagContent, pos)
      if (!quotedKey) {
        return null
      }
      type = quotedKey.content
      pos = quotedKey.endPosition
    } else {
      const separatorIndex = tagContent.indexOf(this.typeSeparator)
      if (separatorIndex === -1) {
        // No separator → treat the whole content as a value with an empty type.
        type = ''
        value = tagContent

        const { parsedValue, inferredType } = this.parseValue(type, value)
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

    if (pos >= tagContent.length || tagContent[pos] !== this.typeSeparator) {
      return null
    }

    pos++

    // Value: quoted, or the rest of the content.
    if (pos < tagContent.length && tagContent[pos] === '"') {
      const quotedValue = this.extractQuotedString(tagContent, pos)
      if (!quotedValue) {
        return null
      }
      value = quotedValue.content
    } else {
      value = tagContent.substring(pos)
    }

    const { parsedValue, inferredType } = this.parseValue(type, value)
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

  /** Infer a primitive type from a raw value: number, boolean, else string. */
  private inferType(value: string): PrimitiveType {
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return 'number'
    }

    const lowerValue = value.toLowerCase()
    if (lowerValue === 'true' || lowerValue === 'false') {
      return 'boolean'
    }

    return 'string'
  }

  /** Resolve a value's type (schema if present, else inferred) and parse it. */
  private parseValue(
    type: string,
    rawValue: string,
  ): {
    parsedValue: string | number | boolean
    inferredType: PrimitiveType
  } {
    let targetType: PrimitiveType

    if (this.schema && type in this.schema) {
      const schemaEntry = this.schema[type]
      // Schema entries are either a shorthand type string or a full definition.
      targetType =
        typeof schemaEntry === 'string' ? schemaEntry : schemaEntry.type
    } else {
      targetType = this.inferType(rawValue)
    }

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

  /** Apply the schema formatter for a type, or fall back to `String(value)`. */
  private applyFormatter(
    type: string,
    parsedValue: string | number | boolean,
  ): string {
    if (this.schema && type in this.schema) {
      const schemaEntry = this.schema[type]
      // Only a full EntityDefinition (not the shorthand string) can carry a formatter.
      if (typeof schemaEntry !== 'string' && schemaEntry.format) {
        try {
          return schemaEntry.format(parsedValue)
        } catch {
          // A throwing formatter falls back to the unformatted value (lenient parsing).
          return String(parsedValue)
        }
      }
    }

    return String(parsedValue)
  }

  /**
   * Extract a quoted string from `startPos` (the opening `"`), processing `\"`
   * and `\\` escapes. Returns the content and the index after the closing quote,
   * or null if the quote is never closed.
   */
  private extractQuotedString(
    message: string,
    startPos: number,
  ): { content: string; endPosition: number } | null {
    if (message[startPos] !== '"') {
      return null
    }

    let result = ''
    let pos = startPos + 1

    while (pos < message.length) {
      const char = message[pos]

      if (char === '\\') {
        if (pos + 1 < message.length) {
          const nextChar = message[pos + 1]
          if (nextChar === '"' || nextChar === '\\') {
            result += nextChar
            pos += 2
            continue
          }
        }
        // Backslash at end or before a non-escapable char is literal.
        result += char
        pos += 1
      } else if (char === '"') {
        return { content: result, endPosition: pos + 1 }
      } else {
        result += char
        pos += 1
      }
    }

    return null
  }

  /**
   * Extract an unquoted token from `startPos`, stopping at whitespace or any
   * character in `stopChars`.
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

      if (/\s/.test(char)) {
        break
      }

      if (stopChars.includes(char)) {
        break
      }

      result += char
      pos += 1
    }

    return { content: result, endPosition: pos }
  }
}
