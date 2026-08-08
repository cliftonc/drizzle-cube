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
import { dbtGenerate, printDbtHelp } from './commands/dbt.js'

function printChartsHelp(): void {
  console.log(`
drizzle-cube charts

Commands:
  drizzle-cube charts init             Scaffold a custom chart
  drizzle-cube charts init --from bar  Copy a built-in chart as starting point
  drizzle-cube charts init -o <dir>    Set output directory (default: ./src/charts)
  drizzle-cube charts list             List available built-in chart types
`)
}

function printRootHelp(): void {
  console.log(`
drizzle-cube CLI

Commands:
  drizzle-cube charts   Chart plugin scaffolding tools
  drizzle-cube dbt      dbt artifact generator tools

Run 'drizzle-cube charts' or 'drizzle-cube dbt' for more info.
`)
}

async function main(): Promise<void> {
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
      printChartsHelp()
    }
    return
  }

  if (command === 'dbt') {
    if (subcommand === 'generate') {
      await dbtGenerate(process.argv.slice(4))
    } else {
      printDbtHelp()
    }
    return
  }

  printRootHelp()
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
