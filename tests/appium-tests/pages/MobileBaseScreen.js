/**
 * Appium Mobile Base Screen Object
 */
class MobileBaseScreen {
  constructor(client) {
    this.client = client;
  }

  async find(selector) {
    return await this.client.$(selector);
  }

  async waitForElement(selector, timeout = 10000) {
    const el = await this.client.$(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  async click(selector) {
    const el = await this.waitForElement(selector);
    await el.click();
  }

  async type(selector, text) {
    const el = await this.waitForElement(selector);
    await el.setValue(text);
  }

  async getText(selector) {
    const el = await this.waitForElement(selector);
    return await el.getText();
  }

  async isDisplayed(selector) {
    try {
      const el = await this.client.$(selector);
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  async pressBack() {
    await this.client.back();
  }
}

module.exports = MobileBaseScreen;
