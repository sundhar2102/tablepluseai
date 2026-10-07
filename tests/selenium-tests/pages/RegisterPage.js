/**
 * RegisterPage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class RegisterPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.nameInput = By.css('input[name="name"], input[placeholder*="Name"], #name');
    this.emailInput = By.css('input[type="email"], input[name="email"], #email');
    this.phoneInput = By.css('input[type="tel"], input[name="phone"], #phone');
    this.passwordInput = By.css('input[type="password"], input[name="password"], #password');
    this.submitBtn = By.css('button[type="submit"]');
  }

  async open() {
    await this.navigateTo('/register');
  }

  async register(name, email, phone, password) {
    await this.waitForVisible(this.nameInput);
    await this.type(this.nameInput, name);
    await this.type(this.emailInput, email);
    if (await this.isElementPresent(this.phoneInput)) {
      await this.type(this.phoneInput, phone);
    }
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
    await this.driver.sleep(1000);
  }
}

module.exports = RegisterPage;
