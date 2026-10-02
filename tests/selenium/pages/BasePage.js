/**
 * BasePage - Common Page Object Model utilities for Selenium
 */
const { By, until } = require('selenium-webdriver');

class BasePage {
  constructor(driver, baseUrl = 'http://localhost:5173') {
    this.driver = driver;
    this.baseUrl = baseUrl;
  }

  async navigate(path = '') {
    const url = `${this.baseUrl}${path}`;
    await this.driver.get(url);
    await this.driver.sleep(1000);
  }

  async find(locator, timeout = 10000) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async findAll(locator, timeout = 10000) {
    await this.driver.wait(until.elementLocated(locator), timeout);
    return await this.driver.findElements(locator);
  }

  async click(locator, timeout = 10000) {
    const el = await this.find(locator, timeout);
    await this.driver.wait(until.elementIsVisible(el), timeout);
    await el.click();
  }

  async type(locator, text, timeout = 10000) {
    const el = await this.find(locator, timeout);
    await this.driver.wait(until.elementIsVisible(el), timeout);
    await el.clear();
    await el.sendKeys(text);
  }

  async getText(locator, timeout = 10000) {
    const el = await this.find(locator, timeout);
    return await el.getText();
  }

  async isVisible(locator, timeout = 5000) {
    try {
      const el = await this.find(locator, timeout);
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  async getTitle() {
    return await this.driver.getTitle();
  }

  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  async takeScreenshot(name = 'screenshot') {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const image = await this.driver.takeScreenshot();
    const filePath = path.join(dir, `${name}_${Date.now()}.png`);
    fs.writeFileSync(filePath, image, 'base64');
    return filePath;
  }
}

module.exports = BasePage;
