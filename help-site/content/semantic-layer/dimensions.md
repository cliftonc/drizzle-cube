# Dimensions

Dimensions are categorical data fields in your cubes that represent the "what", "where", "when", and "who" of your data. They provide the context for slicing and dicing your measures and are essential for grouping, filtering, and organizing analytics queries.

## Overview

In Drizzle Cube, dimensions are type-safe fields that reference columns from your Drizzle schema. They support various data types and can include computed values using SQL expressions. All dimensions benefit from Drizzle's type safety and SQL injection prevention.

## Basic Dimension Structure

```typescript
dimensions: {
  name: {
    name: 'name',           // Internal identifier
    title: 'Employee Name', // Display name
    type: 'string',         // Data type
    sql: employees.name     // Drizzle column reference
  }
}
```

## Dimension Types

### String Dimensions

Used for text and categorical data:

```typescript
dimensions: {
  name: {
    name: 'name',
    title: 'Employee Name',
    type: 'string',
    sql: employees.name
  },
  email: {
    name: 'email',
    title: 'Email Address',
    type: 'string',
    sql: employees.email
  },
  departmentName: {
    name: 'departmentName',
    title: 'Department',
    type: 'string',
    sql: departments.name // From joined table
  }
}
```

### Number Dimensions

For numeric categorical data:

```typescript
dimensions: {
  id: {
    name: 'id',
    title: 'Employee ID',
    type: 'number',
    sql: employees.id,
    primaryKey: true  // Mark as primary key
  },
  departmentId: {
    name: 'departmentId',
    title: 'Department ID',
    type: 'number',
    sql: employees.departmentId
  },
  happinessIndex: {
    name: 'happinessIndex',
    title: 'Happiness Score',
    type: 'number',
    sql: productivity.happinessIndex
  }
}
```

### Boolean Dimensions

For true/false categorical data:

```typescript
dimensions: {
  isActive: {
    name: 'isActive',
    title: 'Active Status',
    type: 'boolean',
    sql: employees.active
  },
  isDayOff: {
    name: 'isDayOff',
    title: 'Day Off',
    type: 'boolean',
    sql: productivity.daysOff
  },
  isWorkDay: {
    name: 'isWorkDay',
    title: 'Work Day',
    type: 'boolean',
    sql: sql`NOT ${productivity.daysOff}` // Computed boolean
  }
}
```

### Time Dimensions

For date and time data - the foundation for time-series analytics:

```typescript
dimensions: {
  createdAt: {
    name: 'createdAt',
    title: 'Hire Date',
    type: 'time',
    sql: employees.createdAt
  },
  date: {
    name: 'date',
    title: 'Date',
    type: 'time',
    sql: productivity.date
  },
  updatedAt: {
    name: 'updatedAt',
    title: 'Last Updated',
    type: 'time',
    sql: employees.updatedAt
  }
}
```

**Time Dimension Usage:**
Time dimensions are used in `timeDimensions` queries with granularity:

```typescript
const query = {
  measures: ['Employees.count'],
  dimensions: [],
  timeDimensions: [{
    dimension: 'Employees.createdAt',
    granularity: 'month', // year, quarter, month, week, day, hour
    dateRange: ['2023-01-01', '2023-12-31']
  }]
}
```

## Computed Dimensions

Create dimensions with custom SQL expressions:

```typescript
dimensions: {
  happinessLevel: {
    name: 'happinessLevel',
    title: 'Happiness Level',
    type: 'string',
    sql: sql`
      CASE 
        WHEN ${productivity.happinessIndex} <= 3 THEN 'Low'
        WHEN ${productivity.happinessIndex} <= 6 THEN 'Medium'
        WHEN ${productivity.happinessIndex} <= 8 THEN 'High'
        ELSE 'Very High'
      END
    `
  },
  ageGroup: {
    name: 'ageGroup',
    title: 'Age Group',
    type: 'string',
    sql: sql`
      CASE 
        WHEN EXTRACT(YEAR FROM AGE(${employees.birthDate})) < 30 THEN 'Under 30'
        WHEN EXTRACT(YEAR FROM AGE(${employees.birthDate})) < 50 THEN '30-49'
        ELSE '50+'
      END
    `
  },
  salaryBand: {
    name: 'salaryBand',
    title: 'Salary Band',
    type: 'string',
    sql: sql`
      CASE 
        WHEN ${employees.salary} < 50000 THEN 'Entry Level'
        WHEN ${employees.salary} < 100000 THEN 'Mid Level'
        ELSE 'Senior Level'
      END
    `
  }
}
```

## Primary Key Dimensions

Mark dimensions as primary keys for unique identification:

```typescript
dimensions: {
  id: {
    name: 'id',
    title: 'Employee ID',
    type: 'number',
    sql: employees.id,
    primaryKey: true  // Enables drill-down and unique identification
  }
}
```

**Primary Key Benefits:**
- Enables drill-down functionality
- Improves query performance
- Provides unique record identification
- Required for some visualization types

## Cross-Table Dimensions

Access dimensions from joined tables:

