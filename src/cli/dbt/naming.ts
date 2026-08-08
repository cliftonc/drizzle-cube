const unsafeIdentifiers = new Set(['__proto__', 'constructor', 'prototype'])

function words(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean)
}

function capitalize(value: string): string {
  return value.length === 0 ? value : `${value[0]!.toUpperCase()}${value.slice(1).toLowerCase()}`
}

export function toCamelCase(sqlName: string): string {
  const parts = words(sqlName)
  if (parts.length === 0) return ''
  const [first, ...rest] = parts
  return `${first!.toLowerCase()}${rest.map(capitalize).join('')}`
}

export function toPascalCase(sqlName: string): string {
  return words(sqlName).map(capitalize).join('')
}

export function toFileName(modelName: string): string {
  const parts = words(modelName)
  return parts.length === 0 ? 'model' : parts.map((part) => part.toLowerCase()).join('-')
}

export function humanizeName(name: string): string {
  return words(name).map(capitalize).join(' ')
}

export function toSafeIdentifier(identifier: string, fallbackPrefix: string): string {
  const raw = toCamelCase(identifier)
  let safe = raw || fallbackPrefix
  if (unsafeIdentifiers.has(identifier) || unsafeIdentifiers.has(safe)) {
    safe = `${fallbackPrefix}${toPascalCase(identifier.replace(/^_+/, '')) || 'Value'}`
  }
  if (!/^[A-Za-z_$]/.test(safe)) {
    safe = `${fallbackPrefix}${toPascalCase(safe)}`
  }
  safe = safe.replace(/[^A-Za-z0-9_$]/g, '')
  return safe || fallbackPrefix
}

export function quoteTsString(value: string): string {
  return JSON.stringify(value)
}

export function makeUniqueName(base: string, used: Set<string>): string {
  let candidate = base
  let suffix = 2
  while (used.has(candidate)) {
    candidate = `${base}${suffix}`
    suffix += 1
  }
  used.add(candidate)
  return candidate
}
