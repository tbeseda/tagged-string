import type { Entity, ParseResult as IParseResult } from './types.ts'

/** Holds a parsed message and its entities, with filtering and reconstruction helpers. */
export class ParseResult implements IParseResult {
  public readonly originalMessage: string
  public readonly entities: Entity[]

  constructor(originalMessage: string, entities: Entity[]) {
    this.originalMessage = originalMessage
    this.entities = entities
  }

  /** All entities of the given type, in original order. */
  getEntitiesByType(type: string): Entity[] {
    return this.entities.filter((entity) => entity.type === type)
  }

  /** Unique entity types found in the message. */
  getAllTypes(): string[] {
    return [...new Set(this.entities.map((entity) => entity.type))]
  }

  /** Reconstruct the message with each tag replaced by its formattedValue. */
  format(): string {
    if (this.entities.length === 0) {
      return this.originalMessage
    }

    const sortedEntities = [...this.entities].sort(
      (a, b) => a.position - b.position,
    )

    let result = ''
    let lastIndex = 0

    for (const entity of sortedEntities) {
      result += this.originalMessage.substring(lastIndex, entity.position)
      result += entity.formattedValue
      lastIndex = entity.endPosition
    }

    result += this.originalMessage.substring(lastIndex)
    return result
  }
}
