/**
 * OrdersPage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class OrdersPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emptyStateHeading = By.xpath('//h3[contains(., "No orders yet") or contains(., "No Orders")] | //h2[contains(., "No orders yet")]');
    this.orderCards = By.css('[data-testid="order-card"], .order-card');
    this.activeOrdersTab = By.xpath('//button[contains(., "Active")]');
    this.pastOrdersTab = By.xpath('//button[contains(., "Past")]');
  }

  async open() {
    await this.navigateTo('/app/orders');
  }

  async isEmptyStateVisible() {
    await this.driver.sleep(1000);
    return await this.isElementPresent(this.emptyStateHeading);
  }

  async getOrderCount() {
    const cards = await this.driver.findElements(this.orderCards);
    return cards.length;
  }
}

module.exports = OrdersPage;
