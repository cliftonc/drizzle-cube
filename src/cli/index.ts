#!/usr/bin/env node

/**
 * drizzle-cube CLI
 *
 * Usage:
 *   npx drizzle-cube charts init               # Scaffold an example custom chart
 *   npx drizzle-cube charts init --from bar     # Copy a built-in chart as starting point
 *   npx drizzle-cube charts init -o ./my-charts # Custom output directory
 *   npx drizzle-cube charts list                # List available built-in chart types
 *   npx drizzle-cube dbt generate               # Generate schema + cubes from dbt artifacts
 */

import { parseArgs } from 'node:util'
import { chartsInit, chartsList } from './commands/charts.js'
import { dbtGenerate, printDbtHelp } from './commands/dbt.js'

const { positionals } = parseArgs({
  allowPositionals: true,
  strict: false
})

const [command, subcommand] = positionals

async function main(): Promise<void> {
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
    return
  }

  if (command === 'dbt') {
    if (subcommand === 'generate') {
      await dbtGenerate(process.argv.slice(4))
      return
    }
    printDbtHelp()
    return
  }

  console.log(`
drizzle-cube CLI

Commands:
  drizzle-cube charts   Chart plugin scaffolding tools
  drizzle-cube dbt      Generate schema and cubes from dbt artifacts

Run 'drizzle-cube charts' or 'drizzle-cube dbt' for more info.
`)
}

main().catch((err: Error) => {
  console.error(err.message)
  process.exit(1)
})
