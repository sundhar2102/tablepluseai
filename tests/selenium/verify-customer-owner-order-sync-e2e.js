const assert = require('assert');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('../../client/node_modules/axios');

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:3001/api';

async function safeClick(driver, element) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element);
      await driver.sleep(300);
      try {
        await element.click();
      } catch {
        await driver.executeScript("arguments[0].click();", element);
      }
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      await driver.sleep(400);
    }
  }
}

(async function runSyncE2E() {
  console.log('================================================================');
  console.log('  E2E REAL BROWSER TEST: CUSTOMER ↔ OWNER ORDER SYNCHRONIZATION ');
  console.log('================================================================\n');

  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1280,900',
    '--disable-gpu'
  );

  let customerDriver = null;
  let ownerDriver = null;

  try {
    // ── STEP 1: Launch Customer Browser & Login ────────────────────────────────
    console.log('[Step 1] Launching Customer Browser & Logging In...');
    customerDriver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
    await customerDriver.get(`${BASE_URL}/login`);
    await customerDriver.wait(until.elementLocated(By.css('input[type="email"]')), 10000);

    await customerDriver.findElement(By.css('input[type="email"]')).sendKeys('customer@demo.com');
    await customerDriver.findElement(By.css('input[type="password"]')).sendKeys('Demo@1234');
    const customerLoginBtn = await customerDriver.findElement(By.css('button[type="submit"]'));
    await safeClick(customerDriver, customerLoginBtn);

    await customerDriver.wait(until.urlContains('/app'), 10000);
    console.log('✅ Customer logged in successfully: /app');

    // ── STEP 2: Launch Owner Browser & Login ───────────────────────────────────
    console.log('\n[Step 2] Launching Restaurant Owner Browser & Logging In...');
    ownerDriver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
    await ownerDriver.get(`${BASE_URL}/owner/login`);
    await ownerDriver.wait(until.elementLocated(By.css('input[type="email"]')), 10000);

    await ownerDriver.findElement(By.css('input[type="email"]')).sendKeys('owner@demo.com');
    await ownerDriver.findElement(By.css('input[type="password"]')).sendKeys('Demo@1234');
    const ownerLoginBtn = await ownerDriver.findElement(By.css('button[type="submit"]'));
    await safeClick(ownerDriver, ownerLoginBtn);

    // Wait for redirection past /owner/login to /owner dashboard
    await ownerDriver.wait(async () => {
      const u = await ownerDriver.getCurrentUrl();
      return u.includes('/owner') && !u.includes('/login');
    }, 10000);
    console.log('✅ Owner logged in successfully, landed on:', await ownerDriver.getCurrentUrl());

    // Owner navigates to Kitchen Orders dashboard
    console.log('[Step 2b] Owner navigating to /owner/orders...');
    await ownerDriver.wait(until.elementLocated(By.css('a[href="/owner/orders"]')), 10000);
    const ordersNavLink = await ownerDriver.findElement(By.css('a[href="/owner/orders"]'));
    await safeClick(ownerDriver, ordersNavLink);

    await ownerDriver.wait(until.urlContains('/owner/orders'), 10000);
    await ownerDriver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Kitchen Display & Orders')]")), 10000);
    console.log('✅ Owner Kitchen Orders dashboard open and listening on WebSocket');

    // ── STEP 3: Customer Selects Restaurant & Pre-Orders Food ─────────────────
    console.log('\n[Step 3] Customer selecting "The Spice Pavilion" & Placing Order...');
    await customerDriver.wait(until.elementLocated(By.xpath("//h3[contains(text(), 'The Spice Pavilion')]")), 15000);
    const spiceCard = await customerDriver.findElement(By.xpath("//h3[contains(text(), 'The Spice Pavilion')]"));
    await safeClick(customerDriver, spiceCard);

    await customerDriver.wait(until.urlContains('/app/restaurants/1'), 10000);
    await customerDriver.wait(until.elementLocated(By.xpath("//button[contains(., 'View Menu')]")), 10000);

    // Scroll to menu
    const viewMenuBtn = await customerDriver.findElement(By.xpath("//button[contains(., 'View Menu')]"));
    await safeClick(customerDriver, viewMenuBtn);
    await customerDriver.sleep(500);

    // Add item to cart
    const addBtns = await customerDriver.findElements(By.xpath("//button[contains(., 'Add')]"));
    assert.ok(addBtns.length > 0, 'No menu item add buttons found');
    await safeClick(customerDriver, addBtns[0]);
    await customerDriver.sleep(500);

    // Review & Pre-Order
    await customerDriver.wait(until.elementLocated(By.xpath("//button[contains(., 'Review & Pre-Order')]")), 5000);
    const reviewBtn = await customerDriver.findElement(By.xpath("//button[contains(., 'Review & Pre-Order')]"));
    await safeClick(customerDriver, reviewBtn);

    // Confirm & Send to Kitchen
    await customerDriver.wait(until.elementLocated(By.xpath("//button[contains(., 'Confirm & Send to Kitchen')]")), 5000);
    const confirmBtn = await customerDriver.findElement(By.xpath("//button[contains(., 'Confirm & Send to Kitchen')]"));
    await safeClick(customerDriver, confirmBtn);

    // Customer lands on Order Tracking
    await customerDriver.wait(until.urlMatches(/\/app\/orders\/\d+/), 15000);
    const customerOrderUrl = await customerDriver.getCurrentUrl();
    const orderIdMatch = customerOrderUrl.match(/\/app\/orders\/(\d+)/);
    assert.ok(orderIdMatch, 'Failed to extract created order ID from customer URL');
    const orderId = parseInt(orderIdMatch[1], 10);
    console.log(`✅ Order placed! Customer Tracking URL: ${customerOrderUrl} (Order #${orderId})`);

    // Verify initial Customer tracking state
    await customerDriver.wait(until.elementLocated(By.id('order-status')), 10000);
    const initialStatusText = await customerDriver.findElement(By.id('order-status')).getText();
    assert.ok(initialStatusText.includes('RECEIVED'), `Initial status was expected to be RECEIVED, got: ${initialStatusText}`);
    console.log(`✅ Customer Tracking displays: ${initialStatusText}`);

    // ── STEP 4: Owner Real-Time Order Receiving ───────────────────────────────
    console.log(`\n[Step 4] Verifying Owner Dashboard receives Order #${orderId} in real-time...`);
    // Wait for the new order card to appear on owner dashboard without reload
    await ownerDriver.wait(until.elementLocated(By.id(`owner-order-${orderId}`)), 15000);
    const ownerOrderCard = await ownerDriver.findElement(By.id(`owner-order-${orderId}`));
    const ownerCardText = await ownerOrderCard.getText();
    assert.ok(ownerCardText.includes(`#${orderId}`), `Owner card does not contain #${orderId}`);
    assert.ok(ownerCardText.toLowerCase().includes('received'), 'Owner card status is not received');
    console.log(`✅ Owner received Order #${orderId} in real time! Status: received`);

    // ── STEP 5: Owner Transitions Order: RECEIVED → PREPARING ─────────────────
    console.log('\n[Step 5] Owner marks order as PREPARING ("Start Cooking")...');
    const startCookingBtn = await ownerDriver.findElement(By.id(`btn-prepare-${orderId}`));
    await safeClick(ownerDriver, startCookingBtn);

    // Wait for owner card status to change to preparing
    await ownerDriver.wait(async () => {
      const st = await ownerDriver.findElement(By.id(`owner-order-status-${orderId}`)).getText();
      return st.toLowerCase().includes('preparing');
    }, 10000);
    console.log(`✅ Owner dashboard updated: Order #${orderId} status is now "preparing"`);

    // ── STEP 6: Customer Sees Status Change to PREPARING Automatically ───────
    console.log('[Step 6] Verifying Customer Tracking updates to PREPARING automatically...');
    await customerDriver.wait(async () => {
      const st = await customerDriver.findElement(By.id('order-status')).getText();
      return st.toUpperCase().includes('PREPARING');
    }, 10000);
    const preparingStatusText = await customerDriver.findElement(By.id('order-status')).getText();
    console.log(`✅ Customer saw real-time status update: ${preparingStatusText} (No manual refresh!)`);

    // ── STEP 7: Owner Transitions Order: PREPARING → SERVED ───────────────────
    console.log('\n[Step 7] Owner marks order as SERVED ("Mark Served at Table")...');
    const markServedBtn = await ownerDriver.findElement(By.id(`btn-serve-${orderId}`));
    await safeClick(ownerDriver, markServedBtn);

    await ownerDriver.wait(async () => {
      const st = await ownerDriver.findElement(By.id(`owner-order-status-${orderId}`)).getText();
      return st.toLowerCase().includes('served');
    }, 10000);
    console.log(`✅ Owner dashboard updated: Order #${orderId} status is now "served"`);

    // ── STEP 8: Customer Sees Status Change to SERVED Automatically ───────────
    console.log('[Step 8] Verifying Customer Tracking updates to SERVED automatically...');
    await customerDriver.wait(async () => {
      const st = await customerDriver.findElement(By.id('order-status')).getText();
      return st.toUpperCase().includes('SERVED');
    }, 10000);
    const servedStatusText = await customerDriver.findElement(By.id('order-status')).getText();
    console.log(`✅ Customer saw real-time status update: ${servedStatusText} (No manual refresh!)`);

    // ── STEP 9: Owner Transitions Order: SERVED → COMPLETED ───────────────────
    console.log('\n[Step 9] Owner marks order as COMPLETED ("Complete Order")...');
    await ownerDriver.wait(until.elementLocated(By.id(`btn-complete-${orderId}`)), 10000);
    await ownerDriver.sleep(400);
    const completeBtn = await ownerDriver.findElement(By.id(`btn-complete-${orderId}`));
    await safeClick(ownerDriver, completeBtn);

    // In Live Kitchen (Active) tab, completed orders move to Completed tab
    const completedTab = await ownerDriver.findElement(By.xpath("//button[contains(., 'Completed')]"));
    await safeClick(ownerDriver, completedTab);
    await ownerDriver.wait(until.elementLocated(By.id(`owner-order-status-${orderId}`)), 10000);
    const ownerCompletedText = await ownerDriver.findElement(By.id(`owner-order-status-${orderId}`)).getText();
    assert.ok(ownerCompletedText.toLowerCase().includes('completed'), 'Owner completed status check');
    console.log(`✅ Owner dashboard updated: Order #${orderId} moved to Completed tab with status: ${ownerCompletedText}`);

    // ── STEP 10: Customer Sees Status Change to COMPLETED Automatically ────────
    console.log('[Step 10] Verifying Customer Tracking updates to COMPLETED automatically...');
    await customerDriver.wait(async () => {
      const st = await customerDriver.findElement(By.id('order-status')).getText();
      return st.toUpperCase().includes('COMPLETED');
    }, 10000);
    const completedStatusText = await customerDriver.findElement(By.id('order-status')).getText();
    console.log(`✅ Customer saw real-time status update: ${completedStatusText} (Dining complete!)`);

    // ── STEP 11: Refresh & Reconnect Persistence Verification ──────────────────
    console.log('\n[Step 11] Testing Refresh & Database Persistence...');
    await customerDriver.navigate().refresh();
    await customerDriver.wait(until.elementLocated(By.id('order-status')), 10000);
    const refreshedCustomerStatus = await customerDriver.findElement(By.id('order-status')).getText();
    assert.ok(refreshedCustomerStatus.includes('COMPLETED'), 'After refresh, customer status must remain COMPLETED');
    console.log(`✅ Customer page reloaded: Order #${orderId} retained database status: ${refreshedCustomerStatus}`);

    await ownerDriver.navigate().refresh();
    // Switch to "Completed" or "All Orders" tab on owner
    const allTab = await ownerDriver.findElement(By.xpath("//button[contains(., 'All Orders')]"));
    await safeClick(ownerDriver, allTab);
    await ownerDriver.wait(until.elementLocated(By.id(`owner-order-${orderId}`)), 10000);
    const refreshedOwnerStatus = await ownerDriver.findElement(By.id(`owner-order-status-${orderId}`)).getText();
    assert.ok(refreshedOwnerStatus.toLowerCase().includes('completed'), 'After refresh, owner status must remain completed');
    console.log(`✅ Owner page reloaded: Order #${orderId} retained database status: ${refreshedOwnerStatus}`);

    // ── STEP 12: Multi-Restaurant & Cross-Customer Security Checks ─────────────
    console.log('\n[Step 12] Multi-Restaurant & Cross-Customer Security Verification...');
    
    // Login Owner 2 (Coastal Catch & Grills, restaurant_id = 2)
    const owner2Login = await axios.post(`${API_BASE}/auth/login`, {
      email: 'owner2@demo.com',
      password: 'Demo@1234',
      role: 'owner',
    });
    const owner2Token = owner2Login.data.data.token;

    // Owner 2 tries to fetch their orders: Must NOT include Restaurant 1's order
    const owner2OrdersRes = await axios.get(`${API_BASE}/owner/orders`, {
      headers: { Authorization: `Bearer ${owner2Token}` },
    });
    const owner2OrderIds = owner2OrdersRes.data.data.map((o) => o.id);
    assert.ok(!owner2OrderIds.includes(orderId), `Security Failure: Owner 2 sees Restaurant 1's order #${orderId}`);
    console.log(`✅ Owner 2 (/owner/orders) cannot see Restaurant 1's order #${orderId}`);

    // Owner 2 tries to update status of Restaurant 1's order: Must return 403 Forbidden
    let owner2Forbidden = false;
    try {
      await axios.patch(`${API_BASE}/owner/orders/${orderId}/status`, { status: 'preparing' }, {
        headers: { Authorization: `Bearer ${owner2Token}` },
      });
    } catch (err) {
      if (err.response?.status === 403) {
        owner2Forbidden = true;
      }
    }
    assert.ok(owner2Forbidden, 'Owner 2 was not forbidden from modifying Restaurant 1 order');
    console.log(`✅ Owner 2 blocked with 403 FORBIDDEN when attempting to mutate Restaurant 1 order`);

    // Customer 2 tries to view Customer 1's order: Must return 403 Forbidden
    const cust2Login = await axios.post(`${API_BASE}/auth/login`, {
      email: 'owner@demo.com', // use another user as non-owner customer or registered customer
      password: 'Demo@1234',
    });
    // Use test customer created earlier or register fresh
    const rand2 = Date.now();
    await axios.post(`${API_BASE}/auth/register`, {
      name: 'Unrelated Customer',
      email: `unrelated_${rand2}@example.com`,
      phone: '+91 9999988888',
      password: 'Password123!',
      role: 'customer',
    });
    const cust2Token = (await axios.post(`${API_BASE}/auth/login`, {
      email: `unrelated_${rand2}@example.com`,
      password: 'Password123!',
      role: 'customer',
    })).data.data.token;

    let cust2Forbidden = false;
    try {
      await axios.get(`${API_BASE}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${cust2Token}` },
      });
    } catch (err) {
      if (err.response?.status === 403) {
        cust2Forbidden = true;
      }
    }
    assert.ok(cust2Forbidden, `Customer 2 was not forbidden from accessing Customer 1 order #${orderId}`);
    console.log(`✅ Customer 2 blocked with 403 FORBIDDEN when attempting to view Customer 1 order #${orderId}`);

    console.log('\n================================================================');
    console.log('  ALL CUSTOMER ↔ OWNER ORDER SYNC E2E CHECKS PASSED (100%)! ✅   ');
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ E2E Order Sync Test Failed:', err);
    process.exitCode = 1;
  } finally {
    if (customerDriver) await customerDriver.quit();
    if (ownerDriver) await ownerDriver.quit();
  }
})();
