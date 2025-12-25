-- Add CASCADE to files foreign key constraint
-- This ensures file records are automatically deleted when notes are deleted

-- Drop existing foreign key constraint
ALTER TABLE files
DROP CONSTRAINT IF EXISTS files_note_id_fkey;

-- Re-add with CASCADE
ALTER TABLE files
ADD CONSTRAINT files_note_id_fkey
FOREIGN KEY (note_id)
REFERENCES notes(id)
ON DELETE CASCADE;
