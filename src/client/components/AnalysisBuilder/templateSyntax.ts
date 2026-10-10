/**
 * A deliberately small tokenizer for the markdown template editor.
 *
 * highlight.js, which the debug panels use, has no Knap language and would need
 * a whole grammar loaded to colour a template. The editor needs far less than a
 * grammar: it has to tell prose from template code, and within template code
 * tell a keyword from a variable, a filter, a literal and punctuation. That is
 * a short list, so it is done directly and costs nothing to load.
 *
 * This colours text; it does not understand it. Diagnostics come from Knap's
 * own parser via `findUnknownReferences`.
 */

export type TemplateTokenKind =
  | 'text'
  | 'heading'
  | 'delimiter'
  | 'keyword'
  | 'identifier'
  | 'filter'
  | 'string'
  | 'number'
  | 'operator'

export interface TemplateToken {
  text: string
  kind: TemplateTokenKind
}

/** `{{ ... }}` expressions and `{% ... %}` tags, whichever comes first. */
const TEMPLATE_PATTERN = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g

/** A markdown ATX heading: up to six hashes at the start of a line. */
const HEADING_PATTERN = /^[ \t]{0,3}#{1,6}[ \t].*$/gm

/**
 * One unit of template code: a quoted string, a word, a number, a run of
 * whitespace, or a single other character. Every character matches exactly one
 * alternative, which is what keeps the round trip exact.
 */
const CODE_PATTERN = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|\s+|[\s\S]/g

/** Knap's control words, which read as structure rather than as data. */
const KEYWORDS = new Set([
  'if', 'elseif', 'else', 'endif',
  'for', 'in', 'endfor',
  'set',
  'and', 'or', 'not', 'contains',
  'true', 'false', 'null'
])

/** Append a token, merging into the previous one when they match. */
function push(tokens: TemplateToken[], text: string, kind: TemplateTokenKind): void {
  if (!text) return
  const last = tokens[tokens.length - 1]
  if (last && last.kind === kind) {
    last.text += text
    return
  }
  tokens.push({ text, kind })
}

/** Classify one unit of template code, given what preceded it. */
function classifyCode(unit: string, previous: string): TemplateTokenKind {
  if (/^\s/.test(unit)) return 'delimiter'
  if (/^["']/.test(unit)) return 'string'
  if (/^\d/.test(unit)) return 'number'
  if (!/^[A-Za-z_$]/.test(unit)) return 'operator'
  if (KEYWORDS.has(unit)) return 'keyword'
  // A word straight after a pipe names a filter, not a variable.
  return previous === '|' ? 'filter' : 'identifier'
}

/** Split the inside of a template construct into its parts. */
function tokenizeCode(code: string, tokens: TemplateToken[]): void {
  let previous = ''
  for (const [unit] of code.matchAll(CODE_PATTERN)) {
    push(tokens, unit, classifyCode(unit, previous))
    if (!/^\s/.test(unit)) previous = unit
  }
}

/** Split one template construct into its delimiters and its code. */
function tokenizeConstruct(construct: string, tokens: TemplateToken[]): void {
  const open = construct.slice(0, 2)
  const close = construct.slice(-2)
  push(tokens, open, 'delimiter')
  tokenizeCode(construct.slice(2, -2), tokens)
  push(tokens, close, 'delimiter')
}

/** Split a run of plain text into headings and everything else. */
function tokenizeProse(text: string, tokens: TemplateToken[]): void {
  let cursor = 0
  for (const match of text.matchAll(HEADING_PATTERN)) {
    const start = match.index
    push(tokens, text.slice(cursor, start), 'text')
    push(tokens, match[0], 'heading')
    cursor = start + match[0].length
  }
  push(tokens, text.slice(cursor), 'text')
}

/**
 * Split template source into coloured runs.
 *
 * Every character of the input appears in exactly one token, in order, so the
 * rendered layer lines up with the textarea character for character. An
 * unterminated `{{` stays plain text rather than swallowing the rest of the
 * document, which keeps the colouring stable while someone is mid-keystroke.
 */
export function tokenizeTemplate(source: string): TemplateToken[] {
  const tokens: TemplateToken[] = []
  let cursor = 0

  for (const match of source.matchAll(TEMPLATE_PATTERN)) {
    const start = match.index
    tokenizeProse(source.slice(cursor, start), tokens)
    tokenizeConstruct(match[0], tokens)
    cursor = start + match[0].length
  }

  tokenizeProse(source.slice(cursor), tokens)
  return tokens
}
