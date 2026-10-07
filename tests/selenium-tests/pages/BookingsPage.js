/**
 * BookingsPage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class BookingsPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emptyStateHeading = By.xpath('//h3[contains(., "No bookings yet") or contains(., "No Bookings")] | //h2[contains(., "No bookings yet")]');
    this.bookingCards = By.css('[data-testid="booking-card"], .booking-card');
    this.cancelBtn = By.xpath('//button[contains(., "Cancel")]');
  }

  async open() {
    await this.navigateTo('/app/bookings');
  }

  async isEmptyStateVisible() {
    await this.driver.sleep(1000);
    return await this.isElementPresent(this.emptyStateHeading);
  }

  async getBookingCount() {
    const cards = await this.driver.findElements(this.bookingCards);
    return cards.length;
  }
}

module.exports = BookingsPage;
