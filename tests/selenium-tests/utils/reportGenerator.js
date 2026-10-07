/**
 * Selenium HTML and JSON Report Generator
 */
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

function generateHtmlReport(testResults, summary) {
  const reportsDir = config.reportsDir;
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TablePulse AI - Selenium Web E2E Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #1e293b; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #334155; }
    h1 { margin: 0 0 12px 0; color: #38bdf8; font-size: 24px; }
    .stats { display: flex; gap: 16px; margin-top: 16px; }
    .stat-card { background: #0f172a; padding: 12px 20px; border-radius: 8px; border: 1px solid #334155; flex: 1; text-align: center; }
    .stat-val { font-size: 24px; font-weight: bold; }
    .stat-val.passed { color: #4ade80; }
    .stat-val.failed { color: #f87171; }
    .table-container { background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; font-size: 13px; text-transform: uppercase; }
    tr:hover { background: #334155; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    .badge.pass { background: #14532d; color: #4ade80; border: 1px solid #166534; }
    .badge.fail { background: #7f1d1d; color: #f87171; border: 1px solid #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 TablePulse AI — Selenium Web E2E Test Report</h1>
      <p style="color: #94a3b8; margin: 0;">Automated Web Browser Verification Suite • Base URL: ${config.baseUrl}</p>
      <div class="stats">
        <div class="stat-card"><div>Total Tests</div><div class="stat-val">${summary.total}</div></div>
        <div class="stat-card"><div>Passed</div><div class="stat-val passed">${summary.passed}</div></div>
        <div class="stat-card"><div>Failed</div><div class="stat-val failed">${summary.failed}</div></div>
        <div class="stat-card"><div>Pass Rate</div><div class="stat-val passed">${summary.passRate}%</div></div>
        <div class="stat-card"><div>Duration</div><div class="stat-val">${(summary.duration / 1000).toFixed(1)}s</div></div>
      </div>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Test ID</th>
            <th>Module</th>
            <th>Scenario</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${testResults.map(t => `
            <tr>
              <td><code>${t.id}</code></td>
              <td>${t.module}</td>
              <td>${t.scenario}</td>
              <td><span class="badge ${t.status.toLowerCase()}">${t.status}</span></td>
              <td>${t.duration || 0}ms</td>
              <td style="color: ${t.status === 'PASS' ? '#94a3b8' : '#f87171'}; font-size: 12px;">${t.error || 'Verified successfully'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(reportsDir, 'selenium-report.html'), html);
  fs.writeFileSync(path.join(reportsDir, 'selenium-results.json'), JSON.stringify({ summary, testResults }, null, 2));
}

module.exports = { generateHtmlReport };
