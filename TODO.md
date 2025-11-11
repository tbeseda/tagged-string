# TODO / Known Issues

## Known Limitations

(No known limitations at this time)

---

## Recently Resolved

### ✅ ParseResult.format() doesn't support custom delimiters
**Status:** RESOLVED  
**Resolved:** November 11, 2025  
**Solution:** Added `endPosition` field to Entity interface and updated format() method to use stored positions

The `ParseResult.format()` method now correctly handles custom delimiters by storing the tag end position during parsing. The Entity interface was extended with an `endPosition` field, and the format() method uses this stored position instead of searching for hardcoded delimiters.

**Implementation:**
- Added `endPosition: number` to Entity interface
- Modified TaggedStringParser to calculate and store tag end positions
- Updated ParseResult.format() to use entity.endPosition
- Added comprehensive tests for custom delimiter formatting
- Updated examples to demonstrate custom delimiter usage

---

## Future Enhancements

### Nested Delimiter Support
**Current behavior:** `[outer:[inner:value]]` extracts `[inner:value` as the value (stops at first closing delimiter)  
**Consideration:** Add support for properly parsing nested tags, either by:
- Escaping inner delimiters
- Counting delimiter depth
- Supporting a different syntax for nested structures

**Use case:** Complex structured data like `[config:{host:localhost,port:8080}]`

### Empty Type Handling
**Current behavior:** `[:value]` works but creates entity with empty string type  
**Consideration:** Decide on explicit behavior:
- Allow empty types as valid (current)
- Treat as error/skip
- Use a default type name like `"_default"` or `"value"`

**Use case:** Quick tagging without type classification: `[:important]` or `[:TODO]`

### Multiple Separator Behavior
**Current behavior:** `[type:value:extra]` splits on first `:` only, value becomes `value:extra`  
**Consideration:** Document this behavior explicitly or add options:
- Split on first separator only (current, implicit)
- Support escaped separators: `[type:value\:with\:colons]`
- Allow configuration for multi-part values

**Use case:** Values containing the separator character like URLs or timestamps

### NaN Handling for Invalid Numbers
**Current behavior:** `[count:abc]` with `number` schema produces `NaN` as parsedValue  
**Consideration:** Add validation/error handling:
- Throw error on invalid number
- Fall back to string type
- Add a `parseError` field to Entity
- Provide a validation callback in schema

**Use case:** Catching malformed numeric data early

### Formatter Error Handling
**Current behavior:** If a custom formatter throws an error, parsing crashes  
**Consideration:** Make parsing more resilient:
- Catch formatter errors and fall back to `String(value)`
- Add error callback to config
- Add `formatterError` field to Entity
- Skip entities with formatter errors

**Use case:** Robust parsing even with buggy custom formatters
