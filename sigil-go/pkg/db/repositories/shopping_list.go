package repositories

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"tofoss/sigil-go/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ShoppingListRepository struct {
	pool *pgxpool.Pool
}

func NewShoppingListRepository(pool *pgxpool.Pool) *ShoppingListRepository {
	return &ShoppingListRepository{pool: pool}
}

// HashContent generates a SHA-256 hash of the content for cache invalidation
func (r *ShoppingListRepository) HashContent(content string) string {
	hash := sha256.Sum256([]byte(content))
	return hex.EncodeToString(hash[:])
}

// GetByUserID retrieves all shopping lists for a user, ordered by created_at DESC
func (r *ShoppingListRepository) GetByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]models.ShoppingList, error) {
	query := `
		SELECT id, user_id, title, content, content_hash, created_at, updated_at
		FROM shopping_lists
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2`

	rows, err := r.pool.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lists []models.ShoppingList
	for rows.Next() {
		var list models.ShoppingList
		err := rows.Scan(
			&list.ID,
			&list.UserID,
			&list.Title,
			&list.Content,
			&list.ContentHash,
			&list.CreatedAt,
			&list.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Get items for this list
		items, err := r.getItemsByListID(ctx, list.ID)
		if err != nil {
			return nil, err
		}
		list.Items = items

		lists = append(lists, list)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return lists, nil
}

// GetLastCreatedByUser retrieves the most recently created shopping list for a user
func (r *ShoppingListRepository) GetLastCreatedByUser(ctx context.Context, userID uuid.UUID) (*models.ShoppingList, error) {
	var list models.ShoppingList
	query := `
		SELECT id, user_id, title, content, content_hash, created_at, updated_at
		FROM shopping_lists
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1`

	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&list.ID,
		&list.UserID,
		&list.Title,
		&list.Content,
		&list.ContentHash,
		&list.CreatedAt,
		&list.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // No shopping lists exist for this user
		}
		return nil, err
	}

	// Get the items
	items, err := r.getItemsByListID(ctx, list.ID)
	if err != nil {
		return nil, err
	}

	list.Items = items
	return &list, nil
}

// GetByID retrieves a shopping list by its ID
func (r *ShoppingListRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ShoppingList, error) {
	var list models.ShoppingList
	query := `
		SELECT id, user_id, title, content, content_hash, created_at, updated_at
		FROM shopping_lists
		WHERE id = $1`

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&list.ID,
		&list.UserID,
		&list.Title,
		&list.Content,
		&list.ContentHash,
		&list.CreatedAt,
		&list.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("shopping list not found: %s", id)
		}
		return nil, err
	}

	// Get the items
	items, err := r.getItemsByListID(ctx, list.ID)
	if err != nil {
		return nil, err
	}

	list.Items = items
	return &list, nil
}

