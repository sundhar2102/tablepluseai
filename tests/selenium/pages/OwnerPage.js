/**
 * OwnerPage & AdminPage - Page Objects for Owner Dashboard & Admin Panel
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class OwnerPage extends BasePage {
  constructor(driver, baseUrl) {
    super(driver, baseUrl);
    this.dashboardHeading = By.css('h1');
  }

  async open() {
    await this.navigate('/owner/dashboard');
  }
}

class AdminPage extends BasePage {
  constructor(driver, baseUrl) {
    super(driver, baseUrl);
    this.dashboardHeading = By.css('h1');
  }

  async open() {
    await this.navigate('/admin/dashboard');
  }
}

module.exports = { OwnerPage, AdminPage };
