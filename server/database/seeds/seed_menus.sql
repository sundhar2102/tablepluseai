-- ============================================================
-- TABLEPULSE AI — Seed: Menu Categories & Items
-- Stage 6 Part 3: Digital Menu & Food Ordering
-- ============================================================

USE `tablepulse_db`;

-- ── 1. The Spice Pavilion (Restaurant ID 1) ───────────────────
INSERT INTO `menu_categories` (`id`, `restaurant_id`, `name`, `display_order`) VALUES
(1, 1, 'Starters & Clay Oven', 1),
(2, 1, 'Signature Curries', 2),
(3, 1, 'Biryanis & Rice', 3),
(4, 1, 'Breads & Accompaniments', 4),
(5, 1, 'Desserts & Beverages', 5)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `menu_items` (`id`, `restaurant_id`, `category_id`, `name`, `description`, `price`, `is_vegetarian`, `photo_url`, `is_available`, `display_order`) VALUES
(1, 1, 1, 'Paneer Tikka Angare', 'Charcoal-grilled cottage cheese cubes marinated in spiced yogurt and Kashmiri chilies.', 280.00, 1, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60', 1, 1),
(2, 1, 1, 'Murgh Malai Kebab', 'Tender chicken skewers infused with cream, cheese, cardamom, and toasted cashews.', 340.00, 0, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60', 1, 2),
(3, 1, 2, 'Dal Makhani Heritage', 'Slow-cooked black lentils simmered overnight with tomatoes, butter, and heavy cream.', 260.00, 1, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60', 1, 1),
(4, 1, 2, 'Butter Chicken Royal', 'Clay-oven roasted chicken pieces in a silky, mildly spiced tomato butter gravy.', 380.00, 0, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60', 1, 2),
(5, 1, 3, 'Dum Pukht Chicken Biryani', 'Fragrant long-grain basmati rice layered with spiced marinated chicken and saffron.', 360.00, 0, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60', 1, 1),
(6, 1, 3, 'Subz Nizami Biryani', 'Seasonal garden vegetables and paneer cooked on dum with aromatics and mint.', 290.00, 1, 'https://images.unsplash.com/photo-1642821373181-696a54913e9a?w=500&auto=format&fit=crop&q=60', 1, 2),
(7, 1, 4, 'Garlic Butter Naan', 'Crisp leavened flatbread brushed with garlic butter and fresh cilantro.', 70.00, 1, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60', 1, 1),
(8, 1, 5, 'Gulab Jamun with Rabri', 'Warm khoya dumplings soaked in rose syrup served atop chilled thickened rabri.', 150.00, 1, 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=500&auto=format&fit=crop&q=60', 1, 1),
(9, 1, 5, 'Royal Kesari Lassi', 'Chilled churned yogurt drink scented with saffron and roasted pistachios.', 120.00, 1, 'https://images.unsplash.com/photo-1571006682855-8798efd4bf88?w=500&auto=format&fit=crop&q=60', 1, 2)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`);

-- ── 2. Coastal Catch & Grills (Restaurant ID 2) ───────────────
INSERT INTO `menu_categories` (`id`, `restaurant_id`, `name`, `display_order`) VALUES
(6, 2, 'Coastal Starters', 1),
(7, 2, 'Chef Sea Specialties', 2),
(8, 2, 'Staples & Rice', 3)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `menu_items` (`id`, `restaurant_id`, `category_id`, `name`, `description`, `price`, `is_vegetarian`, `photo_url`, `is_available`, `display_order`) VALUES
(10, 2, 6, 'Chettinad Prawn Pepper Fry', 'Fresh ocean prawns tossed in crushed black peppercorns and curry leaves.', 390.00, 0, 'https://images.unsplash.com/photo-1559742811-822873691df8?w=500&auto=format&fit=crop&q=60', 1, 1),
(11, 2, 7, 'Goan Fish Curry', 'Fresh Kingfish simmered in a tangy coconut and kokum curry sauce.', 420.00, 0, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60', 1, 1),
(12, 2, 8, 'Malabar Parotta (2 pcs)', 'Flaky, layered golden Kerala style flatbread.', 60.00, 1, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60', 1, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`);

-- ── 3. Aura Bistro & Cafe (Restaurant ID 3) ───────────────────
INSERT INTO `menu_categories` (`id`, `restaurant_id`, `name`, `display_order`) VALUES
(9, 3, 'Wood-Fired Pizza', 1),
(10, 3, 'Artisanal Pastas', 2),
(11, 3, 'Beverages & Coffee', 3)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `menu_items` (`id`, `restaurant_id`, `category_id`, `name`, `description`, `price`, `is_vegetarian`, `photo_url`, `is_available`, `display_order`) VALUES
(13, 3, 9, 'Truffle Mushroom Sourdough Pizza', 'Wild mushrooms, mozzarella, truffle oil, and thyme on fermented sourdough crust.', 480.00, 1, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60', 1, 1),
(14, 3, 10, 'Creamy Fettuccine Alfredo', 'Egg fettuccine tossed in parmesan cream sauce with garlic herbs.', 380.00, 1, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=60', 1, 1),
(15, 3, 11, 'Iced Caramel Macchiato', 'Espresso layered with whole milk, vanilla syrup, and rich caramel drizzle.', 180.00, 1, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60', 1, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`);

-- ── 4. Madras Thali Heritage (Restaurant ID 4) ──────────────────
INSERT INTO `menu_categories` (`id`, `restaurant_id`, `name`, `display_order`) VALUES
(12, 4, 'Tiffin & Dosas', 1),
(13, 4, 'Traditional Thalis & Meals', 2),
(14, 4, 'Beverages & Desserts', 3)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `menu_items` (`id`, `restaurant_id`, `category_id`, `name`, `description`, `price`, `is_vegetarian`, `photo_url`, `is_available`, `display_order`) VALUES
(16, 4, 12, 'Crispy Ghee Podi Dosa', 'Golden fermented rice crepe smeared with fragrant spiced podi and pure cow ghee.', 140.00, 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60', 1, 1),
(17, 4, 13, 'Royal Madras Banana Leaf Thali', 'Traditional spread with sambar, rasam, kootu, poriyal, appalam, curd, and payasam.', 260.00, 1, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=500&auto=format&fit=crop&q=60', 1, 1),
(18, 4, 14, 'Degree Filter Coffee', 'Authentic Kumbakonam degree decoction brewed coffee frothed with hot milk.', 60.00, 1, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60', 1, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`);

-- ── 5. Sakura Ramen & Sushi Bar (Restaurant ID 5) ───────────────
INSERT INTO `menu_categories` (`id`, `restaurant_id`, `name`, `display_order`) VALUES
(15, 5, 'Ramen Bowls', 1),
(16, 5, 'Hand-Rolled Sushi', 2),
(17, 5, 'Japanese Starters', 3)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `menu_items` (`id`, `restaurant_id`, `category_id`, `name`, `description`, `price`, `is_vegetarian`, `photo_url`, `is_available`, `display_order`) VALUES
(19, 5, 15, 'Signature Tonkotsu Chashu Ramen', 'Rich 16-hour simmered pork broth, springy wheat noodles, tender chashu, and ajitsuke tamago.', 450.00, 0, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60', 1, 1),
(20, 5, 15, 'Spicy Miso Vegetable Ramen', 'Hearty roasted miso broth, seasonal greens, sweet corn, bamboo shoots, and nori.', 390.00, 1, 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=500&auto=format&fit=crop&q=60', 1, 2),
(21, 5, 16, 'Salmon & Avocado Maki Roll', 'Fresh Atlantic salmon and ripe Hass avocado wrapped in seasoned sushi rice and seaweed.', 420.00, 0, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60', 1, 1),
(22, 5, 17, 'Pan-Seared Chicken Gyoza (5 pcs)', 'Crisp-bottom Japanese dumplings filled with seasoned ground chicken and scallions.', 280.00, 0, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=60', 1, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `price` = VALUES(`price`);

