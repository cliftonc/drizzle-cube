# Join System Refactor Implementation Plan

## Executive Summary

### Problem Statement

The current join system in drizzle-cube has several critical issues:

1. **SQL Column Name Resolution**: Join conditions use opaque functions that cannot be inspected at query build time, causing failures when tables need aliases in multi-cube queries.

2. **Security Context Leakage**: Security filtering (organisationId) is not properly applied to joined cubes, causing all organizations to see the same data counts.

3. **Type Safety**: String-based cube references and function-based join conditions prevent compile-time validation.

4. **Fan-out Problem**: Multi-cube queries with hasMany relationships cause row multiplication, leading to incorrect aggregate results.

5. **Circular Dependencies**: Direct cube references would create circular import issues between related cubes.

### Solution Overview

We propose a complete refactor to a **type-safe, array-based join system** with:

- **Lazy Cube References**: Use lazy-loaded functions `() => Cube<T>` to avoid circular dependencies
- **Explicit Column Mapping**: Use Drizzle column objects instead of opaque functions  
- **Flexible Comparators**: Array-based join conditions with customizable comparison operators
- **Security by Default**: Automatic security context application to all joined cubes
- **CTE Pre-aggregation**: Proper handling of hasMany relationships to prevent fan-out
- **No Backward Compatibility**: Clean break from old system to reduce complexity

### Key Design Decision: Lazy Reference Pattern

To solve circular dependency issues while maintaining type safety, we will use lazy references:

```typescript
joins: {
  Employees: {
    targetCube: () => employeesCube,  // Lazy evaluation prevents circular imports
    relationship: 'belongsTo',
    on: [
      { source: productivity.employeeId, target: employees.id }
    ]
  }
}
```

This pattern was chosen over alternatives (registry pattern, two-phase init, etc.) because it:
- Maintains full type safety
- Requires minimal API changes
- Is a common TypeScript pattern for circular dependencies
- Doesn't require additional abstractions

### Expected Outcomes

- ✅ Column name resolution works correctly with table aliases
- ✅ Security context properly isolates data by organization
- ✅ Type safety prevents runtime errors without circular dependencies
- ✅ Fan-out problem eliminated through smart pre-aggregation
- ✅ Cleaner, more maintainable API without backward compatibility complexity

## Technical Design

### Current Architecture Issues

```typescript
// CURRENT (PROBLEMATIC)
joins: {
  'Employees': {  // String reference - no type safety
    targetCube: 'Employees',  // String lookup can fail
    condition: (ctx) => eq(productivity.employeeId, employees.id), // Opaque function
    type: 'left',     // Redundant with relationship
    relationship: 'belongsTo'  // Redundant with type
  }
}
```

**Issues:**
- String-based cube lookups can fail at runtime
- Function conditions can't be inspected for CTE building
- Column references fail when tables have aliases
- Security context not applied to joined cubes
- Redundant `type` and `relationship` fields

### Proposed Architecture

```typescript
// NEW (TYPE-SAFE WITH LAZY REFERENCES)
joins: {
  Employees: {  // Object key for easy access
    targetCube: () => employeesCube,  // Lazy reference - prevents circular imports!
    relationship: 'belongsTo',  // Single source of truth
    on: [  // Array-based for flexibility
      { 
        source: productivity.employeeId,  // Direct Drizzle column reference
        target: employees.id,             // Direct Drizzle column reference
        as: eq  // Optional comparator (defaults to eq)
      }
    ]
  }
}
```

**Benefits:**
- Full compile-time type safety
- No circular dependency issues with lazy evaluation
- Inspectable join conditions for CTE building
- Flexible comparators for complex joins
- Automatic security context application
- Clean, single-purpose fields

### New Type Definitions

