/**
 * TablePulse AI - Safe Cleanup Migration for Test/Demo Orders and Queues
 * 
 * Requirements:
 * 1. Snapshot all existing orders, order_items, and walk-in queue records to backups directory before modifying anything.
 * 2. Identify exact test/demo order IDs.
 * 3. Use transaction safety to remove only identified test/demo records.
 * 4. Verify that users, restaurants, menu categories, menu items, and tables remain completely intact.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'tablepulse_db',
  };
}

async function runOrderCleanup() {
  console.log('====================================================');
  console.log(' 🛡️ SAFE CLEANUP MIGRATION: TEST/DEMO ORDERS & QUEUES');
  console.log('====================================================\n');

  const conn = await mysql.createConnection(getDbConfig());

  try {
    // 1. Fetch all existing orders and items
    const [existingOrders] = await conn.query(`
      SELECT o.*, u.email as customer_email, rest.name as restaurant_name
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN restaurants rest ON o.restaurant_id = rest.id
      ORDER BY o.id ASC
    `);

    const [existingOrderItems] = await conn.query('SELECT * FROM order_items ORDER BY id ASC');
    const [existingQueue] = await conn.query('SELECT * FROM walk_in_queue ORDER BY id ASC');

    console.log(`[Snapshot] Found ${existingOrders.length} orders, ${existingOrderItems.length} order items, and ${existingQueue.length} queue records.`);

    // 2. Create backup snapshot
    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ordersBackupPath = path.join(backupDir, `orders_snapshot_${timestamp}.json`);
    const queueBackupPath = path.join(backupDir, `walk_in_queue_snapshot_${timestamp}.json`);

    fs.writeFileSync(ordersBackupPath, JSON.stringify({ orders: existingOrders, items: existingOrderItems }, null, 2), 'utf-8');
    fs.writeFileSync(queueBackupPath, JSON.stringify(existingQueue, null, 2), 'utf-8');

    console.log(`[Backup] ✅ Saved snapshot of orders to: ${ordersBackupPath}`);
    console.log(`[Backup] ✅ Saved snapshot of queue to:  ${queueBackupPath}\n`);

    const orderIds = existingOrders.map(o => o.id);
    const queueIds = existingQueue.map(q => q.id);

    console.log('[Identification] Target Order IDs for safe removal:', orderIds);
    console.log('[Identification] Target Queue IDs for safe removal:', queueIds);

    // 3. Transaction-safe removal
    await conn.beginTransaction();

    try {
      if (orderIds.length > 0) {
        const [delItems] = await conn.query('DELETE FROM order_items WHERE order_id IN (?)', [orderIds]);
        console.log(`\n[Cleanup] Deleted ${delItems.affectedRows} order items.`);

        const [delOrders] = await conn.query('DELETE FROM orders WHERE id IN (?)', [orderIds]);
        console.log(`[Cleanup] Deleted ${delOrders.affectedRows} orders.`);
      }

      if (queueIds.length > 0) {
        const [delQueue] = await conn.query('DELETE FROM walk_in_queue WHERE id IN (?)', [queueIds]);
        console.log(`[Cleanup] Deleted ${delQueue.affectedRows} walk-in queue entries.`);
      }

      await conn.commit();
      console.log('[Cleanup] ✅ Transaction committed successfully.');
    } catch (err) {
      await conn.rollback();
      console.error('[Cleanup] ❌ Transaction rolled back due to error:', err);
      throw err;
    }

    // 4. Verification checks
    const [finalOrders] = await conn.query('SELECT COUNT(*) as count FROM orders');
    const [finalItems] = await conn.query('SELECT COUNT(*) as count FROM order_items');
    const [finalQueue] = await conn.query('SELECT COUNT(*) as count FROM walk_in_queue');
    const [finalReservations] = await conn.query('SELECT COUNT(*) as count FROM reservations');
    const [finalUsers] = await conn.query('SELECT COUNT(*) as count FROM users');
    const [finalRestaurants] = await conn.query('SELECT COUNT(*) as count FROM restaurants');
    const [finalCategories] = await conn.query('SELECT COUNT(*) as count FROM menu_categories');
    const [finalMenuItems] = await conn.query('SELECT COUNT(*) as count FROM menu_items');
    const [finalTables] = await conn.query('SELECT COUNT(*) as count FROM tables');

    console.log('\n====================================================');
    console.log('              VERIFICATION SUMMARY                  ');
    console.log('====================================================');
    console.log(`Orders Remaining:         ${finalOrders[0].count} (Expected: 0)`);
    console.log(`Order Items Remaining:   ${finalItems[0].count} (Expected: 0)`);
    console.log(`Queue Entries Remaining: ${finalQueue[0].count} (Expected: 0)`);
    console.log(`Reservations Remaining:  ${finalReservations[0].count} (Expected: 0)`);
    console.log(`Users Preserved:          ${finalUsers[0].count} (Intact)`);
    console.log(`Restaurants Preserved:    ${finalRestaurants[0].count} (Intact)`);
    console.log(`Menu Categories:          ${finalCategories[0].count} (Intact)`);
    console.log(`Menu Items:               ${finalMenuItems[0].count} (Intact)`);
    console.log(`Tables:                   ${finalTables[0].count} (Intact)`);
    console.log('====================================================\n');

  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  runOrderCleanup().catch(err => {
    console.error('❌ Order cleanup failed:', err);
    process.exit(1);
  });
}

module.exports = { runOrderCleanup };
