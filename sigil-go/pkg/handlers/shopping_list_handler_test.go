package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"tofoss/sigil-go/pkg/db/repositories"
	"tofoss/sigil-go/pkg/handlers/requests"
	"tofoss/sigil-go/pkg/models"
	"tofoss/sigil-go/pkg/utils"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// mockShoppingListRepository is a mock implementation for testing
type mockShoppingListRepository struct {
	getByUserIDFunc         func(ctx context.Context, userID uuid.UUID, limit int) ([]models.ShoppingList, error)
	getLastCreatedByUserFunc func(ctx context.Context, userID uuid.UUID) (*models.ShoppingList, error)
	getByIDFunc             func(ctx context.Context, id uuid.UUID) (*models.ShoppingList, error)
	createFunc              func(ctx context.Context, list models.ShoppingList) (*models.ShoppingList, error)
	updateFunc              func(ctx context.Context, list models.ShoppingList) (*models.ShoppingList, error)
	deleteFunc              func(ctx context.Context, id uuid.UUID) error
	updateItemCheckFunc     func(ctx context.Context, itemID uuid.UUID, checked bool) error
	getUserVocabularyFunc   func(ctx context.Context, userID uuid.UUID, prefix string, limit int) ([]models.VocabularyItem, error)
	addToVocabularyFunc     func(ctx context.Context, userID uuid.UUID, itemName string) error
	hashContentFunc         func(content string) string
}

func (m *mockShoppingListRepository) GetByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]models.ShoppingList, error) {
	if m.getByUserIDFunc != nil {
		return m.getByUserIDFunc(ctx, userID, limit)
	}
	return nil, errors.New("GetByUserID not mocked")
}

func (m *mockShoppingListRepository) GetLastCreatedByUser(ctx context.Context, userID uuid.UUID) (*models.ShoppingList, error) {
	if m.getLastCreatedByUserFunc != nil {
		return m.getLastCreatedByUserFunc(ctx, userID)
	}
	return nil, errors.New("GetLastCreatedByUser not mocked")
}

func (m *mockShoppingListRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ShoppingList, error) {
	if m.getByIDFunc != nil {
		return m.getByIDFunc(ctx, id)
	}
	return nil, errors.New("GetByID not mocked")
}

func (m *mockShoppingListRepository) Create(ctx context.Context, list models.ShoppingList) (*models.ShoppingList, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, list)
	}
	return nil, errors.New("Create not mocked")
}

func (m *mockShoppingListRepository) Update(ctx context.Context, list models.ShoppingList) (*models.ShoppingList, error) {
	if m.updateFunc != nil {
		return m.updateFunc(ctx, list)
	}
	return nil, errors.New("Update not mocked")
}

func (m *mockShoppingListRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, id)
	}
	return errors.New("Delete not mocked")
}

func (m *mockShoppingListRepository) UpdateItemCheckStatus(ctx context.Context, itemID uuid.UUID, checked bool) error {
	if m.updateItemCheckFunc != nil {
		return m.updateItemCheckFunc(ctx, itemID, checked)
	}
	return errors.New("UpdateItemCheckStatus not mocked")
}

func (m *mockShoppingListRepository) GetUserVocabulary(ctx context.Context, userID uuid.UUID, prefix string, limit int) ([]models.VocabularyItem, error) {
	if m.getUserVocabularyFunc != nil {
		return m.getUserVocabularyFunc(ctx, userID, prefix, limit)
	}
	return nil, errors.New("GetUserVocabulary not mocked")
}

func (m *mockShoppingListRepository) AddToVocabulary(ctx context.Context, userID uuid.UUID, itemName string) error {
	if m.addToVocabularyFunc != nil {
		return m.addToVocabularyFunc(ctx, userID, itemName)
	}
	return errors.New("AddToVocabulary not mocked")
}

func (m *mockShoppingListRepository) HashContent(content string) string {
	if m.hashContentFunc != nil {
		return m.hashContentFunc(content)
	}
	return "mock-hash"
}

// mockRecipeRepository is a mock implementation for testing
type mockRecipeRepository struct {
	fetchByIDFunc func(ctx context.Context, id uuid.UUID) (models.Recipe, error)
}

func (m *mockRecipeRepository) FetchByID(ctx context.Context, id uuid.UUID) (models.Recipe, error) {
	if m.fetchByIDFunc != nil {
		return m.fetchByIDFunc(ctx, id)
	}
	return models.Recipe{}, errors.New("FetchByID not mocked")
}

