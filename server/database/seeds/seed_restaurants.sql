-- ============================================================
-- TABLEPULSE AI — Seed: Realistic Restaurants & Tables
-- Stage 6 Part 1: Discovery & Table Availability
-- ============================================================

USE `tablepulse_db`;

-- Additional owners for restaurants (password is Demo@1234)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `role`) VALUES
(10, 'Ananya Sen',     'owner2@demo.com', '$2b$12$Lx2OVqw6wSuAWPcVVsiZP.Y6RGd811e4Yz8KXHupEBjj58EyJCC2u', '9811223344', 'owner'),
(11, 'Karthik Raja',   'owner3@demo.com', '$2b$12$Lx2OVqw6wSuAWPcVVsiZP.Y6RGd811e4Yz8KXHupEBjj58EyJCC2u', '9822334455', 'owner'),
(12, 'Meera Nair',     'owner4@demo.com', '$2b$12$Lx2OVqw6wSuAWPcVVsiZP.Y6RGd811e4Yz8KXHupEBjj58EyJCC2u', '9833445566', 'owner'),
(13, 'Vikram Seth',    'owner5@demo.com', '$2b$12$Lx2OVqw6wSuAWPcVVsiZP.Y6RGd811e4Yz8KXHupEBjj58EyJCC2u', '9844556677', 'owner'),
(14, 'Siddharth Rao',  'owner6@demo.com', '$2b$12$Lx2OVqw6wSuAWPcVVsiZP.Y6RGd811e4Yz8KXHupEBjj58EyJCC2u', '9855667788', 'owner');

-- Ensure primary sample owner Rahul Sharma has id 7
UPDATE `users` SET `role` = 'owner' WHERE `id` = 7;

-- ── Restaurants ──────────────────────────────────────────────
INSERT INTO `restaurants` 
(`id`, `owner_id`, `name`, `slug`, `description`, `cuisine_type`, `address`, `latitude`, `longitude`, `phone`, `cover_photo_url`, `avg_dining_duration_mins`, `avg_cleaning_duration_mins`, `tax_rate`, `approval_status`, `is_active`)
VALUES
(1, 7, 
 'The Spice Pavilion', 
 'the-spice-pavilion', 
 'Authentic North Indian curries, aromatic biryanis, and succulent clay-oven kebabs in an ambient royal setting.', 
 'North Indian', 
 '42 Usman Road, T. Nagar, Chennai 600017', 
 13.04180000, 80.23410000, 
 '+91 44 2434 5678', 
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80', 
 45, 10, 5.00, 'approved', 1),

(2, 10, 
 'Coastal Catch & Grills', 
 'coastal-catch-grills', 
 'Fresh catch from the Coromandel coast, spicy Chettinad crab roasts, and grilled coastal delicacies.', 
 'Seafood', 
 '18 Khader Nawaz Khan Road, Nungambakkam, Chennai 600034', 
 13.05690000, 80.24250000, 
 '+91 44 2833 4455', 
 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80', 
 50, 10, 5.00, 'approved', 1),

(3, 11, 
 'Aura Bistro & Cafe', 
 'aura-bistro-cafe', 
 'Artisanal coffee, wood-fired sourdough pizzas, fresh salads, and gourmet pastas in a cozy aesthetic indoor greenhouse.', 
 'Continental', 
 '7 Second Avenue, Anna Nagar, Chennai 600040', 
 13.08500000, 80.21000000, 
 '+91 44 2621 8899', 
 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80', 
 40, 8, 5.00, 'approved', 1),

(4, 12, 
 'Madras Thali Heritage', 
 'madras-thali-heritage', 
 'Traditional banana-leaf meals, Crispy Ghee Podi Dosas, filter coffee, and heirloom South Indian family recipes.', 
 'South Indian', 
 '112 TTK Road, Alwarpet, Chennai 600018', 
 13.03360000, 80.25200000, 
 '+91 44 2499 1234', 
 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80', 
 35, 10, 5.00, 'approved', 1),

(5, 13, 
 'Sakura Ramen & Sushi Bar', 
 'sakura-ramen-sushi', 
 'Authentic slow-simmered tonkotsu and miso ramen bowls, hand-rolled sushi, and crispy gyoza.', 
 'Japanese', 
 '24 Gandhi Nagar 1st Main Rd, Adyar, Chennai 600020', 
 13.00120000, 80.25650000, 
 '+91 44 2441 5566', 
 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80', 
 45, 10, 5.00, 'approved', 1),

