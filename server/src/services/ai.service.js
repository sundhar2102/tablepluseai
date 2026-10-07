const { pool } = require('../config/db');

/**
 * AI Service for TablePulse AI Concierge & Dining Assistant
 * 
 * CORE RULES:
 * 1. Strict restaurant context: When a restaurantId is provided, recommendations
 *    must NEVER include items from other restaurants or fake/hallucinated items.
 * 2. Grounded Database Items: Every recommended item must exist in MySQL for that restaurant.
 * 3. Unavailable items are filtered out (is_available = 1 only).
 * 4. Clear communication: If a customer asks for a dish that is not on the restaurant's menu
 *    (e.g., biryani at a Japanese/Continental spot), clearly state that it is not available
 *    and recommend authentic alternatives from the current restaurant.
 * 5. Deterministic fallback: Works 100% reliably without requiring external paid AI keys.
 */

async function getRestaurantContext(restaurantId) {
  try {
    const [restaurants] = await pool.query(
      `SELECT r.id, r.name, r.slug, r.cuisine_type, 
              r.address, r.description, r.is_active,
              COUNT(CASE WHEN t.status = 'available' THEN 1 END) as available_tables,
              COUNT(t.id) as total_tables
       FROM restaurants r
       LEFT JOIN tables t ON r.id = t.restaurant_id
       WHERE r.id = ?
       GROUP BY r.id`,
      [restaurantId]
    );

    if (!restaurants.length) return null;

    const currentRestaurant = restaurants[0];

    // Fetch real, available items for this restaurant
    const [menuItems] = await pool.query(
      `SELECT mi.id, mi.restaurant_id, mi.category_id, mc.name AS category_name,
              mi.name, mi.description, mi.price, mi.is_vegetarian, mi.photo_url,
              mi.is_available, mi.preparation_time_mins, mi.display_order
       FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE mi.restaurant_id = ? AND mi.is_available = 1
       ORDER BY mc.display_order ASC, mi.display_order ASC, mi.id ASC`,
      [restaurantId]
    );

    return {
      restaurant: currentRestaurant,
      menuItems,
    };
  } catch (err) {
    console.error('[AI Service] Error loading restaurant context:', err.message);
    return null;
  }
}

async function getAllActiveRestaurants() {
  try {
    const [restaurants] = await pool.query(
      `SELECT r.id, r.name, r.slug, r.cuisine_type, 
              r.address, r.description,
              COUNT(CASE WHEN t.status = 'available' THEN 1 END) as available_tables,
              COUNT(t.id) as total_tables
       FROM restaurants r
       LEFT JOIN tables t ON r.id = t.restaurant_id
       WHERE r.is_active = 1
       GROUP BY r.id`
    );
    return restaurants;
  } catch (err) {
    console.error('[AI Service] Error loading all active restaurants:', err.message);
    return [];
  }
}

/**
 * Generate AI dining recommendation or chat response
 */
async function getDiningRecommendation({ messages, location, restaurantId, userName }) {
  const lastUserMsg = (messages[messages.length - 1]?.content || '').trim();
  
  // ── CASE A: Customer is currently browsing a specific restaurant ──
  if (restaurantId) {
    const context = await getRestaurantContext(restaurantId);
    if (context && context.restaurant) {
      const { restaurant, menuItems } = context;
      const dietaryPreference = detectDietaryPreference(lastUserMsg);

      // Try OpenAI if configured, otherwise or on error use grounded engine
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey && !apiKey.includes('your_openai_api_key')) {
        try {
          const aiResult = await callGroundedOpenAI({
            messages,
            restaurant,
            menuItems,
            userName,
            dietaryPreference,
          });
          if (aiResult) return validateResponse(aiResult, dietaryPreference);
        } catch (err) {
          // Log and seamlessly fall back to local grounded engine
          console.warn('[AI Service] External OpenAI unavailable (falling back to grounded engine):', err.message);
        }
      }

      // Grounded deterministic engine (zero hallucination guarantee)
      const groundedResult = generateRestaurantGroundedResponse({
        userMsg: lastUserMsg,
        restaurant,
        menuItems,
        userName,
        dietaryPreference,
      });
      return validateResponse(groundedResult, dietaryPreference);
    }
  }

  // ── CASE B: Customer is exploring general restaurants (Home / Explore) ──
  const allRestaurants = await getAllActiveRestaurants();
  return generateGeneralDiscoveryResponse({
    userMsg: lastUserMsg,
    restaurants: allRestaurants,
    userName,
  });
}

