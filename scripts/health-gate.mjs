#!/usr/bin/env node
// Reports the issue-862 gate: critical/high above-threshold findings in src/ + maintainability.
// Usage: npx fallow health --complexity --format json | node scripts/health-gate.mjs [fileSubstr]
import { readFileSync } from 'node:fs'
const raw = readFileSync(0, 'utf8')
const d = JSON.parse(raw)
const findings = (d.findings || []).filter(f => /(^|\/)src\//.test(f.path || ''))
const filt = process.argv[2]
const sel = filt ? findings.filter(f => (f.path || '').includes(filt)) : findings
const sev = s => sel.filter(f => f.severity === s)
const crit = sev('critical'), high = sev('high'), mod = sev('moderate')
const mi = d.summary?.average_maintainability ?? d.vital_signs?.maintainability_avg
if (filt) {
  const ch = [...crit, ...high]
  if (!ch.length) console.log(`${filt}: clean (no critical/high)`)
  else console.log(`${filt}:\n` + ch.map(f => `  ${f.severity} ${f.name} cyc=${f.cyclomatic} cog=${f.cognitive} crap=${Math.round(f.crap)}`).join('\n'))
} else {
  console.log(`src/ findings — critical:${crit.length} high:${high.length} moderate:${mod.length} | maintainability:${mi}`)
  const byFile = {}
  ;[...crit, ...high].forEach(f => { const p = (f.path||'').replace(/^.*\/src\//,'src/'); (byFile[p] = byFile[p] || []).push(f) })
  const rows = Object.entries(byFile).map(([p, fs]) => `  ${Math.max(...fs.map(x=>x.cyclomatic))}  ${p}  [${fs.map(x=>x.severity[0]).join('')}]`).sort((a,b)=>parseInt(b)-parseInt(a))
  if (rows.length) console.log('remaining critical+high files:\n' + rows.join('\n'))
}
