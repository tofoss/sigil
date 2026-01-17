package models

import (
	"time"

	"github.com/google/uuid"
)

type RecentNote struct {
	UserID       uuid.UUID  `json:"userId"       db:"user_id"`
	NoteID       uuid.UUID  `json:"noteId"       db:"note_id"`
	LastViewedAt *time.Time `json:"lastViewedAt" db:"last_viewed_at"`
	LastEditedAt *time.Time `json:"lastEditedAt" db:"last_edited_at"`
}
