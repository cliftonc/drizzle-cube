export { buildCTEState } from './cte-processor.js'
export { buildModifiedSelections } from './selection-processor.js'
export { applyJoins } from './joins-processor.js'
export { applyPredicatesAndFinalize } from './predicates-processor.js'
export { buildKeysDeduplicationQuery } from './keys-dedup-processor.js'
export { buildMultiFactMergeQuery } from './multi-fact-processor.js'
export type {
  PhysicalBuildDependencies,
  CTEBuildState,
  JoinBuildState,
  SelectionMap,
  DownstreamJoinState
} from './shared.js'
export { getCubesFromPlan } from './shared.js'
