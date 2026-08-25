-- Mambruk SQLite schema for Cloudflare D1

-- Links (short URLs) Table
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0,
  UNIQUE(handle, code)
);
CREATE INDEX IF NOT EXISTS idx_links_code ON links(handle, code);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Bio pages Table
CREATE TABLE IF NOT EXISTS pages (
  handle TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tagline TEXT,
  avatar_url TEXT,
  theme TEXT NOT NULL DEFAULT 'noir',
  colors TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS page_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL REFERENCES pages(handle) ON DELETE CASCADE,
  section TEXT,
  label TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_page_links_handle ON page_links(handle, position);

-- Seed: Papua Open Source
INSERT OR REPLACE INTO pages (handle, title, tagline, avatar_url, theme)
VALUES (
  'papuaopensource',
  'Papua Open Source',
  'Kontribusi Berbasis Open Source untuk Tanah Papua',
  '/assets/pos-logo.png',
  'noir'
);

DELETE FROM page_links WHERE handle = 'papuaopensource';
INSERT INTO page_links (handle, section, label, description, url, icon, position) VALUES
  ('papuaopensource', 'Situs Web', 'Kunjungi Situs Utama Kami', NULL, 'https://papuaopensource.github.io/', 'globe', 1),
  ('papuaopensource', 'Proyek', 'Kastau Muzik', 'Arsip terbuka musik rakyat Papua, dikurasi dari YouTube', 'https://kastaumuzik.com', 'music', 2),
  ('papuaopensource', 'Proyek', 'Papuan Thought', 'Wadah terbuka untuk esai, refleksi, dan tulisan komunitas dari Papua', 'https://papuanthought.com', 'book', 3),
  ('papuaopensource', 'Media Sosial', 'Ikuti Kami di Instagram', NULL, 'https://instagram.com/papuaopensource', 'instagram', 4),
  ('papuaopensource', 'Media Sosial', 'Ikuti Kami di X (Twitter)', NULL, 'https://x.com/papuaopensource', 'x', 5),
  ('papuaopensource', 'Media Sosial', 'Baca Tulisan Kami di Dev To', NULL, 'https://dev.to/papuaopensource', 'article', 6),
  ('papuaopensource', 'Open Source', 'Jelajahi GitHub Kami', NULL, 'https://github.com/papuaopensource', 'github', 7);

-- Seed: @papuaopensource alias
DELETE FROM links WHERE handle = 'papuaopensource';
INSERT INTO links (handle, code, url) VALUES
  ('papuaopensource', 'ig', 'https://instagram.com/papuaopensource'),
  ('papuaopensource', 'x', 'https://x.com/papuaopensource'),
  ('papuaopensource', 'gh', 'https://github.com/papuaopensource'),
  ('papuaopensource', 'dev', 'https://dev.to/papuaopensource'),
  ('papuaopensource', 'muzik', 'https://kastaumuzik.com'),
  ('papuaopensource', 'thought', 'https://papuanthought.com');
