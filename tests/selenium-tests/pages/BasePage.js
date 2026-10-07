/**
 * Selenium Base Page Object
 */
const { By, until } = require('selenium-webdriver');
const config = require('../config/config');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = config.timeout;
  }

  async navigateTo(path = '') {
    const url = `${config.baseUrl}${path}`;
    await this.driver.get(url);
    await this.driver.sleep(500);
  }

  async waitForElement(locator, timeout = this.timeout) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async waitForVisible(locator, timeout = this.timeout) {
    const el = await this.waitForElement(locator, timeout);
    await this.driver.wait(until.elementIsVisible(el), timeout);
    return el;
  }

  async click(locator) {
    const el = await this.waitForVisible(locator);
    await el.click();
  }

  async type(locator, text) {
    const el = await this.waitForVisible(locator);
    await el.clear();
    await el.sendKeys(text);
  }

  async getText(locator) {
    const el = await this.waitForVisible(locator);
    return await el.getText();
  }

  async isElementPresent(locator) {
    try {
      const elements = await this.driver.findElements(locator);
      return elements.length > 0;
    } catch {
      return false;
    }
  }

  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  async takeScreenshot(name) {
    const fs = require('fs');
    const path = require('path');
    const screenshotsDir = config.screenshotsDir;
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const data = await this.driver.takeScreenshot();
    const filePath = path.join(screenshotsDir, `${name}_${Date.now()}.png`);
    fs.writeFileSync(filePath, data, 'base64');
    return filePath;
  }
}

module.exports = BasePage;