```typescript
// In cube SQL definition
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: productivity,
  joins: [
    {
      table: employees,
      on: eq(productivity.employeeId, employees.id),
      type: 'left'
    },
    {
      table: departments,
      on: eq(employees.departmentId, departments.id),
      type: 'left'
    }
  ],
  where: eq(productivity.organisationId, ctx.securityContext.organisationId)
}),

// Dimensions can reference any joined table
dimensions: {
  employeeName: {
    name: 'employeeName',
    title: 'Employee Name',
    type: 'string',
    sql: employees.name // From joined employees table
  },
  departmentName: {
    name: 'departmentName',
    title: 'Department',
    type: 'string',
    sql: departments.name // From joined departments table
  }
}
```

## Date and Time Granularity

Time dimensions support various granularity levels:

| Granularity | Description | Format Example |
|-------------|-------------|----------------|
| `year` | Annual grouping | 2023 |
| `quarter` | Quarterly grouping | 2023-Q1 |
| `month` | Monthly grouping | 2023-01 |
| `week` | Weekly grouping | 2023-W01 |
| `day` | Daily grouping | 2023-01-15 |
| `hour` | Hourly grouping | 2023-01-15 14:00 |

```typescript
// Query with time dimensions
const timeSeriesQuery = {
  measures: ['Productivity.totalLinesOfCode'],
  dimensions: ['Productivity.departmentName'],
  timeDimensions: [{
    dimension: 'Productivity.date',
    granularity: 'week',
    dateRange: ['2023-01-01', '2023-03-31']
  }]
}
```

## Dimension Formatting and Display

### Custom Formatting

The server does NOT format any responses, it is returned as is from the database, with the exceptio of time-dimensions.  This is included only to allow the client to format it as per its requirements (e.g. internationalisation, timezones etc).

```typescript
dimensions: {
  salary: {
    name: 'salary',
    title: 'Salary',
    type: 'number',
    sql: employees.salary,
    format: 'currency', // Hint for client formatting
    description: 'Annual salary in USD'
  }
}
```

## Usage in Queries

### Grouping by Dimensions

```typescript
const query = {
  measures: ['Employees.count', 'Employees.avgSalary'],
  dimensions: ['Employees.departmentName', 'Employees.isActive']
}
```

### Filtering by Dimensions

```typescript
const query = {
  measures: ['Employees.count'],
  dimensions: ['Employees.name'],
  filters: [
    {
      member: 'Employees.departmentName',
      operator: 'equals',
      values: ['Engineering', 'Marketing']
    },
    {
      member: 'Employees.isActive',
      operator: 'equals',
      values: [true]
    }
  ]
}
```

### Sorting by Dimensions

```typescript
const query = {
  measures: ['Employees.count'],
  dimensions: ['Employees.departmentName'],
  order: [
    ['Employees.departmentName', 'asc'],
    ['Employees.count', 'desc']
  ]
}
```

## Best Practices

1. **Use Descriptive Names**: Choose clear, business-friendly titles
2. **Leverage Type Safety**: Always reference Drizzle schema columns
3. **Primary Keys**: Mark unique identifiers as primary keys
4. **Computed Logic**: Use SQL expressions for business logic
5. **Time Dimensions**: Always include relevant time fields
6. **Cross-Table Access**: Leverage joins for related data
7. **Formatting Hints**: Add format hints for client display

## Security Considerations

Dimensions inherit security from the cube's base SQL:

```typescript
// Security is applied at the cube level
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: employees,
  where: eq(employees.organisationId, ctx.securityContext.organisationId)
}),

// Dimensions automatically respect cube security
dimensions: {
  name: {
    name: 'name',
    title: 'Employee Name',
    type: 'string',
    sql: employees.name // Automatically filtered by organisation
  }
}
```

## Testing Dimensions

```typescript
import { describe, it, expect } from 'vitest'

describe('Employee Dimensions', () => {
  it('should group by department correctly', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.departmentName']
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: 'test-org'
    })
    
    const data = result.rawData()
    expect(data).toHaveLength(3) // 3 departments
    expect(data[0]['Employees.departmentName']).toBeDefined()
  })
  
  it('should handle computed dimensions', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: ['Employees.happinessLevel']
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: 'test-org'
    })
    
    const data = result.rawData()
    const levels = data.map(row => row['Employees.happinessLevel'])
    expect(levels).toContain('High')
    expect(levels).toContain('Medium')
  })
})
```

## Common Patterns

### Standard String Dimension
```typescript
name: {
  name: 'name',
  title: 'Name',
  type: 'string',
  sql: table.name
}
```

### Date Dimension
```typescript
createdAt: {
  name: 'createdAt',
  title: 'Created Date',
  type: 'time',
  sql: table.createdAt
}
```

### Computed Category
```typescript
category: {
  name: 'category',
  title: 'Category',
  type: 'string',
  sql: sql`CASE WHEN ${table.value} > 100 THEN 'High' ELSE 'Low' END`
}
```

## Next Steps

- Learn about [Measures](/help/semantic-layer/measures) for metrics and aggregations
- Explore [Joins](/help/semantic-layer/joins) for multi-cube relationships  
- Review [Security](/help/semantic-layer/security) patterns

## Roadmap Ideas

- Dimension validation and constraints
- Automatic dimension suggestions from schema
- Dimension relationship mapping and visualization
- Custom dimension transformations and formatters