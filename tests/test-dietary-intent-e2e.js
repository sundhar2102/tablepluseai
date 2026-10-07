const http = require('http');

const API_BASE = 'http://localhost:3001/api';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runDietaryTests() {
  console.log('============================================================');
  console.log('🧪 TESTING AI DIETARY INTENT & RECOMMENDATION PIPELINE (E2E)');
  console.log('============================================================\n');

  // 1. Login customer
  const loginRes = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email: 'customer@demo.com', password: 'Demo@1234' }
  });
  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    console.error('Customer login failed:', loginRes.data);
    process.exit(1);
  }
  const token = loginRes.data.data.token;
  console.log('✅ Customer authenticated successfully.\n');

  const testCases = [
    { id: 1, message: "I like to have non vegetarian food", expectedDietary: "NON_VEG" },
    { id: 2, message: "I want non-veg", expectedDietary: "NON_VEG" },
    { id: 3, message: "I want non vegetarian", expectedDietary: "NON_VEG" },
    { id: 4, message: "I prefer nonveg", expectedDietary: "NON_VEG" },
    { id: 5, message: "I want chicken", expectedDietary: "NON_VEG" },
    { id: 6, message: "I want mutton", expectedDietary: "NON_VEG" },
    { id: 7, message: "I want fish", expectedDietary: "NON_VEG" },
    { id: 8, message: "I want egg", expectedDietary: "NON_VEG" },
    { id: 9, message: "I want vegetarian food", expectedDietary: "VEG" },
    { id: 10, message: "I prefer veg", expectedDietary: "VEG" },
    { id: 11, message: "I want something vegetarian", expectedDietary: "VEG" },
    { id: 12, message: "I don't want vegetarian food", expectedDietary: "NON_VEG" },
    { id: 13, message: "Give me something without meat", expectedDietary: "VEG" },
    { id: 14, message: "Give me meat", expectedDietary: "NON_VEG" }
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const tc of testCases) {
    console.log(`--- TEST ${tc.id}: "${tc.message}" ---`);
    console.log(`Expected Dietary Intent: ${tc.expectedDietary}`);

    // Call AI assistant at Restaurant 1 (The Spice Pavilion, which has both Veg and Non-Veg)
    const res = await request(`${API_BASE}/ai/assistant`, {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: tc.message }],
        restaurantId: 1
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status !== 200) {
      console.error(`❌ HTTP Error ${res.status}:`, res.data);
      failedCount++;
      continue;
    }

    const { reply, recommendedItems } = res.data.data;
    console.log(`Bot reply snippet: "${reply.slice(0, 100).replace(/\n/g, ' ')}..."`);
    console.log(`Recommended items count: ${recommendedItems?.length || 0}`);
    if (recommendedItems && recommendedItems.length > 0) {
      console.log(`Items: ${recommendedItems.map(i => `${i.name} (is_veg=${i.is_vegetarian})`).join(', ')}`);
    }

    let isPassed = true;
    const errors = [];

    // Negative check: If NON_VEG, reply MUST NOT say "preference for vegetarian" or "vegetarian preference"
    if (tc.expectedDietary === 'NON_VEG') {
      const lowerReply = reply.toLowerCase();
      if (lowerReply.includes('preference for vegetarian') || lowerReply.includes('vegetarian preference') || lowerReply.includes('for vegetarian food')) {
        errors.push(`Bot reply incorrectly mentions vegetarian preference for non-veg request!`);
        isPassed = false;
      }

      // Check recommended items: MUST NOT contain any is_vegetarian === 1 items
      if (recommendedItems && recommendedItems.length > 0) {
        const vegItemsFound = recommendedItems.filter(i => i.is_vegetarian === 1);
        if (vegItemsFound.length > 0) {
          errors.push(`Leaked ${vegItemsFound.length} VEG items in NON_VEG recommendation: ${vegItemsFound.map(i => i.name).join(', ')}`);
          isPassed = false;
        }
      }
    }

    // Negative check: If VEG, reply MUST NOT say "preference for non-vegetarian" and MUST NOT contain non-veg items
    if (tc.expectedDietary === 'VEG') {
      const lowerReply = reply.toLowerCase();
      if (lowerReply.includes('preference for non-vegetarian') || lowerReply.includes('non-vegetarian preference')) {
        errors.push(`Bot reply incorrectly mentions non-vegetarian preference for veg request!`);
        isPassed = false;
      }

      // Check recommended items: MUST NOT contain any is_vegetarian === 0 items
      if (recommendedItems && recommendedItems.length > 0) {
        const nonVegItemsFound = recommendedItems.filter(i => i.is_vegetarian === 0);
        if (nonVegItemsFound.length > 0) {
          errors.push(`Leaked ${nonVegItemsFound.length} NON_VEG items in VEG recommendation: ${nonVegItemsFound.map(i => i.name).join(', ')}`);
          isPassed = false;
        }
      }
    }

    // Check that items belong to restaurant 1
    if (recommendedItems && recommendedItems.length > 0) {
      const wrongRestItems = recommendedItems.filter(i => i.restaurant_id && i.restaurant_id !== 1);
      if (wrongRestItems.length > 0) {
        errors.push(`Items from wrong restaurant recommended: ${wrongRestItems.map(i => i.name).join(', ')}`);
        isPassed = false;
      }
    }

    if (isPassed) {
      console.log(`✅ [PASS] TEST ${tc.id}\n`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] TEST ${tc.id}:`);
      errors.forEach(e => console.error(`   - ${e}`));
      console.log('');
      failedCount++;
    }
  }

  // Cross-restaurant non-veg test: Coastal Catch & Grills (Restaurant 2)
  console.log('--- ADDITIONAL MULTI-RESTAURANT TEST: Restaurant 2 (Coastal Catch) ---');
  const resR2 = await request(`${API_BASE}/ai/assistant`, {
    method: 'POST',
    body: {
      messages: [{ role: 'user', content: 'i like to have non vegetarian food' }],
      restaurantId: 2
    },
    headers: { Authorization: `Bearer ${token}` }
  });
  if (resR2.status === 200) {
    const items = resR2.data.data.recommendedItems || [];
    const allR2NonVeg = items.every(i => i.is_vegetarian === 0 && (!i.restaurant_id || i.restaurant_id === 2));
    if (allR2NonVeg && items.length > 0) {
      console.log(`✅ [PASS] Restaurant 2 non-veg recommendations strictly match Restaurant 2 non-veg menu.\n`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] Restaurant 2 test failed.`);
      failedCount++;
    }
  }

  console.log('============================================================');
  console.log(`RESULTS: ${passedCount} PASSED, ${failedCount} FAILED out of ${passedCount + failedCount} tests`);
  console.log('============================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDietaryTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