```typescript
/**
 * Type-safe cube join definition with lazy loading support
 */
export interface CubeJoin<TSchema extends Record<string, any> = Record<string, any>> {
  /** Target cube reference - lazy loaded to avoid circular dependencies */
  targetCube: Cube<TSchema> | (() => Cube<TSchema>)
  
  /** Semantic relationship - determines join behavior */
  relationship: 'belongsTo' | 'hasOne' | 'hasMany'
  
  /** Array of join conditions - supports multi-column joins */
  on: Array<{
    /** Column from source cube */
    source: AnyColumn
    /** Column from target cube */  
    target: AnyColumn
    /** Comparison operator - defaults to eq */
    as?: (source: AnyColumn, target: AnyColumn) => SQL
  }>
  
  /** Override default SQL join type (derived from relationship) */
  sqlJoinType?: 'inner' | 'left' | 'right' | 'full'
}

/**
 * Resolve cube reference (handles both direct and lazy references)
 */
function resolveCubeReference<TSchema>(
  ref: Cube<TSchema> | (() => Cube<TSchema>)
): Cube<TSchema> {
  return typeof ref === 'function' ? ref() : ref
}

/**
 * Derive SQL join type from semantic relationship
 */
function getJoinType(relationship: string, override?: string): string {
  if (override) return override
  
  switch (relationship) {
    case 'belongsTo': return 'inner'  // FK should exist
    case 'hasOne':    return 'left'   // Parent may have no child
    case 'hasMany':   return 'left'   // Parent may have no children
    default:          return 'left'   // Safe default
  }
}
```

## Implementation Phases

### Phase 1: Type System Updates
**Duration: 2 days**  
**Risk: Low** - Only type definitions, no runtime changes

#### Tasks
1. **Update `CubeJoin` interface** in `src/server/types-drizzle.ts`
   - Replace entire interface with new lazy-reference version
   - Change `targetCube` from `string` to `Cube<TSchema> | (() => Cube<TSchema>)`
   - Remove old fields (`type`, `condition`) completely
   - Add new array-based `on` field
   - Add optional `sqlJoinType` override

2. **Add helper functions**
   - `resolveCubeReference(ref)` - Handle lazy/direct references
   - `getJoinType(relationship, override?)` - Derive SQL join type
   - Remove any backward compatibility code

3. **Update imports and exports**
   - Ensure `AnyColumn` is imported from drizzle-orm
   - Export new types and helpers from main entry points

#### Validation
- TypeScript compilation succeeds
- No runtime behavior changes yet
- Existing tests will fail (expected - will fix in Phase 5)

### Phase 2: Core Join Logic Implementation  
**Duration: 3 days**  
**Risk: Medium** - Core query building logic

#### Tasks
1. **Update QueryPlanner** (`src/server/query-planner.ts`)
   - Implement new `buildJoinCondition()` with array processing
   - Handle custom comparators (`as` function)
   - Add `resolveCubeReference()` calls for lazy references
   - Remove ALL old `condition` function handling

2. **Update join condition building**
   ```typescript
   private buildJoinCondition(
     joinDef: CubeJoin<TSchema>,
     sourceAlias: string | null,
     targetAlias: string,
     context: QueryContext<TSchema>
   ): SQL {
     const conditions: SQL[] = []
     
     // Process array of join conditions
     for (const joinOn of joinDef.on) {
       const sourceCol = sourceAlias 
         ? sql`${sql.identifier(sourceAlias)}.${sql.identifier(joinOn.source.name)}`
         : joinOn.source
         
       const targetCol = sql`${sql.identifier(targetAlias)}.${sql.identifier(joinOn.target.name)}`
       
       // Use custom comparator or default to eq
       const comparator = joinOn.as || eq
       conditions.push(comparator(sourceCol, targetCol))
     }
     
     return and(...conditions)!
   }
   ```

3. **Update cube resolution**
   - Replace string-based `cubes.get(targetCube)` with `resolveCubeReference(joinDef.targetCube)`
   - Remove cube lookup error handling (no longer needed with direct references)
   - Update join type derivation to use `getJoinType(relationship, sqlJoinType)`

#### Testing
- Create unit tests for `buildJoinCondition()`
- Test multi-column joins
- Test custom comparators
- Ensure proper aliasing

#### Validation
- Simple single-cube queries work
- Join condition building works with proper aliases
- Custom comparators function correctly

### Phase 3: Security Validation & Join Testing  
**Duration: 2-3 days**  
**Risk: Medium** - Validation only, no complex security changes needed

#### Tasks
1. **Verify security is already working correctly**
   ```typescript
   // Security is ALREADY handled properly:
   // - CTEs: Security applied inside the CTE via cube.sql(context).where
   // - Regular joins: Each cube's base query already has security filtering
   
   // NO COMPLEX ALIAS REWRITING NEEDED!
   // The issue is column resolution, not security application
   ```

