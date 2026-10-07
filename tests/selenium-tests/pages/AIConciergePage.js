/**
 * AIConciergePage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class AIConciergePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.drawerBtn = By.css('button[title*="AI"], button[aria-label*="AI Assistant"], .ai-assistant-btn');
    this.chatInput = By.css('input[placeholder*="Ask"], input[placeholder*="craving"], textarea');
    this.sendBtn = By.css('button[type="submit"], button[title*="Send"]');
    this.messages = By.css('.chat-message, [data-testid="chat-message"]');
    this.recommendedItems = By.css('.recommended-item, [data-testid="recommended-item"]');
  }

  async openDrawer() {
    if (await this.isElementPresent(this.drawerBtn)) {
      await this.click(this.drawerBtn);
      await this.driver.sleep(500);
    }
  }

  async sendMessage(prompt) {
    await this.waitForVisible(this.chatInput);
    await this.type(this.chatInput, prompt);
    await this.click(this.sendBtn);
    await this.driver.sleep(2000);
  }
}

module.exports = AIConciergePage;
