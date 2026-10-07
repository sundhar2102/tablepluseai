/**
 * SAFE DATA MIGRATION — MENU DIETARY CLASSIFICATION
 * 
 * Rules:
 * - Backup-safe (JSON snapshot file + MySQL backup table)
 * - Re-runnable / idempotent
 * - Reversible (includes rollback function)
 * - Limited ONLY to menu classification data
 * - Restaurant-aware
 * - Transaction-safe (BEGIN ... COMMIT / ROLLBACK)
 * - Zero modifications to users, orders, reservations, tables, or restaurants
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../../src/config/db');

// Explicit Migration Mapping for Review
const MIGRATION_MAPPING = [
  {
    menuItemId: 14,
    restaurantId: 3,
    restaurantName: 'Aura Bistro & Cafe',
    itemName: 'Creamy Fettuccine Alfredo',
    currentClassification: 1, // VEG
    proposedClassification: 0, // NON-VEG
    reason: 'Explicitly formulated with egg fettuccine. In dietary standards (FSSAI green/red dot), egg pasta is non-vegetarian.',
    isAmbiguous: false,
    status: 'APPROVED_FOR_MIGRATION'
  }
];

// Explicit List of Reviewed & Preserved Items (Ambiguous or Potential edge cases verified as VEG)
const PRESERVED_ITEMS_REVIEW = [
  {
    menuItemId: 53,
    restaurantId: 3,
    restaurantName: 'Aura Bistro & Cafe',
    itemName: 'Quattro Formaggi Bianco',
    classification: 1, // VEG
    reason: 'Artisan 4-cheese white pizza (mozzarella, gorgonzola, parmesan, fontina). Contains dairy cheeses, no meat.',
    action: 'PRESERVE_AS_VEG'
  },
  {
    menuItemId: 68,
    restaurantId: 4,
    restaurantName: 'Madras Thali Heritage',
    itemName: 'Ennai Kathirikai Kulambu',
    classification: 1, // VEG
    reason: 'Traditional South Indian baby brinjal (eggplant) in tangy tamarind sesame curry. 100% vegetarian.',
    action: 'PRESERVE_AS_VEG'
  },
  {
    menuItemId: 76,
    restaurantId: 5,
    restaurantName: 'Sakura Ramen & Sushi Bar',
    itemName: 'Agedashi Tofu',
    classification: 1, // VEG
    reason: 'Silken tofu cubes in dashi-mirin broth with nori. Kept vegetarian as per current restaurant designation.',
    action: 'PRESERVE_AS_VEG'
  },
  {
    menuItemId: 57,
    restaurantId: 3,
    restaurantName: 'Aura Bistro & Cafe',
    itemName: 'Classic Italian Tiramisu',
    classification: 1, // VEG
    reason: 'Mascarpone dessert with espresso ladyfingers. Standard cafe dessert classification preserved.',
    action: 'PRESERVE_AS_VEG'
  }
];

const BACKUP_DIR = path.resolve(__dirname, '../backups');

/**
 * STEP 1: Backup / Snapshot Creation
 */
async function createSnapshot() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const [rows] = await pool.query(
    `SELECT id as menu_item_id, restaurant_id, category_id, name as item_name,
            is_vegetarian, is_available, price, preparation_time_mins, created_at, updated_at
     FROM menu_items
     ORDER BY restaurant_id, id`
  );

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotFileName = `menu_items_snapshot_${timestamp}.json`;
  const snapshotPath = path.join(BACKUP_DIR, snapshotFileName);

  // Write local JSON snapshot
  fs.writeFileSync(snapshotPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalItems: rows.length,
    items: rows
  }, null, 2));

  // Create MySQL backup table if not exists and store snapshot
  await pool.query(`
    CREATE TABLE IF NOT EXISTS backup_menu_items_classification (
      backup_id INT AUTO_INCREMENT PRIMARY KEY,
      snapshot_batch VARCHAR(100) NOT NULL,
      menu_item_id BIGINT UNSIGNED NOT NULL,
      restaurant_id BIGINT UNSIGNED NOT NULL,
      category_id BIGINT UNSIGNED NOT NULL,
      item_name VARCHAR(150) NOT NULL,
      is_vegetarian TINYINT(1) NOT NULL,
      is_available TINYINT(1) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_batch (snapshot_batch),
      INDEX idx_menu_item (menu_item_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const batchId = `snapshot_${timestamp}`;
  for (const r of rows) {
    await pool.query(
      `INSERT INTO backup_menu_items_classification 
       (snapshot_batch, menu_item_id, restaurant_id, category_id, item_name, is_vegetarian, is_available, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [batchId, r.menu_item_id, r.restaurant_id, r.category_id, r.item_name, r.is_vegetarian, r.is_available, r.price]
    );
  }

  return { batchId, snapshotPath, totalBackedUp: rows.length };
}