// getItemsByListID retrieves all items for a shopping list, ordered by position
func (r *ShoppingListRepository) getItemsByListID(ctx context.Context, listID uuid.UUID) ([]models.ShoppingListEntry, error) {
	query := `
		SELECT id, shopping_list_id, item_name, display_name,
		       quantity_min, quantity_max, quantity_unit,
		       notes, checked, position, section_header, created_at
		FROM shopping_list_items
		WHERE shopping_list_id = $1
		ORDER BY position ASC`

	rows, err := r.pool.Query(ctx, query, listID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.ShoppingListEntry
	for rows.Next() {
		var item models.ShoppingListEntry
		var quantityMin, quantityMax *float64
		var quantityUnit *string

		err := rows.Scan(
			&item.ID,
			&item.ShoppingListID,
			&item.ItemName,
			&item.DisplayName,
			&quantityMin,
			&quantityMax,
			&quantityUnit,
			&item.Notes,
			&item.Checked,
			&item.Position,
			&item.SectionHeader,
			&item.CreatedAt,
		)

		if err != nil {
			return nil, err
		}

		// Construct Quantity if any quantity fields are set
		if quantityMin != nil || quantityMax != nil || quantityUnit != nil {
			item.Quantity = &models.Quantity{
				Min:  quantityMin,
				Max:  quantityMax,
				Unit: "",
			}
			if quantityUnit != nil {
				item.Quantity.Unit = *quantityUnit
			}
		}

		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

// Create creates a new shopping list
func (r *ShoppingListRepository) Create(ctx context.Context, list models.ShoppingList) (*models.ShoppingList, error) {
	query := `
		INSERT INTO shopping_lists (id, user_id, title, content, content_hash, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, user_id, title, content, content_hash, created_at, updated_at`

	err := r.pool.QueryRow(ctx, query,
		list.ID,
		list.UserID,
		list.Title,
		list.Content,
		list.ContentHash,
		list.CreatedAt,
		list.UpdatedAt,
	).Scan(
		&list.ID,
		&list.UserID,
		&list.Title,
		&list.Content,
		&list.ContentHash,
		&list.CreatedAt,
		&list.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Insert items
	if len(list.Items) > 0 {
		err = r.replaceItems(ctx, list.ID, list.Items)
		if err != nil {
			return nil, err
		}
	}

	return &list, nil
}

// Update updates an existing shopping list
func (r *ShoppingListRepository) Update(ctx context.Context, list models.ShoppingList) (*models.ShoppingList, error) {
	query := `
		UPDATE shopping_lists
		SET title = $2, content = $3, content_hash = $4, updated_at = $5
		WHERE id = $1
		RETURNING id, user_id, title, content, content_hash, created_at, updated_at`

	err := r.pool.QueryRow(ctx, query,
		list.ID,
		list.Title,
		list.Content,
		list.ContentHash,
		list.UpdatedAt,
	).Scan(
		&list.ID,
		&list.UserID,
		&list.Title,
		&list.Content,
		&list.ContentHash,
		&list.CreatedAt,
		&list.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Replace items
	err = r.replaceItems(ctx, list.ID, list.Items)
	if err != nil {
		return nil, err
	}

	return &list, nil
}

// replaceItems deletes all existing items and inserts new ones
func (r *ShoppingListRepository) replaceItems(ctx context.Context, listID uuid.UUID, items []models.ShoppingListEntry) error {
	// Delete existing items
	_, err := r.pool.Exec(ctx, `DELETE FROM shopping_list_items WHERE shopping_list_id = $1`, listID)
	if err != nil {
		return err
	}

	// Insert new items
	if len(items) == 0 {
		return nil
	}

	query := `
		INSERT INTO shopping_list_items
		(id, shopping_list_id, item_name, display_name, quantity_min, quantity_max, quantity_unit, notes, checked, position, section_header, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	batch := &pgx.Batch{}
	for _, item := range items {
		var quantityMin, quantityMax *float64
		var quantityUnit *string

		if item.Quantity != nil {
			quantityMin = item.Quantity.Min
			quantityMax = item.Quantity.Max
			if item.Quantity.Unit != "" {
				quantityUnit = &item.Quantity.Unit
			}
		}

		batch.Queue(query,
			item.ID,
			listID,
			item.ItemName,
			item.DisplayName,
			quantityMin,
			quantityMax,
			quantityUnit,
			item.Notes,
			item.Checked,
			item.Position,
			item.SectionHeader,
			item.CreatedAt,
		)
	}

	br := r.pool.SendBatch(ctx, batch)
	defer br.Close()

	for range items {
		_, err := br.Exec()
		if err != nil {
			return err
		}
	}

	return nil
}

// Delete deletes a shopping list by its ID (cascade deletes items via foreign key)
func (r *ShoppingListRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM shopping_lists WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

// UpdateItemCheckStatus updates the checked status of a single item
func (r *ShoppingListRepository) UpdateItemCheckStatus(ctx context.Context, itemID uuid.UUID, checked bool) error {
	query := `UPDATE shopping_list_items SET checked = $2 WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, itemID, checked)
	return err
}

// GetUserVocabulary retrieves autocomplete suggestions for a user
func (r *ShoppingListRepository) GetUserVocabulary(ctx context.Context, userID uuid.UUID, prefix string, limit int) ([]models.VocabularyItem, error) {
	query := `
		SELECT id, user_id, item_name, frequency, last_used, created_at
		FROM shopping_item_vocabulary
		WHERE (user_id = $1 OR user_id IS NULL)
		  AND item_name LIKE $2 || '%'
		ORDER BY frequency DESC, item_name ASC
		LIMIT $3`

	rows, err := r.pool.Query(ctx, query, userID, prefix, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.VocabularyItem
	for rows.Next() {
		var item models.VocabularyItem
		err := rows.Scan(
			&item.ID,
			&item.UserID,
			&item.ItemName,
			&item.Frequency,
			&item.LastUsed,
			&item.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

// AddToVocabulary adds or updates an item in the user's vocabulary
func (r *ShoppingListRepository) AddToVocabulary(ctx context.Context, userID uuid.UUID, itemName string) error {
	query := `
		INSERT INTO shopping_item_vocabulary (id, user_id, item_name, frequency, last_used, created_at)
		VALUES ($1, $2, $3, 1, NOW(), NOW())
		ON CONFLICT (user_id, item_name)
		DO UPDATE SET frequency = shopping_item_vocabulary.frequency + 1, last_used = NOW()`

	_, err := r.pool.Exec(ctx, query, uuid.New(), userID, itemName)
	return err
}

// GetAllVocabulary retrieves all vocabulary items (for testing/admin)
func (r *ShoppingListRepository) GetAllVocabulary(ctx context.Context, limit int) ([]models.VocabularyItem, error) {
	query := `
		SELECT id, user_id, item_name, frequency, last_used, created_at
		FROM shopping_item_vocabulary
		ORDER BY frequency DESC, item_name ASC
		LIMIT $1`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.VocabularyItem
	for rows.Next() {
		var item models.VocabularyItem
		err := rows.Scan(
			&item.ID,
			&item.UserID,
			&item.ItemName,
			&item.Frequency,
			&item.LastUsed,
			&item.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}
