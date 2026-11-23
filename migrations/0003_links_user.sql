-- Add `user_id` to `links`, so a signed-in user owns the root links they make.
-- Anonymous links keep NULL. Deleting the user leaves their links unowned.

ALTER TABLE links ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_links_user ON links(user_id);
