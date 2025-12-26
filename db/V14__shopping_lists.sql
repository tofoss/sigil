-- Shopping List Feature: Core tables for shopping list mode in notes

-- Main shopping list entity (1:1 with note)
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_hash VARCHAR(64) NOT NULL,  -- SHA-256 for cache invalidation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_note_id ON shopping_lists(note_id);
CREATE INDEX idx_shopping_lists_content_hash ON shopping_lists(content_hash);

-- Individual shopping list items (1:many with shopping_list)
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,           -- normalized: "carrots"
    display_name TEXT NOT NULL,        -- original: "Carrots (organic)"
    quantity_min DOUBLE PRECISION,
    quantity_max DOUBLE PRECISION,
    quantity_unit TEXT,
    notes TEXT,                        -- parenthetical notes, links
    checked BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL,         -- preserve markdown order
    section_header TEXT,               -- e.g., "Groceries"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_item_name ON shopping_list_items(item_name);
CREATE INDEX idx_shopping_list_items_position ON shopping_list_items(shopping_list_id, position);

-- Autocomplete vocabulary (user-specific + global)
CREATE TABLE shopping_item_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = global
    item_name TEXT NOT NULL,           -- normalized
    frequency INTEGER DEFAULT 1,       -- usage count for ranking
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vocabulary_user_item ON shopping_item_vocabulary(user_id, item_name);
CREATE INDEX idx_vocabulary_item_name ON shopping_item_vocabulary(item_name);
CREATE INDEX idx_vocabulary_frequency ON shopping_item_vocabulary(frequency DESC);