func (m *mockRecipeRepository) Delete(ctx context.Context, recipeID uuid.UUID) error {
	panic("Delete not mocked")
}

var _ repositories.RecipeRepositoryInterface = (*mockRecipeRepository)(nil)

// mockNoteRepositoryForShopping is a simplified mock for shopping list tests
type mockNoteRepositoryForShopping struct {
	fetchUsersNoteFunc func(ctx context.Context, noteID uuid.UUID, userID uuid.UUID) (models.Note, error)
	upsertFunc         func(ctx context.Context, note models.Note) (models.Note, error)
}

func (m *mockNoteRepositoryForShopping) FetchUsersNote(ctx context.Context, noteID uuid.UUID, userID uuid.UUID) (models.Note, error) {
	if m.fetchUsersNoteFunc != nil {
		return m.fetchUsersNoteFunc(ctx, noteID, userID)
	}
	return models.Note{}, errors.New("FetchUsersNote not mocked")
}

func (m *mockNoteRepositoryForShopping) Upsert(ctx context.Context, note models.Note) (models.Note, error) {
	if m.upsertFunc != nil {
		return m.upsertFunc(ctx, note)
	}
	return models.Note{}, errors.New("Upsert not mocked")
}

func (m *mockNoteRepositoryForShopping) DeleteNote(ctx context.Context, noteID uuid.UUID) error {
	panic("DeleteNote not mocked")
}

func (m *mockNoteRepositoryForShopping) FetchNote(ctx context.Context, noteID uuid.UUID) (models.Note, error) {
	panic("FetchNote not mocked")
}

func (m *mockNoteRepositoryForShopping) FetchUsersNotes(ctx context.Context, userID uuid.UUID) ([]models.Note, error) {
	panic("FetchUsersNotes not mocked")
}

func (m *mockNoteRepositoryForShopping) FetchNoteWithTags(ctx context.Context, noteID uuid.UUID) (models.Note, error) {
	panic("FetchNoteWithTags not mocked")
}

func (m *mockNoteRepositoryForShopping) FetchUsersNoteWithTags(ctx context.Context, noteID uuid.UUID, userID uuid.UUID) (models.Note, error) {
	panic("FetchUsersNoteWithTags not mocked")
}

func (m *mockNoteRepositoryForShopping) SearchNotes(ctx context.Context, userID uuid.UUID, query string, limit int, offset int) ([]models.Note, error) {
	panic("SearchNotes not mocked")
}

func (m *mockNoteRepositoryForShopping) GetTagsForNote(ctx context.Context, noteID uuid.UUID) ([]models.Tag, error) {
	panic("GetTagsForNote not mocked")
}

func (m *mockNoteRepositoryForShopping) GetTagsForNotes(ctx context.Context, noteIDs []uuid.UUID) (map[uuid.UUID][]models.Tag, error) {
	panic("GetTagsForNotes not mocked")
}

func (m *mockNoteRepositoryForShopping) AssignTagsToNote(ctx context.Context, noteID uuid.UUID, tagIDs []uuid.UUID) error {
	panic("AssignTagsToNote not mocked")
}

func (m *mockNoteRepositoryForShopping) RemoveTagFromNote(ctx context.Context, noteID uuid.UUID, tagID uuid.UUID) error {
	panic("RemoveTagFromNote not mocked")
}

func (m *mockNoteRepositoryForShopping) GetNotebooksForNote(ctx context.Context, noteID uuid.UUID) ([]models.Notebook, error) {
	panic("GetNotebooksForNote not mocked")
}

func (m *mockNoteRepositoryForShopping) GetRecipesForNote(ctx context.Context, noteID uuid.UUID) ([]models.Recipe, error) {
	panic("GetRecipesForNote not mocked")
}

func (m *mockNoteRepositoryForShopping) GetRecipesForNotes(ctx context.Context, noteIDs []uuid.UUID) (map[uuid.UUID][]models.Recipe, error) {
	panic("GetRecipesForNotes not mocked")
}

func (m *mockNoteRepositoryForShopping) AssignRecipesToNote(ctx context.Context, noteID uuid.UUID, recipeIDs []uuid.UUID) error {
	panic("AssignRecipesToNote not mocked")
}

func (m *mockNoteRepositoryForShopping) RemoveRecipeFromNote(ctx context.Context, noteID uuid.UUID, recipeID uuid.UUID) error {
	panic("RemoveRecipeFromNote not mocked")
}

