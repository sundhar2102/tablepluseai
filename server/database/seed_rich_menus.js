const { pool } = require('../src/config/db');

async function seedRichMenus() {
  console.log('Seeding rich menu categories and items for all 5 active restaurants...');

  // Categories
  const categories = [
    // Rest 1: The Spice Pavilion (Multi-Cuisine / North Indian)
    { id: 1, restaurant_id: 1, name: 'Starters & Clay Oven', display_order: 1 },
    { id: 2, restaurant_id: 1, name: 'Signature Curries', display_order: 2 },
    { id: 3, restaurant_id: 1, name: 'Biryanis & Rice', display_order: 3 },
    { id: 4, restaurant_id: 1, name: 'Breads & Accompaniments', display_order: 4 },
    { id: 5, restaurant_id: 1, name: 'Desserts & Beverages', display_order: 5 },

    // Rest 2: Coastal Catch & Grills (Seafood / Coastal)
    { id: 6, restaurant_id: 2, name: 'Coastal Starters', display_order: 1 },
    { id: 7, restaurant_id: 2, name: 'Chef Sea Specialties', display_order: 2 },
    { id: 8, restaurant_id: 2, name: 'Staples & Rice', display_order: 3 },
    { id: 18, restaurant_id: 2, name: 'Beverages & Desserts', display_order: 4 },

    // Rest 3: Aura Bistro & Cafe (Continental / Italian / Cafe)
    { id: 19, restaurant_id: 3, name: 'Small Plates & Salads', display_order: 1 },
    { id: 9, restaurant_id: 3, name: 'Wood-Fired Pizza', display_order: 2 },
    { id: 10, restaurant_id: 3, name: 'Artisanal Pastas', display_order: 3 },
    { id: 20, restaurant_id: 3, name: 'Desserts & Bakery', display_order: 4 },
    { id: 11, restaurant_id: 3, name: 'Beverages & Coffee', display_order: 5 },

    // Rest 4: Madras Thali Heritage (South Indian)
    { id: 12, restaurant_id: 4, name: 'Tiffin & Dosas', display_order: 1 },
    { id: 13, restaurant_id: 4, name: 'Traditional Thalis & Meals', display_order: 2 },
    { id: 21, restaurant_id: 4, name: 'Curries & Sides', display_order: 3 },
    { id: 14, restaurant_id: 4, name: 'Beverages & Desserts', display_order: 4 },

    // Rest 5: Sakura Ramen & Sushi Bar (Japanese)
    { id: 17, restaurant_id: 5, name: 'Japanese Starters & Bites', display_order: 1 },
    { id: 15, restaurant_id: 5, name: 'Ramen Bowls', display_order: 2 },
    { id: 16, restaurant_id: 5, name: 'Hand-Rolled Sushi', display_order: 3 },
    { id: 22, restaurant_id: 5, name: 'Donburi & Rice Bowls', display_order: 4 },
    { id: 23, restaurant_id: 5, name: 'Beverages & Desserts', display_order: 5 }
  ];

  for (const c of categories) {
    await pool.query(
      `INSERT INTO menu_categories (id, restaurant_id, name, display_order)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), display_order = VALUES(display_order)`,
      [c.id, c.restaurant_id, c.name, c.display_order]
    );
  }
  console.log('Categories seeded successfully:', categories.length);

  // Items
  const items = [
    // ── Rest 1: The Spice Pavilion ───────────────────
    { id: 1, restaurant_id: 1, category_id: 1, name: 'Paneer Tikka Angare', description: 'Charcoal-grilled cottage cheese cubes marinated in spiced yogurt and Kashmiri chilies.', price: 280.00, is_veg: 1, prep: 18, order: 1, photo: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60' },
    { id: 2, restaurant_id: 1, category_id: 1, name: 'Murgh Malai Kebab', description: 'Tender chicken skewers infused with cream, cheese, cardamom, and toasted cashews.', price: 340.00, is_veg: 0, prep: 20, order: 2, photo: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60' },
    { id: 23, restaurant_id: 1, category_id: 1, name: 'Tandoori Bharwan Aloo', description: 'Crisp potato barrels stuffed with seasoned paneer, dry fruits, and slow-roasted in clay tandoor.', price: 240.00, is_veg: 1, prep: 15, order: 3, photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60' },
    { id: 24, restaurant_id: 1, category_id: 1, name: 'Dahi Ke Kebab', description: 'Crisp golden patties made from hung curd, crushed spices, and fresh mint.', price: 260.00, is_veg: 1, prep: 12, order: 4, photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60' },
    { id: 25, restaurant_id: 1, category_id: 1, name: 'Galouti Kebab Awadhi', description: 'Melt-in-mouth smoked lamb patties infused with 16 royal Lucknowi spices.', price: 380.00, is_veg: 0, prep: 22, order: 5, photo: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60' },

    { id: 3, restaurant_id: 1, category_id: 2, name: 'Dal Makhani Heritage', description: 'Slow-cooked black lentils simmered overnight with tomatoes, butter, and heavy cream.', price: 260.00, is_veg: 1, prep: 15, order: 1, photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' },
    { id: 4, restaurant_id: 1, category_id: 2, name: 'Butter Chicken Royal', description: 'Clay-oven roasted chicken pieces in a silky, mildly spiced tomato butter gravy.', price: 380.00, is_veg: 0, prep: 20, order: 2, photo: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60' },
    { id: 26, restaurant_id: 1, category_id: 2, name: 'Paneer Lababdar', description: 'Soft paneer cubes simmered in a rich tomato and onion lababdar gravy with grated cheese.', price: 310.00, is_veg: 1, prep: 18, order: 3, photo: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60' },
    { id: 27, restaurant_id: 1, category_id: 2, name: 'Rogan Josh Kashmiri', description: 'Tender bone-in mutton slow-braised in a deep crimson gravy of ratanjot and Kashmiri chilies.', price: 440.00, is_veg: 0, prep: 25, order: 4, photo: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=500&auto=format&fit=crop&q=60' },
    { id: 28, restaurant_id: 1, category_id: 2, name: 'Subz Kadhai Masala', description: 'Garden fresh vegetables tossed with freshly pounded coriander and crushed whole red chillies.', price: 270.00, is_veg: 1, prep: 16, order: 5, photo: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=60' },

    { id: 5, restaurant_id: 1, category_id: 3, name: 'Dum Pukht Chicken Biryani', description: 'Fragrant long-grain basmati rice layered with spiced marinated chicken and saffron.', price: 360.00, is_veg: 0, prep: 22, order: 1, photo: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60' },
    { id: 6, restaurant_id: 1, category_id: 3, name: 'Subz Nizami Biryani', description: 'Seasonal garden vegetables and paneer cooked on dum with aromatics and mint.', price: 290.00, is_veg: 1, prep: 20, order: 2, photo: 'https://images.unsplash.com/photo-1642821373181-696a54913e9a?w=500&auto=format&fit=crop&q=60' },
    { id: 29, restaurant_id: 1, category_id: 3, name: 'Awadhi Gosht Dum Biryani', description: 'Royal Awadhi style long-grain rice cooked with tender lamb, rose water, and saffron.', price: 450.00, is_veg: 0, prep: 25, order: 3, photo: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=60' },
    { id: 30, restaurant_id: 1, category_id: 3, name: 'Jeera Basmati Rice', description: 'Fluffy aged basmati rice tempered with roasted cumin seeds and desi ghee.', price: 160.00, is_veg: 1, prep: 10, order: 4, photo: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&auto=format&fit=crop&q=60' },

    { id: 7, restaurant_id: 1, category_id: 4, name: 'Garlic Butter Naan', description: 'Crisp leavened flatbread brushed with garlic butter and fresh cilantro.', price: 70.00, is_veg: 1, prep: 8, order: 1, photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60' },
    { id: 31, restaurant_id: 1, category_id: 4, name: 'Laccha Paratha', description: 'Multi-layered whole wheat bread baked in tandoor with generous melted butter.', price: 60.00, is_veg: 1, prep: 8, order: 2, photo: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60' },
    { id: 32, restaurant_id: 1, category_id: 4, name: 'Tandoori Butter Roti', description: 'Crisp traditional whole wheat bread baked in clay tandoor.', price: 40.00, is_veg: 1, prep: 6, order: 3, photo: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60' },
    { id: 33, restaurant_id: 1, category_id: 4, name: 'Burani Garlic Raita', description: 'Thick chilled yogurt flavored with roasted garlic and crushed cumin.', price: 90.00, is_veg: 1, prep: 5, order: 4, photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' },

    { id: 8, restaurant_id: 1, category_id: 5, name: 'Gulab Jamun with Rabri', description: 'Warm khoya dumplings soaked in rose syrup served atop chilled thickened rabri.', price: 150.00, is_veg: 1, prep: 6, order: 1, photo: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60' },
    { id: 9, restaurant_id: 1, category_id: 5, name: 'Royal Kesari Lassi', description: 'Chilled churned yogurt drink scented with saffron and roasted pistachios.', price: 120.00, is_veg: 1, prep: 5, order: 2, photo: 'https://images.unsplash.com/photo-1571006682855-8798efd4bf88?w=500&auto=format&fit=crop&q=60' },
    { id: 34, restaurant_id: 1, category_id: 5, name: 'Shahi Tukda Old Delhi', description: 'Golden fried bread soaked in saffron syrup, layered with thick condensed milk rabri.', price: 160.00, is_veg: 1, prep: 8, order: 3, photo: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60' },

    // ── Rest 2: Coastal Catch & Grills ───────────────
    { id: 10, restaurant_id: 2, category_id: 6, name: 'Chettinad Prawn Pepper Fry', description: 'Fresh ocean prawns tossed in crushed black peppercorns and curry leaves.', price: 390.00, is_veg: 0, prep: 16, order: 1, photo: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=500&auto=format&fit=crop&q=60' },
    { id: 35, restaurant_id: 2, category_id: 6, name: 'Surmai Rava Fry', description: 'Kingfish steaks coated in spicy red masala and semolina crust, shallow-fried crisp.', price: 420.00, is_veg: 0, prep: 18, order: 2, photo: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&auto=format&fit=crop&q=60' },
    { id: 36, restaurant_id: 2, category_id: 6, name: 'Squid Butter Garlic', description: 'Tender calamari rings sauteed in golden garlic butter and crushed black pepper.', price: 360.00, is_veg: 0, prep: 14, order: 3, photo: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60' },
    { id: 37, restaurant_id: 2, category_id: 6, name: 'Paneer Ghee Roast', description: 'Paneer cubes roasted in rich Kundapur red chilli paste and clarified butter.', price: 280.00, is_veg: 1, prep: 15, order: 4, photo: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60' },
    { id: 38, restaurant_id: 2, category_id: 6, name: 'Crab Lollipop Roast', description: 'Crispy spiced crab claws served with tangy coastal coconut dip.', price: 380.00, is_veg: 0, prep: 18, order: 5, photo: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&auto=format&fit=crop&q=60' },

    { id: 11, restaurant_id: 2, category_id: 7, name: 'Goan Fish Curry', description: 'Fresh Kingfish simmered in a tangy coconut and kokum curry sauce.', price: 420.00, is_veg: 0, prep: 20, order: 1, photo: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60' },
    { id: 39, restaurant_id: 2, category_id: 7, name: 'Alleppey Prawn Curry', description: 'Juicy prawns simmered with raw mango slices, coconut milk, and green chillies.', price: 460.00, is_veg: 0, prep: 20, order: 2, photo: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=500&auto=format&fit=crop&q=60' },
    { id: 40, restaurant_id: 2, category_id: 7, name: 'Mangalorean Crab Gassi', description: 'Whole mud crab cooked in roasted coconut and Byadgi chilli traditional gravy.', price: 490.00, is_veg: 0, prep: 25, order: 3, photo: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&auto=format&fit=crop&q=60' },
    { id: 41, restaurant_id: 2, category_id: 7, name: 'Malabar Fish Mulakittathu', description: 'Spicy fiery red fish curry flavored with Kodampuli (Malabar tamarind).', price: 390.00, is_veg: 0, prep: 18, order: 4, photo: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60' },
    { id: 42, restaurant_id: 2, category_id: 7, name: 'Coastal Vegetable Stew', description: 'Mildly spiced garden vegetables cooked in silky coconut milk with ginger and curry leaves.', price: 240.00, is_veg: 1, prep: 14, order: 5, photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' },

    { id: 12, restaurant_id: 2, category_id: 8, name: 'Malabar Parotta (2 pcs)', description: 'Flaky, layered golden Kerala style flatbread.', price: 60.00, is_veg: 1, prep: 8, order: 1, photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60' },
    { id: 43, restaurant_id: 2, category_id: 8, name: 'Steamed Appam (2 pcs)', description: 'Soft-centered fermented rice bowl crepes with crispy lace borders.', price: 60.00, is_veg: 1, prep: 8, order: 2, photo: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60' },
    { id: 44, restaurant_id: 2, category_id: 8, name: 'Malabar Chicken Biryani', description: 'Khaima rice dum biryani flavored with mild spices, cashews, raisins, and mint.', price: 340.00, is_veg: 0, prep: 22, order: 3, photo: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60' },
    { id: 45, restaurant_id: 2, category_id: 8, name: 'Ghee Rice with Cashews', description: 'Aromatic short-grain rice cooked in pure ghee, garnished with crisp fried onions and cashews.', price: 180.00, is_veg: 1, prep: 10, order: 4, photo: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&auto=format&fit=crop&q=60' },

    { id: 46, restaurant_id: 2, category_id: 18, name: 'Solkadhi Cooler', description: 'Refreshing digestive drink made with fresh coconut milk, kokum, and green chillies.', price: 80.00, is_veg: 1, prep: 5, order: 1, photo: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60' },
    { id: 47, restaurant_id: 2, category_id: 18, name: 'Elaneer Payasam', description: 'Silky dessert made from fresh tender coconut pulp, coconut water, and condensed milk.', price: 140.00, is_veg: 1, prep: 6, order: 2, photo: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60' },

    // ── Rest 3: Aura Bistro & Cafe ───────────────────
    { id: 48, restaurant_id: 3, category_id: 19, name: 'Garlic Truffle Fries', description: 'Crispy hand-cut fries tossed with parmesan cheese, roasted garlic, and white truffle oil.', price: 220.00, is_veg: 1, prep: 12, order: 1, photo: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60' },
    { id: 49, restaurant_id: 3, category_id: 19, name: 'Bruschetta Pomodoro', description: 'Toasted artisanal baguette topped with vine-ripened tomatoes, fresh basil, and balsamic reduction.', price: 240.00, is_veg: 1, prep: 10, order: 2, photo: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&auto=format&fit=crop&q=60' },
    { id: 50, restaurant_id: 3, category_id: 19, name: 'Peri Peri Grilled Chicken Skewers', description: 'Tender chicken skewers marinated in house-made African bird’s eye chilli sauce.', price: 320.00, is_veg: 0, prep: 16, order: 3, photo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=60' },

    { id: 13, restaurant_id: 3, category_id: 9, name: 'Truffle Mushroom Sourdough Pizza', description: 'Wild mushrooms, mozzarella, truffle oil, and thyme on fermented sourdough crust.', price: 480.00, is_veg: 1, prep: 18, order: 1, photo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60' },
    { id: 51, restaurant_id: 3, category_id: 9, name: 'Classic Margherita Napoli', description: 'San Marzano tomato sauce, fresh buffalo mozzarella, extra virgin olive oil, and sweet basil.', price: 380.00, is_veg: 1, prep: 15, order: 2, photo: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60' },
    { id: 52, restaurant_id: 3, category_id: 9, name: 'Pepperoni & Hot Honey Pizza', description: 'Artisanal smoked chicken pepperoni, mozzarella, tomato passata, and chilli-infused hot honey.', price: 490.00, is_veg: 0, prep: 18, order: 3, photo: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60' },
    { id: 53, restaurant_id: 3, category_id: 9, name: 'Quattro Formaggi Bianco', description: 'White base pizza with mozzarella, gorgonzola, parmesan reggiano, and fontina cheese.', price: 460.00, is_veg: 1, prep: 16, order: 4, photo: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=500&auto=format&fit=crop&q=60' },

    { id: 14, restaurant_id: 3, category_id: 10, name: 'Creamy Fettuccine Alfredo', description: 'Egg fettuccine tossed in parmesan cream sauce with garlic herbs.', price: 380.00, is_veg: 1, prep: 16, order: 1, photo: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=60' },
    { id: 54, restaurant_id: 3, category_id: 10, name: 'Penne Arrabiata Piccante', description: 'Al dente penne in a spicy slow-cooked garlic, tomato, and red pepper flakes sauce.', price: 320.00, is_veg: 1, prep: 14, order: 2, photo: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?w=500&auto=format&fit=crop&q=60' },
    { id: 55, restaurant_id: 3, category_id: 10, name: 'Spaghetti Aglio e Olio', description: 'Spaghetti tossed in cold-pressed olive oil, sliced golden garlic, chilli flakes, and parsley.', price: 340.00, is_veg: 1, prep: 12, order: 3, photo: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=60' },
    { id: 56, restaurant_id: 3, category_id: 10, name: 'Smoked Chicken Ravioli', description: 'Handmade pasta stuffed with smoked chicken and ricotta in a sage butter glaze.', price: 420.00, is_veg: 0, prep: 18, order: 4, photo: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=500&auto=format&fit=crop&q=60' },

    { id: 57, restaurant_id: 3, category_id: 20, name: 'Classic Italian Tiramisu', description: 'Espresso-soaked ladyfingers layered with mascarpone cream and dusted with raw cocoa.', price: 260.00, is_veg: 1, prep: 8, order: 1, photo: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=60' },
    { id: 58, restaurant_id: 3, category_id: 20, name: 'Belgian Chocolate Lava Cake', description: 'Decadent chocolate cake with a molten truffle centre served with vanilla bean gelato.', price: 240.00, is_veg: 1, prep: 12, order: 2, photo: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60' },

    { id: 15, restaurant_id: 3, category_id: 11, name: 'Iced Caramel Macchiato', description: 'Espresso layered with whole milk, vanilla syrup, and rich caramel drizzle.', price: 180.00, is_veg: 1, prep: 6, order: 1, photo: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60' },
    { id: 59, restaurant_id: 3, category_id: 11, name: 'Cold Brew Tonic with Citrus', description: '18-hour steeped single-origin cold brew poured over sparkling tonic and fresh orange slice.', price: 160.00, is_veg: 1, prep: 5, order: 2, photo: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60' },
    { id: 60, restaurant_id: 3, category_id: 11, name: 'Hazelnut Cappuccino', description: 'Double espresso with micro-foamed milk infused with roasted hazelnut essence.', price: 150.00, is_veg: 1, prep: 6, order: 3, photo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60' },

    // ── Rest 4: Madras Thali Heritage ─────────────────
    { id: 16, restaurant_id: 4, category_id: 12, name: 'Crispy Ghee Podi Dosa', description: 'Golden fermented rice crepe smeared with fragrant spiced podi and pure cow ghee.', price: 140.00, is_veg: 1, prep: 10, order: 1, photo: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60' },
    { id: 61, restaurant_id: 4, category_id: 12, name: 'Mysore Masala Dosa', description: 'Crispy dosa lined with fiery red garlic chutney and stuffed with spiced potato filling.', price: 150.00, is_veg: 1, prep: 12, order: 2, photo: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60' },
    { id: 62, restaurant_id: 4, category_id: 12, name: 'Steamed Button Ghee Idli (14 pcs)', description: 'Mini melt-in-mouth rice cakes soaked in piping hot sambar with melting desi ghee.', price: 120.00, is_veg: 1, prep: 8, order: 3, photo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60' },
    { id: 63, restaurant_id: 4, category_id: 12, name: 'Medu Vada Platter (2 pcs)', description: 'Crispy golden lentil doughnuts served with three freshly ground house chutneys and sambar.', price: 90.00, is_veg: 1, prep: 8, order: 4, photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60' },
    { id: 64, restaurant_id: 4, category_id: 12, name: 'Rava Onion Masala Dosa', description: 'Crispy netted semolina crepe topped with roasted cumin, green chillies, and caramelized onions.', price: 160.00, is_veg: 1, prep: 14, order: 5, photo: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60' },

    { id: 17, restaurant_id: 4, category_id: 13, name: 'Royal Madras Banana Leaf Thali', description: 'Traditional spread with sambar, rasam, kootu, poriyal, appalam, curd, and payasam.', price: 260.00, is_veg: 1, prep: 15, order: 1, photo: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=60' },
    { id: 65, restaurant_id: 4, category_id: 13, name: 'Special Chettinad Non-Veg Thali', description: 'Banana leaf meal featuring Chettinad chicken curry, mutton gravy, fish fry, rasam, and rice.', price: 360.00, is_veg: 0, prep: 18, order: 2, photo: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60' },
    { id: 66, restaurant_id: 4, category_id: 13, name: 'Bisi Bele Bath with Boondi', description: 'Karnataka style spiced rice and lentil mash with vegetables, ghee, and crisp spiced boondi.', price: 140.00, is_veg: 1, prep: 10, order: 3, photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' },
    { id: 67, restaurant_id: 4, category_id: 13, name: 'Curd Rice Thalippu Bowl', description: 'Creamy curd rice tempered with mustard, curry leaves, ginger, pomegranate, and mango pickle.', price: 110.00, is_veg: 1, prep: 6, order: 4, photo: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=500&auto=format&fit=crop&q=60' },

    { id: 68, restaurant_id: 4, category_id: 21, name: 'Ennai Kathirikai Kulambu', description: 'Baby brinjals stuffed with roasted spices simmered in tangy tamarind sesame gravy.', price: 180.00, is_veg: 1, prep: 14, order: 1, photo: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=60' },
    { id: 69, restaurant_id: 4, category_id: 21, name: 'Chettinad Chicken Sukka', description: 'Tender boneless chicken dry-roasted with freshly crushed fennel, shallots, and curry leaves.', price: 280.00, is_veg: 0, prep: 16, order: 2, photo: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60' },
    { id: 70, restaurant_id: 4, category_id: 21, name: 'Malabar Parotta with Kurma', description: 'Two flaky parottas served with fragrant mixed vegetable coconut kurma.', price: 130.00, is_veg: 1, prep: 10, order: 3, photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60' },

    { id: 18, restaurant_id: 4, category_id: 14, name: 'Degree Filter Coffee', description: 'Authentic Kumbakonam degree decoction brewed coffee frothed with hot milk.', price: 60.00, is_veg: 1, prep: 5, order: 1, photo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60' },
    { id: 71, restaurant_id: 4, category_id: 14, name: 'Panakam Herbal Cooler', description: 'Ancient cooling drink made of organic jaggery, crushed dry ginger, cardamom, and lemon.', price: 70.00, is_veg: 1, prep: 5, order: 2, photo: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60' },
    { id: 72, restaurant_id: 4, category_id: 14, name: 'Tirunelveli Ghee Halwa', description: 'Glossy, melt-in-mouth wheat halwa prepared with pure country ghee and cashews.', price: 130.00, is_veg: 1, prep: 6, order: 3, photo: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60' },

    // ── Rest 5: Sakura Ramen & Sushi Bar ───────────────
    { id: 22, restaurant_id: 5, category_id: 17, name: 'Pan-Seared Chicken Gyoza (5 pcs)', description: 'Crisp-bottom Japanese dumplings filled with seasoned ground chicken and scallions.', price: 280.00, is_veg: 0, prep: 12, order: 1, photo: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=60' },
    { id: 73, restaurant_id: 5, category_id: 17, name: 'Vegetable Gyoza (5 pcs)', description: 'Pan-seared dumplings packed with finely minced cabbage, shiitake mushrooms, and garlic.', price: 240.00, is_veg: 1, prep: 12, order: 2, photo: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=60' },
    { id: 74, restaurant_id: 5, category_id: 17, name: 'Steamed Edamame with Sea Salt', description: 'Warm whole soybean pods tossed with Maldon sea salt crystals and sesame oil.', price: 190.00, is_veg: 1, prep: 6, order: 3, photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' },
    { id: 75, restaurant_id: 5, category_id: 17, name: 'Crispy Tempura Prawns (4 pcs)', description: 'Light and crispy battered tiger prawns served with house tentsuyu dipping sauce.', price: 360.00, is_veg: 0, prep: 14, order: 4, photo: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=500&auto=format&fit=crop&q=60' },
    { id: 76, restaurant_id: 5, category_id: 17, name: 'Agedashi Tofu', description: 'Crisp silken tofu cubes in a savoury dashi-mirin broth topped with grated ginger and nori.', price: 230.00, is_veg: 1, prep: 10, order: 5, photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' },

    { id: 19, restaurant_id: 5, category_id: 15, name: 'Signature Tonkotsu Chashu Ramen', description: 'Rich 16-hour simmered broth, springy wheat noodles, tender chashu, and ajitsuke tamago.', price: 450.00, is_veg: 0, prep: 16, order: 1, photo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60' },
    { id: 20, restaurant_id: 5, category_id: 15, name: 'Spicy Miso Vegetable Ramen', description: 'Hearty roasted miso broth, seasonal greens, sweet corn, bamboo shoots, and nori.', price: 390.00, is_veg: 1, prep: 14, order: 2, photo: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=500&auto=format&fit=crop&q=60' },
    { id: 77, restaurant_id: 5, category_id: 15, name: 'Tokyo Shoyu Chicken Ramen', description: 'Clear soy sauce chicken broth, springy noodles, seasoned bamboo shoots, and marinated chicken.', price: 420.00, is_veg: 0, prep: 15, order: 3, photo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60' },
    { id: 78, restaurant_id: 5, category_id: 15, name: 'Black Garlic Tonkotsu Ramen', description: 'Signature pork broth infused with roasted black garlic mayu oil, tender pork belly, and scallions.', price: 480.00, is_veg: 0, prep: 16, order: 4, photo: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=500&auto=format&fit=crop&q=60' },

    { id: 21, restaurant_id: 5, category_id: 16, name: 'Salmon & Avocado Maki Roll', description: 'Fresh Atlantic salmon and ripe Hass avocado wrapped in seasoned sushi rice and seaweed.', price: 420.00, is_veg: 0, prep: 15, order: 1, photo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60' },
    { id: 79, restaurant_id: 5, category_id: 16, name: 'Spicy Tuna Crunch Roll', description: 'Minced yellowfin tuna with spicy sriracha mayo, cucumber, and tempura flakes.', price: 450.00, is_veg: 0, prep: 15, order: 2, photo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60' },
    { id: 80, restaurant_id: 5, category_id: 16, name: 'Crispy Vegetable Tempura Roll', description: 'Crispy asparagus and sweet potato tempura rolled with toasted sesame seeds.', price: 320.00, is_veg: 1, prep: 12, order: 3, photo: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&auto=format&fit=crop&q=60' },
    { id: 81, restaurant_id: 5, category_id: 16, name: 'California Crab Roll (8 pcs)', description: 'Crab meat, creamy avocado, and crisp cucumber rolled with tobiko flying fish roe.', price: 390.00, is_veg: 0, prep: 14, order: 4, photo: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=500&auto=format&fit=crop&q=60' },

    { id: 82, restaurant_id: 5, category_id: 22, name: 'Chicken Katsu Curry Don', description: 'Crispy panko chicken breast over steamed rice with thick aromatic Japanese curry sauce.', price: 380.00, is_veg: 0, prep: 16, order: 1, photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' },
    { id: 83, restaurant_id: 5, category_id: 22, name: 'Teriyaki Tofu & Mushroom Don', description: 'Pan-glazed tofu steak and shiitake mushrooms over Japanese rice with toasted sesame.', price: 310.00, is_veg: 1, prep: 12, order: 2, photo: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' },

    { id: 84, restaurant_id: 5, category_id: 23, name: 'Iced Matcha Green Tea Latte', description: 'Ceremonial grade Uji matcha whisked with cold milk and organic agave.', price: 180.00, is_veg: 1, prep: 5, order: 1, photo: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60' },
    { id: 85, restaurant_id: 5, category_id: 23, name: 'Matcha & Sesame Mochi (2 pcs)', description: 'Soft chewy Japanese rice cakes filled with premium green tea and toasted sesame gelato.', price: 190.00, is_veg: 1, prep: 5, order: 2, photo: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=60' }
  ];

  for (const item of items) {
    await pool.query(
      `INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, is_vegetarian, photo_url, is_available, preparation_time_mins, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
       ON DUPLICATE KEY UPDATE
         restaurant_id = VALUES(restaurant_id),
         category_id = VALUES(category_id),
         name = VALUES(name),
         description = VALUES(description),
         price = VALUES(price),
         is_vegetarian = VALUES(is_vegetarian),
         photo_url = VALUES(photo_url),
         preparation_time_mins = VALUES(preparation_time_mins),
         display_order = VALUES(display_order)`,
      [item.id, item.restaurant_id, item.category_id, item.name, item.description, item.price, item.is_veg, item.photo, item.prep, item.order]
    );
  }
  console.log('Items seeded successfully:', items.length);

  const [countRes] = await pool.query(
    'SELECT r.id, r.name, r.cuisine_type, COUNT(mi.id) as item_count FROM restaurants r JOIN menu_items mi ON r.id = mi.restaurant_id GROUP BY r.id ORDER BY r.id'
  );
  console.log('Final counts by restaurant:\n', countRes);
  process.exit(0);
}

seedRichMenus().catch(e => {
  console.error('Seeding error:', e);
  process.exit(1);
});
