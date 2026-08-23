-- SQLite schema for Cloudflare D1
-- Idempotent: safe to re-apply to an existing mambruk-db.

-- Short links -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_links_code ON links(code);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);
