/**
 * Driver Factory for Selenium WebDriver
 */
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config/config');

async function createDriver(options = {}) {
  const headless = options.headless !== undefined ? options.headless : config.headless;
  const chromeOptions = new chrome.Options();

  if (headless) {
    chromeOptions.addArguments('--headless=new');
  }
  chromeOptions.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1440,900',
    '--disable-extensions'
  );

  const driver = await new Builder()
    .forBrowser(config.browser)
    .setChromeOptions(chromeOptions)
    .build();

  await driver.manage().setTimeouts({
    implicit: 3000,
    pageLoad: 15000,
    script: 10000
  });

  return driver;
}

module.exports = { createDriver };
