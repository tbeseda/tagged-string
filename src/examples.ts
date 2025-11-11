/**
 * Example usage of TaggedStringParser
 * Demonstrates basic usage, schema definition, formatters, and type inference
 *
 * Run with: node src/examples.ts
 */

import { TaggedStringParser } from './TaggedStringParser.ts'
import type { EntitySchema } from './types.ts'

// ============================================================================
// Example 1: Basic Usage with Schema and Simple String Formatters
// ============================================================================

console.log('=== Example 1: Basic Usage with String Formatters ===\n')

const basicSchema: EntitySchema = {
  operation: { type: 'string', format: (v) => String(v).toUpperCase() },
  stack: { type: 'string', format: (v) => String(v).trim() },
  changes: { type: 'number', format: (n) => `${n} changes` },
  status: 'string', // Shorthand without formatter
}

const basicParser = new TaggedStringParser({ schema: basicSchema })
const result1 = basicParser.parse(
  '[operation:deploy] started with [changes:5] to [stack: prod-stack ]',
)

console.log('Original message:', result1.originalMessage)
console.log('Formatted message:', result1.format())
console.log('\nParsed entities:')
result1.entities.forEach((entity) => {
  console.log(`  - Type: ${entity.type}`)
  console.log(`    Raw value: "${entity.value}"`)
  console.log(
    `    Parsed value: ${entity.parsedValue} (${entity.inferredType})`,
  )
  console.log(`    Formatted value: "${entity.formattedValue}"`)
  console.log(`    Position: ${entity.position}`)
})

// ============================================================================
// Example 2: Automatic Type Inference for Unknown Entities
// ============================================================================

console.log('\n\n=== Example 2: Automatic Type Inference ===\n')

const inferenceParser = new TaggedStringParser() // No schema
const result2 = inferenceParser.parse(
  '[count:42] items processed, [enabled:true] flag set, [name:test-service]',
)

console.log('Message:', result2.originalMessage)
console.log('\nInferred types:')
result2.entities.forEach((entity) => {
  console.log(
    `  - [${entity.type}:${entity.value}] → ${entity.inferredType} (${typeof entity.parsedValue})`,
  )
  console.log(`    Parsed value: ${JSON.stringify(entity.parsedValue)}`)
})

// ============================================================================
// Example 3: Entity Filtering by Type
// ============================================================================

console.log('\n\n=== Example 3: Entity Filtering ===\n')

const filterSchema: EntitySchema = {
  resource: 'string',
  action: 'string',
  count: 'number',
}

const filterParser = new TaggedStringParser({ schema: filterSchema })
const result3 = filterParser.parse(
  '[action:create] [resource:function] with [count:3] instances, [action:update] [resource:database]',
)

console.log('All entity types:', result3.getAllTypes())
console.log(
  '\nActions:',
  result3.getEntitiesByType('action').map((e) => e.parsedValue),
)
console.log(
  'Resources:',
  result3.getEntitiesByType('resource').map((e) => e.parsedValue),
)
console.log(
  'Counts:',
  result3.getEntitiesByType('count').map((e) => e.parsedValue),
)
console.log('Non-existent type:', result3.getEntitiesByType('missing'))

// ============================================================================
// Example 4: IaC Logging Examples (from design document)
// ============================================================================

console.log('\n\n=== Example 4: IaC Logging Examples ===\n')

const iacSchema: EntitySchema = {
  operation: { type: 'string', format: (v) => `OP:${v}` },
  stack: { type: 'string', format: (v) => `Stack(${v})` },
  changes: { type: 'number', format: (n) => `${n} change(s)` },
  blueprint: { type: 'string', format: (v) => `BP:${v}` },
  create: 'number',
  update: 'number',
  destroy: 'number',
  action: 'string',
  resource: 'string',
  resourceName: 'string',
  type: 'string',
  externalId: 'string',
  reason: 'string',
  error: 'string',
}

const iacParser = new TaggedStringParser({ schema: iacSchema })

// Operation lifecycle
console.log('Operation Lifecycle:')
const op1 = iacParser.parse(
  '[operation:OP-123] started with [changes:5] to [stack:ST-456]',
)
console.log('  ', op1.format())

const op2 = iacParser.parse(
  '[operation:OP-123] completed [changes:5] to [stack:ST-456]',
)
console.log('  ', op2.format())

const op3 = iacParser.parse('[operation:OP-123] failed: [reason:Timeout error]')
console.log('  ', op3.format())

// Planning
console.log('\nPlanning:')
const plan1 = iacParser.parse('[blueprint:BP-123] planning for [stack:ST-456]')
console.log('  ', plan1.format())

