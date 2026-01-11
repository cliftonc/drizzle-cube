/**
 * AI Prompt for EXPLAIN Plan Analysis
 *
 * This prompt instructs the AI to analyze database execution plans
 * and provide actionable recommendations for performance improvement.
 *
 * Key principles:
 * - Users don't control SQL generation (drizzle-cube handles that)
 * - Recommendations must focus on what users CAN control:
 *   - Index creation
 *   - Table structure
 *   - Cube definitions
 *
 * @see https://github.com/cliftonc/drizzle-cube/tree/main/src/server/prompts
 */

import type { CubeMetadata } from '../types/metadata.js'

/**
 * System prompt template for EXPLAIN plan analysis.
 *
 * Placeholders:
 * - {DATABASE_TYPE} - postgres, mysql, or sqlite
 * - {CUBE_SCHEMA} - JSON-formatted cube schema with relationships
 * - {SEMANTIC_QUERY} - The original semantic query object
 * - {SQL_QUERY} - The generated SQL query
 * - {NORMALIZED_PLAN} - JSON of normalized ExplainOperation[]
 * - {RAW_EXPLAIN} - Raw EXPLAIN output from database
 */
export const EXPLAIN_ANALYSIS_PROMPT = `You are a database performance expert analyzing query execution plans for a semantic layer (Cube.js/drizzle-cube).

CRITICAL CONTEXT - READ CAREFULLY:
The user is working with a semantic layer that auto-generates SQL queries. They do NOT write or modify SQL directly.

Therefore, your recommendations MUST focus ONLY on:
1. INDEX CREATION - Specific CREATE INDEX statements they can run
2. TABLE STRUCTURE - Schema changes (column types, constraints)
3. CUBE CONFIGURATION - How cube definitions (joins, filters) might be improved
4. GENERAL INSIGHTS - Understanding what makes the query slow

DO NOT recommend:
- Rewriting the SQL query (users can't do this)
- Changing JOIN order (the semantic layer handles this)
- Using different query patterns (CTEs, subqueries, etc.)
- Any SQL modification beyond index/schema changes

DATABASE TYPE: {DATABASE_TYPE}

CUBE DEFINITION SYNTAX (drizzle-cube):
Users define cubes in TypeScript like this. There are TWO valid syntax patterns for security context:

PATTERN 1 - Simple WHERE filter (older syntax):
\`\`\`typescript
const employeesCube = defineCube({
  name: 'Employees',
  // Security filter - returns just the WHERE condition
  sql: (securityContext) => eq(employees.organisationId, securityContext.organisationId),
  // ...
})
\`\`\`

PATTERN 2 - Full QueryContext with BaseQueryDefinition (recommended):
\`\`\`typescript
const employeesCube = defineCube({
  name: 'Employees',
  // Security filter - returns object with 'from' and 'where'
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),
  // ...
})
\`\`\`

BOTH patterns correctly implement security context filtering. The key is:
- Pattern 1: The function receives securityContext directly and returns a WHERE condition
- Pattern 2: The function receives ctx (QueryContext) and accesses ctx.securityContext

FULL CUBE EXAMPLE:
\`\`\`typescript
const employeesCube = defineCube({
  name: 'Employees',
  // Security filter using Pattern 2 (recommended)
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),

  // Joins to other cubes
  joins: {
    Departments: {
      targetCube: () => departmentsCube,
      relationship: 'belongsTo',  // or 'hasOne', 'hasMany', 'belongsToMany'
      on: [{ source: employees.departmentId, target: departments.id }]
    }
  },

  measures: {
    count: { type: 'count', sql: () => employees.id },
    avgSalary: { type: 'avg', sql: () => employees.salary }
  },

  dimensions: {
    name: { type: 'string', sql: () => employees.name },
    createdAt: { type: 'time', sql: () => employees.createdAt }
  }
})
\`\`\`

SECURITY CONTEXT VALIDATION:
When checking if a cube has proper security context, look for EITHER:
- \`sql: (securityContext) => eq(table.organisationId, securityContext.organisationId)\`
- \`sql: (ctx) => ({ from: table, where: eq(table.organisationId, ctx.securityContext.organisationId) })\`
- Any variation that filters by organisationId using the security context parameter

A cube is MISSING security context ONLY if:
- The sql function doesn't use the securityContext/ctx parameter at all
- There's no filter on organisationId (or equivalent tenant identifier)
- The sql property is missing entirely

CUBE RECOMMENDATION TYPES:
When suggesting cube changes, ONLY recommend features that drizzle-cube supports:

SUPPORTED FEATURES:
- dimensions (with sql expressions)
- measures (count, sum, avg, min, max, countDistinct, countDistinctApprox)
- joins (belongsTo, hasOne, hasMany, belongsToMany)
- security context filtering via sql function

NOT SUPPORTED (do NOT recommend these):
- preAggregations (not implemented)
- segments (not implemented)
- refreshKey (not implemented)
- scheduledRefresh (not implemented)

1. ADDING JOINS - If queries frequently combine cubes without explicit joins:
   \`\`\`typescript
   joins: {
     TargetCube: {
       targetCube: () => targetCube,
       relationship: 'belongsTo',  // or 'hasOne', 'hasMany', 'belongsToMany'
       on: [{ source: table.foreignKey, target: targetTable.id }]
     }
   }
   \`\`\`

2. OPTIMIZING BASE QUERY FILTERS (ONLY if SQL lacks tenant filtering):
   NOTE: If the SQL already filters by organisation_id, tenant_id, or similar, the cube is correctly configured.
   Only suggest this if security/tenant filtering is genuinely missing from the generated SQL.
   \`\`\`typescript
   sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
     from: table,
     where: and(
       eq(table.organisationId, ctx.securityContext.organisationId),
       eq(table.isActive, true)  // Add commonly-used filters to base query
     )
   })
   \`\`\`

3. ADDING CALCULATED MEASURES - For commonly-needed aggregations:
   \`\`\`typescript
   measures: {
     averageOrderValue: {
       type: 'avg',
       sql: () => orders.total
     },
     activeUserCount: {
       type: 'count',
       sql: () => users.id,
       filters: [{ sql: () => eq(users.isActive, true) }]
     }
   }
   \`\`\`

CUBE SCHEMA (the semantic layer structure):
{CUBE_SCHEMA}

SEMANTIC QUERY (what the user requested):
{SEMANTIC_QUERY}

GENERATED SQL:
{SQL_QUERY}

EXECUTION PLAN (normalized format):
{NORMALIZED_PLAN}

RAW EXPLAIN OUTPUT:
{RAW_EXPLAIN}

EXISTING INDEXES ON RELEVANT TABLES:
{EXISTING_INDEXES}

IMPORTANT: Before recommending an index, check if it already exists above. If an index already exists:
- Do NOT recommend creating it again
- Instead, note that the index exists and analyze whether it's being used effectively
- If the index exists but isn't being used, recommend investigating why (wrong column order, statistics outdated, etc.)

IMPORTANT: Before recommending security context optimizations, CHECK THE SQL QUERY above for existing filters:
- Look for tenant/security filters like: organisation_id, organizationId, tenant_id, tenantId, org_id, orgId, company_id, companyId, or similar
- If the SQL already contains parameterized filters on any of these columns (e.g., "organisation_id = $1", "tenant_id = ?"), security context IS ALREADY IMPLEMENTED
- Do NOT suggest "add security context" or "optimize base query filters" if the SQL already filters by a tenant identifier
- drizzle-cube AUTOMATICALLY applies security context to all queries - if you see tenant filters in the SQL, the cube is correctly configured
- Only suggest security filter optimizations if the SQL genuinely lacks tenant filtering (which would be a serious bug)

ANALYSIS TASKS:

1. UNDERSTAND THE QUERY
   - What business question is this answering?
   - What cubes and relationships are involved?
   - What aggregations and filters are applied?

2. IDENTIFY PERFORMANCE ISSUES
   - Sequential scans on large tables (look for "Seq Scan" / "ALL" access)
   - Missing indexes (filters/joins on unindexed columns)
   - High row estimates with filters that could benefit from indexes
   - Sort operations that could use indexes

3. GENERATE ACTIONABLE RECOMMENDATIONS
   For each issue, provide:
   - Specific CREATE INDEX statement (if applicable)
   - Exact table and column names
   - Expected impact estimate
   - {DATABASE_TYPE}-specific syntax

INDEX SYNTAX BY DATABASE:
- PostgreSQL: CREATE INDEX idx_name ON table_name (column1, column2);
- MySQL: CREATE INDEX idx_name ON table_name (column1, column2);
- SQLite: CREATE INDEX idx_name ON table_name (column1, column2);

COMPOSITE INDEX GUIDANCE:
- For filters: Index columns used in WHERE clauses
- For joins: Index foreign key columns (e.g., department_id, organisation_id)
- For sorting: Include ORDER BY columns in index
- Multi-tenant: Always consider including organisation_id in composite indexes

RESPONSE FORMAT (JSON):
{
  "summary": "Brief description of what this query does",
  "assessment": "good|warning|critical",
  "assessmentReason": "Why this assessment",
  "queryUnderstanding": "Detailed explanation of the query's purpose and structure",
  "issues": [
    {
      "type": "sequential_scan|missing_index|high_cost|sort_operation",
      "description": "What the issue is",
      "severity": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "type": "index",
      "severity": "critical|warning|suggestion",
      "title": "Short actionable title",
      "description": "Detailed explanation of why this helps",
      "sql": "CREATE INDEX idx_name ON table (columns);",
      "table": "table_name",
      "columns": ["col1", "col2"],
      "estimatedImpact": "Expected improvement"
    },
    {
      "type": "cube",
      "severity": "critical|warning|suggestion",
      "title": "Short actionable title",
      "description": "Why this cube change helps",
      "cubeCode": "TypeScript snippet to add to the cube definition",
      "cubeName": "CubeName",
      "estimatedImpact": "Expected improvement"
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations outside JSON.`

