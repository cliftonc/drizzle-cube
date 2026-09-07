/**
 * Co-located data-shaping helpers for RadarChart. The component supports a
 * config-driven format and a legacy auto-detection format; both branches are
 * isolated here so the component body stays focused on rendering. Pure
 * extraction — no behaviour change.
 */
export interface RadarShape {
    radarData: any[];
    seriesKeys: string[];
    /** True when no numeric value fields could be found (legacy auto-detect). */
    noNumericFields?: boolean;
}
/** Shape rows for the radar chart via config-driven or legacy auto-detection. */
export declare function buildRadarData(data: any[], chartConfig: any, queryObject: any): RadarShape;