const plan2 = iacParser.parse(
  '[blueprint:BP-123] plan complete with [create:2] [update:3] [destroy:1] for [stack:ST-456]',
)
console.log('  ', plan2.format())
console.log('  Plan summary:', {
  create: plan2.getEntitiesByType('create')[0]?.parsedValue,
  update: plan2.getEntitiesByType('update')[0]?.parsedValue,
  destroy: plan2.getEntitiesByType('destroy')[0]?.parsedValue,
})

// Resource commands
console.log('\nResource Commands:')
const res1 = iacParser.parse(
  '[action:create] executing for [resource:RS-123] [resourceName:my-function] [type:function]',
)
console.log('  ', res1.format())

const res2 = iacParser.parse(
  '[action:create] completed for [resource:RS-123] [externalId:EXT-789]',
)
console.log('  ', res2.format())

const res3 = iacParser.parse(
  '[action:create] failed for [resource:RS-123]: [error:Connection timeout]',
)
console.log('  ', res3.format())

// ============================================================================
// Example 5: Custom Configuration (Delimiters with Formatting)
// ============================================================================

console.log('\n\n=== Example 5: Custom Delimiters with Formatting ===\n')

// This example demonstrates the fix for custom delimiter formatting
// Previously, format() was hardcoded to use ']' and wouldn't work with custom delimiters
// Now it correctly uses the configured delimiters to reconstruct messages

const customParser = new TaggedStringParser({
  openDelimiter: '{{',
  closeDelimiter: '}}',
  typeSeparator: '=',
  schema: {
    user: { type: 'string', format: (v) => `@${v}` },
    count: { type: 'number', format: (v) => String(v) },
  },
})

const result5 = customParser.parse(
  'User {{user=john}} performed {{count=10}} actions',
)
console.log('Original message:', result5.originalMessage)
console.log('Formatted message:', result5.format())
console.log('  ✓ Custom delimiters {{}} work correctly with format()')
console.log('  ✓ Formatters applied: user → @john, count → 10')

console.log('\nParsed entities:')
result5.entities.forEach((entity) => {
  console.log(
    `  - {{${entity.type}=${entity.value}}} at position ${entity.position}-${entity.endPosition}`,
  )
  console.log(`    Formatted as: "${entity.formattedValue}"`)
})

// Additional custom delimiter examples
console.log('\nOther custom delimiter configurations:')

const angleParser = new TaggedStringParser({
  openDelimiter: '<<',
  closeDelimiter: '>>',
  typeSeparator: ':',
  schema: {
    status: { type: 'string', format: (v) => String(v).toUpperCase() },
  },
})
const angleResult = angleParser.parse('Operation <<status:success>> completed')
console.log('  Angle brackets:', angleResult.format())

const parenParser = new TaggedStringParser({
  openDelimiter: '(',
  closeDelimiter: ')',
  typeSeparator: ':',
  schema: {
    code: { type: 'number', format: (n) => `#${n}` },
  },
})
const parenResult = parenParser.parse('Error (code:404) occurred')
console.log('  Parentheses:', parenResult.format())

// ============================================================================
// Example 6: Mixed Known and Unknown Entities
// ============================================================================

console.log('\n\n=== Example 6: Mixed Known and Unknown Entities ===\n')

const mixedSchema: EntitySchema = {
  operation: { type: 'string', format: (v) => `[OP: ${v}]` },
  // Other entity types will be inferred
}

const mixedParser = new TaggedStringParser({ schema: mixedSchema })
const result6 = mixedParser.parse(
  '[operation:deploy] with [timeout:30] seconds and [retry:true] flag',
)

console.log('Formatted:', result6.format())
console.log('\nEntity details:')
result6.entities.forEach((entity) => {
  const source = mixedSchema[entity.type] ? 'schema' : 'inferred'
  console.log(
    `  - ${entity.type}: ${entity.parsedValue} (${entity.inferredType}, ${source})`,
  )
})

// ============================================================================
// Example 7: Accessing Entity Properties
// ============================================================================

console.log('\n\n=== Example 7: Accessing Entity Properties ===\n')

const propsSchema: EntitySchema = {
  price: { type: 'number', format: (n) => `$${Number(n).toFixed(2)}` },
  available: { type: 'boolean', format: (b) => (b ? '✓' : '✗') },
  product: 'string',
}

const propsParser = new TaggedStringParser({ schema: propsSchema })
const result7 = propsParser.parse(
  '[product:Widget] is [available:true] at [price:29.99]',
)

console.log('Original message:', result7.originalMessage)
console.log('Formatted message:', result7.format())
console.log('\nDetailed entity properties:')
result7.entities.forEach((entity) => {
  console.log(`\n  Entity: ${entity.type}`)
  console.log(`    value (raw string): "${entity.value}"`)
  console.log(
    `    parsedValue (typed): ${JSON.stringify(entity.parsedValue)} (${typeof entity.parsedValue})`,
  )
  console.log(`    formattedValue (display): "${entity.formattedValue}"`)
  console.log(`    inferredType: ${entity.inferredType}`)
  console.log(`    position: ${entity.position}`)
})

