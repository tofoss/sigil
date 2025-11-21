-- Refactor recipes to be shared entities instead of tied to individual notes

-- Remove the note_id foreign key constraint and column
ALTER TABLE recipes DROP CONSTRAINT recipes_note_id_fkey;
ALTER TABLE recipes DROP COLUMN note_id;

-- Add source_url to track where recipe came from
ALTER TABLE recipes ADD COLUMN source_url TEXT;

-- Create junction table for many-to-many relationship between notes and recipes
CREATE TABLE note_recipes (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (note_id, recipe_id)
);

-- Create table for tracking recipe extraction jobs
CREATE TABLE recipe_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Create cache table for URL to recipe mapping
CREATE TABLE recipe_url_cache (
    url_hash VARCHAR(64) PRIMARY KEY,
    original_url TEXT NOT NULL,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW()
);

-- Create index for faster job queue processing
CREATE INDEX idx_recipe_jobs_status_created ON recipe_jobs(status, created_at);

-- Create index for URL cache lookups
CREATE INDEX idx_recipe_url_cache_created ON recipe_url_cache(created_at);