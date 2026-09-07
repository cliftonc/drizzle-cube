/**
 * Helpers for `formatTimeValue` — parsing timestamp strings and formatting
 * them by known or inferred granularity. Split out of chartUtils to keep
 * each unit small.
 */
/**
 * Components of a parsed UTC timestamp used for granularity formatting.
 */
export interface TimestampParts {
    date: Date;
    year: number;
    month: string;
    day: string;
    hours: number;
    minutes: number;
}
/**
 * Parse a timestamp string (ISO or PostgreSQL format) into UTC parts.
 * Returns null if the string isn't a recognizable timestamp or is invalid.
 */
export declare function parseTimestampParts(str: string): TimestampParts | null;
/**
 * Format parsed timestamp parts using an explicit granularity.
 * Returns null for an unknown granularity so the caller can fall back to the
 * heuristic formatter.
 */
export declare function formatByGranularity(parts: TimestampParts, granularity: string): string | null;
/**
 * Infer a display string for parsed timestamp parts when no explicit
 * granularity is known, based on which time components are non-zero.
 */
export declare function formatByHeuristic(parts: TimestampParts): string;
