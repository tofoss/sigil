-- Add position field to note_notebooks for ordering notes within sections
ALTER TABLE note_notebooks ADD COLUMN position INTEGER DEFAULT 0;

-- Initialize positions for existing notes
-- This groups notes by (notebook_id, section_id) and assigns sequential positions
WITH numbered_notes AS (
    SELECT
        note_id,
        notebook_id,
        ROW_NUMBER() OVER (
            PARTITION BY notebook_id, COALESCE(section_id::text, 'unsectioned')
            ORDER BY note_id
        ) - 1 AS new_position
    FROM note_notebooks
)
UPDATE note_notebooks nn
SET position = numbered_notes.new_position
FROM numbered_notes
WHERE nn.note_id = numbered_notes.note_id
  AND nn.notebook_id = numbered_notes.notebook_id;
