#!/usr/bin/env node

/**
 * Create coverage index page and merge database-specific coverage reports
 * This provides a central hub for accessing coverage from PostgreSQL, MySQL, and SQLite test runs
 * and creates a merged coverage report showing combined coverage across all databases
 */

import fs from 'fs'
import path from 'path'
import libCoverage from 'istanbul-lib-coverage'
import libReport from 'istanbul-lib-report'
import reports from 'istanbul-reports'

const { createCoverageMap } = libCoverage
const { createContext } = libReport

const coverageDir = './coverage'
const clientCoverageDir = './coverage/client'
const mergedCoverageDir = './coverage/merged'
const dbDirs = ['postgres', 'mysql', 'sqlite', 'duckdb']

console.log('🔄 Creating coverage index page and merging coverage...')

// Check if database-specific coverage directories exist
const existingDbDirs = dbDirs.filter(db => {
  const dbCoverageDir = path.join(coverageDir, db)
  return fs.existsSync(dbCoverageDir) && fs.existsSync(path.join(dbCoverageDir, 'coverage-final.json'))
})

if (existingDbDirs.length === 0) {
  console.log('❌ No database-specific coverage reports found.')
  console.log('   Run: npm run test:coverage:all to generate coverage for all databases')
  process.exit(1)
}

console.log(`📊 Found coverage reports for: ${existingDbDirs.join(', ')}`)

// Calculate coverage percentages for each database and collect coverage maps
const databaseStats = []
const coverageMap = createCoverageMap()

for (const db of existingDbDirs) {
  const dbCoverageFile = path.join(coverageDir, db, 'coverage-final.json')

  try {
    const coverageData = JSON.parse(fs.readFileSync(dbCoverageFile, 'utf8'))

    // Merge into combined coverage map
    coverageMap.merge(coverageData)

    // Calculate overall coverage percentage (simple metric)
    const files = Object.keys(coverageData)
    let totalLines = 0
    let coveredLines = 0

    for (const file of files) {
      const fileCoverage = coverageData[file]
      if (fileCoverage.s) { // statement coverage
        const statements = Object.values(fileCoverage.s)
        totalLines += statements.length
        coveredLines += statements.filter(count => count > 0).length
      }
    }

    const coveragePercent = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
    console.log(`   ${db}: ${coveragePercent.toFixed(1)}% line coverage`)

    databaseStats.push({
      name: db,
      coverage: coveragePercent.toFixed(1),
      url: `${db}/index.html`,
      type: 'server'
    })
  } catch (error) {
    console.log(`   ${db}: Error reading coverage data - ${error.message}`)
    databaseStats.push({
      name: db,
      coverage: 'Error',
      url: `${db}/index.html`,
      type: 'server'
    })
  }
}

// Generate merged coverage report if we have data from multiple databases
if (existingDbDirs.length > 1) {
  console.log('\n📊 Generating merged coverage report...')

  try {
    // Ensure merged coverage directory exists
    if (!fs.existsSync(mergedCoverageDir)) {
      fs.mkdirSync(mergedCoverageDir, { recursive: true })
    }

    // Write merged coverage-final.json
    const mergedJson = JSON.stringify(coverageMap.toJSON(), null, 2)
    fs.writeFileSync(path.join(mergedCoverageDir, 'coverage-final.json'), mergedJson)

    // Calculate merged coverage percentage
    const mergedData = coverageMap.toJSON()
    const files = Object.keys(mergedData)
    let totalLines = 0
    let coveredLines = 0

    for (const file of files) {
      const fileCoverage = mergedData[file]
      if (fileCoverage.s) {
        const statements = Object.values(fileCoverage.s)
        totalLines += statements.length
        coveredLines += statements.filter(count => count > 0).length
      }
    }

    const mergedPercent = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
    console.log(`   merged: ${mergedPercent.toFixed(1)}% combined line coverage`)

    // Generate HTML report for merged coverage
    // Use 'flat' summarizer to match the individual database reports
    const context = createContext({
      dir: mergedCoverageDir,
      defaultSummarizer: 'flat',
      coverageMap: coverageMap,
      sourceFinder: (filePath) => {
        try {
          return fs.readFileSync(filePath, 'utf8')
        } catch {
          return ''
        }
      }
    })

    // Create HTML report
    const htmlReport = reports.create('html', {})
    htmlReport.execute(context)

    // Create LCOV report
    const lcovReport = reports.create('lcov', {})
    lcovReport.execute(context)

    // Create text summary
    const textReport = reports.create('text', {})
    textReport.execute(context)

    databaseStats.push({
      name: 'merged',
      coverage: mergedPercent.toFixed(1),
      url: 'merged/index.html',
      type: 'merged'
    })

    console.log('   ✅ Merged coverage report generated')
  } catch (error) {
    console.log(`   ⚠️ Error generating merged coverage: ${error.message}`)
  }
}

