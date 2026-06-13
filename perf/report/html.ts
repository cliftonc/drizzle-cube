/**
 * Standalone single-file HTML report (no external dependencies), in the same
 * spirit as the vitest coverage report. Inline CSS, per-category tables with
 * proportional bars, and the raw PerfReport JSON embedded for future diffing.
 */

import type { PerfReport } from '../types'
import { categoriesOf } from './console'

export function buildHtmlReport(report: PerfReport): string {
  const { meta, results } = report

  const datasetCells = Object.entries(meta.rowCounts)
    .map(([table, count]) => `<div class="stat"><span class="stat-value">${count.toLocaleString()}</span><span class="stat-label">${escapeHtml(table)}</span></div>`)
    .join('')

  const sections = categoriesOf(results).map(category => {
    const categoryResults = results.filter(r => r.category === category)
    const maxMedian = Math.max(...categoryResults.filter(r => !r.error).map(r => r.stats.median), 1)
    const rows = categoryResults.map(result => {
      if (result.error) {
        return `<tr class="error-row"><td>${escapeHtml(result.name)}<div class="bench-id">${escapeHtml(result.id)}</div></td><td colspan="5" class="error-cell">⚠️ ${escapeHtml(result.error)}</td></tr>`
      }
      const pct = Math.max(1, Math.round((result.stats.median / maxMedian) * 100))
      return `<tr>
        <td>${escapeHtml(result.name)}<div class="bench-id">${escapeHtml(result.id)}</div></td>
        <td class="num"><strong>${result.stats.median.toFixed(1)}</strong></td>
        <td class="num">${result.stats.p95.toFixed(1)}</td>
        <td class="num">${result.stats.min.toFixed(1)} – ${result.stats.max.toFixed(1)}</td>
        <td class="num">${result.rows.toLocaleString()}</td>
        <td class="bar-cell"><div class="bar" style="width:${pct}%"></div></td>
      </tr>`
    }).join('\n')

    return `<section>
      <h2>${escapeHtml(category)}</h2>
      <table>
        <thead><tr><th>Benchmark</th><th class="num">Median (ms)</th><th class="num">p95 (ms)</th><th class="num">Min – Max (ms)</th><th class="num">Rows</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`
  }).join('\n')

  const failed = results.filter(r => r.error).length

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>drizzle-cube performance benchmarks — ${escapeHtml(meta.gitSha)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
  .container { max-width: 1080px; margin: 0 auto; padding: 32px 24px 64px; }
  header h1 { font-size: 24px; margin: 0 0 4px; }
  header .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
  .meta-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 32px; display: flex; flex-wrap: wrap; gap: 32px; }
  .stat { display: flex; flex-direction: column; }
  .stat-value { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  section { margin-bottom: 32px; }
  h2 { font-size: 16px; text-transform: capitalize; margin: 0 0 8px; color: #334155; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  th, td { padding: 10px 14px; text-align: left; font-size: 14px; border-top: 1px solid #f1f5f9; }
  thead th { background: #f1f5f9; border-top: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .bench-id { font-size: 11px; color: #94a3b8; font-family: ui-monospace, monospace; }
  .bar-cell { width: 160px; }
  .bar { height: 10px; border-radius: 5px; background: linear-gradient(90deg, #38bdf8, #6366f1); min-width: 2px; }
  .error-row td { background: #fef2f2; }
  .error-cell { color: #b91c1c; }
  footer { color: #94a3b8; font-size: 12px; margin-top: 16px; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>drizzle-cube performance benchmarks</h1>
    <div class="subtitle">
      ${escapeHtml(meta.timestamp)} · commit <code>${escapeHtml(meta.gitSha)}</code> · node ${escapeHtml(meta.node)} ·
      median of ${meta.iterations} iterations (+${meta.warmup} warmup) · ${results.length} benchmarks (${failed} failed) in ${(meta.totalDurationMs / 1000).toFixed(1)}s
    </div>
  </header>
  <div class="meta-card">${datasetCells}<div class="stat"><span class="stat-value">v${meta.dataVersion}</span><span class="stat-label">data version</span></div></div>
  ${sections}
  <footer>PostgreSQL · dataset seeded deterministically (fixed RNG seed) · raw results embedded below for diffing</footer>
</div>
<script type="application/json" id="perf-results">${JSON.stringify(report).replace(/</g, '\\u003c')}</script>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
