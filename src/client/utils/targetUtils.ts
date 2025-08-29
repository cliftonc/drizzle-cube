/**
 * Utility functions for handling target values in charts
 */

/**
 * Parse target values from string format
 * @param targetString - String containing target values (e.g., "100" or "50,75,100")
 * @returns Array of numeric target values
 */
export function parseTargetValues(targetString: string): number[] {
  if (!targetString || typeof targetString !== 'string') {
    return []
  }

  const trimmed = targetString.trim()
  if (!trimmed) {
    return []
  }

  try {
    // Split by comma and parse each value
    const values = trimmed
      .split(',')
      .map(val => val.trim())
      .filter(val => val !== '')
      .map(val => {
        const num = parseFloat(val)
        if (isNaN(num)) {
          throw new Error(`Invalid numeric value: ${val}`)
        }
        return num
      })

    return values.length > 0 ? values : []
  } catch (error) {
    console.warn('Failed to parse target values:', error)
    return []
  }
}

/**
 * Spread target values across data points
 * @param targets - Array of target values
 * @param dataLength - Number of data points to spread across
 * @returns Array of target values for each data point
 */
export function spreadTargetValues(targets: number[], dataLength: number): number[] {
  if (targets.length === 0 || dataLength <= 0) {
    return []
  }

  // If only one target value, repeat for all data points
  if (targets.length === 1) {
    return new Array(dataLength).fill(targets[0])
  }

  // If we have multiple targets, spread them evenly across data points
  const result: number[] = []
  const baseGroupSize = Math.floor(dataLength / targets.length)
  const remainder = dataLength % targets.length

  let currentIndex = 0
  
  for (let i = 0; i < targets.length; i++) {
    // Calculate group size for this target
    // First 'remainder' groups get an extra item
    const groupSize = baseGroupSize + (i < remainder ? 1 : 0)
    
    // Fill this group with the current target value
    for (let j = 0; j < groupSize; j++) {
      result[currentIndex++] = targets[i]
    }
  }

  return result
}

/**
 * Calculate variance between actual and target values
 * @param actual - Actual value
 * @param target - Target value
 * @returns Variance as percentage
 */
export function calculateVariance(actual: number, target: number): number {
  if (target === 0) {
    return actual === 0 ? 0 : (actual > 0 ? 100 : -100)
  }
  return ((actual - target) / target) * 100
}

/**
 * Format variance as percentage string with appropriate sign and color indication
 * @param variance - Variance percentage
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted variance string (e.g., "+12.5%" or "-8.3%")
 */
export function formatVariance(variance: number, decimals: number = 1): string {
  const sign = variance >= 0 ? '+' : ''
  return `${sign}${variance.toFixed(decimals)}%`
}

/**
 * Get unique target values for reference lines
 * @param targets - Array of target values (may contain duplicates)
 * @returns Array of unique target values
 */
export function getUniqueTargets(targets: number[]): number[] {
  return [...new Set(targets)].sort((a, b) => a - b)
}