(6, 14, 
 'The Rustic Oven', 
 'the-rustic-oven', 
 'Handcrafted Neapolitan pizzas and Italian risottos in a rustic brick oven setting.', 
 'Italian', 
 '55 3rd Avenue, Anna Nagar East, Chennai 600102', 
 13.08750000, 80.21400000, 
 '+91 44 2626 7788', 
 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop&q=80', 
 45, 10, 5.00, 'pending', 0)
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `slug` = VALUES(`slug`),
  `description` = VALUES(`description`),
  `cuisine_type` = VALUES(`cuisine_type`),
  `address` = VALUES(`address`),
  `latitude` = VALUES(`latitude`),
  `longitude` = VALUES(`longitude`),
  `approval_status` = VALUES(`approval_status`),
  `is_active` = VALUES(`is_active`);

-- ── Operating Hours (Mon-Sun: 11:00 to 23:00) ──────────────────
DELETE FROM `restaurant_hours` WHERE `restaurant_id` IN (1, 2, 3, 4, 5, 6);

INSERT INTO `restaurant_hours` (`restaurant_id`, `day_of_week`, `open_time`, `close_time`, `is_closed`)
VALUES
-- Restaurant 1: The Spice Pavilion (Open daily 11:00 - 23:00)
(1, 0, '11:00:00', '23:00:00', 0),
(1, 1, '11:00:00', '23:00:00', 0),
(1, 2, '11:00:00', '23:00:00', 0),
(1, 3, '11:00:00', '23:00:00', 0),
(1, 4, '11:00:00', '23:00:00', 0),
(1, 5, '11:00:00', '23:30:00', 0),
(1, 6, '11:00:00', '23:30:00', 0),

-- Restaurant 2: Coastal Catch & Grills (Open daily 12:00 - 23:00)
(2, 0, '12:00:00', '23:00:00', 0),
(2, 1, '12:00:00', '23:00:00', 0),
(2, 2, '12:00:00', '23:00:00', 0),
(2, 3, '12:00:00', '23:00:00', 0),
(2, 4, '12:00:00', '23:00:00', 0),
(2, 5, '12:00:00', '23:30:00', 0),
(2, 6, '12:00:00', '23:30:00', 0),

-- Restaurant 3: Aura Bistro (Open daily 08:30 - 23:00)
(3, 0, '08:30:00', '23:00:00', 0),
(3, 1, '08:30:00', '23:00:00', 0),
(3, 2, '08:30:00', '23:00:00', 0),
(3, 3, '08:30:00', '23:00:00', 0),
(3, 4, '08:30:00', '23:00:00', 0),
(3, 5, '08:30:00', '23:30:00', 0),
(3, 6, '08:30:00', '23:30:00', 0),

-- Restaurant 4: Madras Thali Heritage (Open daily 07:00 - 22:30)
(4, 0, '07:00:00', '22:30:00', 0),
(4, 1, '07:00:00', '22:30:00', 0),
(4, 2, '07:00:00', '22:30:00', 0),
(4, 3, '07:00:00', '22:30:00', 0),
(4, 4, '07:00:00', '22:30:00', 0),
(4, 5, '07:00:00', '22:30:00', 0),
(4, 6, '07:00:00', '22:30:00', 0),

-- Restaurant 5: Sakura Ramen (Open daily 12:00 - 22:30, Closed Mondays)
(5, 0, '12:00:00', '22:30:00', 0),
(5, 1, '12:00:00', '22:30:00', 1), -- Closed on Mondays
(5, 2, '12:00:00', '22:30:00', 0),
(5, 3, '12:00:00', '22:30:00', 0),
(5, 4, '12:00:00', '22:30:00', 0),
(5, 5, '12:00:00', '23:00:00', 0),
(5, 6, '12:00:00', '23:00:00', 0);

-- ── Tables ───────────────────────────────────────────────────
DELETE FROM `tables` WHERE `restaurant_id` IN (1, 2, 3, 4, 5, 6);

