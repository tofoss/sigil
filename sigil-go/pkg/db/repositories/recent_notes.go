package repositories

import (
	"context"
	"time"

	"tofoss/sigil-go/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecentNoteRepository struct {
	pool *pgxpool.Pool
}

func NewRecentNoteRepository(pool *pgxpool.Pool) *RecentNoteRepository {
	return &RecentNoteRepository{pool: pool}
}

func (r *RecentNoteRepository) UpsertView(
	ctx context.Context,
	userID uuid.UUID,
	noteID uuid.UUID,
	viewedAt time.Time,
) error {
	query := `
        INSERT INTO recent_notes (user_id, note_id, last_viewed_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, note_id)
        DO UPDATE SET last_viewed_at = EXCLUDED.last_viewed_at
    `

	_, err := r.pool.Exec(ctx, query, userID, noteID, viewedAt)
	return err
}

func (r *RecentNoteRepository) UpsertEdit(
	ctx context.Context,
	userID uuid.UUID,
	noteID uuid.UUID,
	editedAt time.Time,
) error {
	query := `
        INSERT INTO recent_notes (user_id, note_id, last_edited_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, note_id)
        DO UPDATE SET last_edited_at = EXCLUDED.last_edited_at
    `

	_, err := r.pool.Exec(ctx, query, userID, noteID, editedAt)
	return err
}

func (r *RecentNoteRepository) ListRecent(
	ctx context.Context,
	userID uuid.UUID,
	limit int,
) ([]models.Note, error) {
	if limit <= 0 || limit > 50 {
		limit = 10
	}

	query := `
        SELECT n.id, n.user_id, n.title, n.content, n.created_at, n.updated_at,
               n.published_at, n.published
        FROM recent_notes rn
        JOIN notes n ON n.id = rn.note_id
        WHERE rn.user_id = $1 AND n.user_id = $1
        ORDER BY GREATEST(
            COALESCE(rn.last_viewed_at, 'epoch'::timestamptz),
            COALESCE(rn.last_edited_at, 'epoch'::timestamptz)
        ) DESC
        LIMIT $2
    `

	rows, err := r.pool.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notes, err := pgx.CollectRows(rows, pgx.RowToStructByName[models.Note])
	if err != nil {
		return nil, err
	}

	return notes, nil
}
