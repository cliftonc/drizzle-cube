import type { SemanticCube } from './types'

/**
 * Example cube definitions for documentation and testing
 * These show the basic patterns for defining cubes
 */

export const employeesCube: SemanticCube = {
  name: 'Employees',
  title: 'Employee Analytics',
  description: 'Employee data for workforce analysis',
  sql: `
    SELECT 
      e.id,
      e.name,
      e.email,
      e.active,
      e.fte_basis,
      e.start_date,
      e.end_date,
      d.name as department_name,
      s.name as supplier_name,
      s.internal as supplier_internal
    FROM employees e
    LEFT JOIN departments d ON e.department = d.id
    LEFT JOIN suppliers s ON e.supplier = s.id
    WHERE e.organisation = \${SECURITY_CONTEXT.organisation}
  `,
  
  dimensions: {
    id: {
      name: 'id',
      title: 'Employee ID',
      type: 'string',
      sql: 'id',
      primaryKey: true
    },
    name: {
      name: 'name',
      title: 'Employee Name',
      type: 'string',
      sql: 'name'
    },
    email: {
      name: 'email',
      title: 'Email',
      type: 'string',
      sql: 'email'
    },
    active: {
      name: 'active',
      title: 'Active Status',
      type: 'boolean',
      sql: 'active'
    },
    departmentName: {
      name: 'departmentName',
      title: 'Department',
      type: 'string',
      sql: 'department_name'
    },
    supplierName: {
      name: 'supplierName',
      title: 'Supplier',
      type: 'string',
      sql: 'supplier_name'
    },
    supplierType: {
      name: 'supplierType',
      title: 'Supplier Type',
      type: 'string',
      sql: "CASE WHEN supplier_internal THEN 'Internal' ELSE 'External' END"
    },
    startDate: {
      name: 'startDate',
      title: 'Start Date',
      type: 'time',
      sql: 'start_date'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Employee Count',
      type: 'count',
      sql: 'id'
    },
    activeCount: {
      name: 'activeCount',
      title: 'Active Employees',
      type: 'count',
      sql: 'id',
      filters: [{ sql: 'active = true' }]
    },
    totalFte: {
      name: 'totalFte',
      title: 'Total FTE',
      type: 'sum',
      sql: 'fte_basis',
      format: 'number'
    },
    averageFte: {
      name: 'averageFte',
      title: 'Average FTE',
      type: 'avg',
      sql: 'fte_basis',
      format: 'number'
    }
  }
}

export const departmentsCube: SemanticCube = {
  name: 'Departments',
  title: 'Department Analytics',
  description: 'Organizational department data',
  sql: `
    SELECT 
      d.id,
      d.name,
      d.description,
      COUNT(e.id) as employee_count
    FROM departments d
    LEFT JOIN employees e ON d.id = e.department AND e.active = true
    WHERE d.organisation = \${SECURITY_CONTEXT.organisation}
    GROUP BY d.id, d.name, d.description
  `,
  
  dimensions: {
    id: {
      name: 'id',
      title: 'Department ID',
      type: 'string',
      sql: 'id',
      primaryKey: true
    },
    name: {
      name: 'name',
      title: 'Department Name',
      type: 'string',
      sql: 'name'
    },
    description: {
      name: 'description',
      title: 'Description',
      type: 'string',
      sql: 'description'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Department Count',
      type: 'count',
      sql: 'id'
    },
    employeeCount: {
      name: 'employeeCount',
      title: 'Employee Count',
      type: 'sum',
      sql: 'employee_count'
    }
  }
}

// Example showing joins between cubes
export const employeeDepartmentsCube: SemanticCube = {
  name: 'EmployeeDepartments',
  title: 'Employee Department Analysis',
  description: 'Combined employee and department analytics',
  sql: `
    SELECT 
      e.id as employee_id,
      e.name as employee_name,
      e.active,
      e.fte_basis,
      d.id as department_id,
      d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department = d.id
    WHERE e.organisation = \${SECURITY_CONTEXT.organisation}
  `,
  
  dimensions: {
    employeeName: {
      name: 'employeeName',
      title: 'Employee Name',
      type: 'string',
      sql: 'employee_name'
    },
    departmentName: {
      name: 'departmentName',
      title: 'Department Name',
      type: 'string',
      sql: 'department_name'
    },
    active: {
      name: 'active',
      title: 'Active',
      type: 'boolean',
      sql: 'active'
    }
  },
  
  measures: {
    employeeCount: {
      name: 'employeeCount',
      title: 'Employee Count',
      type: 'count',
      sql: 'employee_id'
    },
    activeEmployeeCount: {
      name: 'activeEmployeeCount',
      title: 'Active Employee Count',
      type: 'count',
      sql: 'employee_id',
      filters: [{ sql: 'active = true' }]
    },
    totalFte: {
      name: 'totalFte',
      title: 'Total FTE',
      type: 'sum',
      sql: 'fte_basis'
    }
  }
}

export const exampleCubes = [
  employeesCube,
  departmentsCube,
  employeeDepartmentsCube
]