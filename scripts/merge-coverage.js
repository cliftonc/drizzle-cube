#!/usr/bin/env node

/**
 * Create coverage index page linking all database-specific reports
 * This provides a central hub for accessing coverage from PostgreSQL, MySQL, and SQLite test runs
 */

import fs from 'fs'
import path from 'path'

const coverageDir = './coverage'
const clientCoverageDir = './coverage/client'
const dbDirs = ['postgres', 'mysql', 'sqlite']

console.log('🔄 Creating coverage index page...')

// Check if database-specific coverage directories exist
const existingDbDirs = dbDirs.filter(db => {
  const dbCoverageDir = path.join(coverageDir, db)
  return fs.existsSync(dbCoverageDir) && fs.existsSync(path.join(dbCoverageDir, 'index.html'))
})

if (existingDbDirs.length === 0) {
  console.log('❌ No database-specific coverage reports found.')
  console.log('   Run: npm run test:coverage:all to generate coverage for all databases')
  process.exit(1)
}

console.log(`📊 Found coverage reports for: ${existingDbDirs.join(', ')}`)

// Calculate coverage percentages for each database
const databaseStats = []

for (const db of existingDbDirs) {
  const dbCoverageFile = path.join(coverageDir, db, 'coverage-final.json')
  
  try {
    const coverageData = JSON.parse(fs.readFileSync(dbCoverageFile, 'utf8'))
    
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

// Create HTML index page
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drizzle-Cube Coverage Reports</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .coverage-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .coverage-card {
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
            text-decoration: none;
            color: inherit;
        }
        .coverage-card:hover {
            border-color: #3498db;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
        }
        .db-name {
            font-size: 1.4em;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: capitalize;
        }
        .coverage-percent {
            font-size: 2em;
            font-weight: bold;
            color: #27ae60;
        }
        .coverage-label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .postgres { border-color: #336791; }
        .postgres:hover { border-color: #336791; box-shadow: 0 4px 15px rgba(51, 103, 145, 0.2); }
        .mysql { border-color: #4479A1; }
        .mysql:hover { border-color: #4479A1; box-shadow: 0 4px 15px rgba(68, 121, 161, 0.2); }
        .sqlite { border-color: #003B57; }
        .sqlite:hover { border-color: #003B57; box-shadow: 0 4px 15px rgba(0, 59, 87, 0.2); }
        .client { border-color: #61DAFB; }
        .client:hover { border-color: #61DAFB; box-shadow: 0 4px 15px rgba(97, 218, 251, 0.2); }
        .section-title {
            font-size: 1.2em;
            font-weight: bold;
            margin: 30px 0 15px 0;
            color: #2c3e50;
            border-bottom: 1px solid #e1e8ed;
            padding-bottom: 5px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e1e8ed;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .footer a {
            color: #3498db;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Drizzle-Cube Test Coverage Reports</h1>
        
        <p>This project tests against multiple databases and includes client-side React component testing. 
           Click on any section below to view its detailed coverage report.</p>
        
        ${databaseStats.some(db => db.type === 'server') ? `
        <div class="section-title">🗄️ Server Coverage (Multi-Database)</div>
        <div class="coverage-grid">
            ${databaseStats.filter(db => db.type === 'server').map(db => `
            <a href="${db.url}" class="coverage-card ${db.name}">
                <div class="db-name">${db.name}</div>
                <div class="coverage-percent">${db.coverage}${db.coverage !== 'Error' ? '%' : ''}</div>
                <div class="coverage-label">Line Coverage</div>
            </a>
            `).join('')}
        </div>
        ` : ''}
        
        ${databaseStats.some(db => db.type === 'client') ? `
        <div class="section-title">⚛️ Client Coverage (React Components)</div>
        <div class="coverage-grid">
            ${databaseStats.filter(db => db.type === 'client').map(db => `
            <a href="${db.url}" class="coverage-card ${db.name}">
                <div class="db-name">${db.name === 'client' ? 'React Client' : db.name}</div>
                <div class="coverage-percent">${db.coverage}${db.coverage !== 'Error' ? '%' : ''}</div>
                <div class="coverage-label">Line Coverage</div>
            </a>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="footer">
            <p><strong>Multi-Database Testing:</strong> Server tests run against PostgreSQL, MySQL, and SQLite to ensure compatibility and exercise different database adapter code paths.</p>
            
            <p><strong>Client Testing:</strong> React component tests use JSDOM and Testing Library for comprehensive UI coverage.</p>
            
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            
            <p>Coverage reports generated with <a href="https://vitest.dev/guide/coverage.html">Vitest</a> and 
               <a href="https://github.com/bcoe/v8-coverage">V8 Coverage</a>.</p>
        </div>
    </div>
</body>
</html>`

// Write the index page
const indexPath = path.join(coverageDir, 'index.html')
fs.writeFileSync(indexPath, indexHtml)

console.log(`✅ Coverage index page created!`)
console.log(`📁 Main index: ${path.resolve(indexPath)}`)
console.log(`📊 Database-specific reports available:`)

for (const db of databaseStats) {
  console.log(`   - ${db.name}: ${path.resolve(coverageDir, db.url)} (${db.coverage}% coverage)`)
}