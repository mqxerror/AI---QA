/**
 * Database Initialization Script
 * Creates SQLite database and applies schema
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '../../../database/qa-tests.db');
const SCHEMA_PATH = path.join(__dirname, '../../../database/schema.sql');
const SEED_PATH = path.join(__dirname, '../../../database/seed.sql');

/**
 * Initialize database with schema
 */
function initializeDatabase() {
  console.log('Initializing database...');

  // Ensure database directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create or open database
  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  console.log('Applying schema...');

  // Read and execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  console.log('Schema applied successfully');

  // Optional: Apply seed data
  if (process.argv.includes('--seed')) {
    console.log('Applying seed data...');
    const seed = fs.readFileSync(SEED_PATH, 'utf8');
    db.exec(seed);
    console.log('Seed data applied');
  }

  db.close();
  console.log('Database initialized at:', DB_PATH);
}

// Run if called directly
if (require.main === module) {
  try {
    initializeDatabase();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

module.exports = { initializeDatabase };
