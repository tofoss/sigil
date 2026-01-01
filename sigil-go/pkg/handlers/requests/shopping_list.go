package requests

type CreateShoppingList struct {
	Title   string `json:"title"`   // Optional, will be extracted from content if not provided
	Content string `json:"content"` // Required
}

type UpdateShoppingList struct {
	Title   string `json:"title"`   // Optional, will be extracted from content if not provided
	Content string `json:"content"` // Required
}

type ToggleShoppingListItem struct {
	Checked bool `json:"checked"`
}

type MergeRecipe struct {
	RecipeID string `json:"recipeId"`
}
