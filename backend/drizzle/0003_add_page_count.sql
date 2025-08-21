-- Add pageCount column to files table
ALTER TABLE files ADD COLUMN page_count INTEGER;

-- Add index for efficient queries
CREATE INDEX files_page_count_idx ON files(page_count);
