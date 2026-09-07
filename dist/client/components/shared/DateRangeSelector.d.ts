import { default as React } from 'react';
interface DateRangeSelectorProps {
    timeDimension: string;
    availableTimeDimensions: string[];
    currentDateRange?: string | string[];
    onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void;
    onTimeDimensionChange: (oldTimeDimension: string, newTimeDimension: string) => void;
    onRemove: (timeDimension: string) => void;
    hideFieldSelector?: boolean;
    hideRemoveButton?: boolean;
}
declare const DateRangeSelector: React.FC<DateRangeSelectorProps>;
export default DateRangeSelector;
