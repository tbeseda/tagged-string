import assert from 'node:assert'
import { describe, test } from 'node:test'
import { TaggedStringParser } from '../../src/TaggedStringParser.ts'
import type { EntitySchema } from '../../src/types.ts'

describe('Real-World IaC Log Examples', () => {
  test('should parse operation lifecycle logs', () => {
    const schema: EntitySchema = {
      operation: 'string',
      changes: 'number',
      stack: 'string',
    }
    const parser = new TaggedStringParser({ schema })

    const result1 = parser.parse(
      '[operation:OP-123] started with [changes:5] to [stack:ST-456]',
    )
    assert.strictEqual(result1.entities.length, 3)
    assert.strictEqual(result1.entities[0].parsedValue, 'OP-123')
    assert.strictEqual(result1.entities[1].parsedValue, 5)
    assert.strictEqual(result1.entities[2].parsedValue, 'ST-456')

    const result2 = parser.parse(
      '[operation:OP-123] completed [changes:5] to [stack:ST-456]',
    )
    assert.strictEqual(result2.entities.length, 3)
  })

  test('should parse planning logs', () => {
    const schema: EntitySchema = {
      blueprint: 'string',
      stack: 'string',
      create: 'number',
      update: 'number',
      destroy: 'number',
    }
    const parser = new TaggedStringParser({ schema })

    const result = parser.parse(
      '[blueprint:BP-123] plan complete with [create:2] [update:3] [destroy:1] for [stack:ST-456]',
    )

    assert.strictEqual(result.entities.length, 5)
    assert.strictEqual(result.entities[0].parsedValue, 'BP-123')
    assert.strictEqual(result.entities[1].parsedValue, 2)
    assert.strictEqual(result.entities[2].parsedValue, 3)
    assert.strictEqual(result.entities[3].parsedValue, 1)
    assert.strictEqual(result.entities[4].parsedValue, 'ST-456')
  })

  test('should parse resource command logs', () => {
    const schema: EntitySchema = {
      action: 'string',
      resource: 'string',
      resourceName: 'string',
      type: 'string',
      externalId: 'string',
    }
    const parser = new TaggedStringParser({ schema })

    const result1 = parser.parse(
      '[action:create] executing for [resource:RS-123] [resourceName:"my-function"] [type:function]',
    )
    assert.strictEqual(result1.entities.length, 4)
    assert.strictEqual(result1.entities[0].parsedValue, 'create')
    assert.strictEqual(result1.entities[2].parsedValue, 'my-function')

    const result2 = parser.parse(
      '[action:create] completed for [resource:RS-123] [externalId:EXT-789]',
    )
    assert.strictEqual(result2.entities.length, 3)
  })

  test('should extract quoted values without quotes in entity values', () => {
    const parser = new TaggedStringParser()
    const result = parser.parse(
      '[resourceName:"my-function"] [error:"Error message"]',
    )

    assert.strictEqual(result.entities[0].value, 'my-function')
    assert.strictEqual(result.entities[1].value, 'Error message')
  })

  test('should parse resource type-specific logs', () => {
    const schema: EntitySchema = {
      resourceType: 'string',
      resourceName: 'string',
    }
    const parser = new TaggedStringParser({ schema })

    const result1 = parser.parse(
      '[resourceType:function] creating [resourceName:"my-function"]',
    )
    assert.strictEqual(result1.entities[0].parsedValue, 'function')
    assert.strictEqual(result1.entities[1].parsedValue, 'my-function')

    const result2 = parser.parse(
      '[resourceType:database] updating [resourceName:"user-db"]',
    )
    assert.strictEqual(result2.entities[0].parsedValue, 'database')
    assert.strictEqual(result2.entities[1].parsedValue, 'user-db')
  })
})
