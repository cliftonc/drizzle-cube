/**
 * Orchestration for the dbt → Drizzle schema/cube generator.
 *
 * Pipeline: load artifacts → normalize → emit schema + cubes → write (or
 * plan/check). This module does not print — the command module owns console
 * output.
 */

import type {
  DbtGenerateOptions,
  EmitContext,
  GenerationResult,
  GeneratedFile,
} from './types.js'
import { loadDbtArtifacts } from './parse-artifacts.js'
import { normalizeDbtArtifacts } from './normalize.js'
import { emitSchema } from './emit-schema.js'
import { emitCubes } from './emit-cubes.js'
import { writeGeneratedOutput } from './write-output.js'

function buildEmitContext(options: DbtGenerateOptions): EmitContext {
  return {
    manifestPath: options.manifestPath,
    catalogPath: options.catalogPath,
    dialect: options.dialect,
    security: options.security,
  }
}

export async function generateFromDbt(options: DbtGenerateOptions): Promise<GenerationResult> {
  const artifacts = await loadDbtArtifacts(options.manifestPath, options.catalogPath)
  const { models, warnings } = normalizeDbtArtifacts(artifacts, { security: options.security })

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
