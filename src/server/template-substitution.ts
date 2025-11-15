/**
 * Template Substitution Engine
 *
 * Handles substitution of {member} references in calculatedSql templates
 * with actual SQL expressions while maintaining Drizzle type safety.
 */

import { sql, SQL, StringChunk } from 'drizzle-orm'
import type { Cube, QueryContext } from './types/cube'

/**
 * Resolved measure SQL builders
 * Maps full measure names (e.g., "Cube.measure") to functions that build their SQL
 * Using functions instead of SQL objects avoids mutation and shared reference issues
 */
export type ResolvedMeasures = Map<string, () => SQL>

/**
 * Substitution context
 */
export interface SubstitutionContext {
  /** The cube being processed */
  cube: Cube
  /** All available cubes for cross-cube references */
  allCubes: Map<string, Cube>
  /** Already resolved measure SQL expressions */
  resolvedMeasures: ResolvedMeasures
  /** Query context for SQL generation */
  queryContext: QueryContext
}

/**
 * Substitute {member} references in calculatedSql template
 *
 * Replaces {member} with the corresponding SQL expression from resolvedMeasures.
 * Supports both same-cube ({measure}) and cross-cube ({Cube.measure}) references.
 *
 * @param calculatedSql - Template string with {member} references
 * @param context - Substitution context
 * @returns SQL expression with substituted values
 * @throws Error if referenced measure is not resolved
 */
export function substituteTemplate(
  calculatedSql: string,
  context: SubstitutionContext
): SQL {
  const { cube, allCubes, resolvedMeasures } = context

  // Extract all {member} references
  const memberRefs = extractMemberReferences(calculatedSql)

  // Build substitution map (maps member names to their SQL expressions)
  const substitutions = new Map<string, SQL>()

  for (const ref of memberRefs) {
    const { originalRef, cubeName, fieldName } = ref

    // Resolve cube and measure name
    const targetCubeName = cubeName || cube.name
    const targetCube = allCubes.get(targetCubeName)

    if (!targetCube) {
      throw new Error(
        `Cannot substitute {${originalRef}}: cube '${targetCubeName}' not found`
      )
    }

    // Get resolved SQL builder for the measure
    const fullMeasureName = `${targetCubeName}.${fieldName}`
    const resolvedBuilder = resolvedMeasures.get(fullMeasureName)

    if (!resolvedBuilder) {
      throw new Error(
        `Cannot substitute {${originalRef}}: measure '${fullMeasureName}' not resolved yet. ` +
        `Ensure measures are resolved in dependency order.`
      )
    }

    // Call the builder function to get a fresh SQL object
    // CRITICAL FIX: Wrap in sql template to force fresh queryChunks
    // This avoids mutation issues from shared references in Drizzle
    const resolvedSql = resolvedBuilder()
    const wrappedSql = sql`${resolvedSql}`

    substitutions.set(originalRef, wrappedSql)
  }

  // Build SQL expression by parsing the template and substituting SQL expressions
  // We need to build a single sql`` template literal with the substituted expressions

  // Build arrays for template parts and values
  const sqlParts: string[] = []
  const sqlValues: SQL[] = []
  let lastIndex = 0

  // Find all {member} references and build template parts
  for (const ref of memberRefs) {
    const pattern = `{${ref.originalRef}}`
    const index = calculatedSql.indexOf(pattern, lastIndex)

    if (index >= 0) {
      // Add the string part before this reference
      sqlParts.push(calculatedSql.substring(lastIndex, index))

      // Add the SQL expression as a value
      const resolvedSql = substitutions.get(ref.originalRef)
      if (resolvedSql) {
        sqlValues.push(resolvedSql)
      }

      lastIndex = index + pattern.length
    }
  }

  // Add any remaining string part
  sqlParts.push(calculatedSql.substring(lastIndex))

  // Build the final SQL expression
  // If no member references, return raw SQL
  if (sqlValues.length === 0) {
    return sql.raw(calculatedSql)
  }

  // Build SQL using Drizzle's sql.join to avoid mutation
  // Keep SQL objects intact instead of spreading their chunks
  const parts: (StringChunk | SQL)[] = []

  for (let i = 0; i < sqlParts.length; i++) {
    // Add string part if non-empty
    if (sqlParts[i]) {
      parts.push(new StringChunk(sqlParts[i]))
    }

    // Add SQL value (if any)
    if (i < sqlValues.length) {
      parts.push(sqlValues[i])
    }
  }

  // Use sql.join with empty separator to concatenate
  return sql.join(parts, sql.raw(''))
}

