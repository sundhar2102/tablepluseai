/**
 * RestaurantDetailsPage - Page Object for Restaurant Profile, Table Grid and Hours
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class RestaurantDetailsPage extends BasePage {
  constructor(driver, baseUrl) {
    super(driver, baseUrl);
    this.restaurantTitle = By.css('h1');
    this.crowdBadge = By.css('[class*="border-emerald-500"], [class*="border-amber-500"], [class*="border-rose-500"]');
    this.waitCard = By.css('.bg-surface-dark');
    this.tableCards = By.css('.p-3\\.5.rounded-xl.border');
    this.simButton = By.css('button.bg-surface-elevated');
  }

  async open(restaurantId = 1) {
    await this.navigate(`/app/restaurants/${restaurantId}`);
  }

  async getTableCount() {
    try {
      const tables = await this.findAll(this.tableCards, 5000);
      return tables.length;
    } catch {
      return 0;
    }
  }

  async simulateStaffUpdate() {
    try {
      await this.click(this.simButton, 3000);
      await this.driver.sleep(1500);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = RestaurantDetailsPage;
