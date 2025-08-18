# Measures

Measures are the quantitative metrics in your cubes that represent the "how much", "how many", and "how often" of your data. They define aggregations, calculations, and key performance indicators (KPIs) that drive business insights and decision-making.

## Overview

In Drizzle Cube, measures are type-safe aggregation functions that operate on your data. They leverage Drizzle's SQL builder for secure, optimized queries and support all major aggregation types plus complex calculated measures using SQL expressions.

## Basic Measure Structure

```typescript
measures: {
  count: {
    name: 'count',           // Internal identifier
    title: 'Total Records',  // Display name
    type: 'count',          // Aggregation type
    sql: table.id           // Drizzle column reference
  }
}
```

## Measure Types

### Count Measures

Count measures are the most common and count occurrences of records:

```typescript
measures: {
  // Basic count - counts all records
  count: {
    name: 'count',
    title: 'Total Employees',
    type: 'count',
    sql: employees.id
  },
  
  // Conditional count with filters
  activeCount: {
    name: 'activeCount',
    title: 'Active Employees',
    type: 'count',
    sql: employees.id,
    filters: [
      () => eq(employees.active, true)
    ]
  },
  
  // Working days count
  workingDaysCount: {
    name: 'workingDaysCount',
    title: 'Working Days',
    type: 'count',
    sql: productivity.id,
    filters: [
      () => eq(productivity.daysOff, false)
    ]
  }
}
```

### Sum Measures

Sum measures aggregate numeric values:

```typescript
measures: {
  totalSalary: {
    name: 'totalSalary',
    title: 'Total Salary',
    type: 'sum',
    sql: employees.salary
  },
  
  totalLinesOfCode: {
    name: 'totalLinesOfCode',
    title: 'Total Lines of Code',
    type: 'sum',
    sql: productivity.linesOfCode
  },
  
  totalBudget: {
    name: 'totalBudget',
    title: 'Total Budget',
    type: 'sum',
    sql: departments.budget
  }
}
```

### Average Measures

Average measures calculate mean values:

```typescript
measures: {
  avgSalary: {
    name: 'avgSalary',
    title: 'Average Salary',
    type: 'avg',
    sql: employees.salary,
    format: 'currency' // Formatting hint
  },
  
  avgLinesOfCode: {
    name: 'avgLinesOfCode',
    title: 'Average Lines of Code',
    type: 'avg',
    sql: productivity.linesOfCode
  },
  
  avgHappinessIndex: {
    name: 'avgHappinessIndex',
    title: 'Average Happiness',
    type: 'avg',
    sql: productivity.happinessIndex
  }
}
```

### Min/Max Measures

Find minimum and maximum values:

```typescript
measures: {
  minSalary: {
    name: 'minSalary',
    title: 'Minimum Salary',
    type: 'min',
    sql: employees.salary
  },
  
  maxSalary: {
    name: 'maxSalary',
    title: 'Maximum Salary',
    type: 'max',
    sql: employees.salary
  },
  
  minHappinessIndex: {
    name: 'minHappinessIndex',
    title: 'Lowest Happiness Score',
    type: 'min',
    sql: productivity.happinessIndex
  },
  
  maxLinesOfCode: {
    name: 'maxLinesOfCode',
    title: 'Peak Daily Output',
    type: 'max',
    sql: productivity.linesOfCode
  }
}
```

### Count Distinct Measures

Count unique values:

```typescript
measures: {
  countDistinctEmployees: {
    name: 'countDistinctEmployees',
    title: 'Unique Employees',
    type: 'countDistinct',
    sql: productivity.employeeId
  },
  
  countDistinctDepartments: {
    name: 'countDistinctDepartments',
    title: 'Unique Departments',
    type: 'countDistinct',
    sql: employees.departmentId
  },
  
  uniqueProjects: {
    name: 'uniqueProjects',
    title: 'Active Projects',
    type: 'countDistinct',
    sql: tasks.projectId
  }
}
```

## Advanced Measures

### Calculated Measures

Create complex calculations using SQL expressions:

```typescript
measures: {
  productivityScore: {
    name: 'productivityScore',
    title: 'Productivity Score',
    type: 'avg',
    sql: sql`(${productivity.linesOfCode} + ${productivity.pullRequests} * 50 + ${productivity.liveDeployments} * 100)`,
    description: 'Composite score based on code output, reviews, and deployments'
  },
  
  salaryPerEmployee: {
    name: 'salaryPerEmployee',
    title: 'Salary Per Employee',
    type: 'number',
    sql: sql`CAST(SUM(${employees.salary}) AS DECIMAL(10,2)) / COUNT(DISTINCT ${employees.id})`
  },
  
  efficiencyRatio: {
    name: 'efficiencyRatio',
    title: 'Efficiency Ratio',
    type: 'avg',
    sql: sql`CASE 
      WHEN ${productivity.hoursWorked} > 0 
      THEN ${productivity.linesOfCode}::DECIMAL / ${productivity.hoursWorked}
      ELSE 0 
    END`
  }
}
```

