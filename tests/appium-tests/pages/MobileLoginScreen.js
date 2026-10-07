/**
 * Mobile Screens for Appium Tests
 */
const MobileBaseScreen = require('./MobileBaseScreen');

class MobileLoginScreen extends MobileBaseScreen {
  constructor(client) {
    super(client);
    this.emailInput = 'input[type="email"]';
    this.passwordInput = 'input[type="password"]';
    this.submitBtn = 'button[type="submit"]';
  }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
  }
}

class MobileHomeScreen extends MobileBaseScreen {
  constructor(client) {
    super(client);
    this.restaurantCard = 'a[href^="/app/restaurants/"], .restaurant-card';
    this.searchInput = 'input[type="search"], input[placeholder*="Search"]';
  }

  async selectFirstRestaurant() {
    await this.click(this.restaurantCard);
  }
}

module.exports = {
  MobileLoginScreen,
  MobileHomeScreen
};
