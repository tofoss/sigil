package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"tofoss/sigil-go/pkg/db/repositories"
	"tofoss/sigil-go/pkg/handlers/errors"
	"tofoss/sigil-go/pkg/handlers/requests"
	"tofoss/sigil-go/pkg/models"
	"tofoss/sigil-go/pkg/utils"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ShoppingListHandler struct {
	shoppingListRepo repositories.ShoppingListRepositoryInterface
	noteRepo         repositories.NoteRepositoryInterface
	recipeRepo       repositories.RecipeRepositoryInterface
}

func NewShoppingListHandler(
	shoppingListRepo repositories.ShoppingListRepositoryInterface,
	noteRepo repositories.NoteRepositoryInterface,
	recipeRepo repositories.RecipeRepositoryInterface,
) ShoppingListHandler {
	return ShoppingListHandler{shoppingListRepo, noteRepo, recipeRepo}
}

// GetShoppingList retrieves the parsed shopping list for a note
func (h *ShoppingListHandler) GetShoppingList(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to get shopping list, user not logged in: %v", err)
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
	_, err = h.noteRepo.FetchUsersNote(r.Context(), noteID, userID)
	if err != nil {
		log.Printf("note not found or access denied: %v", err)
		errors.NotFound(w, "Note not found")
		return
	}

	// Get shopping list
	shoppingList, err := h.shoppingListRepo.GetByNoteID(r.Context(), noteID)
	if err != nil {
		log.Printf("shopping list not found for note %s: %v", noteID, err)
		errors.NotFound(w, "Shopping list not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(shoppingList)
}

// EnableShoppingList enables shopping list mode for a note
func (h *ShoppingListHandler) EnableShoppingList(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to enable shopping list, user not logged in: %v", err)
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
	note, err := h.noteRepo.FetchUsersNote(r.Context(), noteID, userID)
	if err != nil {
		log.Printf("note not found or access denied: %v", err)
		errors.NotFound(w, "Note not found")
		return
	}

	// Check if shopping list already exists
	existing, _ := h.shoppingListRepo.GetByNoteID(r.Context(), noteID)
	if existing != nil {
		// Already enabled, return existing
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(existing)
		return
	}

	// Parse the note content and create shopping list
	items, err := utils.ParseShoppingList(note.Content)
	if err != nil {
		log.Printf("failed to parse shopping list from note content: %v", err)
		errors.InternalServerError(w)
		return
	}

	now := time.Now()
	contentHash := h.shoppingListRepo.HashContent(note.Content)

	shoppingList := models.ShoppingList{
		ID:          uuid.New(),
		NoteID:      noteID,
		UserID:      userID,
		ContentHash: contentHash,
		Items:       items,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Set shopping list IDs for all items
	for i := range shoppingList.Items {
		shoppingList.Items[i].ShoppingListID = shoppingList.ID
	}

	created, err := h.shoppingListRepo.Create(r.Context(), shoppingList)
	if err != nil {
		log.Printf("failed to create shopping list: %v", err)
		errors.InternalServerError(w)
		return
	}

	// Update vocabulary with new items
	for _, item := range items {
		err := h.shoppingListRepo.AddToVocabulary(r.Context(), userID, item.ItemName)
		if err != nil {
			log.Printf("warning: failed to add item to vocabulary: %v", err)
			// Don't fail the request, just log
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created)
}

// DisableShoppingList disables shopping list mode for a note
func (h *ShoppingListHandler) DisableShoppingList(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to disable shopping list, user not logged in: %v", err)
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
	_, err = h.noteRepo.FetchUsersNote(r.Context(), noteID, userID)
	if err != nil {
		log.Printf("note not found or access denied: %v", err)
		errors.NotFound(w, "Note not found")
		return
	}

	// Delete shopping list
	err = h.shoppingListRepo.Delete(r.Context(), noteID)
	if err != nil {
		log.Printf("failed to delete shopping list: %v", err)
		errors.InternalServerError(w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ToggleItemCheck toggles the checked status of a shopping list item
func (h *ShoppingListHandler) ToggleItemCheck(w http.ResponseWriter, r *http.Request) {
	_, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to toggle item, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	itemIDStr := chi.URLParam(r, "id")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		log.Printf("invalid item ID: %s", itemIDStr)
		errors.BadRequest(w)
		return
	}

	var req requests.ToggleShoppingListItem
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("could not decode toggle request: %v", err)
		errors.BadRequest(w)
		return
	}

	// TODO: Verify user owns the shopping list that contains this item
	// For now, we'll just update the item

	err = h.shoppingListRepo.UpdateItemCheckStatus(r.Context(), itemID, req.Checked)
	if err != nil {
		log.Printf("failed to update item check status: %v", err)
		errors.InternalServerError(w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetVocabularySuggestions returns autocomplete suggestions
func (h *ShoppingListHandler) GetVocabularySuggestions(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to get vocabulary, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		// Return empty array if no query
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode([]models.VocabularyItem{})
		return
	}

	// Get suggestions (limit to 20)
	suggestions, err := h.shoppingListRepo.GetUserVocabulary(r.Context(), userID, query, 20)
	if err != nil {
		log.Printf("failed to get vocabulary suggestions: %v", err)
		errors.InternalServerError(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(suggestions)
}

// MergeRecipeIngredients adds recipe ingredients to a shopping list
func (h *ShoppingListHandler) MergeRecipeIngredients(w http.ResponseWriter, r *http.Request) {
	userID, _, err := utils.UserContext(r)
	if err != nil {
		log.Printf("unable to merge recipe, user not logged in: %v", err)
		errors.InternalServerError(w)
		return
	}

	shoppingListIDStr := chi.URLParam(r, "id")
	shoppingListID, err := uuid.Parse(shoppingListIDStr)
	if err != nil {
		log.Printf("invalid shopping list ID: %s", shoppingListIDStr)
		errors.BadRequest(w)
		return
	}

	var req requests.MergeRecipe
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("could not decode merge recipe request: %v", err)
		errors.BadRequest(w)
		return
	}

	recipeID, err := uuid.Parse(req.RecipeID)
	if err != nil {
		log.Printf("invalid recipe ID: %s", req.RecipeID)
		errors.BadRequest(w)
		return
	}

	// Get shopping list
	shoppingList, err := h.shoppingListRepo.GetByID(r.Context(), shoppingListID)
	if err != nil {
		log.Printf("shopping list not found: %v", err)
		errors.NotFound(w, "Shopping list not found")
		return
	}

	// Verify user owns the shopping list
	if shoppingList.UserID != userID {
		log.Printf("user %s does not own shopping list %s", userID, shoppingListID)
		errors.Forbidden(w)
		return
	}

	// Get recipe
	recipe, err := h.recipeRepo.FetchByID(r.Context(), recipeID)
	if err != nil {
		log.Printf("recipe not found: %v", err)
		errors.NotFound(w, "Recipe not found")
		return
	}

	// Get the note to update its content
	note, err := h.noteRepo.FetchUsersNote(r.Context(), shoppingList.NoteID, userID)
	if err != nil {
		log.Printf("note not found: %v", err)
		errors.NotFound(w, "Note not found")
		return
	}

	// Merge recipe ingredients into shopping list
	updatedContent := h.mergeRecipeIntoMarkdown(note.Content, recipe.Ingredients, shoppingList.Items)

	// Update the note content
	note.Content = updatedContent
	note.UpdatedAt = time.Now()
	_, err = h.noteRepo.Upsert(r.Context(), note)
	if err != nil {
		log.Printf("failed to update note: %v", err)
		errors.InternalServerError(w)
		return
	}

	// Re-parse the shopping list
	items, err := utils.ParseShoppingList(updatedContent)
	if err != nil {
		log.Printf("failed to re-parse shopping list: %v", err)
		errors.InternalServerError(w)
		return
	}

	// Update shopping list
	shoppingList.Items = items
	shoppingList.ContentHash = h.shoppingListRepo.HashContent(updatedContent)
	shoppingList.UpdatedAt = time.Now()

	// Set shopping list IDs
	for i := range shoppingList.Items {
		shoppingList.Items[i].ShoppingListID = shoppingList.ID
	}

	updated, err := h.shoppingListRepo.Update(r.Context(), *shoppingList)
	if err != nil {
		log.Printf("failed to update shopping list: %v", err)
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updated)
}

// mergeRecipeIntoMarkdown merges recipe ingredients into the note's markdown content
func (h *ShoppingListHandler) mergeRecipeIntoMarkdown(
	currentContent string,
	ingredients []models.Ingredient,
	existingItems []models.ShoppingListEntry,
) string {
	// Build a map of existing items for quick lookup
	existingMap := make(map[string]*models.ShoppingListEntry)
	for i := range existingItems {
		existingMap[existingItems[i].ItemName] = &existingItems[i]
	}

	// Generate markdown for new ingredients
	var newItems []string
	for _, ingredient := range ingredients {
		normalizedName := utils.NormalizeItemName(ingredient.Name)

		// Check if item exists
		if existing, found := existingMap[normalizedName]; found && existing.Quantity != nil && ingredient.Quantity != nil {
			// Item exists with quantity - try to merge
			if existing.Quantity.Unit == ingredient.Quantity.Unit {
				// Same unit - merge by adding quantities
				newQty := *existing.Quantity.Min
				if ingredient.Quantity.Min != nil {
					newQty += *ingredient.Quantity.Min
				}
				// Update existing item in place (will be reflected in markdown regeneration)
				newMin := newQty
				existing.Quantity.Min = &newMin
				existing.Quantity.Max = &newMin
				continue
			}
		}

		// Add as new item
		itemMarkdown := "- [ ] "
		if ingredient.Quantity != nil {
			itemMarkdown += utils.FormatQuantity(*ingredient.Quantity) + " "
		}
		itemMarkdown += ingredient.Name
		if ingredient.Notes != "" {
			itemMarkdown += " (" + ingredient.Notes + ")"
		}
		newItems = append(newItems, itemMarkdown)
	}

	// Append new items to the end of the content
	if len(newItems) > 0 {
		if currentContent != "" && !strings.HasSuffix(currentContent, "\n") {
			currentContent += "\n"
		}
		currentContent += "\n## From Recipe\n"
		for _, item := range newItems {
			currentContent += item + "\n"
		}
	}

	return currentContent
}
