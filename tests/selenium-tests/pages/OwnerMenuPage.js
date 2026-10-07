/**
 * OwnerMenuPage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class OwnerMenuPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.addItemBtn = By.xpath('//button[contains(., "Add Item") or contains(., "New Dish")]');
    this.menuItemCards = By.css('.grid h3, .grid > div.card, [data-testid="menu-item"]');
    this.toggleAvailabilityBtns = By.xpath('//button[contains(., "Available") or contains(., "Unavailable")]');
  }

  async open() {
    await this.navigateTo('/owner/menu');
  }

  async getMenuItemCount() {
    await this.driver.sleep(1500);
    const items = await this.driver.findElements(this.menuItemCards);
    return items.length;
  }
}

module.exports = OwnerMenuPage;
