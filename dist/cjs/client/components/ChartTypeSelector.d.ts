import { ChartType } from '../types.js';
import { ChartAvailabilityMap } from '../shared/chartDefaults.js';
interface ChartTypeSelectorProps {
    selectedType: ChartType;
    onTypeChange: (type: ChartType) => void;
    className?: string;
    /** Compact mode for narrow containers - uses 2 columns and constrains width */
    compact?: boolean;
    /** Map of chart type availability - when provided, unavailable charts are disabled */
    availability?: ChartAvailabilityMap;
    /** Chart types to exclude from the list (e.g., ['funnel'] to hide funnel in query mode) */
    excludeTypes?: ChartType[];
}
export default function ChartTypeSelector({ selectedType, onTypeChange, className, compact, availability, excludeTypes }: ChartTypeSelectorProps): import("react").JSX.Element;
export {};
