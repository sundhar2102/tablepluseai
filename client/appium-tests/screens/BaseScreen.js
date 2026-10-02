/**
 * BaseScreen for Mobile Appium Page/Screen Object Model
 */
class BaseScreen {
  constructor(driver) {
    this.driver = driver;
  }

  async findElement(selector) {
    return this.driver.$(selector);
  }

  async findElements(selector) {
    return this.driver.$$(selector);
  }

  async click(selector) {
    const el = await this.findElement(selector);
    await el.waitForDisplayed({ timeout: 10000 });
    await el.click();
  }

  async setValue(selector, value) {
    const el = await this.findElement(selector);
    await el.waitForDisplayed({ timeout: 10000 });
    await el.setValue(value);
  }

  async getText(selector) {
    const el = await this.findElement(selector);
    await el.waitForDisplayed({ timeout: 10000 });
    return el.getText();
  }

  async isDisplayed(selector) {
    try {
      const el = await this.findElement(selector);
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  async takeScreenshot(filepath) {
    if (this.driver) {
      await this.driver.saveScreenshot(filepath);
    }
  }
}

module.exports = BaseScreen;
