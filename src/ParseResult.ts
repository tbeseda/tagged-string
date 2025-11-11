import type { Entity, ParseResult as IParseResult } from './types.ts'

/**
 * Implementation of ParseResult interface
 * Holds the original message and extracted entities with utility methods
 */
export class ParseResult implements IParseResult {
  public readonly originalMessage: string
  public readonly entities: Entity[]
  private readonly closeDelimiter?: string

  constructor(
    originalMessage: string,
    entities: Entity[],
    closeDelimiter?: string,
  ) {
    this.originalMessage = originalMessage
    this.entities = entities
    this.closeDelimiter = closeDelimiter
  }

  /**
   * Get all entities of a specific type
   * @param type - The entity type to filter by
   * @returns Array of entities matching the type, in original order
   */
  getEntitiesByType(type: string): Entity[] {
    return this.entities.filter((entity) => entity.type === type)
  }

  /**
   * Get all unique entity types found in the message
   * @returns Array of unique type strings
   */
  getAllTypes(): string[] {
    const types = new Set<string>()
    for (const entity of this.entities) {
      types.add(entity.type)
    }
    return Array.from(types)
  }

  /**
   * Reconstruct the message with formatted entity values
   * Replaces tags with their formattedValue from entities
   * @returns Formatted string with all entities replaced
   */
  format(): string {
    if (this.entities.length === 0) {
      return this.originalMessage
    }

    // Sort entities by position to process them in order
    const sortedEntities = [...this.entities].sort(
      (a, b) => a.position - b.position,
    )

    let result = ''
    let lastIndex = 0

    for (const entity of sortedEntities) {
      // Add text before this entity
      result += this.originalMessage.substring(lastIndex, entity.position)

      // Add the formatted value instead of the original tag
      result += entity.formattedValue

      // Use stored endPosition if available, otherwise fall back to searching
      let tagEnd: number
      if (entity.endPosition !== undefined) {
        tagEnd = entity.endPosition
      } else {
        // Fallback: search for closing delimiter
        const delimiter = this.closeDelimiter ?? ']'
        const closingDelimiterIndex = this.originalMessage.indexOf(
          delimiter,
          entity.position,
        )
        tagEnd =
          closingDelimiterIndex !== -1
            ? closingDelimiterIndex + delimiter.length
            : entity.position
      }

      lastIndex = tagEnd
    }

    // Add remaining text after the last entity
    result += this.originalMessage.substring(lastIndex)

    return result
  }
}
