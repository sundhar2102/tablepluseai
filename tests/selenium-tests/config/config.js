/**
 * TablePulse AI - Selenium Test Configuration
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  headless: process.env.HEADLESS !== 'false',
  timeout: parseInt(process.env.TEST_TIMEOUT, 10) || 15000,
  browser: process.env.BROWSER || 'chrome',
  reportsDir: path.resolve(__dirname, '../reports'),
  screenshotsDir: path.resolve(__dirname, '../screenshots')
};
