/**
 * Characterization tests for the pure mode-selection helpers that drive
 * AnalysisBuilder query execution (analysisQueryExecutionModes.ts).
 *
 * These pin the current mode-routing / skip-flag / output-gating behaviour so
 * the planned hooks regroup (#914) cannot silently change which mode runs or
 * which query is skipped. They exercise the public helper functions only.
 */

import { describe, it, expect } from 'vitest'
import {
  resolveActiveMode,
  computeSkipFlags,
  deriveModeOutputs,
  computeExecutionStatus,
  computeExecutionResults,
  type ModeFlags,
  type SkipFlagsInput,
  type ModeOutputsInput,
  type ExecutionStatusInput,
  type ExecutionResultsInput
} from '../../../src/client/hooks/analysisQueryExecutionModes'

// All flags off → single mode is the default/fallback.
const NO_FLAGS: ModeFlags = {
  isRetentionMode: false,
  isFlowMode: false,
  isFunnelMode: false,
  isMultiMode: false
}

describe('resolveActiveMode', () => {
  it('defaults to single mode when no flags are set', () => {
    expect(resolveActiveMode(NO_FLAGS)).toBe('single')
  })

  it('treats undefined flags the same as false (single mode)', () => {
    expect(
      resolveActiveMode({
        isRetentionMode: undefined,
        isFlowMode: undefined,
        isFunnelMode: undefined,
        isMultiMode: undefined
      })
    ).toBe('single')
  })

  it('selects each mode when only its flag is set', () => {
    expect(resolveActiveMode({ ...NO_FLAGS, isRetentionMode: true })).toBe('retention')
    expect(resolveActiveMode({ ...NO_FLAGS, isFlowMode: true })).toBe('flow')
    expect(resolveActiveMode({ ...NO_FLAGS, isFunnelMode: true })).toBe('funnel')
    expect(resolveActiveMode({ ...NO_FLAGS, isMultiMode: true })).toBe('multi')
  })

  it('honours the priority order retention > flow > funnel > multi when flags overlap', () => {
    // Every flag on → retention wins.
    expect(
      resolveActiveMode({
        isRetentionMode: true,
        isFlowMode: true,
        isFunnelMode: true,
        isMultiMode: true
      })
    ).toBe('retention')
    // Retention off → flow wins.
    expect(
      resolveActiveMode({
        isRetentionMode: false,
        isFlowMode: true,
        isFunnelMode: true,
        isMultiMode: true
      })
    ).toBe('flow')
    // Retention + flow off → funnel wins.
    expect(
      resolveActiveMode({
        isRetentionMode: false,
        isFlowMode: false,
        isFunnelMode: true,
        isMultiMode: true
      })
    ).toBe('funnel')
    // Only multi left → multi wins.
    expect(
      resolveActiveMode({
        isRetentionMode: false,
        isFlowMode: false,
        isFunnelMode: false,
        isMultiMode: true
      })
    ).toBe('multi')
  })
})

// A valid single-query session with every other mode off and no server queries.
// From this baseline only the `single` hook should be live.
const SINGLE_BASE: SkipFlagsInput = {
  isValidQuery: true,
  isSingleMode: true,
  isMultiMode: false,
  isFunnelMode: false,
  isFlowMode: false,
  isRetentionMode: false,
  hasMultiQueryConfig: false,
  hasFunnelConfig: false,
  hasServerFunnelQuery: false,
  hasServerFlowQuery: false,
  hasServerRetentionQuery: false
}

