package responses

import "tofoss/sigil-go/pkg/models"

type FetchNoteResponse struct {
	models.Note
	IsEditable bool `json:"isEditable"`
}
