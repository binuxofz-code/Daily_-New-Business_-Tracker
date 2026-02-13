
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tracker.db');
const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize Schema with all required fields matching Supabase
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'member', -- 'admin', 'head', 'zonal_manager', 'member', 'viewer_admin'
      zone TEXT,
      branch TEXT,
      managed_locations TEXT, -- JSON string for Zonal Managers
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      
      -- Plan Columns
      morning_plan TEXT, -- Legacy
      zone_plan REAL DEFAULT 0,
      branch_plan REAL DEFAULT 0,
      
      -- Achievement Columns
      actual_business REAL DEFAULT 0, -- Legacy/Total
      agent_achievement REAL DEFAULT 0,
      bdo_branch_performance REAL DEFAULT 0,
      total_business REAL DEFAULT 0,
      
      -- Location Metadata Snapshot
      zone TEXT,
      branch TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    
    -- Insert default admin if no users exist
    INSERT OR IGNORE INTO users (username, password, role) 
    VALUES ('admin', '$2a$10$X7V.mK1jZ1.w.1.1.1.1.1.1.1.1.1', 'admin'); 
    -- Note: Password needs to be hashed. For now, let's assume 'admin123' hashed or similar.
    -- Better to let user create account or handle via script.
  `);
} catch (err) {
  console.error('Schema initialization error:', err);
}

export default db;
