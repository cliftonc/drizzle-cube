# Security

Security in Drizzle Cube is built on three core principles: **multi-tenant data isolation**, **SQL injection prevention**, and **role-based access control**. The security model leverages Drizzle ORM's type-safe, parameterized queries to ensure your data remains secure and properly isolated.

## Overview

Drizzle Cube's security-first design ensures that every query is automatically filtered by security context, preventing data leakage between tenants and protecting against SQL injection attacks. All security filtering is applied at the database level for maximum performance and reliability.

## Security Context

The security context is the foundation of Drizzle Cube's security model. It contains user and tenant-specific information that is automatically injected into all cube queries.

### Basic Security Context Structure

```typescript
interface SecurityContext {
  organisationId: string    // Tenant/organization identifier (REQUIRED)
  userId?: string          // Current user ID
  userRole?: string        // User role/permission level
  departmentId?: string    // Department-level filtering
  [key: string]: any       // Additional custom fields
}
```

### Extracting Security Context

Define how to extract security context from your application's request context:

```typescript
// Hono adapter example
import { createCubeApp } from 'drizzle-cube/adapters/hono'

const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    const user = await validateToken(token)
    
    return {
      organisationId: user.organisationId,  // REQUIRED for multi-tenant security
      userId: user.id,
      userRole: user.role,
      departmentId: user.departmentId
    }
  }
})
```

## Multi-Tenant Security

**CRITICAL**: Every cube must implement organization-level filtering to ensure data isolation between tenants.

### Required Organization Filtering

```typescript
export const employeesCube: Cube<Schema> = defineCube('Employees', {
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: employees,
    // REQUIRED: Filter by organization for multi-tenant security
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  })
})
```

### Multi-Level Security Filtering

Apply multiple layers of security filtering:

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => {
  const securityFilters = [
    // Level 1: Organization isolation (REQUIRED)
    eq(employees.organisationId, ctx.securityContext.organisationId)
  ]
  
  // Level 2: Department-level access
  if (ctx.securityContext.departmentId) {
    securityFilters.push(
      eq(employees.departmentId, ctx.securityContext.departmentId)
    )
  }
  
  // Level 3: Role-based filtering
  if (ctx.securityContext.userRole !== 'admin') {
    securityFilters.push(
      eq(employees.id, ctx.securityContext.userId)
    )
  }
  
  return {
    from: employees,
    where: and(...securityFilters)
  }
}
```

### Secure Table Joins

Apply security context to ALL joined tables:

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: productivity,
  joins: [
    {
      table: employees,
      on: and(
        eq(productivity.employeeId, employees.id),
        // CRITICAL: Security filtering on joined table
        eq(employees.organisationId, ctx.securityContext.organisationId)
      ),
      type: 'left'
    },
    {
      table: departments,
      on: and(
        eq(employees.departmentId, departments.id),
        // CRITICAL: Security filtering on all joined tables
        eq(departments.organisationId, ctx.securityContext.organisationId)
      ),
      type: 'left'
    }
  ],
  where: eq(productivity.organisationId, ctx.securityContext.organisationId)
})
```

## Role-Based Access Control

Implement fine-grained access control using security context:

### Role-Based Cube Access

```typescript
// Manager-only cube
export const salaryAnalyticsCube: Cube<Schema> = defineCube('SalaryAnalytics', {
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => {
    // Check role-based access
    if (!['admin', 'manager'].includes(ctx.securityContext.userRole)) {
      throw new Error('Access denied: Insufficient permissions for salary data')
    }
    
    return {
      from: employees,
      where: and(
        eq(employees.organisationId, ctx.securityContext.organisationId),
        // Managers can only see their department
        ctx.securityContext.userRole === 'manager' 
          ? eq(employees.departmentId, ctx.securityContext.departmentId)
          : sql`true`
      )
    }
  }
})
```

