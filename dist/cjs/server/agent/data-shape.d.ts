/**
 * Data-shape summary for the agent's `execute_query` results.
 *
 * The agent used to receive every row and no summary, so it chose a chart type
 * blind and then spent its context — and its output-token budget — on raw data.
 * A per-field summary is what the chart decision actually needs: how many
 * distinct categories there are, and whether measures share a scale.
 */
/** How many rows of the result set are handed back to the model. */
export declare const AGENT_RESULT_ROW_LIMIT = 25;
/** Per-field summary of a query result. */
export interface FieldShape {
    field: string;
    kind: 'measure' | 'dimension' | 'timeDimension';
    type?: string;
    /** Distinct non-null values seen. Capped at the rows inspected. */
    distinctCount: number;
    nullCount: number;
    /** Numeric range, present only when every non-null value is a number. */
    min?: number;
    max?: number;
}
interface ResultAnnotation {
    measures?: Record<string, {
        type?: string;
    }>;
    dimensions?: Record<string, {
        type?: string;
    }>;
    timeDimensions?: Record<string, {
        type?: string;
    }>;
}
/**
 * Build a per-field summary of a query result.
 *
 * Computed from the rows handed to the model, so `distinctCount` is a floor
 * rather than an exact count when the result was truncated.
 */
export declare function summariseDataShape(rows: Record<string, unknown>[], annotation: ResultAnnotation | undefined): FieldShape[];
export {};
