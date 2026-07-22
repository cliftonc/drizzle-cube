import { emitCubeFiles } from './emit-cubes.js'
import { emitSchemaFile } from './emit-schema.js'
import { loadDbtArtifacts } from './parse-artifacts.js'
import { normalizeDbtArtifacts } from './normalize.js'
import type { DbtGenerateOptions, GeneratedFile, GeneratorWarning } from './types.js'

export async function generateDbtFiles(options: DbtGenerateOptions): Promise<{ files: GeneratedFile[]; warnings: GeneratorWarning[] }> {
  const artifacts = await loadDbtArtifacts(options.manifestPath, options.catalogPath)
  const { models, warnings } = normalizeDbtArtifacts({ artifacts, config: options.config, security: options.security, dialect: options.dialect })
  const files = [
    emitSchemaFile(models, { manifestPath: options.manifestPath, catalogPath: options.catalogPath, dialect: options.dialect }),
    ...emitCubeFiles(models, { security: options.security }),
  ].sort((a, b) => {
    if (a.path === 'schema.ts') return -1
    if (b.path === 'schema.ts') return 1
    if (a.path === 'index.ts') return 1
    if (b.path === 'index.ts') return -1
    return a.path.localeCompare(b.path)
  })
  return { files, warnings }
}
