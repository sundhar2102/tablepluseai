/**
 * LoginPage - Page Object for Customer, Owner and Admin Login screens
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver, baseUrl) {
    super(driver, baseUrl);
    this.emailInput = By.css('input[type="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.submitBtn = By.css('button[type="submit"]');
    this.errorMsg = By.css('.bg-red-500\\/10, .text-red-400, [role="alert"]');
    this.heading = By.css('h1, h2');
  }

  async openCustomerLogin() {
    await this.navigate('/login');
  }

  async openOwnerLogin() {
    await this.navigate('/owner/login');
  }

  async openAdminLogin() {
    await this.navigate('/admin/login');
  }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
    await this.driver.sleep(1500);
  }

  async getErrorMessage() {
    return await this.getText(this.errorMsg);
  }
}

module.exports = LoginPage;