describe('computeSkipFlags', () => {
  it('runs only the single hook for a valid single-mode query', () => {
    const flags = computeSkipFlags(SINGLE_BASE)
    expect(flags.single).toBe(false)
    expect(flags.multi).toBe(true)
    expect(flags.funnel).toBe(true)
    expect(flags.flow).toBe(true)
    expect(flags.retention).toBe(true)
  })

  it('skips the single hook when the query is invalid', () => {
    expect(computeSkipFlags({ ...SINGLE_BASE, isValidQuery: false }).single).toBe(true)
  })

  it('runs only the multi hook when multi mode has a config', () => {
    const flags = computeSkipFlags({
      ...SINGLE_BASE,
      isSingleMode: false,
      isMultiMode: true,
      hasMultiQueryConfig: true
    })
    expect(flags.multi).toBe(false)
    expect(flags.single).toBe(true)
    expect(flags.funnel).toBe(true)
    expect(flags.flow).toBe(true)
    expect(flags.retention).toBe(true)
  })

  it('skips multi when in multi mode but no config is built yet', () => {
    expect(
      computeSkipFlags({
        ...SINGLE_BASE,
        isSingleMode: false,
        isMultiMode: true,
        hasMultiQueryConfig: false
      }).multi
    ).toBe(true)
  })

  it('runs the funnel hook when funnel mode has either a funnel config or a server query', () => {
    const base = { ...SINGLE_BASE, isSingleMode: false, isFunnelMode: true }
    expect(computeSkipFlags({ ...base, hasFunnelConfig: true }).funnel).toBe(false)
    expect(computeSkipFlags({ ...base, hasServerFunnelQuery: true }).funnel).toBe(false)
    // Funnel mode but neither config nor server query → still skipped.
    expect(computeSkipFlags(base).funnel).toBe(true)
  })

  it('runs flow / retention only when their server query exists', () => {
    const flowBase = { ...SINGLE_BASE, isSingleMode: false, isFlowMode: true }
    expect(computeSkipFlags(flowBase).flow).toBe(true)
    expect(computeSkipFlags({ ...flowBase, hasServerFlowQuery: true }).flow).toBe(false)

    const retBase = { ...SINGLE_BASE, isSingleMode: false, isRetentionMode: true }
    expect(computeSkipFlags(retBase).retention).toBe(true)
    expect(computeSkipFlags({ ...retBase, hasServerRetentionQuery: true }).retention).toBe(false)
  })

  it('runs the dry-run hook only for a valid single/multi query, never for funnel/flow/retention', () => {
    expect(computeSkipFlags(SINGLE_BASE).dryRun).toBe(false)
    expect(computeSkipFlags({ ...SINGLE_BASE, isValidQuery: false }).dryRun).toBe(true)
    expect(computeSkipFlags({ ...SINGLE_BASE, isFunnelMode: true }).dryRun).toBe(true)
    expect(computeSkipFlags({ ...SINGLE_BASE, isFlowMode: true }).dryRun).toBe(true)
    expect(computeSkipFlags({ ...SINGLE_BASE, isRetentionMode: true }).dryRun).toBe(true)
  })
})

// Distinct sentinel values per field so we can assert exact pass-through / gating.
const OUTPUTS_BASE: ModeOutputsInput<string, string, string, string, string, string, string> = {
  isFunnelMode: false,
  isFlowMode: false,
  isRetentionMode: false,
  funnelExecutedQueries: ['fq1'],
  funnelServerQuery: 'funnel-server',
  funnelDebugData: 'funnel-debug',
  flowServerQuery: 'flow-server',
  flowData: 'flow-chart',
  flowDebugData: 'flow-debug',
  retentionServerQuery: 'retention-server',
  retentionChartData: 'retention-chart',
  retentionDebugData: 'retention-debug'
}

describe('deriveModeOutputs', () => {
  it('nulls every mode-specific output when no mode is active', () => {
    const out = deriveModeOutputs(OUTPUTS_BASE)
    expect(out).toEqual({
      funnelExecutedQueries: null,
      funnelServerQuery: null,
      funnelDebugData: null,
      flowServerQuery: null,
      flowChartData: null,
      flowDebugData: null,
      retentionServerQuery: null,
      retentionChartData: null,
      retentionDebugData: null
    })
  })

  it('surfaces only funnel outputs in funnel mode', () => {
    const out = deriveModeOutputs({ ...OUTPUTS_BASE, isFunnelMode: true })
    expect(out.funnelExecutedQueries).toEqual(['fq1'])
    expect(out.funnelServerQuery).toBe('funnel-server')
    expect(out.funnelDebugData).toBe('funnel-debug')
    expect(out.flowServerQuery).toBeNull()
    expect(out.retentionServerQuery).toBeNull()
  })

  it('nulls funnelExecutedQueries when the list is empty even in funnel mode', () => {
    expect(
      deriveModeOutputs({ ...OUTPUTS_BASE, isFunnelMode: true, funnelExecutedQueries: [] })
        .funnelExecutedQueries
    ).toBeNull()
  })

  it('surfaces only flow outputs in flow mode and maps flowData to flowChartData', () => {
    const out = deriveModeOutputs({ ...OUTPUTS_BASE, isFlowMode: true })
    expect(out.flowServerQuery).toBe('flow-server')
    expect(out.flowChartData).toBe('flow-chart')
    expect(out.flowDebugData).toBe('flow-debug')
    expect(out.funnelServerQuery).toBeNull()
    expect(out.retentionServerQuery).toBeNull()
  })

  it('surfaces only retention outputs in retention mode', () => {
    const out = deriveModeOutputs({ ...OUTPUTS_BASE, isRetentionMode: true })
    expect(out.retentionServerQuery).toBe('retention-server')
    expect(out.retentionChartData).toBe('retention-chart')
    expect(out.retentionDebugData).toBe('retention-debug')
    expect(out.funnelServerQuery).toBeNull()
    expect(out.flowServerQuery).toBeNull()
  })
})

