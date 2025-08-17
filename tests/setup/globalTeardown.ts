/**
 * Global test teardown - runs once after all tests
 * Cleans up the test database
 */

export default async function globalTeardown() {
  console.log('Global test teardown complete')
  // The actual cleanup is handled by the function returned from globalSetup
}