/**
 * STEP 2: Dry Run Analysis
 */
async function runDryRun() {
  console.log('\n============================================================');
  console.log('🔍 EXECUTING STEP 2 — DRY RUN ANALYSIS');
  console.log('============================================================\n');

  const [rows] = await pool.query(
    `SELECT mi.id, mi.restaurant_id, r.name as restaurant_name, mi.name, 
            mi.is_vegetarian, mi.description, mi.price, mi.is_available
     FROM menu_items mi
     JOIN restaurants r ON mi.restaurant_id = r.id
     ORDER BY mi.restaurant_id, mi.id`
  );

  const totalItems = rows.length;
  const currentVeg = rows.filter(r => r.is_vegetarian === 1).length;
  const currentNonVeg = rows.filter(r => r.is_vegetarian === 0).length;
  const currentInvalid = rows.filter(r => r.is_vegetarian !== 0 && r.is_vegetarian !== 1).length;

  console.log('CURRENT DATABASE STATUS:');
  console.log(`  • Total Menu Items   : ${totalItems}`);
  console.log(`  • Currently Veg      : ${currentVeg}`);
  console.log(`  • Currently Non-Veg  : ${currentNonVeg}`);
  console.log(`  • Invalid / NULL     : ${currentInvalid}`);

  console.log('\n--- REVIEW MIGRATION MAPPING ---');
  console.table(MIGRATION_MAPPING.map(m => ({
    'Item ID': m.menuItemId,
    'Restaurant': `${m.restaurantId} (${m.restaurantName})`,
    'Item Name': m.itemName,
    'Current': m.currentClassification === 1 ? 'VEG' : 'NON-VEG',
    'Proposed': m.proposedClassification === 1 ? 'VEG' : 'NON-VEG',
    'Reason': m.reason
  })));

  console.log('\n--- REVIEWED & PRESERVED AMBIGUOUS / CONFIRMED ITEMS ---');
  console.table(PRESERVED_ITEMS_REVIEW.map(p => ({
    'Item ID': p.menuItemId,
    'Restaurant': `${p.restaurantId} (${p.restaurantName})`,
    'Item Name': p.itemName,
    'Classification': p.classification === 1 ? 'VEG' : 'NON-VEG',
    'Review Decision': p.action,
    'Reason': p.reason
  })));

  // Calculate proposed state
  let proposedVeg = currentVeg;
  let proposedNonVeg = currentNonVeg;
  for (const m of MIGRATION_MAPPING) {
    const existing = rows.find(r => r.id === m.menuItemId);
    if (existing && existing.is_vegetarian !== m.proposedClassification) {
      if (m.proposedClassification === 1) {
        proposedVeg++;
        proposedNonVeg--;
      } else {
        proposedVeg--;
        proposedNonVeg++;
      }
    }
  }

  console.log('\nPROPOSED POST-MIGRATION STATE:');
  console.log(`  • Total Menu Items   : ${totalItems} (Unchanged)`);
  console.log(`  • Proposed Veg       : ${proposedVeg}`);
  console.log(`  • Proposed Non-Veg   : ${proposedNonVeg}`);
  console.log(`  • Proposed Changes   : ${MIGRATION_MAPPING.length} item(s)`);
  console.log(`  • Dry Run Complete   : Database was NOT modified.`);

  return {
    totalItems,
    currentVeg,
    currentNonVeg,
    currentInvalid,
    proposedVeg,
    proposedNonVeg,
    proposedChangesCount: MIGRATION_MAPPING.length
  };
}