func (m *mockNoteRepositoryForShopping) FetchNoteWithRecipes(ctx context.Context, noteID uuid.UUID) (models.Note, error) {
	panic("FetchNoteWithRecipes not mocked")
}

var _ repositories.NoteRepositoryInterface = (*mockNoteRepositoryForShopping)(nil)

func TestToggleItemCheck(t *testing.T) {
	testUserID := uuid.New()
	testItemID := uuid.New()

	tests := []struct {
		name             string
		itemID           string
		requestBody      requests.ToggleShoppingListItem
		mockUpdateError  error
		expectedStatus   int
	}{
		{
			name:   "Successfully mark item as checked",
			itemID: testItemID.String(),
			requestBody: requests.ToggleShoppingListItem{
				Checked: true,
			},
			expectedStatus: http.StatusNoContent,
		},
		{
			name:   "Successfully uncheck item",
			itemID: testItemID.String(),
			requestBody: requests.ToggleShoppingListItem{
				Checked: false,
			},
			expectedStatus: http.StatusNoContent,
		},
		{
			name:           "Invalid item ID returns bad request",
			itemID:         "invalid-uuid",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "Database error returns 500",
			itemID: testItemID.String(),
			requestBody: requests.ToggleShoppingListItem{
				Checked: true,
			},
			mockUpdateError: errors.New("database error"),
			expectedStatus:  http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Track if update was called with correct parameters
			var capturedItemID uuid.UUID
			var capturedChecked bool
			updateCalled := false

			mockShoppingListRepo := &mockShoppingListRepository{
				updateItemCheckFunc: func(ctx context.Context, itemID uuid.UUID, checked bool) error {
					updateCalled = true
					capturedItemID = itemID
					capturedChecked = checked
					return tt.mockUpdateError
				},
			}

			mockNoteRepo := &mockNoteRepositoryForShopping{}
			mockRecipeRepo := &mockRecipeRepository{}

			handler := NewShoppingListHandler(mockShoppingListRepo, mockNoteRepo, mockRecipeRepo)

			// Create request body
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPatch, "/shopping-list/items/"+tt.itemID+"/check", bytes.NewReader(body))

			// Add user context
			ctx := context.WithValue(req.Context(), utils.UserIDKey, testUserID)
			ctx = context.WithValue(ctx, utils.UsernameKey, "testuser")
			req = req.WithContext(ctx)

			// Add chi URL params
			rctx := chi.NewRouteContext()
			rctx.URLParams.Add("id", tt.itemID)
			req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

			// Create response recorder
			w := httptest.NewRecorder()

			// Call handler
			handler.ToggleItemCheck(w, req)

			// Check status code
			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// Verify update was called with correct parameters
			if tt.expectedStatus == http.StatusNoContent && updateCalled {
				if capturedItemID.String() != tt.itemID {
					t.Errorf("Expected item ID %s, got %s", tt.itemID, capturedItemID.String())
				}
				if capturedChecked != tt.requestBody.Checked {
					t.Errorf("Expected checked=%v, got %v", tt.requestBody.Checked, capturedChecked)
				}
			}
		})
	}
}

