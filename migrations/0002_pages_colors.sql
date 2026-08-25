-- Add new column `colors` to the `pages` table. Stores a JSON string of the
-- colour tokens that differ from the page's theme preset.

ALTER TABLE pages ADD COLUMN colors TEXT;
