package requests

type ToggleShoppingListItem struct {
	Checked bool `json:"checked"`
}

type MergeRecipe struct {
	RecipeID string `json:"recipeId"`
}
