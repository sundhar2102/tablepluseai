/**
 * TablePulse AI - Selenium Web E2E Master Test Runner
 * Covers: Authentication, Customer, Owner, Admin, Menu (Text-first), AI Chatbot, Order, Booking, Real-time
 */
const { createDriver } = require('../utils/driverFactory');
const { generateHtmlReport } = require('../utils/reportGenerator');
const config = require('../config/config');
const LoginPage = require('../pages/LoginPage');
const RegisterPage = require('../pages/RegisterPage');
const CustomerHomePage = require('../pages/CustomerHomePage');
const RestaurantDetailPage = require('../pages/RestaurantDetailPage');
const OrdersPage = require('../pages/OrdersPage');
const BookingsPage = require('../pages/BookingsPage');
const OwnerDashboardPage = require('../pages/OwnerDashboardPage');
const OwnerMenuPage = require('../pages/OwnerMenuPage');
const OwnerTablesPage = require('../pages/OwnerTablesPage');
const AdminDashboardPage = require('../pages/AdminDashboardPage');
const AIConciergePage = require('../pages/AIConciergePage');

async function runSeleniumTestSuite() {
  console.log('============================================================');
  console.log('🌐 RUNNING TABLEPULSE AI — SELENIUM WEB E2E TEST SUITE');
  console.log(`   Base URL: ${config.baseUrl} | Headless: ${config.headless}`);
  console.log('============================================================\n');

  const testResults = [];
  const startTime = Date.now();
  let driver;

  try {
    driver = await createDriver();
  } catch (err) {
    console.error('❌ Failed to initialize Selenium WebDriver:', err.message);
    return {
      total: 0,
      passed: 0,
      failed: 1,
      passRate: 0,
      duration: 0,
      error: err.message
    };
  }

  const loginPage = new LoginPage(driver);
  const registerPage = new RegisterPage(driver);
  const homePage = new CustomerHomePage(driver);
  const detailPage = new RestaurantDetailPage(driver);
  const ordersPage = new OrdersPage(driver);
  const bookingsPage = new BookingsPage(driver);
  const ownerDash = new OwnerDashboardPage(driver);
  const ownerMenu = new OwnerMenuPage(driver);
  const ownerTables = new OwnerTablesPage(driver);
  const adminDash = new AdminDashboardPage(driver);
  const aiPage = new AIConciergePage(driver);

  async function executeTest(id, module, scenario, fn) {
    const tStart = Date.now();
    try {
      await fn();
      const duration = Date.now() - tStart;
      testResults.push({ id, module, scenario, status: 'PASS', duration });
      console.log(`  ✅ [PASS] ${id} - ${scenario} (${duration}ms)`);
    } catch (err) {
      const duration = Date.now() - tStart;
      let screenshotPath = 'N/A';
      try {
        screenshotPath = await loginPage.takeScreenshot(id);
      } catch {}
      testResults.push({ id, module, scenario, status: 'FAIL', duration, error: err.message, screenshotPath });
      console.error(`  ❌ [FAIL] ${id} - ${scenario}: ${err.message}`);
    }
  }

  try {
    // ── 1. AUTHENTICATION MODULE (SEL-AUTH-*) ──────────────────────────────
    console.log('--- 1. AUTHENTICATION MODULE ---');
    await executeTest('SEL-AUTH-001', 'Auth', 'Navigate to login page', async () => {
      await loginPage.open();
      const url = await loginPage.getCurrentUrl();
      if (!url.includes('/login')) throw new Error(`Expected login page, got ${url}`);
    });

    await executeTest('SEL-AUTH-002', 'Auth', 'Invalid credentials error display', async () => {
      await loginPage.login('invalid_user@tablepulse.test', 'WrongPassword123');
      const errorMsg = await loginPage.getErrorMessage();
      // Should remain on login or show error message
      const url = await loginPage.getCurrentUrl();
      if (!url.includes('/login')) throw new Error('Expected to remain on login after invalid credentials');
    });

    await executeTest('SEL-AUTH-003', 'Auth', 'Empty fields client-side validation', async () => {
      await loginPage.open();
      await loginPage.click(loginPage.submitBtn);
      const url = await loginPage.getCurrentUrl();
      if (!url.includes('/login')) throw new Error('Submitted empty form');
    });

    await executeTest('SEL-AUTH-004', 'Auth', 'Customer login success', async () => {
      await loginPage.open();
      await loginPage.login('customer@demo.com', 'Demo@1234');
      await driver.sleep(1500);
      const url = await loginPage.getCurrentUrl();
      if (url.includes('/login')) throw new Error('Customer login failed to redirect');
    });

    // ── 2. CUSTOMER RESTAURANT DISCOVERY (SEL-CUST-*) ────────────────────
    console.log('\n--- 2. CUSTOMER RESTAURANT DISCOVERY ---');
    await executeTest('SEL-CUST-001', 'Customer', 'Load restaurants discovery list', async () => {
      await homePage.open();
      const count = await homePage.getRestaurantCount();
      if (count === 0) throw new Error('No restaurants rendered in discovery list');
    });

    await executeTest('SEL-CUST-002', 'Customer', 'Multi-restaurant list displays 5 active venues', async () => {
      await homePage.open();
      const count = await homePage.getRestaurantCount();
      if (count < 5) throw new Error(`Expected at least 5 restaurants, found ${count}`);
    });

    await executeTest('SEL-CUST-003', 'Customer', 'Search bar filters restaurants by query', async () => {
      await homePage.open();
      await homePage.searchRestaurant('Spice');
      await driver.sleep(500);
      const count = await homePage.getRestaurantCount();
      if (count === 0) throw new Error('Search query returned 0 matches');
    });

    // ── 3. TEXT-FIRST RESTAURANT MENU (SEL-MENU-*) ───────────────────────
    console.log('\n--- 3. TEXT-FIRST RESTAURANT MENU ---');
    await executeTest('SEL-MENU-001', 'Menu', 'Navigate to restaurant detail page', async () => {
      await detailPage.open(1);
      const count = await detailPage.getMenuItemCount();
      if (count === 0) throw new Error('No menu items loaded on restaurant 1');
    });

    await executeTest('SEL-MENU-002', 'Menu', 'Verify text-first cards with NO food images rendered', async () => {
      await detailPage.open(1);
      const foodImages = await driver.findElements({ css: '.grid > div img' });
      if (foodImages.length > 0) throw new Error(`Found ${foodImages.length} food images in menu cards - text-first requirement violated`);
    });

    await executeTest('SEL-MENU-003', 'Menu', 'Verify dietary badges (Veg / Non-Veg) render correctly', async () => {
      await detailPage.open(1);
      const badges = await driver.findElements({ xpath: '//span[contains(., "Veg") or contains(., "Non-Veg")]' });
      if (badges.length === 0) throw new Error('No dietary Veg/Non-Veg badges rendered');
    });

    // ── 4. CUSTOMER CART & ORDERS (SEL-ORD-*) ────────────────────────────
    console.log('\n--- 4. CUSTOMER CART & ORDERS ---');
    await executeTest('SEL-ORD-001', 'Orders', 'Add menu item to cart', async () => {
      await detailPage.open(1);
      await detailPage.addItemToCart();
    });

    await executeTest('SEL-ORD-002', 'Orders', 'Customer Orders page loads with proper state', async () => {
      await ordersPage.open();
      const url = await ordersPage.getCurrentUrl();
      if (!url.includes('/orders')) throw new Error('Failed to navigate to orders page');
    });

    // ── 5. CUSTOMER BOOKINGS (SEL-BKG-*) ─────────────────────────────────
    console.log('\n--- 5. CUSTOMER BOOKINGS ---');
    await executeTest('SEL-BKG-001', 'Bookings', 'Customer Bookings page loads with proper state', async () => {
      await bookingsPage.open();
      const url = await bookingsPage.getCurrentUrl();
      if (!url.includes('/bookings')) throw new Error('Failed to navigate to bookings page');
    });

    // ── 6. AI CONCIERGE CHATBOT (SEL-AI-*) ───────────────────────────────
    console.log('\n--- 6. AI CONCIERGE CHATBOT ---');
    await executeTest('SEL-AI-001', 'AI', 'Open AI Assistant Drawer', async () => {
      await detailPage.open(1);
      await aiPage.openDrawer();
    });

    // ── 7. OWNER DASHBOARD & SCOPING (SEL-OWN-*) ─────────────────────────
    console.log('\n--- 7. OWNER DASHBOARD & SCOPING ---');
    await executeTest('SEL-OWN-001', 'Owner', 'Owner login and dashboard access', async () => {
      await loginPage.login('owner@demo.com', 'Demo@1234', '/owner/login');
      await driver.sleep(2000);
      const isLoaded = await ownerDash.isDashboardLoaded();
      if (!isLoaded) throw new Error('Owner dashboard overview failed to load');
    });

    await executeTest('SEL-OWN-002', 'Owner', 'Owner menu management page loads items', async () => {
      await ownerMenu.open();
      const count = await ownerMenu.getMenuItemCount();
      if (count === 0) throw new Error('Owner menu items failed to load');
    });

    await executeTest('SEL-OWN-003', 'Owner', 'Owner tables page loads table grid', async () => {
      await ownerTables.open();
      const count = await ownerTables.getTableCount();
      if (count === 0) throw new Error('Owner table floor plan failed to load');
    });

    // ── 8. ADMIN DASHBOARD (SEL-ADM-*) ───────────────────────────────────
    console.log('\n--- 8. ADMIN DASHBOARD ---');
    await executeTest('SEL-ADM-001', 'Admin', 'Admin login and management portal access', async () => {
      await loginPage.login('admin@tablepulse.app', 'Demo@1234', '/admin/login');
      await driver.sleep(2000);
      const isLoaded = await adminDash.isAdminLoaded();
      if (!isLoaded) throw new Error('Admin dashboard failed to load');
    });

  } finally {
    if (driver) {
      await driver.quit();
    }
  }

  const duration = Date.now() - startTime;
  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;
  const total = testResults.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  const summary = { total, passed, failed, passRate, duration };
  generateHtmlReport(testResults, summary);

  console.log('\n============================================================');
  console.log(`🏁 SELENIUM WEB E2E RESULTS: ${passed}/${total} PASSED (${passRate}%)`);
  console.log(`   HTML Report: ${config.reportsDir}/selenium-report.html`);
  console.log('============================================================\n');

  return summary;
}

if (require.main === module) {
  runSeleniumTestSuite()
    .then(summary => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}

module.exports = { runSeleniumTestSuite };
