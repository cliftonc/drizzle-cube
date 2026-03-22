#!/usr/bin/env node

/**
 * drizzle-cube CLI
 *
 * Usage:
 *   npx drizzle-cube charts init               # Scaffold an example custom chart
 *   npx drizzle-cube charts init --from bar     # Copy a built-in chart as starting point
 *   npx drizzle-cube charts init -o ./my-charts # Custom output directory
 *   npx drizzle-cube charts list                # List available built-in chart types
 */

import { parseArgs } from 'node:util'
import { chartsInit, chartsList } from './commands/charts.js'

const { positionals } = parseArgs({
  allowPositionals: true,
  strict: false
})

const [command, subcommand] = positionals

if (command === 'charts') {
  if (subcommand === 'init') {
    chartsInit()
  } else if (subcommand === 'list') {
    chartsList()
  } else {
    console.log(`
drizzle-cube charts

Commands:
  drizzle-cube charts init             Scaffold a custom chart
  drizzle-cube charts init --from bar  Copy a built-in chart as starting point
  drizzle-cube charts init -o <dir>    Set output directory (default: ./src/charts)
  drizzle-cube charts list             List available built-in chart types
`)
  }
} else {
  console.log(`
drizzle-cube CLI

Commands:
  drizzle-cube charts   Chart plugin scaffolding tools

Run 'drizzle-cube charts' for more info.
`)
}
