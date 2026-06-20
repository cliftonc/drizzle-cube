/**
 * Orchestrate the dbt → Drizzle Cube generation pipeline:
 *
 * loadDbtArtifacts → normalizeDbtArtifacts → emitSchema + emitCubes →
 * writeGeneratedOutput. Warnings from each stage are concatenated and
 * returned alongside the file set and write result.
 */
import { emitCubes } from './emit-cubes.js'
import { emitSchema } from './emit-schema.js'
import { loadDbtArtifacts } from './parse-artifacts.js'
import { normalizeDbtArtifacts } from './normalize.js'
import { writeGeneratedOutput } from './write-output.js'
import type {
  DbtGenerateOptions,
  EmitContext,
  GeneratedFile,
  GenerationResult,
  GeneratorWarning,
} from './types.js'

/** Build the `EmitContext` shared by the schema and cube emitters. */
function buildEmitContext(options: DbtGenerateOptions): EmitContext {
  return {
    manifestPath: options.manifestPath,
    catalogPath: options.catalogPath,
    dialect: options.dialect,
    security: options.security,
  }
}

/**
 * Run the full generation pipeline and (optionally) write results to disk.
 *
 * Does not print to the console — the CLI command module owns all user-facing
 * output. Returns the generated files, write result, and accumulated warnings.
 */
export async function generateFromDbt(options: DbtGenerateOptions): Promise<GenerationResult> {
  const warnings: GeneratorWarning[] = []

  const artifacts = await loadDbtArtifacts(options.manifestPath, options.catalogPath)
  const { models, warnings: normalizeWarnings } = normalizeDbtArtifacts(artifacts, {
    security: options.security,
  })
  warnings.push(...normalizeWarnings)

  const context = buildEmitContext(options)
  const files: GeneratedFile[] = [emitSchema(models, context), ...emitCubes(models, context)]

  const write = await writeGeneratedOutput(files, {
    outDir: options.outDir,
    dryRun: options.dryRun,
    check: options.check,
    force: options.force,
  })

  return { files, write, warnings }
}
