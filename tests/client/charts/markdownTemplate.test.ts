/**
 * Knap template support for data-bound markdown portlets.
 *
 * The aliasing rules carry most of the weight here: Knap resolves `a.b` as
 * nested member access, so a cube-qualified key is unreachable from a loop or
 * from the `map` filter unless it is renamed first.
 */

import { describe, expect, it } from 'vitest'
import {
  aliasForField,
  buildTemplateContext,
  findUnknownReferences,
  renderMarkdownTemplate,
  validateTemplate
} from '../../../src/client/components/charts/markdownTemplate'

const HEADCOUNT_ROWS = [
  { 'Employees.department': 'Engineering', 'Employees.count': 42, 'Employees.avgSalary': 128000 },
  { 'Employees.department': 'Sales', 'Employees.count': 31, 'Employees.avgSalary': 98000 },
  { 'Employees.department': 'Support', 'Employees.count': 18, 'Employees.avgSalary': 71000 }
]

describe('aliasForField', () => {
  it('joins the cube and field with an underscore', () => {
    expect(aliasForField('Employees.name')).toBe('employees_name')
  })

  it('splits camel case so the alias stays readable', () => {
    expect(aliasForField('Employees.avgSalary')).toBe('employees_avg_salary')
  })

  it('keeps acronym boundaries', () => {
    expect(aliasForField('Orders.totalGBPValue')).toBe('orders_total_gbp_value')
  })

  it('replaces characters that cannot appear in an identifier', () => {
    expect(aliasForField('Orders.total-value (net)')).toBe('orders_total_value_net')
  })

  it('prefixes an alias that would start with a digit', () => {
    expect(aliasForField('2024.count')).toBe('_2024_count')
  })
})

describe('buildTemplateContext', () => {
  it('exposes rows under aliased keys', () => {
    const context = buildTemplateContext(HEADCOUNT_ROWS)

    expect(context.rows[0]).toEqual({
      employees_department: 'Engineering',
      employees_count: 42,
      employees_avg_salary: 128000
    })
  })

  it('preserves the raw dotted keys on data', () => {
    const context = buildTemplateContext(HEADCOUNT_ROWS)

    expect(context.data[0]['Employees.avgSalary']).toBe(128000)
  })

  it('keys labelled rows by field label', () => {
    const context = buildTemplateContext(HEADCOUNT_ROWS, (key) => key.split('.')[1].toUpperCase())

    expect(Object.keys(context.labelled[0])).toEqual(['DEPARTMENT', 'COUNT', 'AVGSALARY'])
  })

  it('surfaces the first and last row, since a template cannot sort and index', () => {
    const context = buildTemplateContext(HEADCOUNT_ROWS)

    expect(context.first?.employees_department).toBe('Engineering')
    expect(context.last?.employees_department).toBe('Support')
    expect(context.rowCount).toBe(3)
  })

  it('suffixes colliding aliases rather than losing a field', () => {
    const context = buildTemplateContext([{ 'Employees.avgSalary': 1, 'Employees.avg_salary': 2 }])

    expect(Object.keys(context.rows[0])).toEqual(['employees_avg_salary', 'employees_avg_salary_2'])
  })

  it('suffixes colliding labels too', () => {
    const context = buildTemplateContext([{ 'Employees.name': 'a', 'Departments.name': 'b' }], () => 'Name')

    expect(Object.keys(context.labelled[0])).toEqual(['Name', 'Name_2'])
  })

  it('returns an empty context for no rows', () => {
    const context = buildTemplateContext([])

    expect(context).toMatchObject({ rows: [], data: [], rowCount: 0, first: null, last: null })
  })

  it('collects keys that only later rows carry', () => {
    const context = buildTemplateContext([{ 'A.one': 1 }, { 'A.one': 2, 'A.two': 3 }])

    expect(context.fields.map((field) => field.alias)).toEqual(['a_one', 'a_two'])
  })

  it('falls back to the raw key when the label lookup throws', () => {
    const context = buildTemplateContext(HEADCOUNT_ROWS, () => {
      throw new Error('no provider')
    })

    expect(Object.keys(context.labelled[0])).toContain('Employees.department')
  })
})

