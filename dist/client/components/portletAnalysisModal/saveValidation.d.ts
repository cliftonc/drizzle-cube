/**
 * Save-time validation helpers for PortletAnalysisModal, extracted to keep
 * the save handler flat.
 */
/** True if a (possibly multi/funnel/flow/retention) query has content worth saving. */
export declare function analysisConfigHasContent(query: any): boolean;
/** Alert message shown when a query of the given analysis type has no content. */
export declare function getEmptyContentMessage(analysisType: string): string;
