-- Sekali jalan untuk database yang tabel links-nya sudah ada dari pemendek URL
-- lama. Database baru cukup pakai schema.sql.
--
-- SQLite tidak bisa mengubah constraint lewat ALTER TABLE, jadi tabelnya
-- dibangun ulang: UNIQUE(code) global menjadi UNIQUE(handle, code).

PRAGMA foreign_keys = OFF;

CREATE TABLE links_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0,
  UNIQUE(handle, code)
);

INSERT INTO links_new (id, handle, code, url, created_at, clicks)
  SELECT id, '', code, url, created_at, clicks FROM links;

DROP TABLE links;
ALTER TABLE links_new RENAME TO links;

CREATE INDEX IF NOT EXISTS idx_links_code ON links(handle, code);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);

PRAGMA foreign_keys = ON;