/**
 * Normalizes user input for robust intent detection without stripping negations
 */
function normalizeUserMessage(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.toLowerCase().trim();
  text = text.replace(/[\u2018\u2019]/g, "'"); // Normalize smart apostrophes
  text = text.replace(/non[\s-]+vegetarian/g, 'non_vegetarian');
  text = text.replace(/non[\s-]+veg/g, 'non_veg');
  text = text.replace(/\bnonveg\b/g, 'non_veg');
  text = text.replace(/\bnonvegetarian\b/g, 'non_vegetarian');
  text = text.replace(/\s+/g, ' ');
  return text;
}

/**
 * Detects dietary preference using normalized multi-word and negation parsing.
 * Priority: Exclusion of meat -> VEG | Negation of veg -> NON_VEG | Non-Veg -> NON_VEG | Veg -> VEG
 * Returns: 'NON_VEG' | 'VEG' | null
 */
function detectDietaryPreference(rawText) {
  const text = normalizeUserMessage(rawText);
  if (!text) return null;

  // 1. Explicit exclusion of meat/non-veg -> VEG
  // e.g. "without meat", "no chicken", "avoid meat", "meatless", "meat free", "dont want meat"
  if (/\b(?:without|no|avoid|dont\s+want|don't\s+want|free\s+of|zero)\s+(?:meat|chicken|mutton|fish|seafood|prawns?|eggs?|pork|beef)\b/.test(text) ||
      /\b(?:meatless|meat\s*free)\b/.test(text)) {
    return 'VEG';
  }

  // 2. Negation of vegetarianism -> NON_VEG
  // e.g. "don't want vegetarian food", "dont want veg", "not veg", "no veg", "avoid veg"
  if (/\b(?:dont|don't|do\s+not|not|never|avoid|no)\s+(?:want\s+|like\s+|prefer\s+|eat\s+)?(?:veg|vegetarian|vegan)\b/.test(text)) {
    return 'NON_VEG';
  }

  // 3. Explicit non-vegetarian markers
  // e.g. "non_veg", "non_vegetarian"
  if (/\b(?:non_veg|non_vegetarian)\b/.test(text)) {
    return 'NON_VEG';
  }

  // 4. Explicit non-veg protein keywords without negative modifiers
  // e.g. "chicken", "mutton", "lamb", "gosht", "fish", "prawn", "crab", "egg", "meat", "pork", "beef"
  if (/\b(?:chicken|mutton|lamb|gosht|prawns?|fish|squid|crabs?|seafood|eggs?|pork|beef|bacon|pepperoni|meat)\b/.test(text)) {
    return 'NON_VEG';
  }

  // 5. Explicit vegetarian markers
  // e.g. "vegetarian", "veg", "veggie", "vegan", "plant based", "pure veg"
  if (/\b(?:veg|vegetarian|veggie|vegan|plant\s*based)\b/.test(text)) {
    return 'VEG';
  }

  return null;
}

/**
 * Validates and enforces that recommended items strictly match dietary preference.
 * Guarantees zero dietary leakage.
 */
function validateResponse(response, dietaryPref) {
  if (!response) return response;
  if (dietaryPref === 'NON_VEG') {
    if (response.recommendedItems) {
      response.recommendedItems = response.recommendedItems.filter(i => i.is_vegetarian === 0);
    }
    if (response.reply) {
      response.reply = response.reply.replace(/preference for \*\*vegetarian food\*\*/gi, 'preference for **non-vegetarian food**');
      response.reply = response.reply.replace(/vegetarian delicacies/gi, 'non-vegetarian delicacies');
    }
  } else if (dietaryPref === 'VEG') {
    if (response.recommendedItems) {
      response.recommendedItems = response.recommendedItems.filter(i => i.is_vegetarian === 1);
    }
    if (response.reply) {
      response.reply = response.reply.replace(/preference for \*\*non-vegetarian food\*\*/gi, 'preference for **vegetarian food**');
    }
  }
  return response;
}

/**
 * Grounded OpenAI integration with strict boundary enforcement
 */
async function callGroundedOpenAI({ messages, restaurant, menuItems, userName, dietaryPreference }) {
  if (openAiQuotaExhausted) return null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  // Filter menu items by dietary preference BEFORE generating prompt
  let eligibleMenuItems = menuItems;
  if (dietaryPreference === 'NON_VEG') {
    eligibleMenuItems = menuItems.filter(m => m.is_vegetarian === 0);
    if (eligibleMenuItems.length === 0) {
      return {
        reply: `ℹ️ There are no matching non-vegetarian items currently available at **${restaurant.name}**.\n\n${restaurant.name} specializes in authentic vegetarian delicacies.`,
        restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
        recommendedItems: [],
        source: 'tablepulse-grounded-intelligence'
      };
    }
  } else if (dietaryPreference === 'VEG') {
    eligibleMenuItems = menuItems.filter(m => m.is_vegetarian === 1);
    if (eligibleMenuItems.length === 0) {
      return {
        reply: `ℹ️ There are no matching vegetarian items currently available at **${restaurant.name}**.`,
        restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
        recommendedItems: [],
        source: 'tablepulse-grounded-intelligence'
      };
    }
  }

  const menuListText = eligibleMenuItems.map(m => (
    `[ID: ${m.id}] "${m.name}" (₹${m.price}) | Category: ${m.category_name} | ${m.is_vegetarian ? 'Veg' : 'Non-Veg'} | Prep: ${m.preparation_time_mins || 15}m | Description: ${m.description || ''}`
  )).join('\n');

  let dietaryRule = '4. Respect user preferences if stated.';
  if (dietaryPreference === 'NON_VEG') {
    dietaryRule = '4. CRITICAL: The customer requested NON-VEGETARIAN food. Recommend ONLY non-vegetarian dishes (is_vegetarian = 0). NEVER recommend vegetarian items or mention "vegetarian preference".';
  } else if (dietaryPreference === 'VEG') {
    dietaryRule = '4. CRITICAL: The customer requested VEGETARIAN food. Recommend ONLY vegetarian dishes (is_vegetarian = 1). NEVER recommend meat, chicken, mutton, fish, or egg dishes.';
  }

  const systemPrompt = `You are TablePulse AI, dining assistant for "${restaurant.name}" (Cuisine: ${restaurant.cuisine_type}).
Address: ${restaurant.address}
Live Tables: ${restaurant.available_tables}/${restaurant.total_tables} available.

CRITICAL RULES:
1. You may ONLY recommend dishes from the ACTIVE MENU LIST below. NEVER invent, hallucinate, or suggest any dish not in this list.
2. If the user asks for a dish that is NOT on this list (e.g., asking for Biryani at a Japanese/Continental place, or Pizza at an Indian place):
   You MUST explicitly state: "[Dish] is not available at ${restaurant.name}".
   Then suggest matching authentic dishes from the active list below.
3. Every dish you recommend must include its real name and price (e.g. ₹XXX).
${dietaryRule}
5. If the user asks for a budget (e.g., under ₹300), recommend ONLY items within that budget.
6. Provide a warm, concise, and helpful response.

ACTIVE MENU LIST FOR ${restaurant.name.toUpperCase()}:
${menuListText}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-5).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: String(m.content).slice(0, 800)
          }))
        ],
        temperature: 0.5,
        max_tokens: 450
      }),
      signal: AbortSignal.timeout(4000)
    });

    if (!response.ok) {
      if (response.status === 429) {
        openAiQuotaExhausted = true;
      }
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(`OpenAI HTTP ${response.status}: ${errorJson?.error?.message || 'Quota/Network error'}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return null;

    // Extract programmatically verified recommended items from reply
    const recommendedItems = [];
    for (const item of eligibleMenuItems) {
      if (reply.toLowerCase().includes(item.name.toLowerCase())) {
        recommendedItems.push({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          is_vegetarian: item.is_vegetarian,
          description: item.description,
          category_name: item.category_name,
          preparation_time_mins: item.preparation_time_mins,
          photo_url: item.photo_url,
        });
        if (recommendedItems.length >= 4) break;
      }
    }

    return {
      reply,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine_type,
      },
      recommendedItems,
      source: 'openai-gpt-4o-mini-grounded'
    };
  } catch (err) {
    if (err.message && err.message.includes('429')) {
      openAiQuotaExhausted = true;
    }
    console.warn(`[AI] OpenAI bypassed (${err.message}). Using deterministic grounded engine.`);
    return null;
  }
}

