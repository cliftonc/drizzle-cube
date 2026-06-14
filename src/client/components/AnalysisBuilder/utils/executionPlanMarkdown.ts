/**
 * executionPlanMarkdown
 *
 * Pure helpers that render a QueryAnalysis (+ optional query/SQL) as a markdown
 * document. Extracted from AnalysisResultsPanel and split into per-section
 * builders to keep each function flat. Output is identical to the previous
 * single-function implementation.
 */

import type { CubeQuery } from '../../../types'
import type { QueryAnalysis } from '../../../shared/types'

type Lines = string[]

function pushCubeQuery(lines: Lines, query: CubeQuery | null): void {
  if (!query) return
  lines.push('## Cube Query')
  lines.push('')
  lines.push('```json')
  lines.push(JSON.stringify(query, null, 2))
  lines.push('```')
  lines.push('')
}

function pushQuerySummary(lines: Lines, analysis: QueryAnalysis): void {
  lines.push('## Query Summary')
  lines.push('')
  lines.push(`- **Cubes:** ${analysis.cubesInvolved.join(', ')}`)
  lines.push(`- **Query Type:** ${analysis.querySummary.queryType.replace(/_/g, ' ')}`)
  lines.push(`- **Joins:** ${analysis.querySummary.joinCount}`)
  lines.push(`- **CTEs:** ${analysis.querySummary.cteCount}`)
  lines.push('')
}

function pushPrimaryCube(lines: Lines, analysis: QueryAnalysis): void {
  lines.push('## Primary Cube Selection')
  lines.push('')
  lines.push(`**Selected:** ${analysis.primaryCube.selectedCube}`)
  lines.push(`**Reason:** ${analysis.primaryCube.reason.replace(/_/g, ' ')}`)
  lines.push(`**Explanation:** ${analysis.primaryCube.explanation}`)
  lines.push('')

  const candidates = analysis.primaryCube.candidates
  if (candidates && candidates.length > 1) {
    lines.push('### Candidates Considered')
    lines.push('')
    lines.push('| Cube | Dimensions | Joins | Can Reach All |')
    lines.push('|------|------------|-------|---------------|')
    for (const c of candidates) {
      const selected = c.cubeName === analysis.primaryCube.selectedCube ? ' ✓' : ''
      lines.push(`| ${c.cubeName}${selected} | ${c.dimensionCount} | ${c.joinCount} | ${c.canReachAll ? 'Yes' : 'No'} |`)
    }
    lines.push('')
  }
}

function pushPathSelection(
  lines: Lines,
  analysis: QueryAnalysis,
  selection: NonNullable<QueryAnalysis['joinPaths'][number]['selection']>
): void {
  lines.push(`**Selection strategy:** ${selection.strategy}`)
  if (typeof selection.selectedRank === 'number') {
    lines.push(`**Selected rank:** #${selection.selectedRank}`)
  }
  if (typeof selection.selectedScore === 'number') {
    lines.push(`**Selected score:** ${selection.selectedScore}`)
  }
  if (selection.preferredCubes && selection.preferredCubes.length > 0) {
    lines.push(`**Preferred cubes:** ${selection.preferredCubes.join(', ')}`)
  }
  if (selection.candidates && selection.candidates.length > 0) {
    lines.push('**Path scoring candidates:**')
    for (const candidate of selection.candidates.slice(0, 5)) {
      const candidatePath = candidate.path.length > 0
        ? `${candidate.path[0].fromCube} → ${candidate.path.map(step => step.toCube).join(' → ')}`
        : analysis.primaryCube.selectedCube
      lines.push(
        `- #${candidate.rank} score=${candidate.score} `
        + `(preferredJoin=${candidate.scoreBreakdown.preferredJoinBonus}, `
        + `preferredCube=${candidate.scoreBreakdown.preferredCubeBonus}, `
        + `lengthPenalty=${candidate.scoreBreakdown.lengthPenalty}) `
        + `${candidatePath}`
      )
    }
  }
  lines.push('')
}

