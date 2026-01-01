package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"tofoss/sigil-go/pkg/db/repositories"
	"tofoss/sigil-go/pkg/handlers/errors"
	"tofoss/sigil-go/pkg/handlers/requests"
	"tofoss/sigil-go/pkg/handlers/responses"
	"tofoss/sigil-go/pkg/models"
	"tofoss/sigil-go/pkg/utils"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type FileServiceInterface interface {
	DeleteFilesForNote(ctx context.Context, noteID uuid.UUID) error
}

type NoteHandler struct {
	repo             repositories.NoteRepositoryInterface
	fileService      FileServiceInterface
	shoppingListRepo repositories.ShoppingListRepositoryInterface
}

func NewNoteHandler(
	repo repositories.NoteRepositoryInterface,
	fileService FileServiceInterface,
	shoppingListRepo repositories.ShoppingListRepositoryInterface,
) NoteHandler {
	return NoteHandler{
		repo:             repo,
		fileService:      fileService,
		shoppingListRepo: shoppingListRepo,
	}
}

func (h *NoteHandler) FetchNote(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to note, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	noteID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		log.Printf("unable to parse note id: %v", err)
		errors.BadRequest(w)
		return
	}

	// First, try to fetch as owner (prevents timing-based IDOR)
	note, err := h.repo.FetchUsersNoteWithTags(r.Context(), noteID, userID)
	if err == nil {
		// User owns this note
		response := responses.FetchNoteResponse{
			Note:       note,
			IsEditable: true,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
		return
	}

	// User doesn't own it - check if it's a published note
	note, err = h.repo.FetchNoteWithTags(r.Context(), noteID)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("note %s not found %v", noteID, err)
			errors.NotFound(w, "note not found")
			return
		}
		log.Printf("unable to fetch note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	// Return 404 for unpublished notes (same as not found to prevent info leak)
	if !note.Published {
		log.Printf(
			"%s does not have access to note %s which is not published",
			userID,
			noteID,
		)
		errors.NotFound(w, "note not found")
		return
	}

	response := responses.FetchNoteResponse{
		Note:       note,
		IsEditable: false,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (h *NoteHandler) FetchUsersNotes(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to fetch users notes: %v", err)
		errors.InternalServerError(w)
		return
	}

	notes, err := h.repo.FetchUsersNotes(r.Context(), userID)
	if err != nil {
		log.Printf("unable to fetch users notes: %v", err)
		errors.InternalServerError(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notes)
}

// SearchNotes searches notes using full-text search
func (h *NoteHandler) SearchNotes(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to search notes, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	// Get query parameters (empty query returns all notes)
	query := r.URL.Query().Get("q")

	// Parse pagination parameters with defaults
	limit := 50
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	notes, err := h.repo.SearchNotes(r.Context(), userID, query, limit, offset)
	if err != nil {
		log.Printf("unable to search notes: %v", err)
		errors.InternalServerError(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notes)
}

func (h *NoteHandler) PostNote(w http.ResponseWriter, r *http.Request) {
	var req requests.Note
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("could not decode request, %v", err)
		errors.BadRequest(w)
		return
	}

	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to fetch users notes: %v", err)
		errors.InternalServerError(w)
		return
	}

	var note *models.Note
	if req.ID == uuid.Nil {
		note, err = h.createNote(req, userID, r.Context())
	} else {
		note, err = h.updateNote(req, userID, r.Context())
	}

	if err != nil {
		log.Printf("could not upsert note: %v", err)
		errors.InternalServerError(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(note)
}

func (h *NoteHandler) createNote(
	req requests.Note,
	userID uuid.UUID,
	ctx context.Context,
) (*models.Note, error) {
	now := time.Now()
	var publishedAt *time.Time

	if req.Published {
		publishedAt = &now
	}

	// Generate title from content if not provided
	title := req.Title
	if title == "" {
		title = utils.GenerateTitleFromContent(req.Content)
	}

	note := models.Note{
		ID:          uuid.New(),
		UserID:      userID,
		Title:       title,
		Content:     req.Content,
		CreatedAt:   now,
		UpdatedAt:   now,
		PublishedAt: publishedAt,
		Published:   req.Published,
	}

	result, err := h.repo.Upsert(ctx, note)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (h *NoteHandler) updateNote(
	req requests.Note,
	userID uuid.UUID,
	ctx context.Context,
) (*models.Note, error) {
	original, err := h.repo.FetchUsersNote(ctx, req.ID, userID)
	if err != nil {
		return nil, fmt.Errorf("unable to upsert note, invalid credentials, %v", err)
	}

	now := time.Now()
	var publishedAt *time.Time

	if req.Published && original.Published {
		publishedAt = original.PublishedAt
	} else if req.Published {
		publishedAt = &now
	}

	// Generate title from content if not explicitly provided in request
	title := req.Title
	if title == "" {
		title = utils.GenerateTitleFromContent(req.Content)
	}

	update := original
	update.Title = title
	update.Content = req.Content
	update.UpdatedAt = now
	update.PublishedAt = publishedAt
	update.Published = req.Published

	result, err := h.repo.Upsert(ctx, update)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

// GetNoteTags retrieves all tags for a specific note
func (h *NoteHandler) GetNoteTags(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to get note tags, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	noteID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		log.Printf("unable to parse note id: %v", err)
		errors.BadRequest(w)
		return
	}

	// Verify user has access to this note
	note, err := h.repo.FetchUsersNote(r.Context(), noteID, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("note %s not found or user %s doesn't have access", noteID, userID)
			errors.NotFound(w, "note not found")
			return
		}
		log.Printf("unable to fetch note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	tags, err := h.repo.GetTagsForNote(r.Context(), note.ID)
	if err != nil {
		log.Printf("unable to fetch tags for note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tags)
}

// AssignNoteTags assigns tags to a note
func (h *NoteHandler) AssignNoteTags(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to assign note tags, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	noteID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		log.Printf("unable to parse note id: %v", err)
		errors.BadRequest(w)
		return
	}

	var req requests.AssignTags
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("could not decode assign tags request: %v", err)
		errors.BadRequest(w)
		return
	}

	// Verify user has access to this note
	_, err = h.repo.FetchUsersNote(r.Context(), noteID, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("note %s not found or user %s doesn't have access", noteID, userID)
			errors.NotFound(w, "note not found")
			return
		}
		log.Printf("unable to fetch note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	err = h.repo.AssignTagsToNote(r.Context(), noteID, req.TagIDs)
	if err != nil {
		log.Printf("unable to assign tags to note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	// Return the updated tags
	tags, err := h.repo.GetTagsForNote(r.Context(), noteID)
	if err != nil {
		log.Printf("unable to fetch updated tags for note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tags)
}

// RemoveNoteTag removes a specific tag from a note
func (h *NoteHandler) RemoveNoteTag(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to remove note tag, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	noteID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		log.Printf("unable to parse note id: %v", err)
		errors.BadRequest(w)
		return
	}

	tagID, err := uuid.Parse(chi.URLParam(r, "tagId"))
	if err != nil {
		log.Printf("unable to parse tag id: %v", err)
		errors.BadRequest(w)
		return
	}

	// Verify user has access to this note
	_, err = h.repo.FetchUsersNote(r.Context(), noteID, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("note %s not found or user %s doesn't have access", noteID, userID)
			errors.NotFound(w, "note not found")
			return
		}
		log.Printf("unable to fetch note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	err = h.repo.RemoveTagFromNote(r.Context(), noteID, tagID)
	if err != nil {
		log.Printf("unable to remove tag %s from note %s: %v", tagID, noteID, err)
		errors.InternalServerError(w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetNoteNotebooks retrieves all notebooks that contain a specific note
func (h *NoteHandler) GetNoteNotebooks(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to get note notebooks, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	noteID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		log.Printf("unable to parse note id: %v", err)
		errors.BadRequest(w)
		return
	}

	// Verify user has access to this note
	_, err = h.repo.FetchUsersNote(r.Context(), noteID, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("note %s not found or user %s doesn't have access", noteID, userID)
			errors.NotFound(w, "note not found")
			return
		}
		log.Printf("unable to fetch note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	notebooks, err := h.repo.GetNotebooksForNote(r.Context(), noteID)
	if err != nil {
		log.Printf("unable to fetch notebooks for note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notebooks)
}

// DeleteNote deletes a note
func (h *NoteHandler) DeleteNote(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("user context error: %v", err)
		errors.InternalServerError(w)
		return
	}

	noteID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		log.Printf("invalid note ID: %v", err)
		errors.BadRequest(w)
		return
	}

	// Verify user owns this note before deleting
	_, err = h.repo.FetchUsersNote(r.Context(), noteID, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			log.Printf("note %s not found or user %s doesn't have access", noteID, userID)
			errors.NotFound(w, "note not found")
			return
		}
		log.Printf("unable to fetch note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	// Delete files from disk before deleting the note
	err = h.fileService.DeleteFilesForNote(r.Context(), noteID)
	if err != nil {
		// Log warning but continue - don't fail deletion due to disk issues
		log.Printf("WARNING: failed to delete some files from disk for note %s: %v", noteID, err)
	}

	// Delete the note (CASCADE will delete file records)
	err = h.repo.DeleteNote(r.Context(), noteID)
	if err != nil {
		log.Printf("failed to delete note %s: %v", noteID, err)
		errors.InternalServerError(w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ConvertNoteToShoppingList converts a note's list items to a shopping list
func (h *NoteHandler) ConvertNoteToShoppingList(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to convert note, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	noteIDStr := chi.URLParam(r, "id")
	noteID, err := uuid.Parse(noteIDStr)
	if err != nil {
		log.Printf("invalid note ID: %s", noteIDStr)
		errors.BadRequest(w)
		return
	}

	// Verify user owns the note
	note, err := h.repo.FetchUsersNote(r.Context(), noteID, userID)
	if err != nil {
		log.Printf("note not found or access denied: %v", err)
		errors.NotFound(w, "Note not found")
		return
	}

	// Parse request body
	var req requests.ConvertNoteToShoppingList
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("could not decode convert request: %v", err)
		errors.BadRequest(w)
		return
	}

	// Normalize note content to shopping list format
	normalizedContent := utils.NormalizeToShoppingList(note.Content)

	// Parse items from normalized content
	items, err := utils.ParseShoppingList(normalizedContent)
	if err != nil {
		log.Printf("failed to parse shopping list from note: %v", err)
		errors.InternalServerError(w)
		return
	}

	if len(items) == 0 {
		log.Printf("no list items found in note")
		errors.BadRequest(w)
		return
	}

	var shoppingList *models.ShoppingList

	if req.Mode == "merge" {
		// Get last created shopping list
		lastList, err := h.shoppingListRepo.GetLastCreatedByUser(r.Context(), userID)
		if err != nil {
			log.Printf("failed to get last shopping list: %v", err)
			errors.InternalServerError(w)
			return
		}

		if lastList == nil {
			// No existing shopping list, create new one
			req.Mode = "new"
		} else {
			// Merge items into existing shopping list
			mergedContent := h.mergeItemsIntoShoppingList(lastList.Content, items, lastList.Items, note.Title)

			// Re-parse merged content
			mergedItems, err := utils.ParseShoppingList(mergedContent)
			if err != nil {
				log.Printf("failed to parse merged shopping list: %v", err)
				errors.InternalServerError(w)
				return
			}

			// Update shopping list
			lastList.Content = mergedContent
			lastList.ContentHash = h.shoppingListRepo.HashContent(mergedContent)
			lastList.Items = mergedItems
			lastList.UpdatedAt = time.Now()

			// Set shopping list IDs
			for i := range lastList.Items {
				lastList.Items[i].ShoppingListID = lastList.ID
			}

			updated, err := h.shoppingListRepo.Update(r.Context(), *lastList)
			if err != nil {
				log.Printf("failed to update shopping list: %v", err)
				errors.InternalServerError(w)
				return
			}

			// Update vocabulary
			for _, item := range mergedItems {
				err := h.shoppingListRepo.AddToVocabulary(r.Context(), userID, item.ItemName)
				if err != nil {
					log.Printf("warning: failed to add item to vocabulary: %v", err)
				}
			}

			shoppingList = updated
		}
	}

	if req.Mode == "new" {
		// Create new shopping list
		title := utils.GenerateTitleFromContent(normalizedContent)
		now := time.Now()

		newList := models.ShoppingList{
			ID:          uuid.New(),
			UserID:      userID,
			Title:       title,
			Content:     normalizedContent,
			ContentHash: h.shoppingListRepo.HashContent(normalizedContent),
			Items:       items,
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		// Set shopping list IDs
		for i := range newList.Items {
			newList.Items[i].ShoppingListID = newList.ID
		}

		created, err := h.shoppingListRepo.Create(r.Context(), newList)
		if err != nil {
			log.Printf("failed to create shopping list: %v", err)
			errors.InternalServerError(w)
			return
		}

		// Update vocabulary
		for _, item := range items {
			err := h.shoppingListRepo.AddToVocabulary(r.Context(), userID, item.ItemName)
			if err != nil {
				log.Printf("warning: failed to add item to vocabulary: %v", err)
			}
		}

		shoppingList = created
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(shoppingList)
}

// mergeItemsIntoShoppingList merges new items into existing shopping list content
func (h *NoteHandler) mergeItemsIntoShoppingList(
	currentContent string,
	newItems []models.ShoppingListEntry,
	existingItems []models.ShoppingListEntry,
	noteTitle string,
) string {
	// Build a map of existing items for quick lookup
	existingMap := make(map[string]*models.ShoppingListEntry)
	for i := range existingItems {
		existingMap[existingItems[i].ItemName] = &existingItems[i]
	}

	// Generate markdown for new items that don't exist or have different quantities
	var itemsToAdd []string
	for _, newItem := range newItems {
		// Check if item exists
		if existing, found := existingMap[newItem.ItemName]; found && existing.Quantity != nil && newItem.Quantity != nil {
			// Item exists with quantity - try to merge
			if existing.Quantity.Unit == newItem.Quantity.Unit {
				// Same unit - merge by adding quantities
				newQty := *existing.Quantity.Min
				if newItem.Quantity.Min != nil {
					newQty += *newItem.Quantity.Min
				}
				// Update existing item quantity in place (will be reflected when content is regenerated)
				newMin := newQty
				existing.Quantity.Min = &newMin
				existing.Quantity.Max = &newMin
				continue
			}
		}

		// Add as new item
		itemMarkdown := "- [ ] "
		if newItem.Checked {
			itemMarkdown = "- [x] "
		}
		if newItem.Quantity != nil {
			itemMarkdown += utils.FormatQuantity(*newItem.Quantity) + " "
		}
		itemMarkdown += newItem.DisplayName
		if newItem.Notes != "" {
			itemMarkdown += " (" + newItem.Notes + ")"
		}
		itemsToAdd = append(itemsToAdd, itemMarkdown)
	}

	// Append new items to the end of the content
	if len(itemsToAdd) > 0 {
		if currentContent != "" && !strings.HasSuffix(currentContent, "\n") {
			currentContent += "\n"
		}
		currentContent += fmt.Sprintf("\n## %s\n", noteTitle)
		for _, item := range itemsToAdd {
			currentContent += item + "\n"
		}
	}

	return currentContent
}
