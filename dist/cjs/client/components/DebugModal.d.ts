import { FlowChartData } from '../types/flow.js';
import { RetentionChartData } from '../types/retention.js';
interface DebugModalProps {
    chartConfig: any;
    displayConfig: any;
    queryObject: any;
    data: any[] | FlowChartData | RetentionChartData;
    chartType: string;
    cacheInfo?: {
        hit: true;
        cachedAt: string;
        ttlMs: number;
        ttlRemainingMs: number;
    } | null;
}
export default function DebugModal({ chartConfig, displayConfig, queryObject, data, chartType, cacheInfo }: DebugModalProps): import("react").JSX.Element;
export {};
