/**
 * SMART TABLE AI — Branding & Logo Regression Test Suite
 * Asserts that:
 * 1. No unintended "TablePulse" references exist in user-facing client source code or built distribution.
 * 2. All platform configurations (Web, Android, Capacitor, Manifest) display "Smart Table AI".
 * 3. Official vector and graphic assets exist and are properly configured.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '../../');
let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
    failCount++;
  }
}

console.log('============================================================');
console.log('🔍 SMART TABLE AI — BRANDING & LOGO REGRESSION TEST');
console.log('============================================================\n');

// 1. Client index.html check
runTest('client/index.html title is "Smart Table AI" and contains no TablePulse', () => {
  const html = fs.readFileSync(path.join(rootDir, 'client/index.html'), 'utf8');
  assert.ok(html.includes('<title>Smart Table AI'), 'Title must start with Smart Table AI');
  assert.ok(!html.includes('TablePulse'), 'index.html must not contain TablePulse');
});

// 2. Client web distribution check
runTest('client/dist/index.html contains "Smart Table AI" and no TablePulse', () => {
  const distHtmlPath = path.join(rootDir, 'client/dist/index.html');
  if (fs.existsSync(distHtmlPath)) {
    const html = fs.readFileSync(distHtmlPath, 'utf8');
    assert.ok(html.includes('Smart Table AI'), 'Built index.html must contain Smart Table AI');
    assert.ok(!html.includes('TablePulse'), 'Built index.html must not contain TablePulse');
  } else {
    console.log('    (dist/index.html not found, skipped check)');
  }
});

// 3. Android app strings.xml check
runTest('Android strings.xml sets app_name to "Smart Table AI"', () => {
  const stringsPath = path.join(rootDir, 'client/android/app/src/main/res/values/strings.xml');
  const stringsXml = fs.readFileSync(stringsPath, 'utf8');
  assert.ok(stringsXml.includes('<string name="app_name">Smart Table AI</string>'), 'app_name must be Smart Table AI');
  assert.ok(stringsXml.includes('<string name="title_activity_main">Smart Table AI</string>'), 'title_activity_main must be Smart Table AI');
  assert.ok(!stringsXml.includes('TablePulse'), 'strings.xml must not contain TablePulse');
});

// 4. Capacitor configuration check
runTest('Capacitor configuration has appName "Smart Table AI"', () => {
  const capPath = path.join(rootDir, 'client/capacitor.config.json');
  const capConfig = JSON.parse(fs.readFileSync(capPath, 'utf8'));
  assert.strictEqual(capConfig.appName, 'Smart Table AI');
  assert.ok(!JSON.stringify(capConfig).includes('TablePulse'), 'Capacitor config must not contain TablePulse');
});

// 5. Manifest.json check
runTest('Web manifest name is "Smart Table AI"', () => {
  const manifestPath = path.join(rootDir, 'client/public/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(manifest.name.includes('Smart Table AI'), 'manifest name must contain Smart Table AI');
  assert.strictEqual(manifest.short_name, 'Smart Table AI');
  assert.ok(!JSON.stringify(manifest).includes('TablePulse'), 'manifest.json must not contain TablePulse');
});

// 6. Root package.json check
runTest('Root package.json name is "smart-table-ai"', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.name, 'smart-table-ai');
});

// 7. Client package.json check
runTest('Client package.json name is "smart-table-client"', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'client/package.json'), 'utf8'));
  assert.strictEqual(pkg.name, 'smart-table-client');
});

// 8. Server package.json check
runTest('Server package.json name is "smart-table-server"', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'server/package.json'), 'utf8'));
  assert.strictEqual(pkg.name, 'smart-table-server');
});

// 9. Official Brand Assets check
runTest('Official vector and SVG logo assets exist', () => {
  const assets = [
    'client/public/favicon.svg',
    'client/public/logo-icon.svg',
    'client/public/logo-full.svg',
    'client/src/components/common/SmartTableLogo.jsx',
    'client/src/components/common/OfflineBanner.jsx'
  ];
  for (const asset of assets) {
    const fullPath = path.join(rootDir, asset);
    assert.ok(fs.existsSync(fullPath), `Asset ${asset} must exist`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(content.length > 50, `Asset ${asset} must not be empty`);
  }
});

// 10. Audit client/src for visible user-facing TablePulse text
runTest('No visible user-facing "TablePulse" text in client/src components and pages', () => {
  function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(walk(fullPath));
      } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const files = walk(path.join(rootDir, 'client/src'));
  const violations = [];

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Allow backwards-compatible legacy fallback property lookups like `restaurant.tablepulse_registered`
      // or legacy localStorage key fallback `localStorage.getItem('tp_...')`
      if (/TablePulse/i.test(line)) {
        const isLegacyFallback = 
          line.includes('tablepulse_registered') ||
          line.includes("'tp_") ||
          line.includes('"tp_');
        if (!isLegacyFallback) {
          violations.push(`${path.relative(rootDir, f)}:${idx + 1}: ${line.trim()}`);
        }
      }
    });
  }

  assert.strictEqual(violations.length, 0, `Found unintended TablePulse references:\n${violations.join('\n')}`);
});

console.log('\n============================================================');
console.log(`SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log('============================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
