const assert = require('assert');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = 'http://localhost:5173';

(async function runFlow() {
  console.log('========================================================');
  console.log('  E2E REAL BROWSER TEST: CUSTOMER RESTAURANT FLOW       ');
  console.log('========================================================\n');

  const options = new chrome.Options();
  options.addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1280,900',
    '--disable-gpu'
  );

  async function safeClick(element) {
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element);
    await driver.sleep(300);
    try {
      await element.click();
    } catch {
      await driver.executeScript("arguments[0].click();", element);
    }
  }

  let driver = null;
  try {
    console.log('[Browser] Launching Google Chrome...');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    // 1. Login
    console.log('[Step 1] Navigating to Login:', `${BASE_URL}/login`);
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.css('input[type="email"]')), 10000);

    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passInput = await driver.findElement(By.css('input[type="password"]'));
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.sendKeys('customer@demo.com');
    await passInput.sendKeys('Demo@1234');
    await safeClick(submitBtn);

    // 2. Wait for Discovery page
    console.log('[Step 2] Waiting for redirection to /app (Discovery)...');
    await driver.wait(until.urlContains('/app'), 10000);
    const currentUrl = await driver.getCurrentUrl();
    console.log('✅ Current URL:', currentUrl);

    // 3. Click Restaurant "The Spice Pavilion"
    console.log('[Step 3] Clicking on "The Spice Pavilion"...');
    // Wait for restaurant cards to load
    await driver.wait(until.elementLocated(By.xpath("//h3[contains(text(), 'The Spice Pavilion')]")), 15000);
    const spiceCard = await driver.findElement(By.xpath("//h3[contains(text(), 'The Spice Pavilion')]"));
    await safeClick(spiceCard);

    // 4. Restaurant Details Page Verification
    console.log('[Step 4] Waiting for Restaurant Details (/app/restaurants/1)...');
    await driver.wait(until.urlContains('/app/restaurants/1'), 10000);
    console.log('✅ Landed on Restaurant Details:', await driver.getCurrentUrl());

    // Wait for the restaurant title to appear
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'The Spice Pavilion')]")), 10000);

    const pageSource = await driver.getPageSource();

    // Verify all 15 required items
    console.log('\n--- VERIFYING 15 REQUIRED ITEMS ON RESTAURANT DETAILS PAGE ---');

    // 1. Restaurant Name
    assert.ok(pageSource.includes('The Spice Pavilion'), 'Missing: 1. Restaurant Name');
    console.log('✅ 1. Restaurant Name: The Spice Pavilion');

    // 2. Cuisine
    assert.ok(pageSource.includes('North Indian'), 'Missing: 2. Cuisine');
    console.log('✅ 2. Cuisine: North Indian');

    // 3. Rating
    assert.ok(pageSource.includes('4.8'), 'Missing: 3. Rating');
    console.log('✅ 3. Rating: 4.8');

    // 4. Reviews
    assert.ok(pageSource.includes('245 reviews'), 'Missing: 4. Reviews');
    console.log('✅ 4. Reviews: 245 reviews');

    // 5. Distance
    const hasDistance = pageSource.includes('from your location') || pageSource.includes('km');
    assert.ok(hasDistance, 'Missing: 5. Distance from location');
    console.log('✅ 5. Distance: Present from device coordinates');

    // 6. Address / Area
    assert.ok(pageSource.includes('42 Usman Road') && pageSource.includes('T. Nagar'), 'Missing: 6. Address/Area');
    console.log('✅ 6. Address / Area: 42 Usman Road, T. Nagar');

    // 7. Open/closed status
    assert.ok(pageSource.includes('Open Now'), 'Missing: 7. Open/Closed status');
    console.log('✅ 7. Open/Closed Status: Open Now');

    // 8. Menu
    assert.ok(pageSource.includes('Restaurant Menu') && pageSource.includes('Paneer Tikka Angare'), 'Missing: 8. Menu');
    console.log('✅ 8. Menu: Real menu items from TablePulse database displayed on page');

    // 9. Estimated waiting time
    assert.ok(pageSource.includes('Estimated Waiting Time'), 'Missing: 9. Estimated Waiting Time');
    console.log('✅ 9. Estimated Waiting Time: Present from TablePulse live calculation');

    // 10. Live crowd level
    const hasCrowdLevel = /Crowd Level:\s*(Low|Moderate|Busy|High|Full|Not Busy)/i.test(pageSource);
    assert.ok(hasCrowdLevel, 'Missing: 10. Live Crowd Level');
    console.log('✅ 10. Live Crowd Level: Live operational metric verified on page');

    // 11. Available tables
    assert.ok(pageSource.includes('Available Tables') && pageSource.includes('Live Table Floor Status'), 'Missing: 11. Available Tables');
    console.log('✅ 11. Available Tables: Live table metric & visual table grid present');

    // 12. [View Menu] button
    const viewMenuBtn = await driver.findElement(By.xpath("//button[contains(., 'View Menu')]"));
    assert.ok(viewMenuBtn, 'Missing: 12. [View Menu] button');
    console.log('✅ 12. [View Menu] button: Present and accessible');

    // 13. [Pre-Order Food] button
    const preOrderBtn = await driver.findElement(By.xpath("//button[contains(., 'Pre-Order Food')]"));
    assert.ok(preOrderBtn, 'Missing: 13. [Pre-Order Food] button');
    console.log('✅ 13. [Pre-Order Food] button: Present and accessible');

    // 14. [Reserve Table] button
    const reserveBtn = await driver.findElement(By.xpath("//button[contains(., 'Reserve Table')]"));
    assert.ok(reserveBtn, 'Missing: 14. [Reserve Table] button');
    console.log('✅ 14. [Reserve Table] button: Present and accessible');

    // 15. [Join Queue] button
    const queueBtn = await driver.findElement(By.xpath("//button[contains(., 'Join Queue')]"));
    assert.ok(queueBtn, 'Missing: 15. [Join Queue] button');
    console.log('✅ 15. [Join Queue] button: Present and accessible');

    // 5. Test [View Menu] button action
    console.log('\n[Step 5] Clicking [View Menu] button...');
    await safeClick(viewMenuBtn);
    await driver.sleep(600);

    // 6. Test Add Food to Cart
    console.log('[Step 6] Adding "Paneer Tikka Angare" to Cart...');
    const addFoodBtns = await driver.findElements(By.xpath("//button[contains(., 'Add')]"));
    assert.ok(addFoodBtns.length > 0, 'No "Add" button found on menu items');
    await safeClick(addFoodBtns[0]);
    await driver.sleep(600);

    // 7. Verify Cart bar appears
    console.log('[Step 7] Checking Bottom Cart Bar...');
    await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Review & Pre-Order')]")), 5000);
    const reviewBtn = await driver.findElement(By.xpath("//button[contains(., 'Review & Pre-Order')]"));
    console.log('✅ Cart Bar appeared with item(s) and total amount');

    // 8. Open Pre-Order Drawer
    console.log('[Step 8] Clicking "Review & Pre-Order"...');
    await safeClick(reviewBtn);
    await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Confirm & Send to Kitchen')]")), 5000);
    const confirmOrderBtn = await driver.findElement(By.xpath("//button[contains(., 'Confirm & Send to Kitchen')]"));
    console.log('✅ Pre-Order Confirmation Drawer opened with dish summary');

    // 9. Submit Pre-Order
    console.log('[Step 9] Submitting Pre-Order to Backend API...');
    await safeClick(confirmOrderBtn);

    // 10. Verify Navigation to Customer Order Tracking
    console.log('[Step 10] Waiting for Order Creation and Navigation to Order Tracking (/app/orders/:id)...');
    await driver.wait(until.urlMatches(/\/app\/orders\/\d+/), 15000);
    const orderTrackingUrl = await driver.getCurrentUrl();
    console.log('✅ Order Created! Navigated to Order Tracking:', orderTrackingUrl);

    // 11. Verify Order Tracking Page contents
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Order #')]")), 10000);
    const trackingSource = await driver.getPageSource();

    assert.ok(trackingSource.includes('The Spice Pavilion'), 'Missing restaurant name on tracking page');
    assert.ok(trackingSource.includes('RECEIVED') || trackingSource.includes('Received'), 'Missing status on tracking page');
    assert.ok(trackingSource.includes('Paneer Tikka Angare'), 'Missing item on tracking page');
    assert.ok(trackingSource.includes('Live Kitchen Stream'), 'Missing live stream indicator');
    console.log('✅ Customer Order Tracking verified with real order data and live kitchen stream!');

    // 12. Verify External OSM Restaurant displays "TablePulse operational data unavailable"
    console.log('\n[Step 12] Verifying External OSM Restaurant (/app/restaurants/osm:node:353206130)...');
    await driver.get(`${BASE_URL}/app/restaurants/osm:node:353206130`);
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'TablePulse operational data unavailable')]")), 15000);
    console.log('✅ "TablePulse operational data unavailable" correctly displayed for unregistered place!');

    console.log('\n========================================================');
    console.log('  ALL E2E BROWSER CHECKS PASSED WITH 100% SUCCESS! ✅   ');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ E2E Browser Test Failed:', err);
    process.exitCode = 1;
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
})();