2. **Focus on column resolution validation**
   ```typescript
   // Simply ensure that when we build join conditions,
   // the column names resolve correctly with table aliases:
   
   const sourceCol = sourceAlias 
     ? sql`${sql.identifier(sourceAlias)}.${sql.identifier(joinOn.source.name)}`
     : joinOn.source
   
   // Drizzle columns know their names - no complex parsing needed!
   ```

3. **Test security isolation works with new column resolution**
   - Verify org1 and org2 see different data (should already work)
   - Ensure column aliases don't break existing security

#### Testing
- **Critical**: Multi-tenant security tests
- Test with different organization IDs
- Verify proper filtering in multi-cube queries
- Test both regular joins and pre-aggregated CTEs

#### Validation
- org1 employees != org2 employees in multi-cube queries
- Security context applied to all joined cubes
- No data leakage between tenants

### Phase 4: CTE/Pre-aggregation Handling
**Duration: 4-5 days**  
**Risk: High** - Complex query building logic

#### Tasks
1. **Update CTE building** to use new join format
   ```typescript
   private buildPreAggregationCTE(
     preAgg: PreAggregationPlan<TSchema>,
     query: SemanticQuery,
     context: QueryContext<TSchema>
   ): any {
     const cube = preAgg.cube
     const cubeBase = cube.sql(context)  // Includes security!
     
     // Extract join key column names from Drizzle columns
     const joinKeyColumns = this.extractJoinKeyColumns(preAgg.joinKeys, cube)
     
     // Build CTE with all filtering inside
     let cteQuery = context.db
       .select(this.buildCTESelections(cube, preAgg, joinKeyColumns))
       .from(cubeBase.from)
       .where(cubeBase.where)  // Security applied inside CTE
     
     return context.db.$with(`${cube.name.toLowerCase()}_agg`).as(cteQuery)
   }
   ```

2. **Fix CTE join conditions**
   ```typescript
   private buildCTEJoinCondition(
     joinDef: CubeJoin<TSchema>,
     cteName: string
   ): SQL {
     const conditions: SQL[] = []
     
     for (const joinOn of joinDef.on) {
       const cteCol = sql`${sql.identifier(cteName)}.${sql.identifier(joinOn.source.name)}`
       const comparator = joinOn.as || eq
       conditions.push(comparator(cteCol, joinOn.target))
     }
     
     return and(...conditions)!
   }
   ```

3. **Update fan-out detection**
   - Use `relationship: 'hasMany'` to detect pre-aggregation needs
   - Check if measures are selected from the "many" side

#### Testing
- **Critical**: Fan-out problem validation
- Test multi-cube queries with hasMany relationships
- Verify correct aggregation results
- Test CTE generation and execution

#### Validation
- Fan-out problem eliminated
- Correct aggregate values in multi-cube queries
- CTEs properly pre-aggregate before joining
- Security applied inside CTEs

### Phase 5: Migration of Existing Code
**Duration: 2 days**  
**Risk: Low** - Mechanical transformation

#### Tasks
1. **Update all cube definitions** in `tests/helpers/test-cubes.ts`
   ```typescript
   // OLD - REMOVE COMPLETELY
   joins: {
     'Employees': {
       targetCube: 'Employees',
       condition: (ctx) => eq(productivity.employeeId, employees.id),
       type: 'left',
       relationship: 'belongsTo'
     }
   }
   
   // NEW - WITH LAZY REFERENCES
   joins: {
     Employees: {
       targetCube: () => employeesCube,  // Lazy reference to avoid circular imports
       relationship: 'belongsTo',
       on: [
         { source: productivity.employeeId, target: employees.id }
       ]
     }
   }
   ```

2. **Handle circular dependencies with lazy pattern**
   - All cube-to-cube references must use arrow functions
   - Cubes can be defined in any order without import issues
   - No need for complex import management

3. **Remove ALL deprecated code**
   - Delete old `condition` function support entirely
   - Remove `type` field processing
   - Clean up ALL backward compatibility code
   - Remove string-based cube lookups

#### Testing
- All existing tests must pass
- No regressions in query functionality
- Performance should be same or better

