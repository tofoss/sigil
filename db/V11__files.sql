CREATE TABLE files (
    id          UUID        PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    filetype    TEXT        NOT NULL,
    filesize    INTEGER     NOT NULL,
    extension   TEXT        NOT NULL,
    note_id     UUID        REFERENCES notes(id)
);

CREATE INDEX idx_file_user_id ON files(user_id);
CREATE INDEX idx_file_note_id ON files(note_id);
