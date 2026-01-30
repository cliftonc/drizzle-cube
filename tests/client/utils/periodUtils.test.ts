/**
 * Tests for periodUtils
 * Covers time period detection, granularity extraction, and incomplete period filtering
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getPeriodEndDate,
  isLastPeriodComplete,
  getQueryGranularity,
  filterIncompletePeriod
} from '../../../src/client/utils/periodUtils'

describe('periodUtils', () => {
  describe('getPeriodEndDate', () => {
    describe('day granularity', () => {
      it('should return end of the same day', () => {
        const date = new Date('2024-06-15T10:30:00')
        const result = getPeriodEndDate(date, 'day')

        expect(result.getFullYear()).toBe(2024)
        expect(result.getMonth()).toBe(5) // June (0-indexed)
        expect(result.getDate()).toBe(15)
        expect(result.getHours()).toBe(23)
        expect(result.getMinutes()).toBe(59)
        expect(result.getSeconds()).toBe(59)
        expect(result.getMilliseconds()).toBe(999)
      })

      it('should handle start of day', () => {
        const date = new Date('2024-06-15T00:00:00')
        const result = getPeriodEndDate(date, 'day')

        expect(result.getDate()).toBe(15)
        expect(result.getHours()).toBe(23)
      })

      it('should handle end of day', () => {
        const date = new Date('2024-06-15T23:59:59')
        const result = getPeriodEndDate(date, 'day')

        expect(result.getDate()).toBe(15)
        expect(result.getHours()).toBe(23)
      })
    })

    describe('week granularity', () => {
      it('should return end of Saturday for Sunday input', () => {
        // June 16, 2024 is a Sunday
        const date = new Date('2024-06-16T10:00:00')
        const result = getPeriodEndDate(date, 'week')

        expect(result.getDay()).toBe(6) // Saturday
        expect(result.getDate()).toBe(22) // June 22
        expect(result.getHours()).toBe(23)
      })

      it('should return end of current Saturday for Saturday input', () => {
        // June 22, 2024 is a Saturday
        const date = new Date('2024-06-22T10:00:00')
        const result = getPeriodEndDate(date, 'week')

        expect(result.getDay()).toBe(6)
        expect(result.getDate()).toBe(22)
      })

      it('should return end of Saturday for Wednesday input', () => {
        // June 19, 2024 is a Wednesday
        const date = new Date('2024-06-19T10:00:00')
        const result = getPeriodEndDate(date, 'week')

        expect(result.getDay()).toBe(6)
        expect(result.getDate()).toBe(22) // Next Saturday
      })

      it('should handle Friday correctly (1 day to Saturday)', () => {
        // June 21, 2024 is a Friday
        const date = new Date('2024-06-21T10:00:00')
        const result = getPeriodEndDate(date, 'week')

        expect(result.getDay()).toBe(6)
        expect(result.getDate()).toBe(22)
      })
    })

    describe('month granularity', () => {
      it('should return last day of current month', () => {
        const date = new Date('2024-06-15T10:00:00')
        const result = getPeriodEndDate(date, 'month')

        expect(result.getMonth()).toBe(5) // June
        expect(result.getDate()).toBe(30) // June has 30 days
        expect(result.getHours()).toBe(23)
      })

      it('should handle February in leap year', () => {
        const date = new Date('2024-02-15T10:00:00')
        const result = getPeriodEndDate(date, 'month')

        expect(result.getMonth()).toBe(1) // February
        expect(result.getDate()).toBe(29) // Leap year
      })

      it('should handle February in non-leap year', () => {
        const date = new Date('2023-02-15T10:00:00')
        const result = getPeriodEndDate(date, 'month')

        expect(result.getMonth()).toBe(1) // February
        expect(result.getDate()).toBe(28)
      })

      it('should handle months with 31 days', () => {
        const date = new Date('2024-01-15T10:00:00')
        const result = getPeriodEndDate(date, 'month')

        expect(result.getMonth()).toBe(0) // January
        expect(result.getDate()).toBe(31)
      })

      it('should handle last day of month', () => {
        const date = new Date('2024-06-30T10:00:00')
        const result = getPeriodEndDate(date, 'month')

        expect(result.getDate()).toBe(30)
      })
    })

    describe('quarter granularity', () => {
      it('should return end of Q1 for January', () => {
        const date = new Date('2024-01-15T10:00:00')
        const result = getPeriodEndDate(date, 'quarter')

        expect(result.getMonth()).toBe(2) // March
        expect(result.getDate()).toBe(31)
      })

      it('should return end of Q1 for March', () => {
        const date = new Date('2024-03-15T10:00:00')
        const result = getPeriodEndDate(date, 'quarter')

        expect(result.getMonth()).toBe(2) // March
        expect(result.getDate()).toBe(31)
      })

      it('should return end of Q2 for April', () => {
        const date = new Date('2024-04-15T10:00:00')
        const result = getPeriodEndDate(date, 'quarter')

        expect(result.getMonth()).toBe(5) // June
        expect(result.getDate()).toBe(30)
      })

      it('should return end of Q2 for June', () => {
        const date = new Date('2024-06-15T10:00:00')
        const result = getPeriodEndDate(date, 'quarter')

        expect(result.getMonth()).toBe(5) // June
        expect(result.getDate()).toBe(30)
      })

      it('should return end of Q3 for September', () => {
        const date = new Date('2024-09-15T10:00:00')
        const result = getPeriodEndDate(date, 'quarter')

        expect(result.getMonth()).toBe(8) // September
        expect(result.getDate()).toBe(30)
      })

      it('should return end of Q4 for December', () => {
        const date = new Date('2024-12-15T10:00:00')
        const result = getPeriodEndDate(date, 'quarter')

        expect(result.getMonth()).toBe(11) // December
        expect(result.getDate()).toBe(31)
      })

      it('should return end of Q4 for October', () => {
        const date = new Date('2024-10-15T10:00:00')
        const result = getPeriodEndDate(date, 'quarter')

        expect(result.getMonth()).toBe(11) // December
        expect(result.getDate()).toBe(31)
      })
    })

    describe('year granularity', () => {
      it('should return December 31st', () => {
        const date = new Date('2024-06-15T10:00:00')
        const result = getPeriodEndDate(date, 'year')

        expect(result.getFullYear()).toBe(2024)
        expect(result.getMonth()).toBe(11) // December
        expect(result.getDate()).toBe(31)
        expect(result.getHours()).toBe(23)
      })

      it('should handle January 1st', () => {
        const date = new Date('2024-01-01T10:00:00')
        const result = getPeriodEndDate(date, 'year')

        expect(result.getMonth()).toBe(11)
        expect(result.getDate()).toBe(31)
      })

      it('should handle December 31st', () => {
        const date = new Date('2024-12-31T10:00:00')
        const result = getPeriodEndDate(date, 'year')

        expect(result.getMonth()).toBe(11)
        expect(result.getDate()).toBe(31)
      })
    })

    describe('case insensitivity', () => {
      it('should handle uppercase DAY', () => {
        const date = new Date('2024-06-15T10:00:00')
        const result = getPeriodEndDate(date, 'DAY')

        expect(result.getDate()).toBe(15)
      })

      it('should handle mixed case Month', () => {
        const date = new Date('2024-06-15T10:00:00')
        const result = getPeriodEndDate(date, 'Month')

        expect(result.getDate()).toBe(30)
      })
    })

    describe('unknown granularity', () => {
      it('should treat unknown granularity as day', () => {
        const date = new Date('2024-06-15T10:00:00')
        const result = getPeriodEndDate(date, 'unknown')

        expect(result.getDate()).toBe(15)
        expect(result.getHours()).toBe(23)
      })

      it('should handle empty string as day', () => {
        const date = new Date('2024-06-15T10:00:00')
        const result = getPeriodEndDate(date, '')

        expect(result.getDate()).toBe(15)
      })
    })
  })

  describe('isLastPeriodComplete', () => {
    beforeEach(() => {
      // Mock current date to 2024-06-15 12:00:00
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T12:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    describe('complete periods', () => {
      it('should return true for completed day', () => {
        const lastDataPoint = { date: '2024-06-14T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'day')).toBe(true)
      })

      it('should return true for completed week', () => {
        // June 8, 2024 was a Saturday (end of week)
        const lastDataPoint = { date: '2024-06-02T00:00:00' } // Sunday of completed week
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'week')).toBe(true)
      })

      it('should return true for completed month', () => {
        const lastDataPoint = { date: '2024-05-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'month')).toBe(true)
      })

      it('should return true for completed quarter', () => {
        const lastDataPoint = { date: '2024-01-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'quarter')).toBe(true)
      })

      it('should return true for completed year', () => {
        const lastDataPoint = { date: '2023-06-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'year')).toBe(true)
      })
    })

    describe('incomplete periods', () => {
      it('should return false for current day', () => {
        const lastDataPoint = { date: '2024-06-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'day')).toBe(false)
      })

      it('should return false for current week', () => {
        // June 15, 2024 is a Saturday - same week as "now"
        const lastDataPoint = { date: '2024-06-10T00:00:00' } // Monday of current week
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'week')).toBe(false)
      })

      it('should return false for current month', () => {
        const lastDataPoint = { date: '2024-06-01T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'month')).toBe(false)
      })

      it('should return false for current quarter', () => {
        const lastDataPoint = { date: '2024-04-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'quarter')).toBe(false)
      })

      it('should return false for current year', () => {
        const lastDataPoint = { date: '2024-01-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'year')).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should return true for null lastDataPoint', () => {
        expect(isLastPeriodComplete(null, 'date', 'day')).toBe(true)
      })

      it('should return true for undefined lastDataPoint', () => {
        expect(isLastPeriodComplete(undefined, 'date', 'day')).toBe(true)
      })

      it('should return true for empty timeDimensionField', () => {
        const lastDataPoint = { date: '2024-06-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, '', 'day')).toBe(true)
      })

      it('should return true for null timeDimensionField', () => {
        const lastDataPoint = { date: '2024-06-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, null as any, 'day')).toBe(true)
      })

      it('should return true for empty granularity', () => {
        const lastDataPoint = { date: '2024-06-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', '')).toBe(true)
      })

      it('should return true for null granularity', () => {
        const lastDataPoint = { date: '2024-06-15T00:00:00' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', null as any)).toBe(true)
      })

      it('should return true when time field is missing from data point', () => {
        const lastDataPoint = { value: 100 }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'day')).toBe(true)
      })

      it('should return true for invalid date string', () => {
        const lastDataPoint = { date: 'not-a-date' }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'day')).toBe(true)
      })

      it('should return true for null date value', () => {
        const lastDataPoint = { date: null }
        expect(isLastPeriodComplete(lastDataPoint, 'date', 'day')).toBe(true)
      })
    })
  })

  describe('getQueryGranularity', () => {
    it('should return granularity from first time dimension', () => {
      const query = {
        timeDimensions: [
          { dimension: 'Sales.createdAt', granularity: 'day' }
        ]
      }
      expect(getQueryGranularity(query)).toBe('day')
    })

    it('should return null for no time dimensions', () => {
      const query = { measures: ['Sales.count'] }
      expect(getQueryGranularity(query)).toBe(null)
    })

    it('should return null for empty time dimensions', () => {
      const query = { timeDimensions: [] }
      expect(getQueryGranularity(query)).toBe(null)
    })

    it('should return null for null query', () => {
      expect(getQueryGranularity(null)).toBe(null)
    })

    it('should return null for undefined query', () => {
      expect(getQueryGranularity(undefined)).toBe(null)
    })

    it('should return null when time dimension has no granularity', () => {
      const query = {
        timeDimensions: [
          { dimension: 'Sales.createdAt' }
        ]
      }
      expect(getQueryGranularity(query)).toBe(null)
    })

    describe('with dimension field matching', () => {
      it('should match exact dimension field', () => {
        const query = {
          timeDimensions: [
            { dimension: 'Sales.createdAt', granularity: 'day' },
            { dimension: 'Sales.updatedAt', granularity: 'week' }
          ]
        }
        expect(getQueryGranularity(query, 'Sales.updatedAt')).toBe('week')
      })

      it('should match partial dimension field (contains)', () => {
        const query = {
          timeDimensions: [
            { dimension: 'Sales.createdAt', granularity: 'month' }
          ]
        }
        expect(getQueryGranularity(query, 'createdAt')).toBe('month')
      })

      it('should match when dimension field contains time dimension', () => {
        const query = {
          timeDimensions: [
            { dimension: 'createdAt', granularity: 'quarter' }
          ]
        }
        expect(getQueryGranularity(query, 'Sales.createdAt')).toBe('quarter')
      })

      it('should fallback to first time dimension when no match', () => {
        const query = {
          timeDimensions: [
            { dimension: 'Sales.createdAt', granularity: 'day' }
          ]
        }
        expect(getQueryGranularity(query, 'Sales.deletedAt')).toBe('day')
      })

      it('should return null when matched dimension has no granularity', () => {
        const query = {
          timeDimensions: [
            { dimension: 'Sales.createdAt', granularity: 'day' },
            { dimension: 'Sales.updatedAt' }
          ]
        }
        // Falls back to first time dimension
        expect(getQueryGranularity(query, 'Sales.updatedAt')).toBe('day')
      })
    })

    describe('various granularities', () => {
      const granularities = ['day', 'week', 'month', 'quarter', 'year', 'hour', 'minute']

      granularities.forEach(granularity => {
        it(`should extract ${granularity} granularity`, () => {
          const query = {
            timeDimensions: [{ dimension: 'Sales.createdAt', granularity }]
          }
          expect(getQueryGranularity(query)).toBe(granularity)
        })
      })
    })
  })

  describe('filterIncompletePeriod', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T12:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    describe('basic filtering', () => {
      it('should filter out incomplete period when useLastCompletePeriod is true', () => {
        const data = [
          { 'Sales.createdAt.day': '2024-06-13', value: 100 },
          { 'Sales.createdAt.day': '2024-06-14', value: 110 },
          { 'Sales.createdAt.day': '2024-06-15', value: 50 } // Current day - incomplete
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        }

        const result = filterIncompletePeriod(data, 'Sales.createdAt.day', query, true)

        expect(result.filteredData).toHaveLength(2)
        expect(result.excludedIncompletePeriod).toBe(true)
        expect(result.skippedLastPeriod).toBe(false)
        expect(result.granularity).toBe('day')
      })

      it('should not filter when useLastCompletePeriod is false', () => {
        const data = [
          { date: '2024-06-14', value: 100 },
          { date: '2024-06-15', value: 50 }
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        }

        const result = filterIncompletePeriod(data, 'date', query, false)

        expect(result.filteredData).toBe(data)
        expect(result.excludedIncompletePeriod).toBe(false)
        expect(result.granularity).toBe('day')
      })

      it('should keep complete periods', () => {
        const data = [
          { date: '2024-06-13', value: 100 },
          { date: '2024-06-14', value: 110 } // Yesterday - complete
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        }

        const result = filterIncompletePeriod(data, 'date', query, true)

        expect(result.filteredData).toBe(data)
        expect(result.excludedIncompletePeriod).toBe(false)
      })
    })

    describe('skipLastPeriod option', () => {
      it('should always skip last period when skipLastPeriod is true', () => {
        const data = [
          { date: '2024-06-13', value: 100 },
          { date: '2024-06-14', value: 110 }
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        }

        const result = filterIncompletePeriod(data, 'date', query, false, true)

        expect(result.filteredData).toHaveLength(1)
        expect(result.filteredData[0].date).toBe('2024-06-13')
        expect(result.skippedLastPeriod).toBe(true)
        expect(result.excludedIncompletePeriod).toBe(false)
      })

      it('should override useLastCompletePeriod when skipLastPeriod is true', () => {
        const data = [
          { date: '2024-06-13', value: 100 },
          { date: '2024-06-14', value: 110 }
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        }

        const result = filterIncompletePeriod(data, 'date', query, true, true)

        expect(result.skippedLastPeriod).toBe(true)
        expect(result.excludedIncompletePeriod).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should not filter data with less than 2 points', () => {
        const data = [{ date: '2024-06-15', value: 100 }]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        }

        const result = filterIncompletePeriod(data, 'date', query, true)

        expect(result.filteredData).toBe(data)
        expect(result.excludedIncompletePeriod).toBe(false)
      })

      it('should not filter empty data', () => {
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        }

        const result = filterIncompletePeriod([], 'date', query, true)

        expect(result.filteredData).toEqual([])
        expect(result.excludedIncompletePeriod).toBe(false)
      })

      it('should not filter when no time dimension field', () => {
        const data = [
          { value: 100 },
          { value: 200 }
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        }

        const result = filterIncompletePeriod(data, undefined, query, true)

        expect(result.filteredData).toBe(data)
        expect(result.granularity).toBe('day')
      })

      it('should not filter when no time dimensions in query', () => {
        const data = [
          { date: '2024-06-15', value: 100 },
          { date: '2024-06-16', value: 200 }
        ]
        const query = { measures: ['Sales.count'] }

        const result = filterIncompletePeriod(data, 'date', query, true)

        expect(result.filteredData).toBe(data)
        expect(result.granularity).toBe(null)
      })

      it('should not filter when query is null', () => {
        const data = [
          { date: '2024-06-15', value: 100 },
          { date: '2024-06-16', value: 200 }
        ]

        const result = filterIncompletePeriod(data, 'date', null, true)

        expect(result.filteredData).toBe(data)
        expect(result.granularity).toBe(null)
      })

      it('should not filter when granularity cannot be determined', () => {
        const data = [
          { date: '2024-06-15', value: 100 },
          { date: '2024-06-16', value: 200 }
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt' }] // No granularity
        }

        const result = filterIncompletePeriod(data, 'date', query, true)

        expect(result.filteredData).toBe(data)
        expect(result.granularity).toBe(null)
      })
    })

    describe('different granularities', () => {
      it('should handle month granularity', () => {
        const data = [
          { month: '2024-04', value: 100 },
          { month: '2024-05', value: 110 },
          { month: '2024-06', value: 50 } // Current month - incomplete
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'month' }]
        }

        const result = filterIncompletePeriod(data, 'month', query, true)

        expect(result.filteredData).toHaveLength(2)
        expect(result.excludedIncompletePeriod).toBe(true)
        expect(result.granularity).toBe('month')
      })

      it('should handle quarter granularity', () => {
        const data = [
          { quarter: '2024-01', value: 100 }, // Q1
          { quarter: '2024-04', value: 110 } // Q2 - current, incomplete
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'quarter' }]
        }

        const result = filterIncompletePeriod(data, 'quarter', query, true)

        expect(result.filteredData).toHaveLength(1)
        expect(result.granularity).toBe('quarter')
      })

      it('should handle year granularity', () => {
        const data = [
          { year: '2022-01', value: 100 },
          { year: '2023-01', value: 110 },
          { year: '2024-01', value: 50 } // Current year - incomplete
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'year' }]
        }

        const result = filterIncompletePeriod(data, 'year', query, true)

        expect(result.filteredData).toHaveLength(2)
        expect(result.granularity).toBe('year')
      })
    })

    describe('return value structure', () => {
      it('should return correct structure for filtered data', () => {
        const data = [
          { date: '2024-06-14', value: 100 },
          { date: '2024-06-15', value: 50 }
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
        }

        const result = filterIncompletePeriod(data, 'date', query, true)

        expect(result).toHaveProperty('filteredData')
        expect(result).toHaveProperty('excludedIncompletePeriod')
        expect(result).toHaveProperty('skippedLastPeriod')
        expect(result).toHaveProperty('granularity')
      })

      it('should return granularity even when no filtering applied', () => {
        const data = [
          { date: '2024-06-13', value: 100 },
          { date: '2024-06-14', value: 110 }
        ]
        const query = {
          timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'week' }]
        }

        const result = filterIncompletePeriod(data, 'date', query, false)

        expect(result.granularity).toBe('week')
        expect(result.filteredData).toBe(data)
      })
    })
  })
})