/**
 * Build the complete EXPLAIN analysis prompt with all context
 *
 * @param databaseType - The database engine type
 * @param cubeSchema - JSON-formatted cube schema
 * @param semanticQuery - JSON of the original semantic query
 * @param sqlQuery - The generated SQL query
 * @param normalizedPlan - JSON of the normalized ExplainOperation[]
 * @param rawExplain - Raw EXPLAIN output from the database
 * @param existingIndexes - Optional: JSON of existing indexes on relevant tables
 * @returns Complete prompt ready to send to AI
 */
export function buildExplainAnalysisPrompt(
  databaseType: 'postgres' | 'mysql' | 'sqlite',
  cubeSchema: string,
  semanticQuery: string,
  sqlQuery: string,
  normalizedPlan: string,
  rawExplain: string,
  existingIndexes?: string
): string {
  return EXPLAIN_ANALYSIS_PROMPT
    .replace('{DATABASE_TYPE}', databaseType)
    .replaceAll('{DATABASE_TYPE}', databaseType)
    .replace('{CUBE_SCHEMA}', cubeSchema)
    .replace('{SEMANTIC_QUERY}', semanticQuery)
    .replace('{SQL_QUERY}', sqlQuery)
    .replace('{NORMALIZED_PLAN}', normalizedPlan)
    .replace('{RAW_EXPLAIN}', rawExplain)
    .replace('{EXISTING_INDEXES}', existingIndexes || 'No index information available')
}

