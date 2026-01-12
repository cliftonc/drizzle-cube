---
name: debug
description: Debug a Drizzle Cube query using dry-run and explain endpoints
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Debug Command

Help me debug a Drizzle Cube query.

## Arguments
- `$ARGUMENTS` - Query to debug (JSON string or file path)

## Instructions

1. **Parse the query:**
   - If JSON provided, parse it as CubeQuery
   - If file path provided, read the file
   - If nothing provided, ask for the query

2. **Validate query structure:**
   - Check required fields (at least measures OR dimensions)
   - Verify field naming format (Cube.field)
   - Check filter operator validity

3. **Generate dry-run request:**

```bash
curl -X POST http://localhost:4000/cubejs-api/v1/dry-run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIZZLE_CUBE_API_TOKEN" \
  -d '{
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["Products.category"]
  }'
```

4. **Analyze dry-run response:**
   - `valid: true/false` - Is the query valid?
   - `sql` - The generated SQL
   - `cubesUsed` - Which cubes are involved
   - `joinType` - How cubes are joined
   - `complexity` - Query complexity rating

5. **If query is invalid:**
   - Check error messages
   - Verify all fields exist in cube metadata
   - Check for typos in field names
   - Verify filter syntax

6. **Generate explain request** for performance analysis:

```bash
curl -X POST http://localhost:4000/cubejs-api/v1/explain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIZZLE_CUBE_API_TOKEN" \
  -d '{
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["Products.category"]
  }'
```

7. **Analyze explain response:**
   - Execution plan details
   - Scan types (Seq Scan vs Index Scan)
   - Estimated vs actual rows
   - Performance recommendations

8. **Common issues to check:**

**Field not found:**
- Verify cube is registered
- Check field name spelling
- Ensure measure vs dimension is correct

**Security context issues:**
- Verify the cube has `sql` function with security context
- Check if organisationId is being passed

**Join issues:**
- Verify relationships exist between cubes
- Check join direction (belongsTo vs hasMany)

**Performance issues:**
- Large result sets - add LIMIT
- Missing indexes - check EXPLAIN output
- Complex filters - simplify or add indexes

9. **Provide debugging output:**

```
=== Query Debug Report ===

Query:
{
  measures: ["Sales.totalRevenue"],
  dimensions: ["Products.category"]
}

Validation: VALID

Generated SQL:
SELECT
  "products"."category" AS "Products.category",
  SUM("sales"."revenue") AS "Sales.totalRevenue"
FROM "sales"
INNER JOIN "products" ON ...
WHERE "sales"."organisation_id" = $1
GROUP BY 1

Cubes Used: Sales, Products
Join Type: multi_cube_join
Complexity: medium

Execution Plan:
- GroupAggregate (cost=...)
  - Sort (cost=...)
    - Nested Loop (cost=...)

Recommendations:
- Consider adding index on sales.product_id
- Query returns estimated 1,234 rows
```

## Output
- Query validation status
- Generated SQL (formatted)
- Cubes and joins involved
- Execution plan analysis
- Performance recommendations
- Suggested fixes for any issues