### Phase 6: Testing & Validation
**Duration: 3-4 days**  
**Risk: Medium** - Comprehensive validation needed

#### New Test Categories

1. **Fan-out Validation Tests**
   ```typescript
   describe('Fan-out Prevention', () => {
     it('should prevent incorrect aggregation in hasMany joins', async () => {
       const query = {
         measures: ['Employees.count', 'Productivity.recordCount'],
         dimensions: [],
         filters: [{ member: 'Employees.organisationId', operator: 'equals', values: ['1'] }]
       }
       
       const result = await executor.executeQuery(query)
       
       // Should not be multiplied by productivity records
       expect(result.data[0]['Employees.count']).toBe(19) // Not 19 * productivity_records
     })
   })
   ```

2. **Security Isolation Tests**
   ```typescript
   describe('Security Context', () => {
     it('should isolate data by organization in multi-cube queries', async () => {
       // Test org1
       const org1Query = await executeWithContext({ organisationId: 1 }, query)
       
       // Test org2  
       const org2Query = await executeWithContext({ organisationId: 2 }, query)
       
       expect(org1Query.data[0]['Employees.count']).not.toBe(org2Query.data[0]['Employees.count'])
     })
   })
   ```

3. **Type Safety Tests**
   ```typescript
   describe('Type Safety', () => {
     it('should catch invalid cube references at compile time', () => {
       // This should fail TypeScript compilation
       const invalidJoin = {
         targetCube: 'NonExistentCube',  // TypeScript error
         relationship: 'belongsTo',
         on: [{ source: productivity.employeeId, target: employees.id }]
       }
     })
   })
   ```

4. **Complex Join Tests**
   ```typescript
   describe('Complex Joins', () => {
     it('should handle multi-column joins', async () => {
       const joinDef = {
         targetCube: projectTasksCube,
         relationship: 'hasMany',
         on: [
           { source: projects.id, target: tasks.projectId },
           { source: projects.version, target: tasks.projectVersion }
         ]
       }
       
       // Test that multi-column join works correctly
     })
     
     it('should handle custom comparators', async () => {
       const joinDef = {
         targetCube: activitiesCube,
         relationship: 'hasMany',
         on: [
           { source: users.id, target: activities.userId },
           { 
             source: users.createdAt, 
             target: activities.timestamp,
             as: (source, target) => gte(target, source)
           }
         ]
       }
       
       // Test that custom comparator works
     })
   })
   ```

#### Performance Benchmarks

1. **Query Performance**
   - Measure query execution time before/after refactor
   - Ensure no significant regressions
   - CTE queries should be faster due to pre-aggregation

2. **Memory Usage**
   - Monitor memory usage during complex multi-cube queries
   - Ensure CTEs don't cause memory spikes

#### Integration Testing

1. **All Existing Tests Must Pass**
   - Run full test suite after each phase
   - Zero regressions allowed
   - Fix any breaking changes immediately

2. **Adapter Tests**
   - Test with all adapters (Express, Fastify, Hono, Next.js)
   - Ensure API compatibility maintained
   - Test with all database types (PostgreSQL, MySQL, SQLite)

## Risk Assessment

### High-Risk Areas

1. **Security Context Application** (Phase 3)
   - **Risk**: Data leakage between organizations
   - **Mitigation**: Extensive multi-tenant testing
   - **Rollback**: Can revert to function-based joins temporarily

2. **CTE Query Building** (Phase 4)  
   - **Risk**: Complex SQL generation failures
   - **Mitigation**: Comprehensive CTE testing, manual SQL verification
   - **Rollback**: Disable pre-aggregation, accept fan-out temporarily

3. **Type System Changes** (Phase 1)
   - **Risk**: Breaking existing code
   - **Mitigation**: Gradual migration, backward compatibility where possible
   - **Rollback**: Revert type definitions

### Medium-Risk Areas

1. **Join Condition Building** (Phase 2)
   - **Risk**: SQL generation errors
   - **Mitigation**: Unit tests for all join types
   - **Rollback**: Use legacy condition functions

2. **Performance Regressions**
   - **Risk**: Slower queries
   - **Mitigation**: Continuous benchmarking
   - **Rollback**: Optimize or revert problematic changes

