export default async function globalTeardown() {
  // Data is intentionally left in the test database after each run.
  // Cleanup happens at the start of global-setup on the next run,
  // so seed users remain visible in DataGrip between runs.
  console.log("[teardown] Done. Test data preserved for inspection.");
}
