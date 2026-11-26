import { describe, it, expect } from 'vitest'
import { CalculatedMeasureResolver } from '../src/server/resolvers/calculated-measure-resolver'

const dividesSafely = (calculatedSql: string) => CalculatedMeasureResolver.dividesOnlyBySafeDivisors(calculatedSql)

describe('CalculatedMeasureResolver.dividesOnlyBySafeDivisors', () => {
  it.each([
    '{count} * 2',
    '{activeCount} + 1.0',
    '{organisations} / NULLIF({count}, 0)',
    '({activeCount} / NULLIF({count}, 0)) * 100',
    '({a} * 0.3 + {b} * 2) / NULLIF({days}, 0)',
    '1.0 * {avgSalary} / NULLIF({maxSalary}, 0)',
    '{a} / nullif( {b} ,0 )',
    '{a} / NULLIF({b}, 0.0)',
    '{a} / NULLIF({Sales.count}, 0)',
    '{calc1} / 2',
    '({a} + {b} + {c}) / 3',
    '{a} / 0.5'
  ])('should accept %s', calculatedSql => {
    expect(dividesSafely(calculatedSql)).toBe(true)
  })

  it.each([
    '{distinctCount} / {count}',
    '{totalSalary} / {avgSalary}',
    '{a} / NULLIF({b}, 0) + {c} / {d}',
    '{a} / NULLIF({b} + {c}, 0)',
    '{a} / NULLIF({b}, 1)',
    '{a} / ({b} + 1)',
    '{a} / 0',
    '{a} / 0.0',
    '({activeCount} /* active over all */ / NULLIF({count}, 0)) * 100'
  ])('should refuse %s', calculatedSql => {
    expect(dividesSafely(calculatedSql)).toBe(false)
  })

  it('should judge only the template it is given, not a referenced calculated measure', () => {
    expect(dividesSafely('{unguardedRatio} * 100')).toBe(true)
    expect(dividesSafely('{a} / NULLIF({unguardedRatio}, 0)')).toBe(true)
  })

  it('should refuse a template too long to scan', () => {
    expect(dividesSafely(`${'{a} + '.repeat(200)}{b}`)).toBe(false)
  })
})
