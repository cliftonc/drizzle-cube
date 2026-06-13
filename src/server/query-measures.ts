import type { DynamicMeasure, QueryMeasure, SemanticQuery } from './types'

export function isDynamicMeasure(measure: QueryMeasure | unknown): measure is DynamicMeasure {
  return !!measure && typeof measure === 'object' && !Array.isArray(measure)
}

export function getStaticMeasureNames(measures?: QueryMeasure[]): string[] {
  return (measures ?? []).filter((measure): measure is string => typeof measure === 'string')
}

export function getDynamicMeasures(measures?: QueryMeasure[]): DynamicMeasure[] {
  return (measures ?? []).filter(isDynamicMeasure)
}

export function splitQueryMeasures(measures?: QueryMeasure[]): {
  staticMeasures: string[]
  dynamicMeasures: DynamicMeasure[]
} {
  return {
    staticMeasures: getStaticMeasureNames(measures),
    dynamicMeasures: getDynamicMeasures(measures)
  }
}

export function stripDynamicMeasures(query: SemanticQuery): SemanticQuery {
  return {
    ...query,
    measures: getStaticMeasureNames(query.measures)
  }
}

export function getMeasureOutputKey(measure: QueryMeasure): string {
  return typeof measure === 'string' ? measure : measure.name
}

export function normalizeQueryMeasure(measure: QueryMeasure): QueryMeasure {
  if (typeof measure === 'string') {
    return measure
  }
  return {
    name: measure.name,
    formula: measure.formula,
    title: measure.title,
    format: measure.format
  }
}
