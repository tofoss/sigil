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
	return r.upsertAndTrim(ctx, userID, noteID, "last_viewed_at", viewedAt)
}

func (r *RecentNoteRepository) UpsertEdit(
	ctx context.Context,
	userID uuid.UUID,
	noteID uuid.UUID,
	editedAt time.Time,
) error {
	return r.upsertAndTrim(ctx, userID, noteID, "last_edited_at", editedAt)
}

func (r *RecentNoteRepository) upsertAndTrim(
	ctx context.Context,
	userID uuid.UUID,
	noteID uuid.UUID,
	column string,
	value time.Time,
) error {
	query := `
        WITH updated AS (
            INSERT INTO recent_notes (user_id, note_id, ` + column + `)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, note_id)
            DO UPDATE SET ` + column + ` = EXCLUDED.` + column + `
            RETURNING user_id
        )
        DELETE FROM recent_notes
        WHERE user_id = (SELECT user_id FROM updated)
          AND note_id IN (
            SELECT note_id
            FROM recent_notes
            WHERE user_id = $1
            ORDER BY GREATEST(
              COALESCE(last_viewed_at, 'epoch'::timestamptz),
              COALESCE(last_edited_at, 'epoch'::timestamptz)
            ) DESC
            OFFSET 5
          )
    `

	_, err := r.pool.Exec(ctx, query, userID, noteID, value)
	return err
}

func (r *RecentNoteRepository) ListRecent(
	ctx context.Context,
	userID uuid.UUID,
	limit int,
) ([]models.Note, error) {
	if limit <= 0 || limit > 50 {
		limit = 5
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

func (r *RecentNoteRepository) DeleteRecent(
	ctx context.Context,
	userID uuid.UUID,
	noteID uuid.UUID,
) error {
	query := `DELETE FROM recent_notes WHERE user_id = $1 AND note_id = $2`
	_, err := r.pool.Exec(ctx, query, userID, noteID)
	return err
}
