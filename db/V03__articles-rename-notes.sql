--ALTER TABLE articles RENAME TO notes;
--ALTER INDEX idx_articles_user_id RENAME TO idx_notes_user_id;
--ALTER INDEX idx_articles_tsv RENAME TO idx_notes_tsv;

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_tsv ON notes USING gin(tsv);
