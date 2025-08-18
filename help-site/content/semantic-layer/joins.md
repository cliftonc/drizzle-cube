# Joins

Joins in Drizzle Cube enable you to combine data from multiple tables and cubes, creating rich, interconnected analytics. There are two types of joins: **table-level joins** within individual cubes and **cube-level joins** for multi-cube queries.

## Overview

Drizzle Cube's join system leverages Drizzle ORM's type-safe join capabilities to provide secure, performant data relationships. All joins maintain security context and prevent SQL injection through parameterized queries.

## Table-Level Joins

Table-level joins occur within a single cube's SQL definition, allowing you to join multiple database tables into one logical dataset.

### Basic Table Join Structure

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: employees,
  joins: [
    {
      table: departments,
      on: and(
        eq(employees.departmentId, departments.id),
        eq(departments.organisationId, ctx.securityContext.organisationId)
      ),
      type: 'left'
    }
  ],
  where: eq(employees.organisationId, ctx.securityContext.organisationId)
})
```

### Join Types

**Left Join** - Most common, includes all records from the main table:
```typescript
joins: [
  {
    table: departments,
    on: eq(employees.departmentId, departments.id),
    type: 'left'
  }
]
```

**Inner Join** - Only records that exist in both tables:
```typescript
joins: [
  {
    table: departments,
    on: eq(employees.departmentId, departments.id),
    type: 'inner'
  }
]
```

**Right Join** - Includes all records from the joined table:
```typescript
joins: [
  {
    table: departments,
    on: eq(employees.departmentId, departments.id),
    type: 'right'
  }
]
```

### Multi-Table Joins

Join multiple tables in a single cube:

```typescript
export const productivityCube: Cube<Schema> = defineCube('Productivity', {
  title: 'Productivity Analytics',
  description: 'Employee productivity with department and project data',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: productivity,
    joins: [
      // Join to employees table
      {
        table: employees,
        on: and(
          eq(productivity.employeeId, employees.id),
          eq(employees.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      },
      // Join to departments through employees
      {
        table: departments,
        on: and(
          eq(employees.departmentId, departments.id),
          eq(departments.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      },
      // Join to projects table
      {
        table: projects,
        on: and(
          eq(productivity.projectId, projects.id),
          eq(projects.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      }
    ],
    where: eq(productivity.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    employeeName: {
      name: 'employeeName',
      title: 'Employee',
      type: 'string',
      sql: employees.name
    },
    departmentName: {
      name: 'departmentName',
      title: 'Department',
      type: 'string',
      sql: departments.name
    },
    projectName: {
      name: 'projectName',
      title: 'Project',
      type: 'string',
      sql: projects.name
    }
  }
  // ... measures
})
```

### Security in Table Joins

**Critical**: Always include security context filtering in join conditions:

```typescript
joins: [
  {
    table: departments,
    on: and(
      eq(employees.departmentId, departments.id),
      // REQUIRED: Security filtering on joined table
      eq(departments.organisationId, ctx.securityContext.organisationId)
    ),
    type: 'left'
  }
]
```

## Cube-Level Joins

Cube-level joins define relationships between different cubes, enabling multi-cube queries and cross-cube analysis.

### Basic Cube Join Structure

```typescript
// In the Employees cube
joins: {
  'Departments': {
    targetCube: 'Departments',
    condition: () => eq(employees.departmentId, departments.id),
    type: 'left',
    relationship: 'belongsTo'
  }
}

// In the Productivity cube  
joins: {
  'Employees': {
    targetCube: 'Employees',
    condition: () => eq(productivity.employeeId, employees.id),
    type: 'left',
    relationship: 'belongsTo'
  },
  'Departments': {
    targetCube: 'Departments',
    condition: () => and(
      eq(productivity.employeeId, employees.id),
      eq(employees.departmentId, departments.id)
    ),
    type: 'left',
    relationship: 'belongsTo'
  }
}
```

### Relationship Types

**belongsTo** - Many-to-one relationship:
```typescript
// Employee belongs to Department
'Departments': {
  targetCube: 'Departments',
  condition: () => eq(employees.departmentId, departments.id),
  relationship: 'belongsTo'
}
```

**hasMany** - One-to-many relationship:
```typescript
// Department has many Employees
'Employees': {
  targetCube: 'Employees',
  condition: () => eq(departments.id, employees.departmentId),
  relationship: 'hasMany'
}
```

**hasOne** - One-to-one relationship:
```typescript
// Employee has one Profile
'UserProfiles': {
  targetCube: 'UserProfiles', 
  condition: () => eq(employees.id, userProfiles.employeeId),
  relationship: 'hasOne'
}
```

### Multi-Cube Query Example

Query data from multiple cubes using cube joins:

```typescript
const multiCubeQuery = {
  measures: [
    'Employees.count',           // From Employees cube
    'Departments.totalBudget',   // From Departments cube
    'Productivity.avgLinesOfCode' // From Productivity cube
  ],
  dimensions: [
    'Departments.name',          // Group by department
    'Employees.isActive'         // Split by active status
  ],
  timeDimensions: [{
    dimension: 'Productivity.date',
    granularity: 'month'
  }]
}
```

## Advanced Join Patterns

### Conditional Joins

Apply conditional logic in join conditions:

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: orders,
  joins: [
    {
      table: customers,
      on: and(
        eq(orders.customerId, customers.id),
        // Conditional join based on security context
        ctx.securityContext.userRole === 'admin' 
          ? sql`true` 
          : eq(customers.salesRepId, ctx.securityContext.userId),
        eq(customers.organisationId, ctx.securityContext.organisationId)
      ),
      type: 'left'
    }
  ],
  where: eq(orders.organisationId, ctx.securityContext.organisationId)
})
```

### Self-Joins

Join a table to itself for hierarchical data:

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: employees,
  joins: [
    {
      table: alias(employees, 'manager'),
      on: and(
        eq(employees.managerId, sql`manager.id`),
        eq(sql`manager.organisationId`, ctx.securityContext.organisationId)
      ),
      type: 'left'
    }
  ],
  where: eq(employees.organisationId, ctx.securityContext.organisationId)
}),

dimensions: {
  name: {
    name: 'name',
    title: 'Employee Name',
    type: 'string',
    sql: employees.name
  },
  managerName: {
    name: 'managerName',
    title: 'Manager Name',
    type: 'string',
    sql: sql`manager.name`
  }
}
```

### Complex Join Conditions

Use complex conditions for specialized joins:

```typescript
joins: [
  {
    table: productivityTargets,
    on: and(
      eq(employees.id, productivityTargets.employeeId),
      eq(employees.departmentId, productivityTargets.departmentId),
      // Join on date range
      sql`${productivity.date} BETWEEN ${productivityTargets.startDate} AND ${productivityTargets.endDate}`,
      eq(productivityTargets.organisationId, ctx.securityContext.organisationId)
    ),
    type: 'left'
  }
]
```

## Join Resolution and Path Finding

Drizzle Cube automatically resolves join paths between cubes using the `JoinPathResolver`:

```typescript
// Automatic path finding from Productivity → Employees → Departments
const query = {
  measures: ['Productivity.totalLinesOfCode'],
  dimensions: ['Departments.name'] // Automatically resolves join path
}
```

### Manual Join Path Control

Control join resolution explicitly:

```typescript
// Force specific join path
joins: {
  'Departments': {
    targetCube: 'Departments',
    condition: () => and(
      // Explicit multi-step join path
      eq(productivity.employeeId, employees.id),
      eq(employees.departmentId, departments.id)
    ),
    type: 'left',
    relationship: 'belongsTo',
    // Optional: specify intermediate cubes
    path: ['Employees']
  }
}
```

## Performance Optimization

### Join Order Optimization

Structure joins for optimal performance:

```typescript
// Good: Start with most selective table
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: activeEmployees, // Pre-filtered view
  joins: [
    {
      table: departments,
      on: eq(activeEmployees.departmentId, departments.id),
      type: 'left'
    }
  ],
  where: eq(activeEmployees.organisationId, ctx.securityContext.organisationId)
})
```

### Index-Friendly Joins

Ensure join conditions use indexed columns:

```typescript
joins: [
  {
    table: departments,
    // Good: uses indexed foreign key
    on: eq(employees.departmentId, departments.id),
    type: 'left'
  }
]
```

## Testing Joins

```typescript
describe('Cube Joins', () => {
  it('should join employees with departments', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.departmentName']
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: 'test-org'
    })
    
    const data = result.rawData()
    expect(data.every(row => row['Employees.departmentName'])).toBeTruthy()
  })
  
  it('should handle multi-cube queries', async () => {
    const query = {
      measures: [
        'Employees.count',
        'Productivity.avgLinesOfCode'
      ],
      dimensions: ['Departments.name']
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: 'test-org'
    })
    
    const data = result.rawData()
    expect(data).toHaveLength(3) // 3 departments
    data.forEach(row => {
      expect(row['Employees.count']).toBeGreaterThan(0)
      expect(row['Productivity.avgLinesOfCode']).toBeGreaterThan(0)
    })
  })
})
```

## Best Practices

1. **Security First**: Always include security context in join conditions
2. **Performance**: Use indexed columns for join conditions
3. **Type Safety**: Leverage Drizzle's type system for join validation
4. **Clarity**: Use descriptive relationship names
5. **Testing**: Verify join correctness and security isolation
6. **Documentation**: Document complex join logic
7. **Optimization**: Structure joins for query performance

## Common Patterns

### Basic Foreign Key Join
```typescript
joins: [
  {
    table: departments,
    on: eq(employees.departmentId, departments.id),
    type: 'left'
  }
]
```

### Secure Multi-Table Join
```typescript
joins: [
  {
    table: departments,
    on: and(
      eq(employees.departmentId, departments.id),
      eq(departments.organisationId, ctx.securityContext.organisationId)
    ),
    type: 'left'
  }
]
```

### Cube-Level Relationship
```typescript
joins: {
  'Departments': {
    targetCube: 'Departments',
    condition: () => eq(employees.departmentId, departments.id),
    relationship: 'belongsTo'
  }
}
```

## Troubleshooting

### Join Issues

**Problem**: Duplicate records in results
**Solution**: Check for many-to-many relationships and use appropriate aggregation

**Problem**: Missing data after join
**Solution**: Verify join type (left vs inner) and foreign key integrity

**Problem**: Security context not applied
**Solution**: Ensure all joined tables include security filtering

### Performance Issues

**Problem**: Slow join queries
**Solution**: Add database indexes on join columns and optimize join order

**Problem**: Cartesian products
**Solution**: Verify join conditions are specific enough

## Next Steps

- Learn about [Security](/help/semantic-layer/security) patterns for multi-tenant systems
- Explore [Cubes](/help/semantic-layer/cubes) for complete cube definitions
- Understand [Dimensions](/help/semantic-layer/dimensions) and [Measures](/help/semantic-layer/measures)
- Review database indexing strategies for optimal join performance

## Roadmap Ideas

- Visual join relationship designer
- Automatic join path optimization suggestions
- Join performance analysis tools
- Advanced relationship types (polymorphic, conditional)
- Join validation and testing framework