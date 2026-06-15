import { describe, it, expect } from 'vitest'
import { resolveValueKeyboardAction } from '../../../../src/client/components/AnalysisBuilder/filterConfigModalUtils'

describe('resolveValueKeyboardAction', () => {
  it('returns none when the dropdown is closed', () => {
    expect(resolveValueKeyboardAction('ArrowDown', false, 3, 0)).toEqual({ type: 'none' })
  })

  it('returns none when there are no values', () => {
    expect(resolveValueKeyboardAction('ArrowDown', true, 0, 0)).toEqual({ type: 'none' })
  })

  it('ArrowDown moves to the next index', () => {
    expect(resolveValueKeyboardAction('ArrowDown', true, 3, 0)).toEqual({ type: 'highlight', index: 1 })
  })

  it('ArrowDown wraps from the last index to the first', () => {
    expect(resolveValueKeyboardAction('ArrowDown', true, 3, 2)).toEqual({ type: 'highlight', index: 0 })
  })

  it('ArrowUp moves to the previous index', () => {
    expect(resolveValueKeyboardAction('ArrowUp', true, 3, 2)).toEqual({ type: 'highlight', index: 1 })
  })

  it('ArrowUp wraps from the first index to the last', () => {
    expect(resolveValueKeyboardAction('ArrowUp', true, 3, 0)).toEqual({ type: 'highlight', index: 2 })
  })

  it('Enter selects the highlighted value', () => {
    expect(resolveValueKeyboardAction('Enter', true, 3, 1)).toEqual({ type: 'select', index: 1 })
  })

  it('Enter is a no-op when nothing is highlighted', () => {
    expect(resolveValueKeyboardAction('Enter', true, 3, -1)).toEqual({ type: 'none' })
  })

  it('Enter is a no-op when the highlight is out of range', () => {
    expect(resolveValueKeyboardAction('Enter', true, 3, 3)).toEqual({ type: 'none' })
  })

  it('Escape closes the dropdown', () => {
    expect(resolveValueKeyboardAction('Escape', true, 3, 0)).toEqual({ type: 'close' })
  })

  it('ignores unrelated keys', () => {
    expect(resolveValueKeyboardAction('a', true, 3, 0)).toEqual({ type: 'none' })
  })
})
