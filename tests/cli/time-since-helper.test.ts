import { describe, expect, it } from 'vitest'
import { formatTimeSince } from '../../src/shared/date-utils.js'

const fixedNow = new Date('2024-01-15T12:00:00Z')
const fmt = (input: Date | string | number) => formatTimeSince(input, { now: fixedNow })

describe('formatTimeSince', () => {
  it('formats seconds in the past', () => {
    const past5Seconds = new Date(fixedNow.getTime() - 5 * 1000)
    expect(fmt(past5Seconds)).toBe('5 seconds ago')

    const past1Second = new Date(fixedNow.getTime() - 1 * 1000)
    expect(fmt(past1Second)).toBe('1 second ago')
  })

  it('handles boundary between seconds and minutes', () => {
    const past59Seconds = new Date(fixedNow.getTime() - 59 * 1000)
    expect(fmt(past59Seconds)).toBe('59 seconds ago')

    const past60Seconds = new Date(fixedNow.getTime() - 60 * 1000)
    expect(fmt(past60Seconds)).toBe('1 minute ago')
  })

  it('formats minutes in the past', () => {
    const past10Minutes = new Date(fixedNow.getTime() - 10 * 60 * 1000)
    expect(fmt(past10Minutes)).toBe('10 minutes ago')
  })

  it('formats hours in the past', () => {
    const past1Hour = new Date(fixedNow.getTime() - 1 * 60 * 60 * 1000)
    expect(fmt(past1Hour)).toBe('1 hour ago')

    const past23Hours = new Date(fixedNow.getTime() - 23 * 60 * 60 * 1000)
    expect(fmt(past23Hours)).toBe('23 hours ago')
  })

  it('formats days and weeks in the past', () => {
    const past10Days = new Date(fixedNow.getTime() - 10 * 24 * 60 * 60 * 1000)
    expect(fmt(past10Days)).toBe('10 days ago')

    const past14Days = new Date(fixedNow.getTime() - 14 * 24 * 60 * 60 * 1000)
    expect(fmt(past14Days)).toBe('2 weeks ago')
  })

  it('formats months in the past', () => {
    const past45Days = new Date(fixedNow.getTime() - 45 * 24 * 60 * 60 * 1000)
    expect(fmt(past45Days)).toBe('1 month ago')

    const past90Days = new Date(fixedNow.getTime() - 90 * 24 * 60 * 60 * 1000)
    expect(fmt(past90Days)).toBe('3 months ago')
  })

  it('formats years in the past', () => {
    const past400Days = new Date(fixedNow.getTime() - 400 * 24 * 60 * 60 * 1000)
    expect(fmt(past400Days)).toBe('1 year ago')

    const past800Days = new Date(fixedNow.getTime() - 800 * 24 * 60 * 60 * 1000)
    expect(fmt(past800Days)).toBe('2 years ago')
  })

  it('formats future timestamps', () => {
    const future30Seconds = new Date(fixedNow.getTime() + 30 * 1000)
    expect(fmt(future30Seconds)).toBe('in 30 seconds')

    const future2Days = new Date(fixedNow.getTime() + 2 * 24 * 60 * 60 * 1000)
    expect(fmt(future2Days)).toBe('in 2 days')
  })

  it('accepts different input types', () => {
    const past5SecondsDate = new Date(fixedNow.getTime() - 5 * 1000)
    const isoString = past5SecondsDate.toISOString()
    const timestamp = past5SecondsDate.getTime()

    expect(fmt(past5SecondsDate)).toBe('5 seconds ago')
    expect(fmt(isoString)).toBe('5 seconds ago')
    expect(fmt(timestamp)).toBe('5 seconds ago')
  })

  it('throws on invalid input', () => {
    // @ts-expect-error Testing runtime validation for invalid input
    expect(() => fmt(null)).toThrow(/formatTimeSince: invalid date input/)
    // @ts-expect-error Testing runtime validation for invalid input
    expect(() => fmt(undefined)).toThrow(/formatTimeSince: invalid date input/)
    expect(() => fmt('not-a-date')).toThrow(/formatTimeSince: invalid date input/)
    expect(() => fmt(NaN)).toThrow(/formatTimeSince: invalid date input/)
  })
})
