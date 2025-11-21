CREATE TABLE invite_codes (
    code UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp + INTERVAL '7 days'
);

CREATE INDEX idx_invite_codes_user_id ON invite_codes(user_id);