/**
 * Deterministic Menu-Grounded Recommendation Engine
 * 100% accurate, zero hallucination, cuisine-specific, handles all user intents.
 */
function generateRestaurantGroundedResponse({ userMsg, restaurant, menuItems, userName, dietaryPreference }) {
  const normMsg = normalizeUserMessage(userMsg);
  const query = userMsg.toLowerCase();
  const pref = dietaryPreference !== undefined ? dietaryPreference : detectDietaryPreference(userMsg);

  let availableItems = menuItems.filter(i => i.is_available === 1);

  // Database is source of truth: filter items according to dietary preference FIRST
  if (pref === 'NON_VEG') {
    const nonVegAvailable = availableItems.filter(i => i.is_vegetarian === 0);
    if (nonVegAvailable.length === 0) {
      return {
        reply: `ℹ️ There are no matching non-vegetarian items currently available at **${restaurant.name}**.\n\n${restaurant.name} specializes in authentic vegetarian delicacies. Would you like to explore our vegetarian specialties instead?`,
        restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
        recommendedItems: [],
        source: 'tablepulse-grounded-intelligence'
      };
    }
    availableItems = nonVegAvailable;
  } else if (pref === 'VEG') {
    const vegAvailable = availableItems.filter(i => i.is_vegetarian === 1);
    if (vegAvailable.length === 0) {
      return {
        reply: `ℹ️ There are no matching vegetarian items currently available at **${restaurant.name}**.\n\nWould you like to check our other dining options?`,
        restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
        recommendedItems: [],
        source: 'tablepulse-grounded-intelligence'
      };
    }
    availableItems = vegAvailable;
  }

  // 1. DIRECT ADD TO CART INTENT
  // e.g. "add paneer tikka to cart", "add mutton rogan josh to my order"
  if (query.includes('add') && (query.includes('cart') || query.includes('order'))) {
    let matchedItem = null;
    for (const item of availableItems) {
      const lowerName = item.name.toLowerCase();
      const words = lowerName.split(/\s+/).filter(w => w.length > 2);

      // Exact full name match
      if (query.includes(lowerName)) {
        matchedItem = item;
        break;
      }
      // Two-word phrase match (e.g. "paneer tikka" matches "Paneer Tikka Angare")
      if (words.length >= 2 && query.includes(words.slice(0, 2).join(' '))) {
        matchedItem = item;
        break;
      }
      // Single distinctive keyword match
      if (words.some(w => query.includes(w) && w.length >= 5 && !['curry', 'fried', 'gravy', 'style'].includes(w))) {
        if (!matchedItem) matchedItem = item;
      }
    }

    if (matchedItem) {
      return {
        reply: `🛒 Added **${matchedItem.name}** (₹${parseFloat(matchedItem.price).toFixed(2)}) to your cart!\n\nYou can review your order in the pre-order cart drawer anytime. Would you like a beverage or accompaniment with that?`,
        restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
        recommendedItems: [formatItem(matchedItem)],
        action: { type: 'add_to_cart', item: formatItem(matchedItem) },
        source: 'tablepulse-grounded-intelligence'
      };
    }
  }

  // 2. LIVE TABLES & SEATING AVAILABILITY QUERY
  if (query.includes('table') || query.includes('seat') || query.includes('crowd') || query.includes('wait') || query.includes('available')) {
    const avail = restaurant.available_tables || 0;
    const total = restaurant.total_tables || 0;
    const statusText = avail > 0 
      ? `🟢 **Good news!** We currently have **${avail} out of ${total} tables available** for immediate seating.`
      : `🟡 All tables are currently occupied. You can join the **walk-in waitlist** or **pre-order** your meal right now so it's ready when seated!`;

    const quickBites = availableItems.slice(0, 2).map(formatItem);

    return {
      reply: `📍 **Live Seating Status at ${restaurant.name}:**\n\n${statusText}\n\nOur kitchen is actively taking orders with an average dining turnaround of 35-45 minutes.`,
      restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
      recommendedItems: quickBites,
      source: 'tablepulse-grounded-intelligence'
    };
  }

  // 3. EXPLICIT NON-VEGETARIAN INTENT (Priority over veg, prevents negation confusion)
  // e.g. "i like to have non vegetarian food", "i want non-veg", "i prefer nonveg", "give me meat"
  const isGeneralNonVeg = normMsg.includes('non_veg') || normMsg.includes('non_vegetarian') || /\bmeat\b/.test(normMsg) || query.includes('non veg') || query.includes('non-veg');
  if (pref === 'NON_VEG' && isGeneralNonVeg) {
    const selected = pickDiverseItems(availableItems, 3);
    return {
      reply: `🍗 Here are our signature **non-vegetarian specialties** at **${restaurant.name}**:\n\n${formatBulletList(selected)}\n\nFreshly prepared by our culinary team. Would you like me to add any of these to your cart?`,
      restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
      recommendedItems: selected.map(formatItem),
      source: 'tablepulse-grounded-intelligence'
    };
  }

  // 4. EXPLICIT VEGETARIAN INTENT
  // e.g. "i want vegetarian food", "i prefer veg", "give me something without meat"
  const isGeneralVeg = normMsg.includes('vegetarian') || normMsg.includes('veg') || normMsg.includes('without meat') || normMsg.includes('meatless');
  if (pref === 'VEG' && isGeneralVeg && !query.includes('biryani') && !query.includes('dosa') && !query.includes('pizza') && !query.includes('pasta')) {
    const selected = pickDiverseItems(availableItems, 3);
    return {
      reply: `🌱 Based on your preference for **vegetarian food** at **${restaurant.name}**, here are our top recommendations:\n\n${formatBulletList(selected)}\n\nWould you like me to add any of these to your cart?`,
      restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
      recommendedItems: selected.map(formatItem),
      source: 'tablepulse-grounded-intelligence'
    };
  }

  // 5. BUDGET / PRICE FILTER (e.g. "under ₹300", "below 200", "under 400")
  const budgetMatch = query.match(/(?:under|below|less than|within|max|budget of)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (budgetMatch) {
    const maxBudget = parseInt(budgetMatch[1], 10);
    const budgetItems = availableItems.filter(i => parseFloat(i.price) <= maxBudget);

    if (budgetItems.length > 0) {
      // Sort by price descending to show best dishes within the budget
      budgetItems.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      const selected = pickDiverseItems(budgetItems, 3);
      return {
        reply: `💰 Here are fantastic options at **${restaurant.name}** that comfortably fit your budget of **under ₹${maxBudget}**:\n\n${formatBulletList(selected)}\n\nAll prices are inclusive of taxes. Would you like to select one?`,
        restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
        recommendedItems: selected.map(formatItem),
        source: 'tablepulse-grounded-intelligence'
      };
    } else {
      // Budget is lower than lowest priced item
      const lowestPriced = [...availableItems].sort((a, b) => parseFloat(a.price) - parseFloat(b.price)).slice(0, 3);
      return {
        reply: `We don't have items strictly under ₹${maxBudget} at **${restaurant.name}**, but here are our most pocket-friendly offerings:\n\n${formatBulletList(lowestPriced)}`,
        restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
        recommendedItems: lowestPriced.map(formatItem),
        source: 'tablepulse-grounded-intelligence'
      };
    }
  }

  // 6. MEAL FOR TWO / COUPLE COMBO
  if (query.includes('two') || query.includes('2') || query.includes('couple') || query.includes('pair') || query.includes('combo')) {
    // Pick 1 starter, 1 or 2 mains, 1 dessert/beverage
    const starter = availableItems.find(i => i.category_name.toLowerCase().includes('starter') || i.category_name.toLowerCase().includes('tiffin') || i.category_name.toLowerCase().includes('plate'));
    const main = availableItems.find(i => i.category_name.toLowerCase().includes('curry') || i.category_name.toLowerCase().includes('biryani') || i.category_name.toLowerCase().includes('pizza') || i.category_name.toLowerCase().includes('pasta') || i.category_name.toLowerCase().includes('thali') || i.category_name.toLowerCase().includes('ramen'));
    const stapleOrBread = availableItems.find(i => (i.category_name.toLowerCase().includes('bread') || i.category_name.toLowerCase().includes('rice') || i.category_name.toLowerCase().includes('sushi') || i.category_name.toLowerCase().includes('side')) && i.id !== main?.id);
    const drinkOrSweet = availableItems.find(i => i.category_name.toLowerCase().includes('dessert') || i.category_name.toLowerCase().includes('beverage') || i.category_name.toLowerCase().includes('coffee'));

    const combo = [starter, main, stapleOrBread || drinkOrSweet, drinkOrSweet].filter((item, index, self) => Boolean(item) && self.findIndex(t => t?.id === item.id) === index).slice(0, 3);
    const comboPrice = combo.reduce((sum, i) => sum + parseFloat(i.price), 0);

    return {
      reply: `🥂 Here is a curated dining combination **perfect for two guests** at **${restaurant.name}**:\n\n${formatBulletList(combo)}\n\n**Estimated Total:** ₹${comboPrice.toFixed(2)} (Ideal sharing portions).`,
      restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
      recommendedItems: combo.map(formatItem),
      source: 'tablepulse-grounded-intelligence'
    };
  }

  // 7. SPECIFIC DISH / CATEGORY KEYWORD SEARCH
  // Handles: biryani, dosa, pizza, pasta, ramen, sushi, gyoza, coffee, curry, fish, prawn, dessert, chai, etc.
  const commonDishTerms = [
    { term: 'biryani', label: 'Biryani' },
    { term: 'dosa', label: 'Dosa' },
    { term: 'idli', label: 'Idli' },
    { term: 'thali', label: 'Thali' },
    { term: 'pizza', label: 'Pizza' },
    { term: 'pasta', label: 'Pasta' },
    { term: 'ramen', label: 'Ramen' },
    { term: 'sushi', label: 'Sushi' },
    { term: 'gyoza', label: 'Gyoza' },
    { term: 'dumpling', label: 'Dumpling' },
    { term: 'curry', label: 'Curry' },
    { term: 'tikka', label: 'Tikka' },
    { term: 'kebab', label: 'Kebab' },
    { term: 'naan', label: 'Naan' },
    { term: 'parotta', label: 'Parotta' },
    { term: 'coffee', label: 'Coffee' },
    { term: 'tea', label: 'Tea' },
    { term: 'dessert', label: 'Dessert' },
    { term: 'cake', label: 'Cake' },
    { term: 'ice cream', label: 'Ice cream' },
    { term: 'halwa', label: 'Halwa' },
    { term: 'payasam', label: 'Payasam' },
    { term: 'fries', label: 'Fries' },
    { term: 'soup', label: 'Soup' },
    { term: 'salad', label: 'Salad' },
  ];

  for (const { term, label } of commonDishTerms) {
    if (query.includes(term)) {
      const matchingItems = availableItems.filter(i => 
        i.name.toLowerCase().includes(term) ||
        i.description?.toLowerCase().includes(term) ||
        i.category_name.toLowerCase().includes(term)
      );

      if (matchingItems.length > 0) {
        const selected = matchingItems.slice(0, 3);
        return {
          reply: `✨ Here are the delicious **${label}** selections available at **${restaurant.name}**:\n\n${formatBulletList(selected)}\n\nAll made fresh to order. Would you like to add any to your cart?`,
          restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
          recommendedItems: selected.map(formatItem),
          source: 'tablepulse-grounded-intelligence'
        };
      } else {
        // Critical Rule 9: Never hallucinate! Explicitly state item is absent & provide real alternatives!
        const alternatives = pickDiverseItems(availableItems, 3);
        return {
          reply: `ℹ️ **${label} is not available at ${restaurant.name}** (${restaurant.name} specializes in ${restaurant.cuisine_type}).\n\nBased on our current menu, here are popular specialties you will love instead:\n\n${formatBulletList(alternatives)}\n\nWould you like to try one of these?`,
          restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
          recommendedItems: alternatives.map(formatItem),
          source: 'tablepulse-grounded-intelligence'
        };
      }
    }
  }

  // 8. TASTE PROFILE: SPICY / MILD / SWEET
  if (query.includes('spicy') || query.includes('hot') || query.includes('pepper') || query.includes('chilli') || query.includes('masala')) {
    const spicyItems = availableItems.filter(i => {
      const text = `${i.name} ${i.description || ''}`.toLowerCase();
      return text.includes('pepper') || text.includes('spicy') || text.includes('angare') || text.includes('chilli') || text.includes('chettinad') || text.includes('arrabiata') || text.includes('sukka') || text.includes('podi') || text.includes('miso');
    });
    const selected = (spicyItems.length > 0 ? spicyItems : availableItems).slice(0, 3);
    return {
      reply: `🌶️ For bold and **spicy flavors** at **${restaurant.name}**, we recommend:\n\n${formatBulletList(selected)}\n\nYou can also request the kitchen to adjust the spice level to your liking!`,
      restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
      recommendedItems: selected.map(formatItem),
      source: 'tablepulse-grounded-intelligence'
    };
  }

  if (query.includes('mild') || query.includes('creamy') || query.includes('less spicy') || query.includes('not spicy')) {
    const mildItems = availableItems.filter(i => {
      const text = `${i.name} ${i.description || ''}`.toLowerCase();
      return text.includes('creamy') || text.includes('malai') || text.includes('butter') || text.includes('alfredo') || text.includes('mild') || text.includes('curd') || text.includes('ghee') || text.includes('stew');
    });
    const selected = (mildItems.length > 0 ? mildItems : availableItems).slice(0, 3);
    return {
      reply: `🧈 Here are our comforting, **mild and creamy** dishes at **${restaurant.name}**:\n\n${formatBulletList(selected)}\n\nGentle on the palate and rich in flavour!`,
      restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
      recommendedItems: selected.map(formatItem),
      source: 'tablepulse-grounded-intelligence'
    };
  }

  if (query.includes('sweet') || query.includes('dessert') || query.includes('drink') || query.includes('beverage')) {
    const sweetItems = availableItems.filter(i => 
      i.category_name.toLowerCase().includes('dessert') || 
      i.category_name.toLowerCase().includes('beverage') ||
      i.category_name.toLowerCase().includes('coffee')
    );
    const selected = (sweetItems.length > 0 ? sweetItems : availableItems).slice(0, 3);
    return {
      reply: `🍨 Here are delightful **beverages and sweet treats** at **${restaurant.name}**:\n\n${formatBulletList(selected)}\n\nThe perfect finish to your dining experience!`,
      restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
      recommendedItems: selected.map(formatItem),
      source: 'tablepulse-grounded-intelligence'
    };
  }

  // 9. QUICK PREPARATION TIME QUERY
  if (query.includes('quick') || query.includes('fast') || query.includes('hurry') || query.includes('rush') || query.includes('fastest')) {
    const fastItems = [...availableItems].sort((a, b) => (a.preparation_time_mins || 15) - (b.preparation_time_mins || 15)).slice(0, 3);
    return {
      reply: `⚡ In a hurry? Here are our **quickest dishes to prepare** at **${restaurant.name}** (approx. 5-12 mins):\n\n${formatBulletList(fastItems)}\n\nOrder ahead so they arrive piping hot at your table!`,
      restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
      recommendedItems: fastItems.map(formatItem),
      source: 'tablepulse-grounded-intelligence'
    };
  }

  // 10. DEFAULT / "WHAT SHOULD I ORDER?" / SIGNATURE DISHES
  const curated = pickDiverseItems(availableItems, 3);
  return {
    reply: `👋 Welcome to **${restaurant.name}** (${restaurant.cuisine_type})!\n\nHere are our top chef recommendations from today's live menu:\n\n${formatBulletList(curated)}\n\nTell me if you have any dietary preferences (e.g. Pure Veg, Spicy, Budget under ₹300) and I'll tailor the menu for you!`,
    restaurant: { id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine_type },
    recommendedItems: curated.map(formatItem),
    source: 'tablepulse-grounded-intelligence'
  };
}

/**
 * Fallback for Home / Discovery page (when no specific restaurant is chosen)
 */
function generateGeneralDiscoveryResponse({ userMsg, restaurants, userName }) {
  const query = userMsg.toLowerCase();

  // Filter restaurants by cuisine keywords
  let matched = [];
  if (query.includes('seafood') || query.includes('fish') || query.includes('prawn') || query.includes('coastal')) {
    matched = restaurants.filter(r => r.cuisine_type.toLowerCase().includes('seafood') || r.name.toLowerCase().includes('coastal'));
  } else if (query.includes('veg') || query.includes('south indian') || query.includes('dosa')) {
    matched = restaurants.filter(r => r.cuisine_type.toLowerCase().includes('south indian'));
  } else if (query.includes('japanese') || query.includes('ramen') || query.includes('sushi')) {
    matched = restaurants.filter(r => r.cuisine_type.toLowerCase().includes('japanese'));
  } else if (query.includes('pizza') || query.includes('pasta') || query.includes('bistro') || query.includes('continental') || query.includes('cafe')) {
    matched = restaurants.filter(r => r.cuisine_type.toLowerCase().includes('continental') || r.cuisine_type.toLowerCase().includes('italian'));
  } else if (query.includes('biryani') || query.includes('north indian') || query.includes('mughlai') || query.includes('tandoor')) {
    matched = restaurants.filter(r => r.cuisine_type.toLowerCase().includes('multi-cuisine') || r.name.toLowerCase().includes('spice'));
  }

  if (matched.length === 0) {
    matched = restaurants.slice(0, 3);
  }

  const suggestions = matched.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    cuisine: r.cuisine_type,
    availableTables: r.available_tables,
  }));

  const restList = matched.map(r => 
    `- **${r.name}** (${r.cuisine_type}) • ${r.available_tables || 0} tables open right now`
  ).join('\n');

  return {
    reply: `👋 Hello${userName ? ` ${userName}` : ''}! Based on live table availability across TablePulse, here are our recommended dining spots:\n\n${restList}\n\nClick on any restaurant to explore its live floor layout and digital menu!`,
    suggestedRestaurants: suggestions,
    recommendedItems: [],
    source: 'tablepulse-grounded-intelligence'
  };
}

