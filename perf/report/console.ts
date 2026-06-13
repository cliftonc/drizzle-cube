import type { PerfReport } from '../types'

export function printConsoleSummary(report: PerfReport): void {
  const { meta, results } = report

  console.log('')
  console.log('='.repeat(78))
  console.log('  drizzle-cube performance benchmarks')
  console.log('='.repeat(78))
  console.log(`  commit ${meta.gitSha} · node ${meta.node} · data v${meta.dataVersion} · ${meta.iterations} iterations (+${meta.warmup} warmup)`)
  const datasets = Object.entries(meta.rowCounts)
    .map(([table, count]) => `${table}: ${count.toLocaleString()}`)
    .join(', ')
  console.log(`  dataset  ${datasets}`)
  console.log('')

  const header = `  ${'benchmark'.padEnd(44)} ${'median'.padStart(9)} ${'p95'.padStart(9)} ${'rows'.padStart(8)}`
  for (const category of categoriesOf(results)) {
    console.log(`  ${category}`)
    console.log(header)
    console.log(`  ${'-'.repeat(74)}`)
    for (const result of results.filter(r => r.category === category)) {
      if (result.error) {
        console.log(`  ${result.name.padEnd(44)} ERROR: ${result.error}`)
      } else {
        console.log(
          `  ${result.name.padEnd(44)} ${formatMs(result.stats.median).padStart(9)} ${formatMs(result.stats.p95).padStart(9)} ${String(result.rows).padStart(8)}`
        )
      }
    }
    console.log('')
  }

  const failed = results.filter(r => r.error).length
  const totalSeconds = (meta.totalDurationMs / 1000).toFixed(1)
  console.log(`  ${results.length} benchmarks (${failed} failed) in ${totalSeconds}s`)
  console.log('='.repeat(78))
}

function formatMs(ms: number): string {
  return `${ms.toFixed(1)}ms`
}

export function categoriesOf(results: PerfReport['results']): string[] {
  return [...new Set(results.map(r => r.category))]
}