/**
 * Member reference extracted from template
 */
interface MemberReference {
  /** Original reference as it appears in template (e.g., "measure" or "Cube.measure") */
  originalRef: string
  /** Cube name if cross-cube reference, null otherwise */
  cubeName: string | null
  /** Field/measure name */
  fieldName: string
}

/**
 * Extract all {member} references from calculatedSql template
 *
 * @param calculatedSql - Template string
 * @returns Array of member references
 */
function extractMemberReferences(calculatedSql: string): MemberReference[] {
  const regex = /\{([^}]+)\}/g
  const matches = calculatedSql.matchAll(regex)
  const references: MemberReference[] = []

  for (const match of matches) {
    const memberRef = match[1].trim()

    if (memberRef.includes('.')) {
      // Cross-cube reference: {Cube.measure}
      const [cubeName, fieldName] = memberRef.split('.').map(s => s.trim())
      references.push({
        originalRef: memberRef,
        cubeName,
        fieldName
      })
    } else {
      // Same-cube reference: {measure}
      references.push({
        originalRef: memberRef,
        cubeName: null,
        fieldName: memberRef
      })
    }
  }

  return references
}

/**
 * Validate calculatedSql template syntax
 *
 * @param calculatedSql - Template string to validate
 * @returns Validation result
 */
export function validateTemplateSyntax(calculatedSql: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check for unmatched braces
  let braceDepth = 0
  for (let i = 0; i < calculatedSql.length; i++) {
    if (calculatedSql[i] === '{') {
      braceDepth++
    } else if (calculatedSql[i] === '}') {
      braceDepth--
      if (braceDepth < 0) {
        errors.push(`Unmatched closing brace at position ${i}`)
        break
      }
    }
  }

  if (braceDepth > 0) {
    errors.push('Unmatched opening brace in template')
  }

  // Check for empty references
  const emptyRefRegex = /\{\s*\}/
  if (emptyRefRegex.test(calculatedSql)) {
    errors.push('Empty member reference {} found in template')
  }

  // Check for nested braces
  const nestedBraceRegex = /\{[^}]*\{/
  if (nestedBraceRegex.test(calculatedSql)) {
    errors.push('Nested braces are not allowed in member references')
  }

  // Check for invalid characters in member names
  const memberRefs = extractMemberReferences(calculatedSql)
  for (const ref of memberRefs) {
    const fullRef = ref.cubeName ? `${ref.cubeName}.${ref.fieldName}` : ref.fieldName

    // Allow alphanumeric, underscore, and dot
    if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(fullRef)) {
      errors.push(
        `Invalid member reference {${ref.originalRef}}: must start with letter or underscore, ` +
        `and contain only letters, numbers, underscores, and dots`
      )
    }

    // Check for multiple dots (only Cube.measure allowed)
    if (fullRef.split('.').length > 2) {
      errors.push(
        `Invalid member reference {${ref.originalRef}}: only one dot allowed (Cube.measure format)`
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if a template contains any member references
 *
 * @param calculatedSql - Template string to check
 * @returns True if template contains {member} references
 */
export function hasMemberReferences(calculatedSql: string): boolean {
  return /\{[^}]+\}/.test(calculatedSql)
}

/**
 * Get list of all unique member references in a template
 *
 * @param calculatedSql - Template string
 * @returns Array of unique full member names (e.g., ["Cube.measure", "otherMeasure"])
 */
export function getMemberReferences(calculatedSql: string, currentCube: string): string[] {
  const refs = extractMemberReferences(calculatedSql)
  const uniqueRefs = new Set<string>()

  for (const ref of refs) {
    const cubeName = ref.cubeName || currentCube
    const fullName = `${cubeName}.${ref.fieldName}`
    uniqueRefs.add(fullName)
  }

  return Array.from(uniqueRefs)
}
