/**
 * AdminDashboardPage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class AdminDashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.adminTitle = By.xpath('//h1[contains(., "Admin")] | //h2[contains(., "Admin")] | //span[contains(., "SUPER ADMIN")] | //div[contains(., "Admin")]');
    this.usersNav = By.css('a[href*="/admin/users"]');
    this.restaurantsNav = By.css('a[href*="/admin/restaurants"]');
    this.approvalsNav = By.css('a[href*="/admin/approvals"]');
  }

  async open() {
    await this.navigateTo('/admin');
  }

  async isAdminLoaded() {
    await this.driver.sleep(1500);
    const url = await this.getCurrentUrl();
    return url.includes('/admin') && (await this.isElementPresent(this.adminTitle));
  }
}

module.exports = AdminDashboardPage;