// A valid query that has settled with nothing outstanding → idle.
const STATUS_BASE: ExecutionStatusInput = {
  hasResults: false,
  initialData: undefined,
  isValidQuery: true,
  isLoading: false,
  isFetching: false,
  error: null
}

describe('computeExecutionStatus', () => {
  it('returns idle for a valid query with no activity and no results', () => {
    expect(computeExecutionStatus(STATUS_BASE)).toBe('idle')
  })

  it('returns idle for an invalid query', () => {
    expect(computeExecutionStatus({ ...STATUS_BASE, isValidQuery: false })).toBe('idle')
  })

  it('shows seeded initialData as success, taking precedence even over an invalid query', () => {
    expect(
      computeExecutionStatus({
        ...STATUS_BASE,
        isValidQuery: false,
        initialData: [{ a: 1 }],
        hasResults: false
      })
    ).toBe('success')
  })

  it('returns loading while fetching the first results', () => {
    expect(computeExecutionStatus({ ...STATUS_BASE, isLoading: true, hasResults: false })).toBe('loading')
  })

  it('returns refreshing when refetching while previous results are shown', () => {
    expect(computeExecutionStatus({ ...STATUS_BASE, isFetching: true, hasResults: true })).toBe('refreshing')
  })

  it('prefers refreshing over error when a background refetch has stale results', () => {
    expect(
      computeExecutionStatus({
        ...STATUS_BASE,
        isFetching: true,
        hasResults: true,
        error: new Error('boom')
      })
    ).toBe('refreshing')
  })

  it('returns error when the query failed with no in-flight refetch', () => {
    expect(computeExecutionStatus({ ...STATUS_BASE, error: new Error('boom') })).toBe('error')
  })

  it('returns success once results are settled', () => {
    expect(computeExecutionStatus({ ...STATUS_BASE, hasResults: true })).toBe('success')
  })
})

// No mode active and no data anywhere → the cascade bottoms out at null.
const RESULTS_BASE: ExecutionResultsInput = {
  isRetentionMode: false,
  isFlowMode: false,
  isFunnelMode: false,
  isMultiMode: false,
  retentionChartData: null,
  flowData: null,
  funnelChartData: null,
  multiData: null,
  singleRawData: null,
  initialData: undefined
}

describe('computeExecutionResults', () => {
  it('returns null when no mode has data and there is no initialData', () => {
    expect(computeExecutionResults(RESULTS_BASE)).toBeNull()
  })

  it('transforms retention chart rows into flat Retention.* records', () => {
    const out = computeExecutionResults({
      ...RESULTS_BASE,
      isRetentionMode: true,
      retentionChartData: {
        rows: [
          { period: 0, retentionRate: 0.45, retainedUsers: 45, cohortSize: 100, breakdownValue: 'US' },
          { period: 1, retentionRate: 0.3, retainedUsers: 30, cohortSize: 100, breakdownValue: null }
        ]
      }
    })
    expect(out).toEqual([
      { 'Retention.period': 'P0', 'Retention.rate': 0.45, 'Retention.retained': 45, 'Retention.cohortSize': 100, 'Retention.segment': 'US' },
      { 'Retention.period': 'P1', 'Retention.rate': 0.3, 'Retention.retained': 30, 'Retention.cohortSize': 100, 'Retention.segment': 'All Users' }
    ])
  })

  it('wraps flow chart data in a single-element array', () => {
    const flow = { nodes: [], links: [] }
    expect(computeExecutionResults({ ...RESULTS_BASE, isFlowMode: true, flowData: flow })).toEqual([flow])
  })

  it('passes funnel and multi chart data through unchanged', () => {
    const funnel = [{ step: 'a' }]
    expect(computeExecutionResults({ ...RESULTS_BASE, isFunnelMode: true, funnelChartData: funnel })).toBe(funnel)
    const multi = [{ q: 1 }]
    expect(computeExecutionResults({ ...RESULTS_BASE, isMultiMode: true, multiData: multi })).toBe(multi)
  })

  it('falls through to single raw data, then initialData, in priority order', () => {
    const single = [{ row: 1 }]
    expect(computeExecutionResults({ ...RESULTS_BASE, singleRawData: single })).toBe(single)

    const initial = [{ seed: 1 }]
    expect(computeExecutionResults({ ...RESULTS_BASE, initialData: initial })).toBe(initial)
  })

  it('falls through to lower-priority data when the active mode has none yet', () => {
    // Retention mode is active but its data has not arrived; single results exist.
    const single = [{ row: 1 }]
    expect(
      computeExecutionResults({
        ...RESULTS_BASE,
        isRetentionMode: true,
        retentionChartData: null,
        singleRawData: single
      })
    ).toBe(single)
  })
})
