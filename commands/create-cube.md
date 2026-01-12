---
name: create-cube
description: Create a new Drizzle Cube definition with measures, dimensions, and security context
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---

# Create Cube Command

Help me create a new Drizzle Cube definition.

## Arguments
- `$1` - Cube name (e.g., "Orders", "Employees")
- `$2` - (Optional) Source table name from Drizzle schema

## Instructions

1. **If source table provided ($2)**, search for the Drizzle schema definition:
   - Look for the table in `schema.ts` or similar files
   - Identify columns, types, and relationships

2. **If no source table**, ask the user which Drizzle table to use

3. **Generate the cube definition** following these patterns:

```typescript
import { defineCube } from 'drizzle-cube/server'
import { eq } from 'drizzle-orm'
import { tableName } from './schema'

export const ${cubeName}Cube = defineCube({
  name: '${CubeName}',

  // CRITICAL: Security context filter (REQUIRED for multi-tenant isolation)
  sql: (securityContext) => eq(tableName.organisationId, securityContext.organisationId),

  measures: {
    count: {
      type: 'count',
      sql: () => tableName.id
    }
    // Add more measures based on numeric columns
  },

  dimensions: {
    id: {
      type: 'number',
      sql: () => tableName.id,
      primaryKey: true
    }
    // Add more dimensions based on columns
  }
})
```

4. **For each column type, suggest appropriate field type:**
   - `integer`, `serial`, `bigint` → `number` dimension or `count`/`sum` measure
   - `varchar`, `text`, `char` → `string` dimension
   - `boolean` → `boolean` dimension
   - `timestamp`, `date`, `datetime` → `time` dimension
   - `numeric`, `decimal`, `float`, `real` → `number` dimension or `avg`/`sum` measure

5. **Suggest measures based on columns:**
   - Primary key → `count`
   - Amount/price columns → `sum`, `avg`
   - Status columns → `countDistinct`

6. **Ask about relationships:**
   - Does this cube relate to other cubes?
   - Suggest `belongsTo` for foreign keys
   - Suggest `hasMany` for reverse relationships

7. **Verify security context:**
   - Ensure the table has an `organisationId` or tenant column
   - If not, ask how to filter for multi-tenant security

8. **Write the file** to an appropriate location (e.g., `src/cubes/${cubeName}.ts`)

## Output
Provide the complete cube definition file with:
- Proper imports
- Security context filter
- Appropriate measures for the data
- Appropriate dimensions for the data
- Suggested joins if foreign keys exist
