/**
 * Sort direction cycle helper shared by query section components.
 */

/**
 * Get next sort direction in the cycle: null -> asc -> desc -> null
 */
export function getNextSortDirection(current: 'asc' | 'desc' | null): 'asc' | 'desc' | null {
  switch (current) {
    case null:
      return 'asc'
    case 'asc':
      return 'desc'
    case 'desc':
      return null
    default:
      return 'asc'
  }
}