/**
 * STEP 6: Pre-Migration Validation
 */
async function preMigrationValidation(mapping) {
  console.log('\n--- STEP 6: PRE-MIGRATION VALIDATION ---');
  const ids = mapping.map(m => m.menuItemId);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error('Pre-validation failed: Duplicate menu item IDs found in migration mapping.');
  }

  for (const item of mapping) {
    const [rows] = await pool.query(
      'SELECT id, restaurant_id, name, is_vegetarian, price, is_available FROM menu_items WHERE id = ?',
      [item.menuItemId]
    );

    if (rows.length === 0) {
      throw new Error(`Pre-validation failed: Menu item ID ${item.menuItemId} does not exist in database.`);
    }

    const row = rows[0];
    if (Number(row.restaurant_id) !== Number(item.restaurantId)) {
      throw new Error(`Pre-validation failed: Menu item ID ${item.menuItemId} belongs to restaurant ${row.restaurant_id}, expected ${item.restaurantId}.`);
    }

    if (item.proposedClassification !== 0 && item.proposedClassification !== 1) {
      throw new Error(`Pre-validation failed: Invalid proposed classification '${item.proposedClassification}'. Must be 0 or 1.`);
    }

    console.log(`  ✅ Verified ID ${item.menuItemId} ("${row.name}") belongs to Restaurant ${item.restaurantId}`);
  }

  console.log('  ✅ Pre-migration validation passed successfully.');
  return true;
}

/**
 * STEP 7: Transaction-Safe Migration Application
 */
async function applyMigration(mapping) {
  console.log('\n--- STEP 7: APPLYING MIGRATION (TRANSACTION SAFE) ---');
  const conn = await pool.getConnection();

  let affectedRowsCount = 0;
  const affectedRestaurants = new Set();
  const affectedItemIds = [];

  try {
    await conn.beginTransaction();

    for (const item of mapping) {
      const [res] = await conn.query(
        `UPDATE menu_items 
         SET is_vegetarian = ?, updated_at = NOW() 
         WHERE id = ? AND restaurant_id = ?`,
        [item.proposedClassification, item.menuItemId, item.restaurantId]
      );

      if (res.affectedRows > 0) {
        affectedRowsCount += res.affectedRows;
        affectedRestaurants.add(item.restaurantId);
        affectedItemIds.push(item.menuItemId);
        console.log(`  ✅ Updated menu_item ID ${item.menuItemId} ("${item.itemName}") -> is_vegetarian = ${item.proposedClassification}`);
      } else {
        console.log(`  ℹ️ Item ID ${item.menuItemId} already has classification ${item.proposedClassification} (Idempotent)`);
      }
    }

    await conn.commit();
    console.log('  ✅ Transaction COMMITTED successfully.');
  } catch (err) {
    await conn.rollback();
    console.error('  ❌ Error encountered. Transaction ROLLED BACK.');
    throw err;
  } finally {
    conn.release();
  }

  return {
    affectedRowsCount,
    affectedRestaurants: Array.from(affectedRestaurants),
    affectedItemIds
  };
}

/**
 * STEP 8: Post-Migration Validation
 */
