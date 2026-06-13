/**
 * ModeRouter — resolves which execution mode a query uses (regular, comparison,
 * funnel, flow, retention) and validates the query for that mode.
 *
 * Extracted from QueryExecutor. Holds references to the analysis query builders
 * so it can detect each mode and validate its config.
 */

import type { Cube, SemanticQuery } from '../types'
import { safeKey } from '../cube-utils'
import { validateQueryAgainstCubes } from '../query-validator'
import type { ComparisonQueryBuilder } from '../builders/comparison-query-builder'
import type { FunnelQueryBuilder } from '../builders/funnel-query-builder'
import type { FlowQueryBuilder } from '../builders/flow-query-builder'
import type { RetentionQueryBuilder } from '../builders/retention-query-builder'
import { t } from '../../i18n/runtime'

export type QueryExecutionMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention'

export interface ModeRouterBuilders {
  comparison: ComparisonQueryBuilder
  funnel: FunnelQueryBuilder
  flow: FlowQueryBuilder
  retention: RetentionQueryBuilder
}

export class ModeRouter {
  constructor(private readonly builders: ModeRouterBuilders) {}

  /**
   * Resolve the single active execution mode for a query.
   * Throws if more than one analysis mode is present.
   */
  resolveMode(query: SemanticQuery): QueryExecutionMode {
    const activeModes: QueryExecutionMode[] = []

    if (this.builders.comparison.hasComparison(query)) {
      activeModes.push('comparison')
    }
    if (this.builders.funnel.hasFunnel(query)) {
      activeModes.push('funnel')
    }
    if (this.builders.flow.hasFlow(query)) {
      activeModes.push('flow')
    }
    if (this.builders.retention.hasRetention(query)) {
      activeModes.push('retention')
    }

    if (activeModes.length === 0) {
      return 'regular'
    }

    if (activeModes.length > 1) {
      throw new Error(t('server.errors.queryContainsMultipleModes', { modes: activeModes.join(', ') }))
    }

    return activeModes[0]
  }

  /**
   * Validate a query for its resolved mode. Throws a translated error on failure.
   */
  validateForMode(
    mode: QueryExecutionMode,
    cubes: Map<string, Cube>,
    query: SemanticQuery
  ): void {
    const validateStandard = () => {
      const validation = validateQueryAgainstCubes(cubes, query)
      if (!validation.isValid) {
        throw new Error(t('server.errors.queryValidationFailed', { errors: validation.errors.join(', ') }))
      }
    }

    const validators: Record<QueryExecutionMode, () => void> = {
      regular: validateStandard,
      comparison: validateStandard,
      funnel: () => {
        const validation = this.builders.funnel.validateConfig(query.funnel!, cubes)
        if (!validation.isValid) {
          throw new Error(t('server.errors.funnelValidationFailed', { errors: validation.errors.join(', ') }))
        }
      },
      flow: () => {
        const validation = this.builders.flow.validateConfig(query.flow!, cubes)
        if (!validation.isValid) {
          throw new Error(t('server.errors.flowValidationFailed', { errors: validation.errors.join(', ') }))
        }
      },
      retention: () => {
        const validation = this.builders.retention.validateConfig(query.retention!, cubes)
        if (!validation.isValid) {
          throw new Error(t('server.errors.retentionValidationFailed', { errors: validation.errors.join(', ') }))
        }
      }
    }

    validators[safeKey(mode) as QueryExecutionMode]()
  }
}