### Percentage Measures

Calculate percentages and ratios:

```typescript
measures: {
  activeEmployeePercentage: {
    name: 'activeEmployeePercentage',
    title: 'Active Employee %',
    type: 'number',
    sql: sql`
      (COUNT(CASE WHEN ${employees.active} = true THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100
    `,
    format: 'percent'
  },
  
  happinessAboveAverage: {
    name: 'happinessAboveAverage',
    title: 'Above Average Happiness %',
    type: 'number',
    sql: sql`
      (COUNT(CASE WHEN ${productivity.happinessIndex} > 5 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100
    `
  }
}
```

### Conditional Measures

Measures with complex filtering logic:

```typescript
measures: {
  highProductivityDays: {
    name: 'highProductivityDays',
    title: 'High Productivity Days',
    type: 'count',
    sql: productivity.id,
    filters: [
      () => sql`${productivity.linesOfCode} > 200`
    ]
  },
  
  happyWorkDays: {
    name: 'happyWorkDays',
    title: 'Happy Work Days',
    type: 'count',
    sql: productivity.id,
    filters: [
      () => and(
        eq(productivity.daysOff, false),
        sql`${productivity.happinessIndex} >= 7`
      )
    ]
  },
  
  seniorEmployees: {
    name: 'seniorEmployees',
    title: 'Senior Employees',
    type: 'count',
    sql: employees.id,
    filters: [
      () => sql`${employees.salary} >= 100000`
    ]
  }
}
```

## Measure Filters

Apply conditional logic to measures using filters:

```typescript
measures: {
  // Single filter condition
  premiumCustomers: {
    name: 'premiumCustomers',
    title: 'Premium Customers',
    type: 'count',
    sql: customers.id,
    filters: [
      () => eq(customers.tier, 'premium')
    ]
  },
  
  // Multiple filter conditions (AND logic)
  activeHighValueCustomers: {
    name: 'activeHighValueCustomers',
    title: 'Active High-Value Customers',
    type: 'count',
    sql: customers.id,
    filters: [
      () => eq(customers.status, 'active'),
      () => sql`${customers.totalValue} > 10000`
    ]
  },
  
  // Complex filter logic
  qualifiedLeads: {
    name: 'qualifiedLeads',
    title: 'Qualified Leads',
    type: 'count',
    sql: leads.id,
    filters: [
      (ctx) => and(
        eq(leads.status, 'qualified'),
        sql`${leads.score} >= 75`,
        eq(leads.organisationId, ctx.securityContext.organisationId)
      )
    ]
  }
}
```

## Time-Based Measures

Measures that work with time dimensions:

```typescript
measures: {
  // Daily averages
  dailyAvgLinesOfCode: {
    name: 'dailyAvgLinesOfCode',
    title: 'Daily Average Lines of Code',
    type: 'avg',
    sql: productivity.linesOfCode,
    description: 'Average lines of code per day'
  },
  
  // Growth rates (requires window functions)
  monthlyGrowthRate: {
    name: 'monthlyGrowthRate',
    title: 'Monthly Growth Rate',
    type: 'number',
    sql: sql`
      ((COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', ${table.createdAt})))::DECIMAL 
       / LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', ${table.createdAt}))) * 100
    `
  },
  
  // Running totals
  runningTotal: {
    name: 'runningTotal',
    title: 'Running Total',
    type: 'number',
    sql: sql`SUM(${table.amount}) OVER (ORDER BY ${table.date} ROWS UNBOUNDED PRECEDING)`
  }
}
```

## Formatting and Display Options

```typescript
measures: {
  revenue: {
    name: 'revenue',
    title: 'Total Revenue',
    type: 'sum',
    sql: orders.amount,
    format: 'currency',          // Currency formatting
    description: 'Total revenue from all orders'
  },
  
  conversionRate: {
    name: 'conversionRate',
    title: 'Conversion Rate',
    type: 'number',
    sql: sql`(${conversions.count}::DECIMAL / ${visitors.count}) * 100`,
    format: 'percent',           // Percentage formatting
    description: 'Visitor to customer conversion rate'
  },
  
  responseTime: {
    name: 'responseTime',
    title: 'Avg Response Time',
    type: 'avg',
    sql: requests.responseTime,
    format: 'number',            // Number formatting with decimals
    description: 'Average API response time in milliseconds'
  }
}
```

## Cross-Cube Measures

Reference measures across related cubes:

```typescript
// In a joined cube
measures: {
  employeeProductivity: {
    name: 'employeeProductivity',
    title: 'Employee Productivity Score',
    type: 'avg',
    sql: sql`
      (${productivity.linesOfCode} * ${employees.experienceLevel}) / 
      NULLIF(${productivity.hoursWorked}, 0)
    `,
    description: 'Productivity adjusted for experience level'
  },
  
  departmentEfficiency: {
    name: 'departmentEfficiency',
    title: 'Department Efficiency',
    type: 'number',
    sql: sql`
      SUM(${productivity.linesOfCode}) / 
      (SUM(${employees.salary}) / 100000.0)
    `,
    description: 'Lines of code per $100k in salaries'
  }
}
```

## Usage in Queries

### Basic Usage

```typescript
const query = {
  measures: ['Employees.count', 'Employees.avgSalary'],
  dimensions: ['Employees.departmentName']
}
```

### Multiple Measures

```typescript
const query = {
  measures: [
    'Employees.count',
    'Employees.avgSalary',
    'Employees.minSalary',
    'Employees.maxSalary'
  ],
  dimensions: ['Employees.departmentName'],
  order: [['Employees.avgSalary', 'desc']]
}
```

### Filtering Measures

```typescript
const query = {
  measures: ['Employees.count'],
  dimensions: ['Employees.departmentName'],
  filters: [
    {
      member: 'Employees.avgSalary',
      operator: 'gt',
      values: [75000]
    }
  ]
}
```

## Best Practices

1. **Descriptive Names**: Use business-friendly titles and descriptions
2. **Type Safety**: Always reference Drizzle schema columns
3. **Performance**: Prefer database-native aggregations over complex calculations
4. **Filters**: Use measure filters for conditional logic
5. **Format Hints**: Include formatting hints for proper display
6. **Documentation**: Add descriptions for complex calculated measures
7. **Security**: Filters automatically inherit cube security context

## Testing Measures

```typescript
import { describe, it, expect } from 'vitest'

describe('Employee Measures', () => {
  it('should calculate employee count correctly', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: []
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: 'test-org'
    })
    
    const count = result.rawData()[0]['Employees.count']
    expect(count).toBeGreaterThan(0)
  })
  
  it('should calculate average salary', async () => {
    const query = {
      measures: ['Employees.avgSalary'],
      dimensions: []
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: 'test-org'
    })
    
    const avgSalary = result.rawData()[0]['Employees.avgSalary']
    expect(avgSalary).toBeGreaterThan(0)
    expect(avgSalary).toBeLessThan(1000000)
  })
  
  it('should handle filtered measures', async () => {
    const query = {
      measures: ['Employees.activeCount', 'Employees.count'],
      dimensions: []
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: 'test-org'
    })
    
    const data = result.rawData()[0]
    expect(data['Employees.activeCount']).toBeLessThanOrEqual(data['Employees.count'])
  })
})
```

## Common Patterns

### Basic Count
```typescript
count: {
  name: 'count',
  title: 'Total Count',
  type: 'count',
  sql: table.id
}
```

### Sum with Formatting
```typescript
totalRevenue: {
  name: 'totalRevenue',
  title: 'Total Revenue',
  type: 'sum',
  sql: orders.amount,
  format: 'currency'
}
```

### Conditional Count
```typescript
activeUsers: {
  name: 'activeUsers',
  title: 'Active Users',
  type: 'count',
  sql: users.id,
  filters: [() => eq(users.status, 'active')]
}
```

### Calculated Measure
```typescript
conversionRate: {
  name: 'conversionRate',
  title: 'Conversion Rate %',
  type: 'number',
  sql: sql`(COUNT(CASE WHEN ${users.converted} THEN 1 END)::DECIMAL / COUNT(*)) * 100`,
  format: 'percent'
}
```

## Next Steps

- Learn about [Dimensions](/help/semantic-layer/dimensions) for categorical data
- Explore [Joins](/help/semantic-layer/joins) for multi-cube relationships
- Understand [Cubes](/help/semantic-layer/cubes) structure and organization
- Review [Security](/help/semantic-layer/security) patterns and best practices

## Roadmap Ideas

- Measure performance optimization hints
- Automatic measure suggestions based on data types
- Advanced statistical measures (median, percentiles, standard deviation)
- Measure validation and testing framework
- Visual measure builder interface