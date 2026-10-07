/**
 * LoginPage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"], input[name="email"], #email');
    this.passwordInput = By.css('input[type="password"], input[name="password"], #password');
    this.submitBtn = By.css('button[type="submit"]');
    this.errorMsg = By.css('.text-red-500, .text-rose-500, [role="alert"]');
  }

  async open(path = '/login') {
    await this.navigateTo(path);
  }

  async login(email, password, path = '/login') {
    await this.open(path);
    await this.waitForVisible(this.emailInput);
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
    await this.driver.sleep(1500);
  }

  async getErrorMessage() {
    if (await this.isElementPresent(this.errorMsg)) {
      return await this.getText(this.errorMsg);
    }
    return '';
  }
}

module.exports = LoginPage;
