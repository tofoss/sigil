-- V08: Add full-text search support
-- Backfill tsv (text search vector) field for all existing notes
-- The tsv field combines title (weight A), content (weight B), and tag names (weight A)

UPDATE notes
SET tsv = (
	setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
	setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
	setweight(to_tsvector('english', coalesce((
		SELECT string_agg(t.name, ' ')
		FROM tags t
		JOIN note_tags nt ON t.id = nt.tag_id
		WHERE nt.note_id = notes.id
	), '')), 'A')
);
