CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash is 64 hex characters
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    revoked_at TIMESTAMPTZ  -- NULL means active, non-NULL means revoked
);

-- Index for user lookup (to find all tokens for a user)
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Index for token hash lookup (for validation)
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Index for cleanup queries (to delete expired tokens)
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Composite index for finding active tokens (not revoked and not expired)
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens(user_id, revoked_at, expires_at);
