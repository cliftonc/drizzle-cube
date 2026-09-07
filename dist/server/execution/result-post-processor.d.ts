import { SemanticQuery } from '../types/index.js';
import { DatabaseAdapter } from '../adapters/base-adapter.js';
/**
 * Normalise time-dimension values in result rows and apply gap filling.
 *
 * @param data Raw rows from the database executor
 * @param query The semantic query (for timeDimensions + measures)
 * @param databaseAdapter Adapter used to convert engine-specific date results
 */
export declare function postProcessResultRows(data: unknown, query: SemanticQuery, databaseAdapter: DatabaseAdapter): Record<string, unknown>[];