func TestGetVocabularySuggestions(t *testing.T) {
	testUserID := uuid.New()

	tests := []struct {
		name             string
		queryParam       string
		mockVocabulary   []models.VocabularyItem
		mockError        error
		expectedStatus   int
		expectedCount    int
		validateResponse func(t *testing.T, items []models.VocabularyItem)
	}{
		{
			name:       "Return matching suggestions",
			queryParam: "car",
			mockVocabulary: []models.VocabularyItem{
				{ID: uuid.New(), ItemName: "carrots", Frequency: 10},
				{ID: uuid.New(), ItemName: "cardamom", Frequency: 5},
			},
			expectedStatus: http.StatusOK,
			expectedCount:  2,
			validateResponse: func(t *testing.T, items []models.VocabularyItem) {
				if items[0].ItemName != "carrots" {
					t.Errorf("Expected first item to be 'carrots', got '%s'", items[0].ItemName)
				}
			},
		},
		{
			name:           "Empty query returns empty array",
			queryParam:     "",
			expectedStatus: http.StatusOK,
			expectedCount:  0,
		},
		{
			name:           "No matches returns empty array",
			queryParam:     "xyz",
			mockVocabulary: []models.VocabularyItem{},
			expectedStatus: http.StatusOK,
			expectedCount:  0,
		},
		{
			name:           "Database error returns 500",
			queryParam:     "car",
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockShoppingListRepo := &mockShoppingListRepository{
				getUserVocabularyFunc: func(ctx context.Context, userID uuid.UUID, prefix string, limit int) ([]models.VocabularyItem, error) {
					if tt.mockError != nil {
						return nil, tt.mockError
					}
					return tt.mockVocabulary, nil
				},
			}

			mockNoteRepo := &mockNoteRepositoryForShopping{}
			mockRecipeRepo := &mockRecipeRepository{}

			handler := NewShoppingListHandler(mockShoppingListRepo, mockNoteRepo, mockRecipeRepo)

			// Create request
			url := "/shopping-list/vocabulary"
			if tt.queryParam != "" {
				url += "?q=" + tt.queryParam
			}
			req := httptest.NewRequest(http.MethodGet, url, nil)

			// Add user context
			ctx := context.WithValue(req.Context(), utils.UserIDKey, testUserID)
			ctx = context.WithValue(ctx, utils.UsernameKey, "testuser")
			req = req.WithContext(ctx)

			// Create response recorder
			w := httptest.NewRecorder()

			// Call handler
			handler.GetVocabularySuggestions(w, req)

			// Check status code
			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// For successful responses, validate the result
			if tt.expectedStatus == http.StatusOK {
				var items []models.VocabularyItem
				if err := json.NewDecoder(w.Body).Decode(&items); err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}

				if len(items) != tt.expectedCount {
					t.Errorf("Expected %d items, got %d", tt.expectedCount, len(items))
				}

				if tt.validateResponse != nil {
					tt.validateResponse(t, items)
				}
			}
		})
	}
}

func TestMergeRecipeIngredients(t *testing.T) {
	testUserID := uuid.New()
	testShoppingListID := uuid.New()
	testRecipeID := uuid.New()

	tests := []struct {
		name               string
		shoppingListID     string
		requestBody        requests.MergeRecipe
		mockShoppingList   *models.ShoppingList
		mockRecipe         models.Recipe
		mockShoppingError  error
		mockRecipeError    error
		expectedStatus     int
		validateResponse   func(t *testing.T, list *models.ShoppingList)
	}{
		{
			name:           "Successfully merge recipe ingredients",
			shoppingListID: testShoppingListID.String(),
			requestBody: requests.MergeRecipe{
				RecipeID: testRecipeID.String(),
			},
			mockShoppingList: &models.ShoppingList{
				ID:          testShoppingListID,
				UserID:      testUserID,
				Title:       "Groceries",
				Content:     "- [ ] Flour\n",
				ContentHash: "hash",
				Items: []models.ShoppingListEntry{
					{ItemName: "flour", DisplayName: "Flour", Quantity: &models.Quantity{Min: floatPtr(500), Max: floatPtr(500), Unit: "g"}},
				},
			},
			mockRecipe: models.Recipe{
				ID:   testRecipeID,
				Name: "Test Recipe",
				Ingredients: []models.Ingredient{
					{Name: "Sugar", Quantity: &models.Quantity{Min: floatPtr(200), Max: floatPtr(200), Unit: "g"}},
				},
			},
			expectedStatus: http.StatusOK,
			validateResponse: func(t *testing.T, list *models.ShoppingList) {
				if list == nil {
					t.Error("Expected shopping list in response")
				}
			},
		},
		{
			name:           "Invalid shopping list ID returns bad request",
			shoppingListID: "invalid-uuid",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Shopping list not found returns 404",
			shoppingListID: testShoppingListID.String(),
			requestBody: requests.MergeRecipe{
				RecipeID: testRecipeID.String(),
			},
			mockShoppingError: errors.New("not found"),
			expectedStatus:    http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockShoppingListRepo := &mockShoppingListRepository{
				getByIDFunc: func(ctx context.Context, id uuid.UUID) (*models.ShoppingList, error) {
					if tt.mockShoppingError != nil {
						return nil, tt.mockShoppingError
					}
					return tt.mockShoppingList, nil
				},
				updateFunc: func(ctx context.Context, list models.ShoppingList) (*models.ShoppingList, error) {
					return &list, nil
				},
				addToVocabularyFunc: func(ctx context.Context, userID uuid.UUID, itemName string) error {
					return nil
				},
			}

			mockNoteRepo := &mockNoteRepositoryForShopping{}

			mockRecipeRepo := &mockRecipeRepository{
				fetchByIDFunc: func(ctx context.Context, id uuid.UUID) (models.Recipe, error) {
					if tt.mockRecipeError != nil {
						return models.Recipe{}, tt.mockRecipeError
					}
					return tt.mockRecipe, nil
				},
			}

			handler := NewShoppingListHandler(mockShoppingListRepo, mockNoteRepo, mockRecipeRepo)

			// Create request body
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPost, "/shopping-list/"+tt.shoppingListID+"/merge-recipe", bytes.NewReader(body))

			// Add user context
			ctx := context.WithValue(req.Context(), utils.UserIDKey, testUserID)
			ctx = context.WithValue(ctx, utils.UsernameKey, "testuser")
			req = req.WithContext(ctx)

			// Add chi URL params
			rctx := chi.NewRouteContext()
			rctx.URLParams.Add("id", tt.shoppingListID)
			req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

			// Create response recorder
			w := httptest.NewRecorder()

			// Call handler
			handler.MergeRecipeIngredients(w, req)

			// Check status code
			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// For successful responses, validate the result
			if tt.expectedStatus == http.StatusOK {
				var list models.ShoppingList
				if err := json.NewDecoder(w.Body).Decode(&list); err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}

				if tt.validateResponse != nil {
					tt.validateResponse(t, &list)
				}
			}
		})
	}
}

