import { CubeQuery, FilterOperator, Filter, SimpleFilter, GroupFilter } from '../../types.js';
export type { MetaField, MetaResponse, DateRangeType } from '../../shared/types.js';
export { FILTER_OPERATORS, DATE_RANGE_OPTIONS, TIME_GRANULARITIES } from '../../shared/types.js';
export interface FilterBuilderProps {
    filters: Filter[];
    schema: import('../../shared/types.js').MetaResponse | null;
    query: CubeQuery;
    onFiltersChange: (filters: Filter[]) => void;
    hideFieldSelector?: boolean;
}
export interface FilterItemProps {
    filter: SimpleFilter;
    index: number;
    onFilterChange: (index: number, filter: SimpleFilter) => void;
    onFilterRemove: (index: number) => void;
    schema: import('../../shared/types.js').MetaResponse | null;
    query: CubeQuery;
    hideFieldSelector?: boolean;
    hideOperatorSelector?: boolean;
    hideRemoveButton?: boolean;
}
export interface FilterGroupProps {
    group: GroupFilter;
    index: number;
    onGroupChange: (index: number, group: GroupFilter) => void;
    onGroupChangeWithUnwrap?: (index: number, group: GroupFilter) => void;
    onGroupRemove: (index: number) => void;
    schema: import('../../shared/types.js').MetaResponse | null;
    query: CubeQuery;
    depth: number;
}
export interface FilterValueSelectorProps {
    fieldName: string;
    operator: FilterOperator;
    values: any[];
    onValuesChange: (values: any[]) => void;
    schema: import('../../shared/types.js').MetaResponse | null;
}
export interface DateRangeFilter {
    id: string;
    timeDimension: string;
    rangeType: import('../../shared/types.js').DateRangeType;
    startDate?: string;
    endDate?: string;
}
export interface DateRangeSelectorProps {
    timeDimensions: string[];
    onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void;
    onDateRangeRemove: (timeDimension: string) => void;
    currentDateRanges: Record<string, string | string[]>;
}
export interface DateRangeFilterProps {
    timeDimensions: Array<{
        dimension: string;
        granularity?: string;
        dateRange?: string | string[];
    }>;
    onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void;
    onDateRangeRemove: (timeDimension: string) => void;
}
