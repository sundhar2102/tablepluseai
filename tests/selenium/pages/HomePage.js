/**
 * HomePage - Page Object for Customer Discovery / Restaurant List screen
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class HomePage extends BasePage {
  constructor(driver, baseUrl) {
    super(driver, baseUrl);
    this.searchInput = By.css('input[placeholder*="Search by restaurant name"]');
    this.restaurantCards = By.css('.group.relative.flex.flex-col');
    this.cuisineFilters = By.css('button[class*="rounded-full"]');
    this.openNowToggle = By.css('button[role="switch"]');
    this.locationBadge = By.css('.bg-amber-500\\/10, .bg-emerald-500\\/10');
    this.hubChips = By.css('button.text-xs.font-medium');
  }

  async open() {
    await this.navigate('/app/restaurants');
  }

  async search(keyword) {
    await this.type(this.searchInput, keyword);
    await this.driver.sleep(1000);
  }

  async getCardCount() {
    try {
      const cards = await this.findAll(this.restaurantCards, 5000);
      return cards.length;
    } catch {
      return 0;
    }
  }

  async clickFirstRestaurant() {
    const cards = await this.findAll(this.restaurantCards);
    if (cards.length > 0) {
      await cards[0].click();
      await this.driver.sleep(1500);
    }
  }
}

module.exports = HomePage;