func TestGetShoppingList(t *testing.T) {
	testUserID := uuid.New()
	testShoppingListID := uuid.New()

	tests := []struct {
		name             string
		shoppingListID   string
		mockList         *models.ShoppingList
		mockListError    error
		expectedStatus   int
		validateResponse func(t *testing.T, list *models.ShoppingList)
	}{
		{
			name:           "Successfully retrieve shopping list",
			shoppingListID: testShoppingListID.String(),
			mockList: &models.ShoppingList{
				ID:          testShoppingListID,
				UserID:      testUserID,
				Title:       "Groceries",
				Content:     "- [ ] 2L Milk\n- [x] Whole Wheat Bread\n",
				ContentHash: "hash",
				Items: []models.ShoppingListEntry{
					{ItemName: "milk", DisplayName: "2L Milk", Checked: false},
					{ItemName: "bread", DisplayName: "Whole Wheat Bread", Checked: true},
				},
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			expectedStatus: http.StatusOK,
			validateResponse: func(t *testing.T, list *models.ShoppingList) {
				if len(list.Items) != 2 {
					t.Errorf("Expected 2 items, got %d", len(list.Items))
				}
				if list.ID != testShoppingListID {
					t.Errorf("Expected shopping list ID %s, got %s", testShoppingListID, list.ID)
				}
			},
		},
		{
			name:           "Invalid shopping list ID returns bad request",
			shoppingListID: "invalid-uuid",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Shopping list not found returns 404",
			shoppingListID: testShoppingListID.String(),
			mockListError:  errors.New("shopping list not found"),
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockShoppingListRepo := &mockShoppingListRepository{
				getByIDFunc: func(ctx context.Context, id uuid.UUID) (*models.ShoppingList, error) {
					if tt.mockListError != nil {
						return nil, tt.mockListError
					}
					return tt.mockList, nil
				},
			}

			mockNoteRepo := &mockNoteRepositoryForShopping{}

			mockRecipeRepo := &mockRecipeRepository{}

			handler := NewShoppingListHandler(mockShoppingListRepo, mockNoteRepo, mockRecipeRepo)

			// Create request
			req := httptest.NewRequest(http.MethodGet, "/shopping-list/"+tt.shoppingListID, nil)

			// Add user context
			ctx := context.WithValue(req.Context(), utils.UserIDKey, testUserID)
			ctx = context.WithValue(ctx, utils.UsernameKey, "testuser")
			req = req.WithContext(ctx)

			// Add chi URL params
			rctx := chi.NewRouteContext()
			rctx.URLParams.Add("id", tt.shoppingListID)
			req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

			// Create response recorder
			w := httptest.NewRecorder()

			// Call handler
			handler.GetShoppingList(w, req)

			// Check status code
			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// For successful responses, validate the result
			if tt.expectedStatus == http.StatusOK {
				var list models.ShoppingList
				if err := json.NewDecoder(w.Body).Decode(&list); err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}

				if tt.validateResponse != nil {
					tt.validateResponse(t, &list)
				}
			}
		})
	}
}

// Helper function to create float pointers
func floatPtr(f float64) *float64 {
	return &f
}