describe('renderMarkdownTemplate', () => {
  it('renders a narrative over aliased rows', async () => {
    const context = buildTemplateContext(HEADCOUNT_ROWS)
    const result = await renderMarkdownTemplate(
      'We employ {{ rows | map:"employees_count" | sum }} people across {{ rowCount }} teams. '
        + 'The largest is {{ first.employees_department }}.',
      context
    )

    expect(result.errors).toEqual([])
    expect(result.output).toBe('We employ 91 people across 3 teams. The largest is Engineering.')
  })

  it('renders a markdown table with field labels as headers', async () => {
    const context = buildTemplateContext(HEADCOUNT_ROWS, (key) => key.split('.')[1])
    const result = await renderMarkdownTemplate('{{ labelled | table }}', context)

    expect(result.errors).toEqual([])
    expect(result.output.split('\n')[0]).toBe('| department | count | avgSalary |')
  })

  it('reaches a raw dotted key through bracket access', async () => {
    const context = buildTemplateContext(HEADCOUNT_ROWS)
    const result = await renderMarkdownTemplate('{{ data[0]["Employees.avgSalary"] }}', context)

    expect(result.output).toBe('128000')
  })

  it('renders loops and conditionals', async () => {
    const context = buildTemplateContext(HEADCOUNT_ROWS)
    const result = await renderMarkdownTemplate(
      '{% for r in rows %}{% if r.employees_count > 20 %}- {{ r.employees_department }}\n{% endif %}{% endfor %}',
      context
    )

    expect(result.output).toBe('- Engineering\n- Sales')
  })

  it('still renders when the query returned no rows', async () => {
    const context = buildTemplateContext([])
    const result = await renderMarkdownTemplate(
      '{% if rowCount %}{{ rowCount }} incidents.{% else %}No incidents this week.{% endif %}',
      context
    )

    expect(result.errors).toEqual([])
    expect(result.output).toBe('No incidents this week.')
  })

  it('reports a syntax error instead of throwing', async () => {
    const result = await renderMarkdownTemplate('{% if %}', buildTemplateContext([]))

    expect(result.output).toBe('')
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]).toMatchObject({ line: expect.any(Number), column: expect.any(Number) })
  })
})

describe('findUnknownReferences', () => {
  const context = buildTemplateContext(HEADCOUNT_ROWS)

  it('finds nothing wrong with a correct template', () => {
    const template = '{% for row in rows %}## {{ row.employees_department }}{% endfor %}'

    expect(findUnknownReferences(template, context)).toEqual([])
  })

  // The reported case: the loop is fine, but a misspelt field renders as an
  // empty heading, so nothing appears and nothing complains.
  it('catches a misspelt field on a loop variable', () => {
    const template = '{% for row in rows %}\n## {{ row.employee_department }}\n{% endfor %}'
    const found = findUnknownReferences(template, context)

    expect(found).toHaveLength(1)
    expect(found[0].message).toContain('Unknown field "employee_department"')
    expect(found[0].message).toContain('employees_department')
  })

  it('reports a misspelt field once, not once per row', () => {
    const template = '{% for row in rows %}{{ row.nope }}{{ row.nope }}{% endfor %}'

    expect(findUnknownReferences(template, context)).toHaveLength(1)
  })

  it('catches a field misspelt on first or last', () => {
    const found = findUnknownReferences('{{ first.employee_count }}', context)

    expect(found[0].message).toContain('Unknown field "employee_count"')
  })

  it('catches a variable the context does not provide', () => {
    const found = findUnknownReferences('{{ totals }}', context)

    expect(found[0].message).toContain('Unknown variable "totals"')
    expect(found[0].message).toContain('rowCount')
  })

  it('allows the members of a fields entry', () => {
    const template = '{% for f in fields %}{{ f.alias }} {{ f.label }} {{ f.key }}{% endfor %}'

    expect(findUnknownReferences(template, context)).toEqual([])
  })

  it('catches an unknown member on a fields entry', () => {
    const found = findUnknownReferences('{% for f in fields %}{{ f.title }}{% endfor %}', context)

    expect(found).toHaveLength(1)
    expect(found[0].message).toContain('Available: key, alias, label.')
  })

  it('stays quiet about members of a labelled row, whose keys have spaces', () => {
    const template = '{% for l in labelled %}{{ l.anything }}{% endfor %}'

    expect(findUnknownReferences(template, context)).toEqual([])
  })

  it('leaves bracket access on raw rows alone', () => {
    expect(findUnknownReferences('{{ data[0]["Employees.count"] }}', context)).toEqual([])
  })

  it('leaves bracket access inside a loop over raw rows alone', () => {
    const template = '{% for r in data %}{{ r["Employees.count"] }}{% endfor %}'

    expect(findUnknownReferences(template, context)).toEqual([])
  })

  // Knap reads `r.Employees.count` as two levels of nesting, not one literal
  // key, so it resolves to nothing on a raw row.
  it('catches dotted access on a raw row and suggests brackets', () => {
    const template = '{% for r in data %}{{ r.Employees.count }}{% endfor %}'
    const found = findUnknownReferences(template, context)

    expect(found).toHaveLength(1)
    expect(found[0].message).toContain('r["Employees.count"]')
  })

  it('does not second-guess labelled, whose keys contain spaces', () => {
    expect(findUnknownReferences('{{ labelled | table }}', context)).toEqual([])
  })

  it('stays quiet when the template does not parse', () => {
    expect(findUnknownReferences('{% if %}', context)).toEqual([])
  })

  it('reports a line and column to point at', () => {
    const found = findUnknownReferences('line one\n{{ first.wrong }}', context)

    expect(found[0].line).toBe(2)
  })
})

describe('validateTemplate', () => {
  it('accepts a valid template', () => {
    expect(validateTemplate('{{ rows | length }}')).toEqual([])
  })

  it('accepts an empty template', () => {
    expect(validateTemplate('   ')).toEqual([])
  })

  it('reports an unknown filter without needing data', () => {
    const errors = validateTemplate('{{ rows | nosuchfilter }}')

    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('nosuchfilter')
  })
})
