/**
 * GitHub-flavored markdown summary, used for both the Actions job summary
 * (GITHUB_STEP_SUMMARY) and the sticky PR comment.
 */

import type { PerfReport } from '../types'
import { categoriesOf } from './console'

export function buildMarkdownSummary(report: PerfReport): string {
  const { meta, results } = report
  const lines: string[] = []

  lines.push('## ⚡ Performance benchmarks')
  lines.push('')
  const datasets = Object.entries(meta.rowCounts)
    .map(([table, count]) => `${table} ${count.toLocaleString()}`)
    .join(' · ')
  lines.push(`\`${meta.gitSha}\` · node ${meta.node} · data v${meta.dataVersion} · median of ${meta.iterations} iterations (+${meta.warmup} warmup) · ${(meta.totalDurationMs / 1000).toFixed(1)}s total`)
  lines.push('')
  lines.push(`Dataset: ${datasets}`)
  lines.push('')
  lines.push('> Timings come from shared CI runners and vary 2-3x between runs — compare trends, not single runs.')
  lines.push('')

  for (const category of categoriesOf(results)) {
    lines.push(`### ${category}`)
    lines.push('')
    lines.push('| Benchmark | Median | p95 | Rows |')
    lines.push('|---|---:|---:|---:|')
    for (const result of results.filter(r => r.category === category)) {
      if (result.error) {
        lines.push(`| ${result.name} | ⚠️ error | — | — |`)
      } else {
        lines.push(`| ${result.name} | ${result.stats.median.toFixed(1)}ms | ${result.stats.p95.toFixed(1)}ms | ${result.rows.toLocaleString()} |`)
      }
    }
    lines.push('')
  }

  const failed = results.filter(r => r.error)
  if (failed.length > 0) {
    lines.push('### Errors')
    lines.push('')
    for (const result of failed) {
      lines.push(`- **${result.id}**: ${result.error}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
