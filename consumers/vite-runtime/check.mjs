// Serve the built app with a mocked Cube API and render it in headless
// Chromium. Build-level checks cannot see runtime chunking bugs: an export
// left undefined because the consumer's bundler dropped an init call crashed
// the whole dashboard while every build passed (#1438).
import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { extname, join, resolve } from 'node:path'

const repoRoot = process.env.DC_SMOKE_REPO_ROOT
if (!repoRoot) throw new Error('DC_SMOKE_REPO_ROOT is not set (run through scripts/consumer-smoke.mjs)')
// The repo's Playwright, so the fixture does not install a browser.
const { chromium } = createRequire(join(repoRoot, 'package.json'))('@playwright/test')

const meta = {
  cubes: [{
    name: 'Employees', title: 'Employees',
    measures: [{ name: 'Employees.count', type: 'number', title: 'Count', aggType: 'count' }],
    dimensions: [
      { name: 'Employees.name', type: 'string', title: 'Name' },
      { name: 'Employees.departmentId', type: 'number', title: 'Dept' },
      { name: 'Employees.createdAt', type: 'time', title: 'Created' }
    ]
  }]
}
const data = ['Ann', 'Bob', 'Cy', 'Dee', 'Eve'].flatMap((name, i) =>
  [1, 2].map(d => ({ 'Employees.name': name, 'Employees.departmentId': d, 'Employees.count': 3 + i * 2 + d })))
const annotation = {
  measures: { 'Employees.count': { title: 'Count', type: 'number' } },
  dimensions: { 'Employees.name': { title: 'Name', type: 'string' }, 'Employees.departmentId': { title: 'Dept', type: 'number' } },
  timeDimensions: {}
}
const result = query => ({ data, annotation, query, requestId: 'smoke' })
const contentTypes = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' }
const distDir = resolve('dist')

const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    const { pathname } = new URL(req.url, 'http://localhost')
    const json = value => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(value)) }
    if (pathname.endsWith('/meta')) return json(meta)
    if (pathname.endsWith('/batch')) return json({ results: (JSON.parse(body || '{}').queries ?? []).map(result) })
    if (pathname.endsWith('/load')) return json(result({}))
    if (pathname.endsWith('/sql')) return json({ sql: { sql: 'select 1', params: [] } })
    const file = join(distDir, pathname === '/' ? 'index.html' : pathname)
    if (!file.startsWith(distDir) || !existsSync(file)) { res.statusCode = 404; return res.end() }
    res.setHeader('content-type', contentTypes[extname(file)] ?? 'application/octet-stream')
    res.end(readFileSync(file))
  })
})
await new Promise(done => server.listen(0, '127.0.0.1', done))
const url = `http://127.0.0.1:${server.address().port}/`

const failures = []
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 3200 } })
  page.on('pageerror', error => failures.push(`page error: ${error.message}`))
  page.on('console', message => { if (message.type() === 'error') failures.push(`console error: ${message.text().slice(0, 300)}`) })

  await page.goto(url, { waitUntil: 'networkidle' })
  // 24 portlets, one per chart type: the last title renders once the cards mount.
  const rendered = await page.getByText('measureProfile', { exact: true })
    .waitFor({ timeout: 20000 }).then(() => true, () => false)
  if (!rendered) {
    failures.push('the dashboard did not render (no "measureProfile" portlet after 20 s)')
  } else {
    await page.waitForTimeout(2000)
    const charts = await page.locator('svg.recharts-surface').count()
    const fallbacks = await page.locator('.dc-missing-dependency-fallback').count()
    console.log(`dashboard: ${charts} recharts charts, ${fallbacks} missing-dependency fallbacks`)
    if (charts < 10) failures.push(`only ${charts} recharts charts rendered (expected 10+)`)
    if (fallbacks > 0) failures.push(`${fallbacks} charts show the missing-dependency fallback with every peer installed`)

    // The edit modals are lazy chunks (#1438): open both.
    await page.getByRole('button', { name: /^Edit$/ }).first().click()
    for (const [button, heading] of [['Add Portlet', 'Add New Portlet'], ['Add Text', 'Markdown Content']]) {
      await page.getByRole('button', { name: button }).first().click()
      const opened = await page.getByText(heading).first()
        .waitFor({ timeout: 10000 }).then(() => true, () => false)
      if (opened) console.log(`${button}: opened`)
      else failures.push(`${button} did not open (no "${heading}")`)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
  }
} finally {
  await browser.close()
  server.close()
}

if (failures.length > 0) {
  console.error('✗ ' + failures.join('\n✗ '))
  process.exit(1)
}