type JoinPath = QueryAnalysis['joinPaths'][number]

function pushFoundJoinPath(lines: Lines, analysis: QueryAnalysis, jp: JoinPath): void {
  lines.push(`### ${analysis.primaryCube.selectedCube} → ${jp.targetCube} (${jp.pathLength} step${jp.pathLength !== 1 ? 's' : ''})`)
  lines.push('')
  if (jp.selection) {
    pushPathSelection(lines, analysis, jp.selection)
  }
  for (const step of jp.path ?? []) {
    lines.push(`- **${step.fromCube}** → **${step.toCube}** (${step.relationship}, ${step.joinType.toUpperCase()} JOIN)`)
    for (const col of step.joinColumns) {
      lines.push(`  - \`${col.sourceColumn}\` = \`${col.targetColumn}\``)
    }
  }
  lines.push('')
}

function pushMissingJoinPath(lines: Lines, analysis: QueryAnalysis, jp: JoinPath): void {
  lines.push(`### ${analysis.primaryCube.selectedCube} → ${jp.targetCube}`)
  lines.push('')
  lines.push(`❌ **No path found**${jp.error ? `: ${jp.error}` : ''}`)
  if (jp.visitedCubes && jp.visitedCubes.length > 0) {
    lines.push(`Cubes visited: ${jp.visitedCubes.join(' → ')}`)
  }
  lines.push('')
}

function pushJoinPaths(lines: Lines, analysis: QueryAnalysis): void {
  if (analysis.joinPaths.length === 0) return
  lines.push('## Join Paths')
  lines.push('')
  for (const jp of analysis.joinPaths) {
    if (jp.pathFound && jp.path) {
      pushFoundJoinPath(lines, analysis, jp)
    } else if (!jp.pathFound) {
      pushMissingJoinPath(lines, analysis, jp)
    }
  }
}

function pushPreAggregations(lines: Lines, analysis: QueryAnalysis): void {
  if (analysis.preAggregations.length === 0) return
  lines.push('## Pre-Aggregation CTEs')
  lines.push('')
  for (const cte of analysis.preAggregations) {
    lines.push(`### ${cte.cubeName} (\`${cte.cteAlias}\`)`)
    lines.push('')
    lines.push(`**Reason:** ${cte.reason}`)
    lines.push(`**Measures:** ${cte.measures.join(', ')}`)
    if (cte.joinKeys.length > 0) {
      lines.push('**Join Keys:**')
      for (const jk of cte.joinKeys) {
        lines.push(`- \`${jk.sourceColumn}\` = \`${jk.targetColumn}\``)
      }
    }
    lines.push('')
  }
}

function pushWarnings(lines: Lines, analysis: QueryAnalysis): void {
  if (!analysis.warnings || analysis.warnings.length === 0) return
  lines.push('## ⚠️ Warnings')
  lines.push('')
  for (const warning of analysis.warnings) {
    lines.push(`- ${warning}`)
  }
  lines.push('')
}

function pushGeneratedSql(lines: Lines, sql?: { sql: string } | null): void {
  if (!sql?.sql) return
  lines.push('## Generated SQL')
  lines.push('')
  lines.push('```sql')
  lines.push(sql.sql)
  lines.push('```')
}

/**
 * Generate markdown representation of query execution plan.
 */
export function generateExecutionPlanMarkdown(
  analysis: QueryAnalysis,
  query: CubeQuery | null,
  sql?: { sql: string } | null
): string {
  const lines: Lines = []

  lines.push('# Query Execution Plan')
  lines.push('')

  pushCubeQuery(lines, query)
  pushQuerySummary(lines, analysis)
  pushPrimaryCube(lines, analysis)
  pushJoinPaths(lines, analysis)
  pushPreAggregations(lines, analysis)
  pushWarnings(lines, analysis)
  pushGeneratedSql(lines, sql)

  return lines.join('\n')
}