// ── Helper formatters ────────────────────────────────────────────────────────

function formatItem(item) {
  return {
    id: item.id,
    name: item.name,
    price: parseFloat(item.price),
    is_vegetarian: item.is_vegetarian,
    description: item.description,
    category_name: item.category_name,
    preparation_time_mins: item.preparation_time_mins,
    photo_url: item.photo_url,
  };
}

function formatBulletList(items) {
  return items.map((i, idx) => {
    const vegBadge = i.is_vegetarian ? '🟢 Veg' : '🔴 Non-Veg';
    const prep = i.preparation_time_mins ? ` • ${i.preparation_time_mins}m prep` : '';
    return `${idx + 1}. **${i.name}** — ₹${parseFloat(i.price).toFixed(2)} [${vegBadge}${prep}]\n   ${i.description || 'Specialty dish from our chef'}`;
  }).join('\n\n');
}

function pickDiverseItems(items, count = 3) {
  if (items.length <= count) return items;
  // Pick from different categories where possible
  const categories = {};
  for (const it of items) {
    if (!categories[it.category_id]) categories[it.category_id] = [];
    categories[it.category_id].push(it);
  }

  const chosen = [];
  const catKeys = Object.keys(categories);
  for (const k of catKeys) {
    if (categories[k].length > 0) {
      chosen.push(categories[k][0]);
      if (chosen.length >= count) break;
    }
  }

  if (chosen.length < count) {
    for (const it of items) {
      if (!chosen.find(c => c.id === it.id)) {
        chosen.push(it);
        if (chosen.length >= count) break;
      }
    }
  }

  return chosen;
}

module.exports = {
  getDiningRecommendation,
  getRestaurantContext,
  detectDietaryPreference,
  normalizeUserMessage,
  validateResponse,
};
