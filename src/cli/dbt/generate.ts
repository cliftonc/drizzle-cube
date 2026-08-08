import { emitCubes } from './emit-cubes.js'
import { emitSchema } from './emit-schema.js'
import { normalizeDbtArtifacts } from './normalize.js'
import { loadDbtArtifacts } from './parse-artifacts.js'
import { GENERATED_HEADER, writeGeneratedOutput } from './write-output.js'
import type { DbtGenerateOptions, GenerationResult } from './types.js'

export async function generateFromDbt(options: DbtGenerateOptions): Promise<GenerationResult> {
  const artifacts = await loadDbtArtifacts(options.manifestPath, options.catalogPath)
  const normalized = normalizeDbtArtifacts(artifacts, { security: options.security })
  const context = { header: GENERATED_HEADER }
  const files = [emitSchema(normalized.models, context), ...emitCubes(normalized.models, context)]
  const writeResult = await writeGeneratedOutput(files, { outDir: options.outDir, dryRun: options.dryRun, check: options.check, force: options.force })
  return { files, writeResult, warnings: normalized.warnings.concat(writeResult.warnings) }
}
