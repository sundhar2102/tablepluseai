/**
 * TablePulse AI - Selenium Test Excel Report Generator
 * Generates reports/selenium/TablePulse_Web_Selenium_Test_Report.xlsx
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function generateWebReport(testResults, metadata = {}) {
  const outputDir = path.resolve(__dirname, '../../../reports/selenium');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const wb = XLSX.utils.book_new();

  // Metrics
  const total = testResults.length;
  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;
  const blocked = testResults.filter(t => t.status === 'BLOCKED').length;
  const notExecuted = testResults.filter(t => t.status === 'NOT EXECUTED').length;
  const executed = passed + failed;
  const totalDurationMs = testResults.reduce((acc, t) => acc + (t.duration || 0), 0);

  // 1. Summary Sheet
  const summaryData = [
    ['TABLEPULSE AI — WEB SELENIUM AUTOMATION TEST REPORT'],
    ['Generated Date', new Date().toISOString()],
    ['Environment', metadata.environment || 'Local Development (Vite + Express)'],
    ['Base URL', metadata.baseUrl || 'http://localhost:5173'],
    ['Browser', metadata.browser || 'Google Chrome (Headless)'],
    ['Browser Version', metadata.browserVersion || '154.0.8037.93'],
    [''],
    ['METRIC', 'COUNT', 'PERCENTAGE'],
    ['Total Test Cases', total, '100.0%'],
    ['Executed', executed, `${((executed / total) * 100).toFixed(1)}%`],
    ['Passed', passed, `${((passed / total) * 100).toFixed(1)}%`],
    ['Failed', failed, `${((failed / total) * 100).toFixed(1)}%`],
    ['Blocked (Future Stages / Dependencies)', blocked, `${((blocked / total) * 100).toFixed(1)}%`],
    ['Not Executed', notExecuted, `${((notExecuted / total) * 100).toFixed(1)}%`],
    ['Total Execution Duration', `${(totalDurationMs / 1000).toFixed(2)} seconds`, '']
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // 2. Test Details Sheet
  const detailsHeaders = [
    'Test ID', 'Module', 'Category', 'Scenario', 'Preconditions',
    'Test Data', 'Steps', 'Expected Result', 'Actual Result',
    'Status', 'Priority', 'Severity', 'Duration (ms)', 'Screenshot Path',
    'Error Details', 'Defect ID'
  ];
  const detailsRows = [detailsHeaders];
  testResults.forEach(t => {
    detailsRows.push([
      t.id,
      t.module,
      t.category,
      t.scenario,
      t.preconditions || 'Application running',
      t.testData || 'Default test dataset',
      t.steps || 'Navigate -> Interact -> Verify',
      t.expected,
      t.actual || (t.status === 'PASS' ? 'Observed expected behavior' : t.error || 'Blocked by stage scope'),
      t.status,
      t.priority || 'P1',
      t.severity || 'Major',
      t.duration || 0,
      t.screenshot || 'N/A',
      t.error || 'None',
      t.defectId || (t.status === 'FAIL' ? `DEF-WEB-${t.id}` : 'None')
    ]);
  });
  const wsDetails = XLSX.utils.aoa_to_sheet(detailsRows);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Test Details');

  // 3. Category Summary Sheet
  const categoryMap = {};
  testResults.forEach(t => {
    const cat = t.category || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { total: 0, passed: 0, failed: 0, blocked: 0 };
    }
    categoryMap[cat].total++;
    if (t.status === 'PASS') categoryMap[cat].passed++;
    if (t.status === 'FAIL') categoryMap[cat].failed++;
    if (t.status === 'BLOCKED') categoryMap[cat].blocked++;
  });

  const catHeaders = ['Category', 'Total', 'Passed', 'Failed', 'Blocked', 'Pass Rate (%)'];
  const catRows = [catHeaders];
  Object.keys(categoryMap).forEach(cat => {
    const c = categoryMap[cat];
    const rate = c.total > 0 ? ((c.passed / c.total) * 100).toFixed(1) : '0.0';
    catRows.push([cat, c.total, c.passed, c.failed, c.blocked, `${rate}%`]);
  });
  const wsCat = XLSX.utils.aoa_to_sheet(catRows);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Category Summary');

  // 4. Defect Summary Sheet
  const defects = testResults.filter(t => t.status === 'FAIL');
  const defectHeaders = ['Defect ID', 'Associated Test ID', 'Module', 'Summary', 'Severity', 'Root Cause Analysis'];
  const defectRows = [defectHeaders];
  if (defects.length === 0) {
    defectRows.push(['None', 'N/A', 'N/A', 'Zero automated test failures recorded', 'N/A', 'All executed cases met assertions']);
  } else {
    defects.forEach((d, idx) => {
      defectRows.push([
        d.defectId || `DEF-WEB-${idx + 1}`,
        d.id,
        d.module,
        d.error || 'Assertion failure',
        d.severity || 'Major',
        'Investigating component state transition'
      ]);
    });
  }
  const wsDefects = XLSX.utils.aoa_to_sheet(defectRows);
  XLSX.utils.book_append_sheet(wb, wsDefects, 'Defect Summary');

  // Write file
  const filePath = path.join(outputDir, 'TablePulse_Web_Selenium_Test_Report.xlsx');
  XLSX.writeFile(wb, filePath);
  console.log(`[Excel] Web Selenium Report successfully generated at: ${filePath}`);
  return filePath;
}

module.exports = { generateWebReport };
