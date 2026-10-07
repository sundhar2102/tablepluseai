/**
 * OwnerDashboardPage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class OwnerDashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.dashboardTitle = By.css('h1');
    this.statCards = By.css('.card');
    this.tablesNav = By.css('a[href*="/owner/tables"]');
    this.ordersNav = By.css('a[href*="/owner/orders"]');
    this.menuNav = By.css('a[href*="/owner/menu"]');
    this.reservationsNav = By.css('a[href*="/owner/reservations"]');
  }

  async open() {
    await this.navigateTo('/owner');
  }

  async isDashboardLoaded() {
    await this.driver.sleep(1500);
    const url = await this.getCurrentUrl();
    return url.includes('/owner') && (await this.isElementPresent(this.dashboardTitle));
  }
}

module.exports = OwnerDashboardPage;
