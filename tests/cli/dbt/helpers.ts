import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FIXTURE_ROOT = resolve(__dirname, '../../fixtures/dbt')

/** Read a dbt fixture file as a string, e.g. fixture('postgres-simple', 'manifest.json'). */
export function fixture(name: string, file: string): string {
  return readFileSync(resolve(FIXTURE_ROOT, name, file), 'utf8')
}

export function fixtureManifest(name: string): string {
  return fixture(name, 'manifest.json')
}

export function fixtureCatalog(name: string): string {
  return fixture(name, 'catalog.json')
}
