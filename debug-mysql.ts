import { getTestSchema } from './tests/helpers/test-database.js';
import { createTestCubesForCurrentDatabase } from './tests/helpers/test-cubes.js';
import { TestExecutor, TestQueryBuilder } from './tests/helpers/test-utilities.js';

async function debugMySQLIssue() {
  console.log('Setting up MySQL test...');
  
  const { schema } = await getTestSchema();
  const cubes = await createTestCubesForCurrentDatabase();
  const testExecutor = await TestExecutor.create([
    cubes.testEmployeesCube, 
    cubes.testProductivityCube, 
    cubes.testDepartmentsCube
  ]);
  
  const query = TestQueryBuilder.create()
    .measures(['Employees.count', 'Productivity.recordCount', 'Departments.count'])
    .build();
    
  console.log('Query:', JSON.stringify(query, null, 2));
  
  try {
    const result = await testExecutor.executeQuery(query);
    console.log('Result data length:', result.data.length);
    
    if (result.data.length > 0) {
      const row = result.data[0];
      console.log('Full row:', JSON.stringify(row, null, 2));
      console.log('Row keys:', Object.keys(row));
      
      // Check types
      console.log('Employees.count:', row['Employees.count'], 'Type:', typeof row['Employees.count']);
      console.log('Productivity.recordCount:', row['Productivity.recordCount'], 'Type:', typeof row['Productivity.recordCount']);
      console.log('Departments.count:', row['Departments.count'], 'Type:', typeof row['Departments.count']);
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.stack) {
      console.error('Stack:', err.stack);
    }
  }
}

debugMySQLIssue().catch(console.error);