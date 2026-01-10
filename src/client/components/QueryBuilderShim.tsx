/**
 * QueryBuilder Shim
 *
 * Backward compatibility wrapper that provides the QueryBuilder interface
 * while using AnalysisBuilder internally.
 *
 * This allows existing code importing QueryBuilder to seamlessly use the new
 * AnalysisBuilder component without any code changes.
 */
import { forwardRef, useImperativeHandle, useRef } from 'react'
import AnalysisBuilder from './AnalysisBuilder'
import type { AnalysisBuilderRef } from './AnalysisBuilder/types'
import type { QueryBuilderProps, QueryBuilderRef } from './QueryBuilder/types'

const QueryBuilderShim = forwardRef<QueryBuilderRef, QueryBuilderProps>(
  (props, ref) => {
    const analysisBuilderRef = useRef<AnalysisBuilderRef>(null)

    // Map QueryBuilder ref interface to AnalysisBuilder ref
    useImperativeHandle(ref, () => ({
      getCurrentQuery: () => {
        const config = analysisBuilderRef.current?.getQueryConfig()
        if (!config) {
          return { measures: [], dimensions: [] }
        }
        // If funnel query, return empty query for backward compatibility
        // (QueryBuilder interface doesn't support funnel mode)
        if ('funnel' in config) {
          return { measures: [], dimensions: [] }
        }
        // If multi-query, return first query for backward compatibility
        if ('queries' in config) {
          return config.queries[0] || { measures: [], dimensions: [] }
        }
        return config
      },

      getValidationState: () => {
        // AnalysisBuilder doesn't expose validation state
        // Return a basic "valid" state since AnalysisBuilder auto-validates
        return {
          status: 'valid' as const
        }
      },

      getValidationResult: () => {
        // AnalysisBuilder doesn't expose validation results
        // Return null as it's an optional field
        return null
      }
    }), [])

    // Map QueryBuilder props to AnalysisBuilder props
    return (
      <AnalysisBuilder
        ref={analysisBuilderRef}
        className={props.className}
        initialQuery={props.initialQuery}
        disableLocalStorage={props.disableLocalStorage}
        hideSettings={props.hideSettings}
        // Note: enableSharing and onShare props are not supported by AnalysisBuilder
        // The AnalysisBuilder has its own sharing mechanism
      />
    )
  }
)

QueryBuilderShim.displayName = 'QueryBuilder'

export default QueryBuilderShim
