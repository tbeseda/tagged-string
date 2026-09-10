# Known limitations

Changing these behaviors may require a major release:

- **Nested tags** — `[outer:[inner:value]]` stops at the first close delimiter (value becomes `[inner:value`). No depth counting or escaping.
- **Empty type** — `[:value]` produces an entity with an empty-string type.
- **Multiple separators** — `[type:value:extra]` splits on the first separator only; the value becomes `value:extra`.
- **Invalid numbers** — `[count:abc]` with a `number` schema yields `NaN` (no validation).
