const assert = require('assert');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = 'http://localhost:5173';

(async function runDiscoveryVerification() {
  console.log('========================================================');
  console.log('  E2E TEST: RESTAURANT DISCOVERY & UI STATE VERIFICATION ');
  console.log('========================================================\n');

  const options = new chrome.Options();
  options.addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1280,900',
    '--disable-gpu'
  );

  let driver = null;

  async function safeClick(element) {
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element);
    await driver.sleep(300);
    try {
      await element.click();
    } catch {
      await driver.executeScript("arguments[0].click();", element);
    }
  }

  try {
    console.log('[Browser] Launching Google Chrome...');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    // ── 1. Customer Login ──────────────────────────────────────────
    console.log('\n[Step 1] Customer Login...');
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.css('input[type="email"]')), 15000);

    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passInput = await driver.findElement(By.css('input[type="password"]'));
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.sendKeys('customer@demo.com');
    await passInput.sendKeys('Demo@1234');
    await safeClick(submitBtn);

    // ── 2. Land on Restaurant Discovery (/app) ─────────────────────
    console.log('\n[Step 2] Navigating to Restaurant Discovery (/app)...');
    await driver.wait(until.urlContains('/app'), 10000);
    console.log('✅ Landed on:', await driver.getCurrentUrl());

    // Wait for restaurant cards or results header
    await driver.wait(until.elementLocated(By.css('.card')), 15000);
    await driver.sleep(1000);

    // ── 3. Verify Success State & Results Header ───────────────────
    console.log('\n[Step 3] Verifying Success State & Results Header...');
    const resultsHeader = await driver.findElements(By.id('discovery-results-header'));
    assert.strictEqual(resultsHeader.length, 1, 'Expected #discovery-results-header to be present in success state');

    const countElem = await driver.findElement(By.id('restaurant-count'));
    const countText = await countElem.getText();
    const count = parseInt(countText, 10);
    console.log(`✅ Results header displayed: Showing ${count} restaurants`);
    assert.ok(count > 0, 'Expected restaurant count to be greater than 0');

    // Verify error card is NOT displayed
    const errorCardsBefore = await driver.findElements(By.id('discovery-error-card'));
    assert.strictEqual(errorCardsBefore.length, 0, 'Expected NO error card in success state');
    console.log('✅ No contradictory error card in success state');

    // ── 4. Verify Multiple Locations (Switch to Indiranagar, Bengaluru) ─
    console.log('\n[Step 4] Testing Location Switch to Bengaluru (Indiranagar)...');
    const indiranagarBtn = await driver.wait(until.elementLocated(By.id('hub-indiranagar')), 10000);
    await safeClick(indiranagarBtn);
    await driver.sleep(2000);

    // Wait for discovery to finish loading and results header to appear
    const bglCountElem = await driver.wait(until.elementLocated(By.id('restaurant-count')), 15000);
    const bglCount = parseInt(await bglCountElem.getText(), 10);
    console.log(`✅ Bengaluru restaurants discovered: ${bglCount} restaurants`);
    assert.ok(bglCount > 0, 'Expected real restaurants found in Bengaluru');

    // ── 5. Simulate Failure Condition & Verify NO Contradictory State ──
    console.log('\n[Step 5] Simulating Failure Condition & Testing State Consistency...');
    await driver.executeScript('window.__simulateRestaurantError = true;');

    // Click refresh to trigger the failed request
    const headerRefreshBtn = await driver.findElement(By.id('btn-header-refresh'));
    await safeClick(headerRefreshBtn);
    await driver.sleep(1500);

    // CRITICAL CHECK: In error state:
    // 1. Error card MUST be visible
    const errorCard = await driver.wait(until.elementLocated(By.id('discovery-error-card')), 10000);
    assert.ok(errorCard, 'Expected #discovery-error-card to be visible upon failure');

    const errorTitle = await driver.findElement(By.id('discovery-error-title')).getText();
    const errorMsg = await driver.findElement(By.id('discovery-error-message')).getText();
    console.log(`✅ Error card visible: "${errorTitle}" - "${errorMsg}"`);
    assert.ok(errorTitle.includes('temporarily unavailable'), 'Expected title to indicate temporarily unavailable');

    // 2. Results Header MUST NOT BE VISIBLE (NO STALE "Showing 5 restaurants...")
    const resultsHeaderInError = await driver.findElements(By.id('discovery-results-header'));
    assert.strictEqual(resultsHeaderInError.length, 0, 'CONTRADICTION DETECTED: #discovery-results-header must NOT exist in error state!');
    console.log('✅ Verified: NO contradictory "Showing X restaurants..." header in error state!');

    // 3. Buttons [Try Again] and [Refresh Location] must be present
    const tryAgainBtn = await driver.findElement(By.id('btn-try-again'));
    const refreshLocBtn = await driver.findElement(By.id('btn-refresh-location'));
    assert.ok(tryAgainBtn, 'Expected [Try Again] button');
    assert.ok(refreshLocBtn, 'Expected [Refresh Location] button');
    console.log('✅ [Try Again] and [Refresh Location] buttons present in error card');

    // ── 6. Test Recovery via [Try Again] ───────────────────────────
    console.log('\n[Step 6] Testing Recovery via [Try Again]...');
    // Turn off error simulator
    await driver.executeScript('window.__simulateRestaurantError = false;');

    // Click Try Again
    await safeClick(tryAgainBtn);
    await driver.sleep(2500);

    // Verify error card disappears and results header reappears
    const errorCardAfter = await driver.findElements(By.id('discovery-error-card'));
    assert.strictEqual(errorCardAfter.length, 0, 'Expected error card to disappear after successful retry');

    const resultsHeaderAfter = await driver.wait(until.elementLocated(By.id('discovery-results-header')), 10000);
    assert.ok(resultsHeaderAfter, 'Expected results header to reappear after retry');

    const recoveredCountElem = await driver.findElement(By.id('restaurant-count'));
    const recoveredCount = parseInt(await recoveredCountElem.getText(), 10);
    console.log(`✅ Successfully recovered! Showing ${recoveredCount} restaurants`);
    assert.ok(recoveredCount > 0, 'Expected positive restaurant count after recovery');

    // ── 7. Verify Customer Detail & Pre-Order Flow (No Regression) ─
    console.log('\n[Step 7] Verifying Restaurant Details & Pre-Order Flow...');
    const chennaiCityBtn = await driver.wait(until.elementLocated(By.id('city-chennai')), 10000);
    await safeClick(chennaiCityBtn);
    await driver.sleep(2000);

    const tnagarBtn = await driver.wait(until.elementLocated(By.id('hub-t--nagar')), 10000);
    await safeClick(tnagarBtn);
    await driver.sleep(2000);

    // Wait for "The Spice Pavilion" card
    const spiceCard = await driver.wait(
      until.elementLocated(By.xpath("//h3[contains(text(), 'The Spice Pavilion')]")),
      10000
    );
    await safeClick(spiceCard);

    // Verify Restaurant Details
    await driver.wait(until.urlContains('/app/restaurants/1'), 10000);
    console.log('✅ Landed on Restaurant Details:', await driver.getCurrentUrl());

    // Click [View Menu]
    const viewMenuBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'View Menu')]")), 10000);
    await safeClick(viewMenuBtn);
    await driver.sleep(600);

    // Add first menu item to cart
    const addFoodBtns = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Add')]")), 10000);
    await safeClick(addFoodBtns);
    await driver.sleep(600);

    // Click [Review & Pre-Order]
    const reviewBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Review & Pre-Order')]")), 5000);
    await safeClick(reviewBtn);
    await driver.sleep(800);

    // Confirm Pre-Order
    const confirmBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Confirm & Send to Kitchen')]")), 5000);
    await safeClick(confirmBtn);

    // Wait for Order Details page
    await driver.wait(until.urlMatches(/\/app\/orders\/\d+/), 15000);
    console.log('✅ Order placed successfully! Tracking URL:', await driver.getCurrentUrl());

    console.log('\n========================================================');
    console.log('  ALL DISCOVERY & UI STATE TESTS PASSED SUCCESSFULLY! ✅ ');
    console.log('========================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (driver) {
      const pageSource = await driver.getPageSource().catch(() => '');
      console.error('Page source snippet:\n', pageSource.slice(0, 1000));
    }
    process.exit(1);
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
})();
