-- ============================================================
-- TABLEPULSE AI — Seed: Default Admin + Sample Data
-- Run AFTER schema.sql
-- ============================================================

USE `tablepulse_db`;

-- ── Default Admin User ───────────────────────────────────────
-- Password: Admin@1234  (bcrypt hash — change after first login)
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `role`) VALUES
(1, 'Super Admin', 'admin@tablepulse.app',
 '$2b$12$Lx2OVqw6wSuAWPcVVsiZP.Y6RGd811e4Yz8KXHupEBjj58EyJCC2u',
 'admin');

-- ── Sample Owner ─────────────────────────────────────────────
-- Password: Owner@1234
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `role`) VALUES
(7, 'Rahul Sharma', 'owner@demo.com',
 '$2b$12$Lx2OVqw6wSuAWPcVVsiZP.Y6RGd811e4Yz8KXHupEBjj58EyJCC2u',
 '9876543210', 'owner');

-- ── Sample Customer ──────────────────────────────────────────
-- Password: User@1234
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `role`) VALUES
(8, 'Priya Patel', 'customer@demo.com',
 '$2b$12$Lx2OVqw6wSuAWPcVVsiZP.Y6RGd811e4Yz8KXHupEBjj58EyJCC2u',
 '9123456789', 'customer');

-- NOTE: The bcrypt hash above corresponds to the password "Demo@1234"
-- For production — generate fresh hashes. Never commit real passwords.
-- Generate hash: node -e "const b=require('bcrypt');b.hash('Demo@1234',12).then(console.log)"