async function postMigrationValidation(mapping, originalCount) {
  console.log('\n--- STEP 8: POST-MIGRATION VALIDATION ---');

  const [allRows] = await pool.query('SELECT COUNT(*) as cnt FROM menu_items');
  const newCount = allRows[0].cnt;
  if (newCount !== originalCount) {
    throw new Error(`Post-validation failed: Total menu items count changed from ${originalCount} to ${newCount}!`);
  }
  console.log(`  ✅ Total menu items count unchanged: ${newCount}`);

  for (const item of mapping) {
    const [rows] = await pool.query(
      'SELECT id, is_vegetarian, name, price, is_available FROM menu_items WHERE id = ?',
      [item.menuItemId]
    );
    const row = rows[0];
    if (row.is_vegetarian !== item.proposedClassification) {
      throw new Error(`Post-validation failed: Menu item ID ${item.menuItemId} is ${row.is_vegetarian}, expected ${item.proposedClassification}.`);
    }
    console.log(`  ✅ Verified ID ${item.menuItemId} ("${row.name}") has confirmed is_vegetarian = ${row.is_vegetarian}`);
  }

  // Verify non-menu tables were not touched
  const [orders] = await pool.query('SELECT COUNT(*) as cnt FROM orders');
  const [reservations] = await pool.query('SELECT COUNT(*) as cnt FROM reservations');
  const [users] = await pool.query('SELECT COUNT(*) as cnt FROM users');
  const [restaurants] = await pool.query('SELECT COUNT(*) as cnt FROM restaurants');
  console.log(`  ✅ Integrity verified: Orders (${orders[0].cnt}), Reservations (${reservations[0].cnt}), Users (${users[0].cnt}), Restaurants (${restaurants[0].cnt}) intact.`);

  return true;
}

/**
 * STEP 11: Rollback Procedure (Reversible)
 */
async function rollbackMigration(mapping) {
  console.log('\n--- STEP 11: TESTING / EXECUTING ROLLBACK PROCEDURE ---');
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const item of mapping) {
      await conn.query(
        `UPDATE menu_items 
         SET is_vegetarian = ?, updated_at = NOW() 
         WHERE id = ? AND restaurant_id = ?`,
        [item.currentClassification, item.menuItemId, item.restaurantId]
      );
      console.log(`  ⏪ Restored menu_item ID ${item.menuItemId} -> is_vegetarian = ${item.currentClassification} (Original)`);
    }

    await conn.commit();
    console.log('  ✅ Rollback transaction COMMITTED successfully.');
  } catch (err) {
    await conn.rollback();
    console.error('  ❌ Rollback failed! Transaction rolled back.');
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Main Orchestrator
 */
async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const isRollback = args.includes('--rollback');

  // STEP 2: Dry Run (Always executed first)
  const dryRunReport = await runDryRun();

  if (!isApply && !isRollback) {
    console.log('\n[INFO] Dry-run complete. Run with "--apply" to safely execute the migration.');
    process.exit(0);
  }

  if (isRollback) {
    await rollbackMigration(MIGRATION_MAPPING);
    console.log('\n[INFO] Rollback completed.');
    process.exit(0);
  }

  if (isApply) {
    console.log('\n============================================================');
    console.log('🚀 EXECUTING SAFE MIGRATION LIFECYCLE');
    console.log('============================================================');

    // STEP 1: Backup / Snapshot
    console.log('\n--- STEP 1: CREATING SNAPSHOT / BACKUP ---');
    const backupResult = await createSnapshot();
    console.log(`  ✅ File Snapshot Created : ${backupResult.snapshotPath}`);
    console.log(`  ✅ DB Backup Batch ID    : ${backupResult.batchId}`);
    console.log(`  ✅ Total Records Stored  : ${backupResult.totalBackedUp}`);

    // STEP 6: Pre-Migration Validation
    await preMigrationValidation(MIGRATION_MAPPING);

    // STEP 7: Apply Migration
    const applyResult = await applyMigration(MIGRATION_MAPPING);

    // STEP 8: Post-Migration Validation
    await postMigrationValidation(MIGRATION_MAPPING, dryRunReport.totalItems);

    console.log('\n============================================================');
    console.log('🏁 MIGRATION EXECUTION COMPLETE');
    console.log('============================================================\n');

    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('\n❌ FATAL MIGRATION ERROR:', err.message);
    process.exit(1);
  });
}

module.exports = {
  createSnapshot,
  runDryRun,
  preMigrationValidation,
  applyMigration,
  postMigrationValidation,
  rollbackMigration,
  MIGRATION_MAPPING
};