### Low-Risk Areas

1. **Code Migration** (Phase 5)
   - **Risk**: Mechanical transformation errors
   - **Mitigation**: Automated testing
   - **Rollback**: Easy to fix individual cube definitions

## Success Criteria

### Functional Requirements
- ✅ All existing tests pass without modification
- ✅ Fan-out problem eliminated (correct aggregate counts)  
- ✅ Security context properly isolates organizations
- ✅ Multi-column joins work correctly
- ✅ Custom comparators function as expected
- ✅ CTE pre-aggregation prevents row multiplication

### Non-Functional Requirements  
- ✅ No performance regressions (< 5% slower acceptable)
- ✅ Full compile-time type safety
- ✅ Clean, maintainable code
- ✅ Comprehensive test coverage (>90%)
- ✅ Clear migration path for future users

### Technical Validation
- ✅ SQL generated uses proper table aliases
- ✅ Column references resolve correctly
- ✅ Security WHERE clauses applied to all joined cubes
- ✅ Pre-aggregation CTEs built correctly
- ✅ No memory leaks or excessive resource usage

## Migration Guide for Future Users

### Breaking Changes (No Backward Compatibility)

1. **Join Configuration Format**
   ```typescript
   // OLD - COMPLETELY REMOVED
   joins: {
     'Employees': {
       targetCube: 'Employees',  // String reference - NO LONGER SUPPORTED
       condition: (ctx) => eq(productivity.employeeId, employees.id),  // Function - REMOVED
       type: 'left',  // Redundant field - REMOVED
       relationship: 'belongsTo'
     }
   }
   
   // NEW - REQUIRED FORMAT WITH LAZY REFERENCES
   joins: {
     Employees: {
       targetCube: () => employeesCube,  // Lazy reference - REQUIRED for avoiding circular deps
       relationship: 'belongsTo', 
       on: [  // Array-based conditions - REQUIRED
         { source: productivity.employeeId, target: employees.id }
       ]
     }
   }
   ```

2. **Lazy Reference Pattern**
   - ALL cube references must use arrow functions: `() => cubeName`
   - This prevents circular import issues
   - Cubes can reference each other bidirectionally

### Migration Steps

1. **Use lazy references** for ALL targetCube fields: `() => cubeName`
2. **Replace string `targetCube`** with lazy cube reference
3. **Convert `condition` function** to `on` array
4. **Remove `type` field** entirely (use `relationship` instead)
5. **Remove ALL string-based cube lookups**
6. **Test thoroughly** - NO backward compatibility means all code must be updated

### Advanced Features

1. **Multi-column joins**
   ```typescript
   on: [
     { source: table1.col1, target: table2.col1 },
     { source: table1.col2, target: table2.col2 }
   ]
   ```

2. **Custom comparators**
   ```typescript
   on: [
     { 
       source: users.createdAt, 
       target: activities.timestamp,
       as: (source, target) => gte(target, source)
     }
   ]
   ```

## Timeline

| Phase | Duration | Dependencies | Risk Level |
|-------|----------|--------------|------------|
| Phase 1: Types | 2 days | - | Low |
| Phase 2: Core Logic | 3 days | Phase 1 | Medium |  
| Phase 3: Validation | 1 day | Phase 2 | Low |
| Phase 4: CTEs | 4 days | Phase 3 | High |
| Phase 5: Migration | 2 days | Phase 4 | Low |
| Phase 6: Testing | 3 days | All phases | Medium |
| **Total** | **15 days** | **~3 weeks** | |

## Rollback Strategy

Each phase has a clear rollback path:

1. **Git branches** for each phase
2. **Feature flags** for new join system vs old
3. **Backward compatibility** maintained until Phase 5
4. **Automated tests** prevent regressions
5. **Performance monitoring** catches issues early

If critical issues arise, we can:
1. Revert the problematic phase
2. Fall back to legacy join system
3. Fix issues and re-deploy incrementally

## Next Steps

1. **Review and approve** this implementation plan
2. **Create Phase 1 branch** and begin type system updates
3. **Set up monitoring** for performance and correctness
4. **Begin Phase 1** implementation with daily progress reviews

This comprehensive plan ensures we solve the fan-out and security issues while maintaining system stability and providing a clear path forward.