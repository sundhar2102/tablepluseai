/**
 * TablePulse AI - Regression Test Runner
 * Executes core regression suites: Data Integrity, Dietary Intent, Multi-Restaurant Menus, and Stage Verifications
 */
const { spawnSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');

const regressionSuites = [
  'tests/test-production-data-integrity.js',
  'tests/test-dietary-intent-e2e.js',
  'tests/multi-restaurant-menu-ai-test.js'
];

console.log('============================================================');
console.log('🔄 RUNNING TABLEPULSE AI — REGRESSION TEST SUITE');
console.log('============================================================\n');

let allPassed = true;

for (const suite of regressionSuites) {
  console.log(`\n▶️ Executing: ${suite}`);
  const res = spawnSync('node', [suite], { cwd: rootDir, stdio: 'inherit' });
  if (res.status !== 0) {
    allPassed = false;
    console.error(`❌ Suite failed: ${suite}`);
  } else {
    console.log(`✅ Suite passed: ${suite}`);
  }
}

if (!allPassed) {
  console.error('\n❌ One or more regression suites failed.');
  process.exit(1);
} else {
  console.log('\n🎉 ALL REGRESSION SUITES PASSED CLEANLY.');
  process.exit(0);
}
