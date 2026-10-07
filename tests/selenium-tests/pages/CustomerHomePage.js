/**
 * CustomerHomePage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class CustomerHomePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.restaurantCards = By.css('[data-testid="restaurant-card"], .restaurant-card, a[href^="/app/restaurants/"]');
    this.searchInput = By.css('input[placeholder*="Search"], input[type="search"]');
    this.filterButtons = By.css('button[data-filter], .filter-btn');
    this.aiAssistantTrigger = By.css('button[title*="AI"], button[aria-label*="AI"], .ai-assistant-btn');
  }

  async open() {
    await this.navigateTo('/app/restaurants');
  }

  async getRestaurantCount() {
    await this.driver.sleep(1000);
    const elements = await this.driver.findElements(this.restaurantCards);
    return elements.length;
  }

  async clickFirstRestaurant() {
    const elements = await this.driver.findElements(this.restaurantCards);
    if (elements.length > 0) {
      await elements[0].click();
      await this.driver.sleep(1000);
    }
  }

  async searchRestaurant(query) {
    if (await this.isElementPresent(this.searchInput)) {
      await this.type(this.searchInput, query);
      await this.driver.sleep(500);
    }
  }
}

module.exports = CustomerHomePage;