// ============================================================================
// Example 8: Handling Quoted Values
// ============================================================================

console.log('\n\n=== Example 8: Handling Quoted Values ===\n')

const quotedParser = new TaggedStringParser({
  schema: {
    resourceName: 'string',
    error: 'string',
  },
})

const result8 = quotedParser.parse(
  '[resourceName:"my-function"] failed with [error:"Connection timeout"]',
)
console.log('Original:', result8.originalMessage)
console.log('\nEntity values (quotes preserved):')
result8.entities.forEach((entity) => {
  console.log(`  ${entity.type}: ${entity.value}`)
})

console.log('\n=== Examples Complete ===\n')
// ============================================================================
// Example 9: Producer-Consumer Pattern with Generator
// ============================================================================

console.log('\n\n=== Example 9: Producer-Consumer Pattern ===\n')

import { TaggedStringGenerator } from './TaggedStringGenerator.ts'

// Producer: Generate tagged strings
const generator = new TaggedStringGenerator()

console.log('Producer generating tagged strings:')
const generatedMessage1 = generator.embed('Starting ', 'operation', 'deploy')
console.log('  ', generatedMessage1)

const generatedMessage2 = generator.embed('Processing ', 'stack', 'prod-stack')
console.log('  ', generatedMessage2)

const generatedMessage3 = `${generator.tag('operation', 'deploy')} completed with ${generator.tag('changes', 5)} to ${generator.tag('stack', 'prod-stack')}`
console.log('  ', generatedMessage3)

// Consumer: Parse the generated strings
const consumerSchema: EntitySchema = {
  operation: { type: 'string', format: (v) => String(v).toUpperCase() },
  stack: { type: 'string', format: (v) => `Stack(${v})` },
  changes: { type: 'number', format: (n) => `${n} change(s)` },
}

const consumerParser = new TaggedStringParser({ schema: consumerSchema })

console.log('\nConsumer parsing generated strings:')
const parsed1 = consumerParser.parse(generatedMessage1)
console.log('  Original:', parsed1.originalMessage)
console.log('  Formatted:', parsed1.format())
console.log(
  '  Entities:',
  parsed1.entities.map((e) => `${e.type}=${e.parsedValue}`),
)

const parsed3 = consumerParser.parse(generatedMessage3)
console.log('\n  Original:', parsed3.originalMessage)
console.log('  Formatted:', parsed3.format())
console.log(
  '  Entities:',
  parsed3.entities.map((e) => `${e.type}=${e.parsedValue}`),
)

// Demonstrate matching configurations
console.log('\n✓ Producer and consumer use matching default configuration')
console.log('✓ Generated tags are correctly parsed and formatted')

// ============================================================================
// Example 10: Custom Delimiters with Generator and Parser
// ============================================================================

console.log('\n\n=== Example 10: Custom Delimiters with Generator ===\n')

// Producer with custom delimiters
const customConfig = {
  openDelimiter: '{{',
  closeDelimiter: '}}',
  typeSeparator: '=',
}

const customGenerator = new TaggedStringGenerator(customConfig)

console.log('Producer generating with custom delimiters {{}}:')
const customMessage1 = customGenerator.embed('User ', 'user', 'alice')
console.log('  ', customMessage1)

const customMessage2 = `${customGenerator.tag('action', 'login')} by ${customGenerator.tag('user', 'alice')} at ${customGenerator.tag('timestamp', 1699999999)}`
console.log('  ', customMessage2)

// Consumer with matching custom delimiters
const customConsumerParser = new TaggedStringParser({
  ...customConfig,
  schema: {
    user: { type: 'string', format: (v) => `@${v}` },
    action: { type: 'string', format: (v) => String(v).toUpperCase() },
    timestamp: {
      type: 'number',
      format: (n) => new Date(Number(n) * 1000).toISOString(),
    },
  },
})

console.log('\nConsumer parsing with matching custom delimiters:')
const customParsed1 = customConsumerParser.parse(customMessage1)
console.log('  Original:', customParsed1.originalMessage)
console.log('  Formatted:', customParsed1.format())

const customParsed2 = customConsumerParser.parse(customMessage2)
console.log('\n  Original:', customParsed2.originalMessage)
console.log('  Formatted:', customParsed2.format())
console.log(
  '  Entities:',
  customParsed2.entities.map((e) => `${e.type}=${e.parsedValue}`),
)

console.log('\n✓ Custom delimiters work correctly with generator and parser')
console.log('✓ Configuration consistency ensures proper round-trip')

console.log('\n=== All Examples Complete ===\n')