// Check for client coverage
if (fs.existsSync(clientCoverageDir) && fs.existsSync(path.join(clientCoverageDir, 'index.html'))) {
  const clientCoverageFile = path.join(clientCoverageDir, 'coverage-final.json')

  try {
    const coverageData = JSON.parse(fs.readFileSync(clientCoverageFile, 'utf8'))

    // Calculate client coverage percentage
    const files = Object.keys(coverageData)
    let totalLines = 0
    let coveredLines = 0

    for (const file of files) {
      const fileCoverage = coverageData[file]
      if (fileCoverage.s) { // statement coverage
        const statements = Object.values(fileCoverage.s)
        totalLines += statements.length
        coveredLines += statements.filter(count => count > 0).length
      }
    }

    const coveragePercent = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
    console.log(`   client: ${coveragePercent.toFixed(1)}% line coverage`)

    databaseStats.push({
      name: 'client',
      coverage: coveragePercent.toFixed(1),
      url: 'client/index.html',
      type: 'client'
    })
  } catch (error) {
    console.log(`   client: Error reading coverage data - ${error.message}`)
    databaseStats.push({
      name: 'client',
      coverage: 'Error',
      url: 'client/index.html',
      type: 'client'
    })
  }
}

// Create HTML index page - styled to match Starlight
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Reports</title>
    <style>
        :root {
            --color-bg: #fff;
            --color-bg-secondary: #f6f7f9;
            --color-text: #1e1e1e;
            --color-text-muted: #6b7280;
            --color-border: #e5e7eb;
            --color-accent: #3b82f6;
            --color-success: #22c55e;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --color-bg: #18181b;
                --color-bg-secondary: #27272a;
                --color-text: #e4e4e7;
                --color-text-muted: #a1a1aa;
                --color-border: #3f3f46;
                --color-accent: #60a5fa;
                --color-success: #4ade80;
            }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--color-text);
            background: var(--color-bg);
            padding: 2rem;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            color: var(--color-text-muted);
            margin-bottom: 2rem;
            font-size: 0.95rem;
        }
        .section { margin-bottom: 2rem; }
        .section-title {
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-text-muted);
            margin-bottom: 1rem;
        }
        .coverage-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 1rem;
        }
        .coverage-card {
            display: block;
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: 0.5rem;
            padding: 1.25rem;
            text-decoration: none;
            color: inherit;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .coverage-card:hover {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 1px var(--color-accent);
        }
        .db-name {
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            text-transform: capitalize;
        }
        .coverage-percent {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--color-success);
            line-height: 1.2;
        }
        .coverage-label {
            font-size: 0.75rem;
            color: var(--color-text-muted);
            margin-top: 0.25rem;
        }
        .merged-card {
            border-left: 3px solid var(--color-accent);
        }
        .merged-card .coverage-percent {
            color: var(--color-accent);
        }
        .footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--color-border);
            font-size: 0.8rem;
            color: var(--color-text-muted);
        }
        .footer a {
            color: var(--color-accent);
            text-decoration: none;
        }
        .footer a:hover { text-decoration: underline; }
        .meta { display: flex; gap: 2rem; flex-wrap: wrap; }
        .meta-item strong { display: block; color: var(--color-text); margin-bottom: 0.25rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Coverage</h1>
        <p class="subtitle">Coverage reports for server and client test suites</p>

        ${databaseStats.some(db => db.type === 'merged') ? `
        <div class="section">
            <div class="section-title">Combined Coverage</div>
            <div class="coverage-grid">
                ${databaseStats.filter(db => db.type === 'merged').map(db => `
                <a href="${db.url}" class="coverage-card merged-card">
                    <div class="db-name">All Databases</div>
                    <div class="coverage-percent">${db.coverage}${db.coverage !== 'Error' ? '%' : ''}</div>
                    <div class="coverage-label">Merged from all adapters</div>
                </a>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${databaseStats.some(db => db.type === 'server') ? `
        <div class="section">
            <div class="section-title">Server Coverage by Database</div>
            <div class="coverage-grid">
                ${databaseStats.filter(db => db.type === 'server').map(db => `
                <a href="${db.url}" class="coverage-card">
                    <div class="db-name">${db.name}</div>
                    <div class="coverage-percent">${db.coverage}${db.coverage !== 'Error' ? '%' : ''}</div>
                    <div class="coverage-label">Line coverage</div>
                </a>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${databaseStats.some(db => db.type === 'client') ? `
        <div class="section">
            <div class="section-title">Client Coverage</div>
            <div class="coverage-grid">
                ${databaseStats.filter(db => db.type === 'client').map(db => `
                <a href="${db.url}" class="coverage-card">
                    <div class="db-name">React Components</div>
                    <div class="coverage-percent">${db.coverage}${db.coverage !== 'Error' ? '%' : ''}</div>
                    <div class="coverage-label">Line coverage</div>
                </a>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <div class="meta">
                <div class="meta-item">
                    <strong>Generated</strong>
                    ${new Date().toLocaleString()}
                </div>
                <div class="meta-item">
                    <strong>Tools</strong>
                    <a href="https://vitest.dev/guide/coverage.html">Vitest</a> + V8 Coverage
                </div>
            </div>
        </div>
    </div>
</body>
</html>`

// Write the dashboard page (named dashboard.html to avoid conflict with Starlight route)
const dashboardPath = path.join(coverageDir, 'dashboard.html')
fs.writeFileSync(dashboardPath, indexHtml)

// Inject back link into all Istanbul-generated HTML files
const backLinkStyle = `
<style>
  .back-link {
    display: inline-block;
    margin-bottom: 1rem;
    color: #3b82f6;
    text-decoration: none;
    font-size: 0.9rem;
  }
  .back-link:hover { text-decoration: underline; }
  @media (prefers-color-scheme: dark) {
    .back-link { color: #60a5fa; }
  }
</style>
`
const backLinkHtml = `<a href="../dashboard.html" class="back-link">&larr; Back to Coverage Dashboard</a>`

function injectBackLink(htmlPath, depth = 1) {
  if (!fs.existsSync(htmlPath)) return

  let html = fs.readFileSync(htmlPath, 'utf8')

  // Skip if already has back link
  if (html.includes('back-link')) return

  // Calculate relative path based on depth
  const relativePath = depth === 1 ? '../dashboard.html' : '../'.repeat(depth) + 'dashboard.html'
  const link = backLinkHtml.replace('../dashboard.html', relativePath)

  // Inject style into head
  html = html.replace('</head>', backLinkStyle + '</head>')

  // Inject back link before h1
  html = html.replace(/<h1>/, link + '\n        <h1>')

  fs.writeFileSync(htmlPath, html)
}

// Inject back links into all coverage report index files
const dirsToProcess = [...existingDbDirs, 'merged', 'client']
for (const dir of dirsToProcess) {
  const indexPath = path.join(coverageDir, dir, 'index.html')
  injectBackLink(indexPath, 1)
}
console.log('   ✓ Injected back links into coverage reports')

console.log(`\n✅ Coverage dashboard page created!`)
console.log(`📁 Dashboard: ${path.resolve(dashboardPath)}`)
console.log(`📊 Coverage reports available:`)

for (const db of databaseStats) {
  const marker = db.type === 'merged' ? '🔀' : db.type === 'client' ? '⚛️' : '🗄️'
  console.log(`   ${marker} ${db.name}: ${path.resolve(coverageDir, db.url)} (${db.coverage}% coverage)`)
}
