/**
 * Sort direction cycle helper shared by query section components.
 */
/**
 * Get next sort direction in the cycle: null -> asc -> desc -> null
 */
export declare function getNextSortDirection(current: 'asc' | 'desc' | null): 'asc' | 'desc' | null;
