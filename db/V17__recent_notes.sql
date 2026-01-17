CREATE TABLE IF NOT EXISTS recent_notes (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    last_viewed_at timestamptz,
    last_edited_at timestamptz,
    PRIMARY KEY (user_id, note_id)
);

CREATE INDEX IF NOT EXISTS recent_notes_user_activity_idx
    ON recent_notes (
        user_id,
        GREATEST(
            COALESCE(last_viewed_at, 'epoch'::timestamptz),
            COALESCE(last_edited_at, 'epoch'::timestamptz)
        ) DESC
    );
