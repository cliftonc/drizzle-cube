import { CubeQuery } from '../../types.js';
export interface UsePortletDeadMembersParams {
    queryObject: CubeQuery | null;
    /** The error from the last attempt, if it failed. */
    error: unknown;
}
export interface UsePortletDeadMembersResult {
    /** The query with dead members removed — the original when there are none. */
    query: CubeQuery | null;
    /** Members dropped so far, for the note shown above the chart. */
    droppedMembers: string[];
}
/**
 * Pull the prunable members out of a failed query, or `null` when the failure
 * is not one we may recover from.
 *
 * A single unknown *filter* member makes the whole error unrecoverable, even
 * alongside prunable ones: re-running without the dead columns would still
 * carry the dead filter.
 */
export declare function prunableMembers(error: unknown): string[] | null;
/** Remove members from everything that projects or orders by them. */
export declare function withoutMembers(query: CubeQuery, members: string[]): CubeQuery;
export declare function usePortletDeadMembers({ queryObject, error }: UsePortletDeadMembersParams): UsePortletDeadMembersResult;
