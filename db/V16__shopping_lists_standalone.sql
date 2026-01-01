-- Transform shopping lists from note-dependent to standalone entities
-- This migration enables shopping lists to exist independently with their own content

-- Add new columns for standalone functionality
ALTER TABLE shopping_lists
    ADD COLUMN title VARCHAR(255),
    ADD COLUMN content TEXT;

-- Migrate existing shopping lists by copying data from associated notes
UPDATE shopping_lists sl
SET
    title = n.title,
    content = n.content
FROM notes n
WHERE sl.note_id = n.id;

-- Set default values for any rows that couldn't be migrated (defensive coding)
UPDATE shopping_lists
SET
    title = 'Untitled Shopping List',
    content = ''
WHERE title IS NULL OR content IS NULL;

-- Make new columns NOT NULL now that data is migrated
ALTER TABLE shopping_lists
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN content SET NOT NULL;

-- Drop the note_id foreign key and column (shopping lists are now independent)
ALTER TABLE shopping_lists
    DROP CONSTRAINT IF EXISTS shopping_lists_note_id_fkey,
    DROP COLUMN note_id;

-- Drop the old index on note_id (no longer needed)
DROP INDEX IF EXISTS idx_shopping_lists_note_id;

-- Add index on title for searching and sorting
CREATE INDEX idx_shopping_lists_title ON shopping_lists(title);