### Conditional Data Filtering

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => {
  const baseFilters = [
    eq(employees.organisationId, ctx.securityContext.organisationId)
  ]
  
  // Role-specific data access
  switch (ctx.securityContext.userRole) {
    case 'admin':
      // Admins see all organization data
      break
      
    case 'manager':
      // Managers see their department only
      baseFilters.push(
        eq(employees.departmentId, ctx.securityContext.departmentId)
      )
      break
      
    case 'employee':
      // Employees see only their own data
      baseFilters.push(
        eq(employees.id, ctx.securityContext.userId)
      )
      break
      
    default:
      throw new Error('Invalid user role')
  }
  
  return {
    from: employees,
    where: and(...baseFilters)
  }
}
```

## SQL Injection Prevention

Drizzle Cube prevents SQL injection through Drizzle ORM's parameterized queries and type-safe SQL builder.

### Safe Practices (DO)

```typescript
// ✅ SAFE: Using Drizzle column references
sql: employees.name

// ✅ SAFE: Using Drizzle sql template with parameters
sql: sql`${employees.salary} > ${ctx.securityContext.minSalary}`

// ✅ SAFE: Using Drizzle operators with parameters
where: and(
  eq(employees.organisationId, ctx.securityContext.organisationId),
  gt(employees.salary, ctx.securityContext.minSalary)
)

// ✅ SAFE: Using security context values (pre-validated)
where: eq(employees.departmentId, ctx.securityContext.departmentId)
```

### Unsafe Practices (DON'T)

```typescript
// ❌ DANGEROUS: Raw string concatenation
sql: `SELECT * FROM employees WHERE name = '${userName}'`

// ❌ DANGEROUS: Dynamic SQL construction
sql: `SELECT * FROM ${tableName} WHERE ${columnName} = ${value}`

// ❌ DANGEROUS: Unvalidated user input
sql: sql`SELECT * FROM employees WHERE ${sql.raw(userInput)}`
```

### Secure Parameter Handling

```typescript
// ✅ CORRECT: Parameters automatically escaped
dimensions: {
  searchResults: {
    name: 'searchResults',
    title: 'Search Results',
    type: 'string',
    sql: sql`
      CASE 
        WHEN ${employees.name} ILIKE ${`%${ctx.query.searchTerm}%`} THEN 'Match'
        ELSE 'No Match'
      END
    `
  }
}
```

## Data Masking and Privacy

Implement data masking for sensitive information:

### Column-Level Security

```typescript
dimensions: {
  email: {
    name: 'email',
    title: 'Email',
    type: 'string',
    sql: ctx.securityContext.userRole === 'admin' 
      ? employees.email
      : sql`REGEXP_REPLACE(${employees.email}, '(.{2}).*(@.*)', '\\1***\\2')`
  },
  
  salary: {
    name: 'salary',
    title: 'Salary',
    type: 'number',
    sql: ['admin', 'hr'].includes(ctx.securityContext.userRole)
      ? employees.salary
      : sql`NULL` // Hide salary for non-authorized users
  }
}
```

### Conditional Measure Access

```typescript
measures: {
  avgSalary: {
    name: 'avgSalary',
    title: 'Average Salary',
    type: 'avg',
    sql: ['admin', 'hr'].includes(ctx.securityContext.userRole)
      ? employees.salary
      : sql`NULL`,
    description: 'Available to HR and Admin roles only'
  }
}
```

## Audit and Logging

Track data access for compliance and security monitoring:

### Query Logging

```typescript
// In your adapter or middleware
const logQuery = (query: SemanticQuery, context: SecurityContext) => {
  console.log('Analytics Query:', {
    timestamp: new Date().toISOString(),
    userId: context.userId,
    organisationId: context.organisationId,
    cubes: query.measures?.map(m => m.split('.')[0]) || [],
    dimensions: query.dimensions || [],
    filters: query.filters || []
  })
}
```

### Access Control Logging

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => {
  // Log access attempt
  if (ctx.securityContext.userRole !== 'admin') {
    logAccess({
      action: 'CUBE_ACCESS',
      cube: 'SalaryAnalytics',
      userId: ctx.securityContext.userId,
      result: 'DENIED'
    })
    throw new Error('Access denied')
  }
  
  return {
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }
}
```