INSERT INTO `tables` (`restaurant_id`, `table_number`, `capacity`, `status`, `qr_token`, `display_order`)
VALUES
-- Restaurant 1 (The Spice Pavilion): 12 tables — Moderate crowd
(1, 'T-01', 2, 'available', '11111111-0001-4000-8000-000000000001', 1),
(1, 'T-02', 2, 'available', '11111111-0001-4000-8000-000000000002', 2),
(1, 'T-03', 4, 'occupied',  '11111111-0001-4000-8000-000000000003', 3),
(1, 'T-04', 4, 'occupied',  '11111111-0001-4000-8000-000000000004', 4),
(1, 'T-05', 4, 'occupied',  '11111111-0001-4000-8000-000000000005', 5),
(1, 'T-06', 4, 'reserved',  '11111111-0001-4000-8000-000000000006', 6),
(1, 'T-07', 6, 'available', '11111111-0001-4000-8000-000000000007', 7),
(1, 'T-08', 6, 'occupied',  '11111111-0001-4000-8000-000000000008', 8),
(1, 'T-09', 6, 'cleaning',  '11111111-0001-4000-8000-000000000009', 9),
(1, 'T-10', 8, 'available', '11111111-0001-4000-8000-000000000010', 10),
(1, 'T-11', 2, 'available', '11111111-0001-4000-8000-000000000011', 11),
(1, 'T-12', 4, 'occupied',  '11111111-0001-4000-8000-000000000012', 12),

-- Restaurant 2 (Coastal Catch): 8 tables — Low crowd (mostly available)
(2, 'C-01', 2, 'available', '22222222-0002-4000-8000-000000000001', 1),
(2, 'C-02', 2, 'available', '22222222-0002-4000-8000-000000000002', 2),
(2, 'C-03', 4, 'available', '22222222-0002-4000-8000-000000000003', 3),
(2, 'C-04', 4, 'occupied',  '22222222-0002-4000-8000-000000000004', 4),
(2, 'C-05', 4, 'available', '22222222-0002-4000-8000-000000000005', 5),
(2, 'C-06', 6, 'available', '22222222-0002-4000-8000-000000000006', 6),
(2, 'C-07', 6, 'reserved',  '22222222-0002-4000-8000-000000000007', 7),
(2, 'C-08', 8, 'available', '22222222-0002-4000-8000-000000000008', 8),

-- Restaurant 3 (Aura Bistro): 6 tables — FULL crowd (0 available, 1 cleaning)
(3, 'A-01', 2, 'occupied',  '33333333-0003-4000-8000-000000000001', 1),
(3, 'A-02', 2, 'occupied',  '33333333-0003-4000-8000-000000000002', 2),
(3, 'A-03', 4, 'occupied',  '33333333-0003-4000-8000-000000000003', 3),
(3, 'A-04', 4, 'reserved',  '33333333-0003-4000-8000-000000000004', 4),
(3, 'A-05', 4, 'occupied',  '33333333-0003-4000-8000-000000000005', 5),
(3, 'A-06', 6, 'cleaning',  '33333333-0003-4000-8000-000000000006', 6),

-- Restaurant 4 (Madras Thali): 10 tables — High crowd
(4, 'M-01', 2, 'available', '44444444-0004-4000-8000-000000000001', 1),
(4, 'M-02', 2, 'occupied',  '44444444-0004-4000-8000-000000000002', 2),
(4, 'M-03', 4, 'occupied',  '44444444-0004-4000-8000-000000000003', 3),
(4, 'M-04', 4, 'occupied',  '44444444-0004-4000-8000-000000000004', 4),
(4, 'M-05', 4, 'reserved',  '44444444-0004-4000-8000-000000000005', 5),
(4, 'M-06', 4, 'occupied',  '44444444-0004-4000-8000-000000000006', 6),
(4, 'M-07', 6, 'occupied',  '44444444-0004-4000-8000-000000000007', 7),
(4, 'M-08', 6, 'occupied',  '44444444-0004-4000-8000-000000000008', 8),
(4, 'M-09', 6, 'cleaning',  '44444444-0004-4000-8000-000000000009', 9),
(4, 'M-10', 8, 'occupied',  '44444444-0004-4000-8000-000000000010', 10),

-- Restaurant 5 (Sakura Ramen): 6 tables — Moderate crowd
(5, 'S-01', 2, 'available', '55555555-0005-4000-8000-000000000001', 1),
(5, 'S-02', 2, 'available', '55555555-0005-4000-8000-000000000002', 2),
(5, 'S-03', 4, 'occupied',  '55555555-0005-4000-8000-000000000003', 3),
(5, 'S-04', 4, 'occupied',  '55555555-0005-4000-8000-000000000004', 4),
(5, 'S-05', 4, 'available', '55555555-0005-4000-8000-000000000005', 5),
(5, 'S-06', 6, 'reserved',  '55555555-0005-4000-8000-000000000006', 6);
