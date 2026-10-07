/**
 * RestaurantDetailPage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class RestaurantDetailPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.restaurantTitle = By.css('h1, h2.font-bold');
    this.menuItems = By.css('.grid > div');
    this.addToCartBtns = By.xpath('//button[contains(., "Add")]');
    this.bookTableBtn = By.xpath('//button[contains(., "Book Table") or contains(., "Reserve")]');
    this.tableStatusBadges = By.css('[data-status], .table-status');
    this.vegBadges = By.xpath('//span[contains(., "Veg")]');
    this.cartDrawer = By.css('[data-testid="cart-drawer"], .cart-drawer');
  }

  async open(restaurantId = 1) {
    await this.navigateTo(`/app/restaurants/${restaurantId}`);
  }

  async getMenuItemCount() {
    await this.driver.sleep(1000);
    const elements = await this.driver.findElements(this.menuItems);
    return elements.length;
  }

  async addItemToCart() {
    await this.driver.sleep(1000);
    const addBtns = await this.driver.findElements(this.addToCartBtns);
    if (addBtns.length > 0) {
      await this.driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", addBtns[0]);
      await this.driver.sleep(300);
      try {
        await addBtns[0].click();
      } catch (e) {
        await this.driver.executeScript("arguments[0].click();", addBtns[0]);
      }
      await this.driver.sleep(500);
    }
  }

  async clickBookTable() {
    if (await this.isElementPresent(this.bookTableBtn)) {
      await this.click(this.bookTableBtn);
      await this.driver.sleep(500);
    }
  }
}

module.exports = RestaurantDetailPage;
