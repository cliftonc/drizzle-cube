import { CubeQuery, Filter } from '../types.js';
/**
 * Clean query object by removing empty arrays.
 *
 * Leaf helper kept here (rather than in shared/utils.ts) so that
 * `transformQueryForUIImpl` can use it without creating an import cycle back
 * into utils.ts. Re-exported from utils.ts to keep existing import paths stable.
 */
export declare function cleanQuery(query: CubeQuery): CubeQuery;
/**
 * Transform a single filter from server/API format to UI format.
 * Converts {and: [...]} / {or: [...]} to {type, filters} GroupFilter shape and
 * recurses; passes simple filters through unchanged.
 */
export declare function transformFilterFromServer(filter: any): Filter | null | undefined;
/**
 * Transform a Cube.js query from external format to UI internal format.
 * Handles format differences between server/API queries and QueryBuilder state.
 */
export declare function transformQueryForUIImpl(query: any, transformFiltersFromServer: (filters: any[]) => Filter[]): CubeQuery;
