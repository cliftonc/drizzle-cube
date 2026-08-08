import type { GeneratorWarning } from './types.js'

const RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum',
  'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null',
  'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'let', 'static', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'await'
])

function words(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function cap(value: string): string {
  return value.length === 0 ? value : `${value[0]?.toUpperCase()}${value.slice(1).toLowerCase()}`
}

export function toCamelCase(value: string): string {
  const parts = words(value)
  if (parts.length === 0) return 'value'
  const [first, ...rest] = parts
  return `${first?.toLowerCase() ?? 'value'}${rest.map(cap).join('')}`
}

export function toPascalCase(value: string): string {
  const result = words(value).map(cap).join('')
  return result.length === 0 ? 'Value' : result
}

export function toKebabCase(value: string): string {
  const result = words(value).map((part) => part.toLowerCase()).join('-')
  return result.length === 0 ? 'value' : result
}

export function humanizeTitle(value: string): string {
  return words(value).map(cap).join(' ')
}

export function quoteStringLiteral(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

export function sanitizeIdentifier(value: string): string {
  const camel = toCamelCase(value)
  const cleaned = camel.replace(/[^A-Za-z0-9_$]/g, '')
  const prefixed = /^[A-Za-z_$]/.test(cleaned) ? cleaned : `_${cleaned}`
  return RESERVED.has(prefixed) ? `${prefixed}Value` : prefixed
}

export function makeUniqueIdentifier(raw: string, used: Set<string>, kind: string): { identifier: string; warning?: GeneratorWarning } {
  const base = sanitizeIdentifier(raw)
  if (!used.has(base)) return { identifier: base }

  let suffix = 2
  let candidate = `${base}${suffix}`
  while (used.has(candidate)) {
    suffix += 1
    candidate = `${base}${suffix}`
  }

  return {
    identifier: candidate,
    warning: {
      code: 'identifier_collision',
      message: `${kind} identifier '${base}' collided; using '${candidate}' instead.`
    }
  }
}
