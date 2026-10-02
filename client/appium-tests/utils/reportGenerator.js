/**
 * Excel Report Generator for Mobile Appium Tests
 * Generates reports/appium/TablePulse_Mobile_Appium_Test_Report.xlsx
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function generateMobileReport(catalog, deviceInfo) {
  const reportsDir = path.resolve(__dirname, '../../../reports/appium');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const filePath = path.join(reportsDir, 'TablePulse_Mobile_Appium_Test_Report.xlsx');

  const total = catalog.length;
  const passed = catalog.filter(t => t.status === 'PASS').length;
  const failed = catalog.filter(t => t.status === 'FAIL').length;
  const blocked = catalog.filter(t => t.status === 'BLOCKED').length;
  const notExecuted = catalog.filter(t => t.status === 'NOT EXECUTED').length;
  const notApplicable = catalog.filter(t => t.status === 'NOT APPLICABLE').length;

  const totalDuration = catalog.reduce((acc, t) => acc + (t.duration || 0), 0);

  // Sheet 1: Summary
  const summaryData = [
    ['METRIC', 'VALUE'],
    ['Project Name', 'TablePulse AI'],
    ['Test Framework', 'Appium Mobile Automation (UiAutomator2 / Android)'],
    ['Target Platform', 'Android (Capacitor Native Shell)'],
    ['Execution Date', new Date().toISOString().replace('T', ' ').substring(0, 19)],
    ['Total Test Cases Cataloged', total],
    ['Executed - Passed', passed],
    ['Executed - Failed', failed],
    ['Blocked (Environment/Device)', blocked],
    ['Not Executed', notExecuted],
    ['Not Applicable', notApplicable],
    ['Pass Percentage', total > 0 ? `${((passed / total) * 100).toFixed(2)}%` : '0.00%'],
    ['Fail Percentage', total > 0 ? `${((failed / total) * 100).toFixed(2)}%` : '0.00%'],
    ['Total Execution Duration (ms)', totalDuration],
    ['Connected ADB Devices', deviceInfo.devices.length],
    ['Execution Verdict', failed > 0 ? 'FAIL' : blocked > 0 ? 'BLOCKED - NO DEVICE ATTACHED' : 'PASS']
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Sheet 2: Test Details
  const detailsData = [
    [
      'Test ID', 'Module', 'Category', 'Scenario', 'Preconditions',
      'Test Data', 'Steps', 'Expected Result', 'Actual Result',
      'Status', 'Priority', 'Severity', 'Duration (ms)', 'Screenshot Path',
      'Error Message', 'Defect ID'
    ]
  ];

  catalog.forEach(t => {
    detailsData.push([
      t.id,
      t.module,
      t.category,
      t.scenario,
      t.preconditions,
      t.testData,
      t.steps,
      t.expected,
      t.actual || 'N/A',
      t.status,
      t.priority,
      t.severity,
      t.duration || 0,
      t.screenshot || 'N/A',
      t.error || 'None',
      t.defectId || 'N/A'
    ]);
  });
  const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);

  // Sheet 3: Device Information
  const deviceData = [
    ['PARAMETER', 'VALUE'],
    ['ADB Available', deviceInfo.available ? 'YES' : 'NO'],
    ['Device Count', deviceInfo.devices.length],
    ['Device List', deviceInfo.devices.map(d => `${d.id} (${d.state})`).join(', ') || 'None Detected'],
    ['Target Package', process.env.MOBILE_PACKAGE_ID || 'com.tablepulse.app'],
    ['Target Activity', process.env.MOBILE_ACTIVITY || 'com.tablepulse.app.MainActivity'],
    ['Automation Driver', 'UiAutomator2'],
    ['Platform Name', 'Android'],
    ['Raw ADB Status', deviceInfo.rawOutput]
  ];
  const deviceSheet = XLSX.utils.aoa_to_sheet(deviceData);

  // Sheet 4: Defect Summary
  const defectData = [
    ['Defect ID', 'Test ID', 'Category', 'Summary', 'Severity', 'Status', 'Root Cause']
  ];
  const defects = catalog.filter(t => t.status === 'FAIL');
  if (defects.length === 0) {
    defectData.push(['NONE', 'N/A', 'N/A', 'No test execution failures recorded', 'N/A', 'CLOSED', 'N/A']);
  } else {
    defects.forEach((d, idx) => {
      defectData.push([
        `DEF-MOB-${String(idx + 1).padStart(3, '0')}`,
        d.id,
        d.category,
        d.scenario,
        d.severity,
        'OPEN',
        d.error || 'N/A'
      ]);
    });
  }
  const defectSheet = XLSX.utils.aoa_to_sheet(defectData);

  // Sheet 5: Category Summary
  const categories = [...new Set(catalog.map(t => t.category))];
  const catData = [
    ['Category', 'Total Cases', 'Passed', 'Failed', 'Blocked', 'Not Executed']
  ];
  categories.forEach(cat => {
    const subset = catalog.filter(t => t.category === cat);
    catData.push([
      cat,
      subset.length,
      subset.filter(t => t.status === 'PASS').length,
      subset.filter(t => t.status === 'FAIL').length,
      subset.filter(t => t.status === 'BLOCKED').length,
      subset.filter(t => t.status === 'NOT EXECUTED').length
    ]);
  });
  const catSheet = XLSX.utils.aoa_to_sheet(catData);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Test Details');
  XLSX.utils.book_append_sheet(workbook, deviceSheet, 'Device Information');
  XLSX.utils.book_append_sheet(workbook, defectSheet, 'Defect Summary');
  XLSX.utils.book_append_sheet(workbook, catSheet, 'Category Summary');

  XLSX.writeFile(workbook, filePath);
  return filePath;
}

module.exports = {
  generateMobileReport
};
