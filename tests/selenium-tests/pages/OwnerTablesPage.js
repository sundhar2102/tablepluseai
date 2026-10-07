/**
 * OwnerTablesPage Object
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class OwnerTablesPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.tableCards = By.xpath('//h3[contains(., "Table")] | //div[contains(@class, "card")]//h3');
    this.addTableBtn = By.xpath('//button[contains(., "Add Table")]');
    this.statusToggles = By.css('[data-testid="table-status-select"], select');
  }

  async open() {
    await this.navigateTo('/owner/tables');
  }

  async getTableCount() {
    await this.driver.sleep(1500);
    const tables = await this.driver.findElements(this.tableCards);
    return tables.length;
  }
}

module.exports = OwnerTablesPage;
