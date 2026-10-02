/**
 * TablePulse AI - Selenium Test Configuration
 */
require('dotenv').config();

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  headless: process.env.HEADLESS !== 'false',
  timeout: parseInt(process.env.TEST_TIMEOUT, 10) || 15000,
  browser: process.env.BROWSER || 'chrome',
  reportsDir: './reports',
  screenshotsDir: './screenshots'
};