## Testing Security

**CRITICAL**: Always test security isolation to prevent data leakage.

### Multi-Tenant Isolation Tests

```typescript
describe('Security Isolation', () => {
  it('should isolate data by organisation', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: []
    }
    
    // Test org 1
    const result1 = await semanticLayer.load(query, {
      organisationId: 'org-1'
    })
    
    // Test org 2
    const result2 = await semanticLayer.load(query, {
      organisationId: 'org-2'  
    })
    
    // Results should be different and non-overlapping
    expect(result1.rawData()).not.toEqual(result2.rawData())
  })
  
  it('should enforce role-based access', async () => {
    const query = {
      measures: ['Employees.avgSalary'],
      dimensions: []
    }
    
    // Should succeed for admin
    const adminResult = await semanticLayer.load(query, {
      organisationId: 'test-org',
      userRole: 'admin'
    })
    expect(adminResult.rawData()[0]['Employees.avgSalary']).toBeDefined()
    
    // Should fail or return null for regular employee
    const employeeResult = await semanticLayer.load(query, {
      organisationId: 'test-org',
      userRole: 'employee'
    })
    expect(employeeResult.rawData()[0]['Employees.avgSalary']).toBeNull()
  })
})
```

### Security Context Validation

```typescript
describe('Security Context', () => {
  it('should require organisation ID', async () => {
    const query = { measures: ['Employees.count'], dimensions: [] }
    
    await expect(
      semanticLayer.load(query, {})  // Missing organisationId
    ).rejects.toThrow('organisationId is required')
  })
  
  it('should validate user permissions', async () => {
    await expect(
      semanticLayer.load(
        { measures: ['SalaryAnalytics.count'], dimensions: [] },
        { organisationId: 'test-org', userRole: 'employee' }
      )
    ).rejects.toThrow('Access denied')
  })
})
```

## Best Practices

1. **Organization Filtering**: ALWAYS filter by organizationId in every cube
2. **Join Security**: Apply security context to ALL joined tables
3. **Parameter Safety**: Use Drizzle's parameterized queries exclusively
4. **Role Validation**: Validate user roles before data access
5. **Audit Logging**: Log all data access for compliance
6. **Test Security**: Write comprehensive security isolation tests
7. **Principle of Least Privilege**: Grant minimal necessary access

## Security Checklist

- [ ] Every cube filters by `organisationId`
- [ ] All joined tables include security context filtering
- [ ] No raw SQL string concatenation
- [ ] Role-based access controls implemented
- [ ] Sensitive data is masked appropriately
- [ ] Security tests cover tenant isolation
- [ ] Audit logging is in place
- [ ] Security context validation is implemented

## Common Security Patterns

### Basic Tenant Isolation
```typescript
where: eq(table.organisationId, ctx.securityContext.organisationId)
```

### Role-Based Access
```typescript
sql: (ctx) => {
  if (ctx.securityContext.userRole !== 'admin') {
    throw new Error('Access denied')
  }
  // ... cube definition
}
```

### Department-Level Security
```typescript
where: and(
  eq(table.organisationId, ctx.securityContext.organisationId),
  eq(table.departmentId, ctx.securityContext.departmentId)
)
```

### Secure Join Pattern
```typescript
joins: [{
  table: joinedTable,
  on: and(
    eq(mainTable.foreignKey, joinedTable.id),
    eq(joinedTable.organisationId, ctx.securityContext.organisationId)
  )
}]
```

## Next Steps

- Review [Cubes](/help/semantic-layer/cubes) for complete security implementation
- Understand [Joins](/help/semantic-layer/joins) security requirements
- Learn about [Adapters](/help/adapters/hono) security context extraction
- Implement comprehensive security testing

## Roadmap Ideas

- Advanced RBAC with fine-grained permissions
- Field-level encryption for sensitive data
- Security policy configuration UI
- Automated security testing framework
- Compliance reporting and audit trails
- Integration with external identity providers