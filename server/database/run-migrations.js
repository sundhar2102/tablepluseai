/**
 * TablePulse AI - Database Migration and Seeding Runner
 * Robust, cross-platform runner for CI and local development.
 * Waits for MySQL connection readiness, applies schema.sql and seeds.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    multipleStatements: true
  };
}

async function waitForDatabase(maxAttempts = 15, delayMs = 2000) {
  const config = getDbConfig();
  console.log(`[DB] Target Host: ${config.host}:${config.port}, User: ${config.user}`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const conn = await mysql.createConnection(config);
      await conn.ping();
      await conn.end();
      console.log(`[DB] MySQL is ready on ${config.host}:${config.port}`);
      return true;
    } catch (err) {
      console.log(`[DB] Waiting for MySQL... (Attempt ${attempt}/${maxAttempts}: ${err.message})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('[DB] Could not connect to MySQL within timeout.');
}

async function runMigrations() {
  console.log('====================================================');
  console.log('       TABLEPULSE AI — DATABASE MIGRATIONS          ');
  console.log('====================================================\n');

  await waitForDatabase();

  const conn = await mysql.createConnection(getDbConfig());

  try {
    const dbName = process.env.DB_NAME || 'tablepulse_db';
    console.log(`[DB] Ensuring database '${dbName}' exists...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await conn.changeUser({ database: dbName });
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 1. Schema
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('[DB] Executing schema.sql...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await conn.query(schemaSql);
      console.log('[DB] schema.sql executed successfully.');
    }

    // 2. Seeds: seed_admin.sql
    const seedAdminPath = path.resolve(__dirname, 'seeds/seed_admin.sql');
    if (fs.existsSync(seedAdminPath)) {
      console.log('[DB] Executing seeds/seed_admin.sql...');
      const adminSql = fs.readFileSync(seedAdminPath, 'utf-8');
      await conn.query(adminSql);
      console.log('[DB] seeds/seed_admin.sql executed successfully.');
    }

    // 3. Seeds: seed_restaurants.sql
    const seedRestPath = path.resolve(__dirname, 'seeds/seed_restaurants.sql');
    if (fs.existsSync(seedRestPath)) {
      console.log('[DB] Executing seeds/seed_restaurants.sql...');
      const restSql = fs.readFileSync(seedRestPath, 'utf-8');
      await conn.query(restSql);
      console.log('[DB] seeds/seed_restaurants.sql executed successfully.');
    }

    // 4. Seeds: seed_menus.sql
    const seedMenuPath = path.resolve(__dirname, 'seeds/seed_menus.sql');
    if (fs.existsSync(seedMenuPath)) {
      console.log('[DB] Executing seeds/seed_menus.sql...');
      const menuSql = fs.readFileSync(seedMenuPath, 'utf-8');
      await conn.query(menuSql);
      console.log('[DB] seeds/seed_menus.sql executed successfully.');
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('\n[DB] All database migrations and seeds applied successfully! ✅\n');
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  runMigrations().catch(err => {
    console.error('[DB] Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { runMigrations };
