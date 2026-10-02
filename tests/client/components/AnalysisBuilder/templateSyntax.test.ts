/**
 * Tokenizing for the template editor's highlight layer.
 *
 * The layer sits underneath a transparent textarea, so the one invariant that
 * really matters is that concatenating the tokens reproduces the input exactly.
 * Any dropped or added character shifts every following line out of alignment.
 */

import { describe, expect, it } from 'vitest'
import { tokenizeTemplate } from '../../../../src/client/components/AnalysisBuilder/templateSyntax'

const join = (source: string) => tokenizeTemplate(source).map((token) => token.text).join('')

describe('tokenizeTemplate', () => {
  // Delimiters and the whitespace beside them share a colour, so they merge
  // into one span. Fewer spans, same rendering.
  it('breaks an expression into its parts', () => {
    expect(tokenizeTemplate('{{ rowCount }}')).toEqual([
      { text: '{{ ', kind: 'delimiter' },
      { text: 'rowCount', kind: 'identifier' },
      { text: ' }}', kind: 'delimiter' }
    ])
  })

  it('marks control words as keywords', () => {
    const kinds = new Map(tokenizeTemplate('{% if cast %}').map((t) => [t.text, t.kind]))

    expect(kinds.get('if')).toBe('keyword')
    expect(kinds.get('cast')).toBe('identifier')
  })

  // A word means something different either side of a pipe: `sort` after one is
  // a filter, the same word before one would be a variable.
  it('marks a word after a pipe as a filter', () => {
    const kinds = new Map(tokenizeTemplate('{{ cast | sort:"Actor" | table }}').map((t) => [t.text, t.kind]))

    expect(kinds.get('cast')).toBe('identifier')
    expect(kinds.get('sort')).toBe('filter')
    expect(kinds.get('table')).toBe('filter')
    expect(kinds.get('"Actor"')).toBe('string')
  })

  it('marks numeric literals', () => {
    const kinds = new Map(tokenizeTemplate('{% if rowCount > 10 %}').map((t) => [t.text, t.kind]))

    expect(kinds.get('10')).toBe('number')
    expect(kinds.get('>')).toBe('operator')
  })

  it('handles bracket access with a quoted key', () => {
    const kinds = new Map(
      tokenizeTemplate('{{ row["Employees.country"] }}').map((t) => [t.text, t.kind])
    )

    expect(kinds.get('row')).toBe('identifier')
    expect(kinds.get('"Employees.country"')).toBe('string')
    expect(kinds.get('[')).toBe('operator')
  })

  it('marks a markdown heading', () => {
    expect(tokenizeTemplate('## Headcount')).toEqual([{ text: '## Headcount', kind: 'heading' }])
  })

  it('separates prose from a trailing expression', () => {
    const kinds = tokenizeTemplate('We employ {{ x }}').map((t) => t.kind)

    expect(kinds[0]).toBe('text')
    expect(kinds).toContain('identifier')
  })

  // The expression keeps its own colours inside a heading rather than being
  // absorbed by it, which is what makes a template line readable at a glance.
  it('keeps an expression distinct inside a heading', () => {
    const tokens = tokenizeTemplate('## {{ row.name }}')

    expect(tokens[0]).toEqual({ text: '## ', kind: 'heading' })
    expect(tokens.some((t) => t.text === 'name' && t.kind === 'identifier')).toBe(true)
  })

  it('merges adjacent runs of the same kind', () => {
    expect(tokenizeTemplate('one\ntwo\nthree')).toHaveLength(1)
  })

  it('returns nothing for an empty template', () => {
    expect(tokenizeTemplate('')).toEqual([])
  })

  // An unterminated delimiter must not swallow the document, or the colours
  // would flip wholesale between two keystrokes.
  it('leaves an unterminated expression as plain text', () => {
    expect(tokenizeTemplate('{{ oops')).toEqual([{ text: '{{ oops', kind: 'text' }])
  })

  describe('round trip', () => {
    const cases = [
      '',
      'plain prose',
      '## Heading\n\n{% for row in rows %}\n- {{ row.a }}\n{% endfor %}\n',
      '{{ a }}{{ b }}{% c %}',
      '{% if rowCount > 10 %}\n## {{ row["Employees.country"] | upper }}\n{% endif %}',
      '   # not quite a heading?\n#hash-no-space\n###### six\n',
      'trailing newline\n',
      '{{ unterminated'
    ]

    for (const source of cases) {
      it(`reproduces ${JSON.stringify(source.slice(0, 32))}`, () => {
        expect(join(source)).toBe(source)
      })
    }
  })
})
