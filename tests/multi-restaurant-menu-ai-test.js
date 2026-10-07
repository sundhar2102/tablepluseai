/**
 * Test Suite: Multi-Restaurant Menu Isolation, Rich Menus, & AI Grounded Assistant
 * 
 * Verifies:
 * 1. Multi-restaurant menu isolation (5 active restaurants)
 * 2. Preparation time, categories, prices, veg/non-veg metadata
 * 3. AI assistant recommendations:
 *    - Strict restaurant context
 *    - Vegetarian filter
 *    - Budget filter
 *    - Specific dish search
 *    - Honest notice & alternatives when dish is absent (anti-hallucination)
 *    - Add-to-cart action extraction
 * 4. Owner menu management isolation & real-time updates
 * 5. Zero demo orders / zero demo bookings in MySQL
 */

const BASE_URL = 'http://localhost:3001/api';

async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return { data, status: res.status };
}

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function assert(condition, message) {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`  ✅ [PASS] ${message}`);
    results.details.push({ status: 'PASS', message });
  } else {
    results.failed++;
    console.error(`  ❌ [FAIL] ${message}`);
    results.details.push({ status: 'FAIL', message });
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🧪 RUNNING TABLEPULSE AI: MULTI-RESTAURANT & AI VERIFICATION');
  console.log('============================================================\n');

  let customerToken = null;
  let ownerToken = null;

  // 1. AUTHENTICATION
  try {
    const custRes = await api('/auth/login', {
      method: 'POST',
      body: { email: 'customer@demo.com', password: 'Demo@1234' }
    });
    customerToken = custRes.data.data.token;
    assert(!!customerToken, 'Customer authenticated successfully');
  } catch (err) {
    assert(false, `Customer login failed: ${err.message}`);
  }

  try {
    const ownerRes = await api('/auth/login', {
      method: 'POST',
      body: { email: 'owner@demo.com', password: 'Demo@1234' }
    });
    ownerToken = ownerRes.data.data.token;
    assert(!!ownerToken, 'Owner authenticated successfully');
  } catch (err) {
    assert(false, `Owner login failed: ${err.message}`);
  }

  // 2. ACTIVE RESTAURANTS & MULTI-RESTAURANT MENU ISOLATION
  console.log('\n--- 1. MULTI-RESTAURANT MENU ISOLATION & DATA CONTENT ---');
  let restaurants = [];
  try {
    const rRes = await api('/restaurants');
    restaurants = rRes.data.data.restaurants || [];
    assert(restaurants.length >= 5, `Found ${restaurants.length} active restaurants in database`);
  } catch (err) {
    assert(false, `Fetch restaurants failed: ${err.message}`);
  }

  const restaurantMenus = {};

  for (const r of restaurants) {
    try {
      const mRes = await api(`/restaurants/${r.id}/menu`);
      const menuData = mRes.data.data;
      const categories = menuData.categories || [];
      const totalItems = categories.reduce((sum, c) => sum + (c.items ? c.items.length : 0), 0);

      assert(categories.length > 0, `Restaurant ${r.id} (${r.name}): Has ${categories.length} categories`);
      assert(totalItems >= 12, `Restaurant ${r.id} (${r.name}): Has ${totalItems} items (rich menu)`);

      // Verify item properties: preparation_time_mins, price, etc.
      let allItemsHavePrepTime = true;
      let allItemsBelongToThisRestaurant = true;
      const itemNames = [];

      for (const cat of categories) {
        for (const item of (cat.items || [])) {
          itemNames.push(item.name.toLowerCase());
          if (item.preparation_time_mins === undefined || item.preparation_time_mins === null) {
            allItemsHavePrepTime = false;
          }
          if (item.restaurant_id && item.restaurant_id !== r.id) {
            allItemsBelongToThisRestaurant = false;
          }
        }
      }

      assert(allItemsHavePrepTime, `Restaurant ${r.id}: All items have preparation_time_mins populated`);
      assert(allItemsBelongToThisRestaurant, `Restaurant ${r.id}: All items belong strictly to restaurant ${r.id}`);

      restaurantMenus[r.id] = { name: r.name, cuisine: r.cuisine_type, items: itemNames };
    } catch (err) {
      assert(false, `Restaurant ${r.id} menu fetch failed: ${err.message}`);
    }
  }

  // Verify Zero cross-restaurant menu leakage
  console.log('\n--- 2. CROSS-RESTAURANT MENU LEAKAGE CHECK ---');
  if (restaurantMenus[1] && restaurantMenus[5]) {
    const indianItems = restaurantMenus[1].items;
    const japaneseItems = restaurantMenus[5].items;

    const hasSushiInIndian = indianItems.some(name => name.includes('sushi') || name.includes('ramen'));
    const hasBiryaniInJapanese = japaneseItems.some(name => name.includes('biryani') || name.includes('paneer'));

    assert(!hasSushiInIndian, 'Restaurant 1 (North Indian) does NOT contain Japanese Sushi/Ramen items');
    assert(!hasBiryaniInJapanese, 'Restaurant 5 (Japanese) does NOT contain North Indian Biryani/Paneer items');
  }

  // 3. AI CHATBOT CONTEXTUAL RECOMMENDATION TESTS
  console.log('\n--- 3. AI CHATBOT CONTEXTUAL RECOMMENDATION TESTS ---');

  // Test 3a: Vegetarian filter at Restaurant 1
  try {
    const aiVeg = await api('/ai/assistant', {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'I am vegetarian, show me good options' }],
        restaurantId: 1
      },
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    const items = aiVeg.data.data.recommendedItems || [];
    assert(items.length > 0, `Restaurant 1: AI returned ${items.length} recommendations for vegetarian query`);
    const allVeg = items.every(i => i.is_vegetarian === 1);
    assert(allVeg, 'Restaurant 1: All recommended items are 100% vegetarian (is_vegetarian = 1)');
  } catch (err) {
    assert(false, `Vegetarian query failed: ${err.message}`);
  }

  // Test 3b: Budget filter at Restaurant 1
  try {
    const aiBudget = await api('/ai/assistant', {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'What can I get under 300?' }],
        restaurantId: 1
      },
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    const items = aiBudget.data.data.recommendedItems || [];
    assert(items.length > 0, `Restaurant 1: AI returned ${items.length} items for budget query`);
    const allUnder300 = items.every(i => parseFloat(i.price) <= 300);
    assert(allUnder300, 'Restaurant 1: All recommended items are under or equal to ₹300');
  } catch (err) {
    assert(false, `Budget query failed: ${err.message}`);
  }

  // Test 3c: Anti-Hallucination: Ask for Biryani at Restaurant 5 (Japanese Sakura Ramen)
  try {
    const aiBiryaniAtJapanese = await api('/ai/assistant', {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'I want biryani' }],
        restaurantId: 5
      },
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    const reply = aiBiryaniAtJapanese.data.data.reply || '';
    const items = aiBiryaniAtJapanese.data.data.recommendedItems || [];
    const mentionsNotAvailable = reply.toLowerCase().includes('not available');
    const recommendedJapanese = items.every(i => restaurantMenus[5].items.includes(i.name.toLowerCase()));

    assert(mentionsNotAvailable, 'Restaurant 5 (Japanese): AI explicitly informs customer that Biryani is not available');
    assert(recommendedJapanese && items.length > 0, 'Restaurant 5: AI suggests genuine alternatives from Restaurant 5 menu only');
  } catch (err) {
    assert(false, `Anti-hallucination test failed: ${err.message}`);
  }

  // Test 3d: Query Biryani at Restaurant 1 (The Spice Pavilion - has Biryani)
  try {
    const aiBiryaniAtIndian = await api('/ai/assistant', {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'I want biryani' }],
        restaurantId: 1
      },
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    const items = aiBiryaniAtIndian.data.data.recommendedItems || [];
    const hasActualBiryani = items.some(i => i.name.toLowerCase().includes('biryani'));
    assert(hasActualBiryani, 'Restaurant 1: AI recommends genuine biryanis from the current restaurant menu');
  } catch (err) {
    assert(false, `Biryani query at Indian restaurant failed: ${err.message}`);
  }

  // Test 3e: Spicy filter at Restaurant 2 (Coastal Catch)
  try {
    const aiSpicy = await api('/ai/assistant', {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'I want something spicy' }],
        restaurantId: 2
      },
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    const items = aiSpicy.data.data.recommendedItems || [];
    assert(items.length > 0, `Restaurant 2: AI returned ${items.length} spicy recommendations`);
    const allBelongToR2 = items.every(i => restaurantMenus[2].items.includes(i.name.toLowerCase()));
    assert(allBelongToR2, 'Restaurant 2: All spicy recommendations exist in Restaurant 2 menu');
  } catch (err) {
    assert(false, `Spicy query at Restaurant 2 failed: ${err.message}`);
  }

  // Test 3f: Add to cart intent
  try {
    const aiAddToCart = await api('/ai/assistant', {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'Add Paneer Tikka to my cart' }],
        restaurantId: 1
      },
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    const action = aiAddToCart.data.data.action;
    assert(action && action.type === 'add_to_cart', 'AI identified "add to cart" intent and returned action: add_to_cart');
    assert(action && action.item && action.item.name.toLowerCase().includes('paneer tikka'), 'AI matched the exact menu item ID and name for cart addition');
  } catch (err) {
    assert(false, `Add to cart AI intent failed: ${err.message}`);
  }

  // 4. OWNER MENU MANAGEMENT & ISOLATION
  console.log('\n--- 4. OWNER MENU MANAGEMENT & ISOLATION ---');
  let testItemId = null;
  try {
    // Owner gets their restaurant and menu categories
    const ownerRestRes = await api('/owner/restaurant', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const ownerRest = ownerRestRes.data.data.restaurant || ownerRestRes.data.data;
    assert(ownerRest.id === 1, `Owner is properly assigned to Restaurant ${ownerRest.id} (${ownerRest.name})`);

    const r1MenuRes = await api(`/restaurants/${ownerRest.id}/menu`);
    const categories = r1MenuRes.data.data.categories || [];
    assert(categories.length > 0, `Owner has access to ${categories.length} categories for their restaurant`);
    const firstCatId = categories[0].id;

    // Create a new item
    const testItemName = 'Test Kebab ' + Date.now();
    const createRes = await api('/owner/menu/items', {
      method: 'POST',
      body: {
        categoryId: firstCatId,
        name: testItemName,
        description: 'Created during automated testing',
        price: 349.00,
        isVegetarian: false,
        preparationTimeMins: 20
      },
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    testItemId = createRes.data.data.id || createRes.data.data.item?.id;
    assert(!!testItemId, `Owner created item successfully (ID: ${testItemId})`);

    // Verify it appears in Restaurant 1 public menu
    const r1Menu = await api('/restaurants/1/menu');
    const inR1 = JSON.stringify(r1Menu.data).includes(testItemName);
    assert(inR1, 'Newly created item appears in Restaurant 1 customer menu');

    // Verify it does NOT appear in Restaurant 2 public menu
    const r2Menu = await api('/restaurants/2/menu');
    const inR2 = JSON.stringify(r2Menu.data).includes(testItemName);
    assert(!inR2, 'Newly created item does NOT appear in Restaurant 2 customer menu (Isolation verified)');

    // Toggle availability
    await api(`/owner/menu/items/${testItemId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const r1MenuAfterToggle = await api('/restaurants/1/menu');
    let toggledItem = null;
    for (const c of r1MenuAfterToggle.data.data.categories) {
      const found = (c.items || []).find(i => i.id === testItemId);
      if (found) toggledItem = found;
    }
    assert(toggledItem && toggledItem.is_available === 0, 'Item availability toggle to 0 reflected in public customer menu');

    // Clean up test item
    await api(`/owner/menu/items/${testItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const r1MenuAfterDelete = await api('/restaurants/1/menu');
    const inR1AfterDelete = JSON.stringify(r1MenuAfterDelete.data).includes(testItemName);
    assert(!inR1AfterDelete, 'Item cleaned up successfully from Restaurant 1 menu');
  } catch (err) {
    assert(false, `Owner menu management test failed: ${err.message}`);
  }

  // 5. NO DEMO ORDERS / NO DEMO BOOKINGS
  console.log('\n--- 5. ZERO DEMO ORDERS / ZERO DEMO BOOKINGS VERIFICATION ---');
  try {
    const ordersRes = await api('/owner/orders', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const orders = ordersRes.data.data.orders || [];
    console.log(`  ℹ️ Total orders in database for Owner 1: ${orders.length}`);
    const fakeKeywords = ['sample', 'demo', 'placeholder', 'test burger', 'fake'];
    const hasFakeOrders = orders.some(o => 
      fakeKeywords.some(kw => (o.customer_name || '').toLowerCase().includes(kw))
    );
    assert(!hasFakeOrders, 'Zero demo/mock customer orders detected in owner orders');

    const resRes = await api('/owner/reservations', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const reservations = resRes.data.data.reservations || [];
    console.log(`  ℹ️ Total reservations in database for Owner 1: ${reservations.length}`);
    const hasFakeReservations = reservations.some(r =>
      fakeKeywords.some(kw => (r.customer_name || '').toLowerCase().includes(kw))
    );
    assert(!hasFakeReservations, 'Zero demo/mock bookings detected in owner reservations');
  } catch (err) {
    assert(false, `Zero demo data check failed: ${err.message}`);
  }

  // SUMMARY
  console.log('\n============================================================');
  console.log(`🏁 TEST RESULTS: ${results.passed}/${results.total} PASSED (${results.failed} FAILED)`);
  console.log('============================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
