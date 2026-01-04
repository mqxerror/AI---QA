/**
 * Database Connection Module
 * Provides SQLite database connection for the application
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../../database/qa-tests.db');

let db = null;

/**
 * Get database connection (singleton)
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL'); // Better concurrency
  }
  return db;
}

/**
 * Close database connection
 */
function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  getDb,
  closeDb
};
