-- Warna pilihan pemilik halaman, disimpan sebagai JSON berisi hanya token yang
-- berbeda dari presetnya. NULL berarti ikut preset sepenuhnya.
--
-- schema.sql memakai CREATE TABLE IF NOT EXISTS, jadi file itu TIDAK menambah
-- kolom ke tabel pages yang sudah terlanjur ada di produksi. Jalankan ini
-- sekali pada database yang sudah berjalan:
--   wrangler d1 execute mambruk-db --remote --file=./migrations/0002_pages_colors.sql

ALTER TABLE pages ADD COLUMN colors TEXT;
