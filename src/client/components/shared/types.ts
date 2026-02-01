/**
 * Type definitions for shared filter/form components
 *
 * These types are used by shared components in this directory.
 * For query analysis and meta types, see ../../shared/types.ts
 */

import type { CubeQuery, FilterOperator, Filter, SimpleFilter, GroupFilter } from '../../types'

// Re-export shared types that components need
export type {
  MetaField,
  MetaResponse,
  DateRangeType
} from '../../shared/types'

export {
  FILTER_OPERATORS,
  DATE_RANGE_OPTIONS,
  TIME_GRANULARITIES
} from '../../shared/types'

// ============================================================================
// Filter component prop types
// ============================================================================

export interface FilterBuilderProps {
  filters: Filter[]
  schema: import('../../shared/types').MetaResponse | null
  query: CubeQuery
  onFiltersChange: (filters: Filter[]) => void
  hideFieldSelector?: boolean // Hide the field selector (for universal time filters)
}

export interface FilterItemProps {
  filter: SimpleFilter
  index: number
  onFilterChange: (index: number, filter: SimpleFilter) => void
  onFilterRemove: (index: number) => void
  schema: import('../../shared/types').MetaResponse | null
  query: CubeQuery
  hideFieldSelector?: boolean // Hide the field selector (for read-only filters)
  hideOperatorSelector?: boolean // Hide the operator selector (for read-only filters)
  hideRemoveButton?: boolean // Hide the remove button (for read-only filters)
}

export interface FilterGroupProps {
  group: GroupFilter
  index: number
  onGroupChange: (index: number, group: GroupFilter) => void
  onGroupChangeWithUnwrap?: (index: number, group: GroupFilter) => void
  onGroupRemove: (index: number) => void
  schema: import('../../shared/types').MetaResponse | null
  query: CubeQuery
  depth: number
}

export interface FilterValueSelectorProps {
  fieldName: string
  operator: FilterOperator
  values: any[]
  onValuesChange: (values: any[]) => void
  schema: import('../../shared/types').MetaResponse | null
}

// ============================================================================
// Date range component prop types
// ============================================================================

export interface DateRangeFilter {
  id: string
  timeDimension: string
  rangeType: import('../../shared/types').DateRangeType
  startDate?: string
  endDate?: string
}

export interface DateRangeSelectorProps {
  timeDimensions: string[]
  onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void
  onDateRangeRemove: (timeDimension: string) => void
  currentDateRanges: Record<string, string | string[]>
}

export interface DateRangeFilterProps {
  timeDimensions: Array<{ dimension: string; granularity?: string; dateRange?: string | string[] }>
  onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void
  onDateRangeRemove: (timeDimension: string) => void
}
