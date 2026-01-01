package models

import (
	"time"

	"github.com/google/uuid"
)

// ShoppingList represents a standalone shopping list
type ShoppingList struct {
	ID          uuid.UUID           `json:"id" db:"id"`
	UserID      uuid.UUID           `json:"userId" db:"user_id"`
	Title       string              `json:"title" db:"title"`
	Content     string              `json:"content" db:"content"`
	ContentHash string              `json:"contentHash" db:"content_hash"`
	Items       []ShoppingListEntry `json:"items" db:"-"` // Not stored in shopping_lists table
	CreatedAt   time.Time           `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time           `json:"updatedAt" db:"updated_at"`
}

// ShoppingListEntry represents a single item in a shopping list
type ShoppingListEntry struct {
	ID             uuid.UUID `json:"id" db:"id"`
	ShoppingListID uuid.UUID `json:"shoppingListId" db:"shopping_list_id"`
	ItemName       string    `json:"itemName" db:"item_name"`         // Normalized: "carrots"
	DisplayName    string    `json:"displayName" db:"display_name"`   // Original: "Carrots (organic)"
	Quantity       *Quantity `json:"quantity" db:"-"`                 // Reuse from recipes
	Notes          string    `json:"notes" db:"notes"`                // Parenthetical notes, links
	Checked        bool      `json:"checked" db:"checked"`            // Checkbox state
	Position       int       `json:"position" db:"position"`          // Preserve markdown order
	SectionHeader  string    `json:"sectionHeader" db:"section_header"` // e.g., "Groceries"
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
}

// VocabularyItem represents an item in the autocomplete vocabulary
type VocabularyItem struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    *uuid.UUID `json:"userId" db:"user_id"` // NULL for global items
	ItemName  string     `json:"itemName" db:"item_name"`
	Frequency int        `json:"frequency" db:"frequency"`
	LastUsed  time.Time  `json:"lastUsed" db:"last_used"`
	CreatedAt time.Time  `json:"createdAt" db:"created_at"`
}
