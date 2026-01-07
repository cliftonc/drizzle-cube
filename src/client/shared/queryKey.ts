export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>()

  const stringify = (input: unknown): string => {
    if (input === null || typeof input !== 'object') {
      return JSON.stringify(input)
    }

    if (seen.has(input as object)) {
      return '"[Circular]"'
    }
    seen.add(input as object)

    if (Array.isArray(input)) {
      return `[${input.map((item) => stringify(item)).join(',')}]`
    }

    const record = input as Record<string, unknown>
    const keys = Object.keys(record).sort()
    const props = keys.map((key) => `${JSON.stringify(key)}:${stringify(record[key])}`)
    return `{${props.join(',')}}`
  }

  return stringify(value)
}