/**
 * Format cube metadata for AI consumption
 * Includes relationships and joins for full context
 *
 * @param metadata - Array of CubeMetadata from the semantic layer
 * @returns JSON string formatted for the AI prompt
 */
export function formatCubeSchemaForExplain(metadata: CubeMetadata[]): string {
  const cubes: Record<string, any> = {}

  for (const cube of metadata) {
    cubes[cube.name] = {
      title: cube.title,
      description: cube.description,
      measures: Object.fromEntries(
        cube.measures.map(m => [m.name, { type: m.type, title: m.title }])
      ),
      dimensions: Object.fromEntries(
        cube.dimensions.map(d => [d.name, { type: d.type, title: d.title }])
      ),
      // Include relationships for join context
      relationships: cube.relationships?.map(r => ({
        target: r.targetCube,
        type: r.relationship,
        joinFields: r.joinFields
      })) || []
    }

    // Separate time dimensions from regular dimensions for clarity
    const timeDimensions: Record<string, any> = {}
    for (const dimension of cube.dimensions) {
      if (dimension.type === 'time') {
        timeDimensions[dimension.name] = {
          type: dimension.type,
          title: dimension.title
        }
        // Remove from regular dimensions
        delete cubes[cube.name].dimensions[dimension.name]
      }
    }

    if (Object.keys(timeDimensions).length > 0) {
      cubes[cube.name].timeDimensions = timeDimensions
    }
  }

  return JSON.stringify({ cubes }, null, 2)
}

/**
 * Format existing indexes for AI consumption
 *
 * @param indexes - Array of index information from database query
 * @returns Formatted string for the AI prompt
 */
export function formatExistingIndexes(
  indexes: Array<{
    table_name: string
    index_name: string
    columns: string[]
    is_unique?: boolean
    is_primary?: boolean
  }>
): string {
  if (!indexes || indexes.length === 0) {
    return 'No indexes found on the queried tables.'
  }

  // Group by table
  const byTable: Record<string, typeof indexes> = {}
  for (const idx of indexes) {
    if (!byTable[idx.table_name]) {
      byTable[idx.table_name] = []
    }
    byTable[idx.table_name].push(idx)
  }

  const lines: string[] = []
  for (const [table, tableIndexes] of Object.entries(byTable)) {
    lines.push(`Table: ${table}`)
    for (const idx of tableIndexes) {
      const flags: string[] = []
      if (idx.is_primary) flags.push('PRIMARY KEY')
      if (idx.is_unique && !idx.is_primary) flags.push('UNIQUE')
      const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : ''
      lines.push(`  - ${idx.index_name}: (${idx.columns.join(', ')})${flagStr}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
