package utils

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestParseShoppingList_EmptyContent(t *testing.T) {
	content := ""
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Empty(t, result)
}

func TestParseShoppingList_NoCheckboxItems(t *testing.T) {
	content := `# Shopping List

This is just some text without any checkbox items.
Remember to pick up the package.`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Empty(t, result)
}

func TestParseShoppingList_SimpleUncheckedItem(t *testing.T) {
	content := "- [ ] Milk"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "milk", result[0].ItemName)
	assert.Equal(t, "Milk", result[0].DisplayName)
	assert.False(t, result[0].Checked)
	assert.Nil(t, result[0].Quantity)
	assert.Equal(t, "", result[0].Notes)
	assert.Equal(t, 0, result[0].Position)
	assert.Equal(t, "", result[0].SectionHeader)
}

func TestParseShoppingList_SimpleCheckedItem(t *testing.T) {
	content := "- [x] Eggs"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "eggs", result[0].ItemName)
	assert.Equal(t, "Eggs", result[0].DisplayName)
	assert.True(t, result[0].Checked)
}

func TestParseShoppingList_CheckedUppercaseX(t *testing.T) {
	content := "- [X] Bread"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.True(t, result[0].Checked)
}

func TestParseShoppingList_MultipleItems(t *testing.T) {
	content := `- [ ] Milk
- [x] Eggs
- [ ] Bread`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 3)

	assert.Equal(t, "milk", result[0].ItemName)
	assert.False(t, result[0].Checked)
	assert.Equal(t, 0, result[0].Position)

	assert.Equal(t, "eggs", result[1].ItemName)
	assert.True(t, result[1].Checked)
	assert.Equal(t, 1, result[1].Position)

	assert.Equal(t, "bread", result[2].ItemName)
	assert.False(t, result[2].Checked)
	assert.Equal(t, 2, result[2].Position)
}

func TestParseShoppingList_WithLeadingWhitespace(t *testing.T) {
	content := `  - [ ] Milk
    - [ ] Eggs
	- [ ] Bread`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 3)
	assert.Equal(t, "milk", result[0].ItemName)
}

func TestParseShoppingList_SimpleQuantity(t *testing.T) {
	content := "- [ ] 1kg Carrots"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "carrots", result[0].ItemName)
	assert.Equal(t, "1kg Carrots", result[0].DisplayName)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 1.0, *result[0].Quantity.Min)
	assert.Equal(t, 1.0, *result[0].Quantity.Max)
	assert.Equal(t, "kg", result[0].Quantity.Unit)
}

func TestParseShoppingList_DecimalQuantity(t *testing.T) {
	content := "- [ ] 0.5L Milk"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 0.5, *result[0].Quantity.Min)
	assert.Equal(t, "L", result[0].Quantity.Unit)
}

func TestParseShoppingList_QuantityWithSpace(t *testing.T) {
	content := "- [ ] 2 cups Flour"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "flour", result[0].ItemName)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 2.0, *result[0].Quantity.Min)
	assert.Equal(t, "cups", result[0].Quantity.Unit)
}

func TestParseShoppingList_QuantityRange(t *testing.T) {
	content := "- [ ] 2-3 cups Sugar"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "sugar", result[0].ItemName)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 2.0, *result[0].Quantity.Min)
	assert.Equal(t, 3.0, *result[0].Quantity.Max)
	assert.Equal(t, "cups", result[0].Quantity.Unit)
}

func TestParseShoppingList_AtLeastQuantity(t *testing.T) {
	content := "- [ ] at least 1L Water"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "water", result[0].ItemName)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 1.0, *result[0].Quantity.Min)
	assert.Nil(t, result[0].Quantity.Max)
	assert.Equal(t, "L", result[0].Quantity.Unit)
}

func TestParseShoppingList_UpToQuantity(t *testing.T) {
	content := "- [ ] up to 2 cups Milk"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "milk", result[0].ItemName)
	assert.NotNil(t, result[0].Quantity)
	assert.Nil(t, result[0].Quantity.Min)
	assert.Equal(t, 2.0, *result[0].Quantity.Max)
	assert.Equal(t, "cups", result[0].Quantity.Unit)
}

func TestParseShoppingList_ParentheticalNotes(t *testing.T) {
	content := "- [ ] Eggs (if they have the good ones)"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "eggs", result[0].ItemName)
	assert.Equal(t, "Eggs (if they have the good ones)", result[0].DisplayName)
	assert.Equal(t, "(if they have the good ones)", result[0].Notes)
}

func TestParseShoppingList_WithLink(t *testing.T) {
	content := "- [ ] [This thing](https://example.org/)"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "this thing", result[0].ItemName)
	assert.Equal(t, "[This thing](https://example.org/)", result[0].DisplayName)
	assert.Contains(t, result[0].Notes, "https://example.org/")
}

func TestParseShoppingList_QuantityAndNotes(t *testing.T) {
	content := "- [ ] 1kg Carrots (organic)"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "carrots", result[0].ItemName)
	assert.Equal(t, "1kg Carrots (organic)", result[0].DisplayName)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 1.0, *result[0].Quantity.Min)
	assert.Equal(t, "kg", result[0].Quantity.Unit)
	assert.Equal(t, "(organic)", result[0].Notes)
}

func TestParseShoppingList_SingleSection(t *testing.T) {
	content := `## Groceries
- [ ] Milk
- [ ] Eggs`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "Groceries", result[0].SectionHeader)
	assert.Equal(t, "Groceries", result[1].SectionHeader)
}

func TestParseShoppingList_MultipleSections(t *testing.T) {
	content := `## Groceries
- [ ] Milk
- [ ] Eggs

## Hardware
- [ ] Screws
- [ ] Nails`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 4)
	assert.Equal(t, "Groceries", result[0].SectionHeader)
	assert.Equal(t, "Groceries", result[1].SectionHeader)
	assert.Equal(t, "Hardware", result[2].SectionHeader)
	assert.Equal(t, "Hardware", result[3].SectionHeader)
}

func TestParseShoppingList_ItemsWithoutSection(t *testing.T) {
	content := `- [ ] Milk
- [ ] Eggs

## Groceries
- [ ] Bread`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 3)
	assert.Equal(t, "", result[0].SectionHeader)
	assert.Equal(t, "", result[1].SectionHeader)
	assert.Equal(t, "Groceries", result[2].SectionHeader)
}

func TestParseShoppingList_EmptyLines(t *testing.T) {
	content := `- [ ] Milk

- [ ] Eggs

- [ ] Bread`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 3)
	assert.Equal(t, 0, result[0].Position)
	assert.Equal(t, 1, result[1].Position)
	assert.Equal(t, 2, result[2].Position)
}

func TestParseShoppingList_MixedContent(t *testing.T) {
	content := `# Shopping List

## Groceries
- [ ] 1kg Carrots
- [x] Milk
- [ ] Eggs (organic)

Remember to check expiry dates!

## Hardware
- [ ] Screws
- [ ] [USB Cable](https://example.com/)

Don't forget the receipt.`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 5)

	assert.Equal(t, "carrots", result[0].ItemName)
	assert.Equal(t, "Groceries", result[0].SectionHeader)
	assert.NotNil(t, result[0].Quantity)

	assert.Equal(t, "milk", result[1].ItemName)
	assert.True(t, result[1].Checked)

	assert.Equal(t, "eggs", result[2].ItemName)
	assert.Equal(t, "(organic)", result[2].Notes)

	assert.Equal(t, "screws", result[3].ItemName)
	assert.Equal(t, "Hardware", result[3].SectionHeader)

	assert.Equal(t, "usb cable", result[4].ItemName)
	assert.Contains(t, result[4].Notes, "https://example.com/")
}

func TestParseShoppingList_MalformedCheckboxes(t *testing.T) {
	content := `- [] Milk
- [ Eggs
[x] Bread
- [ ] Butter`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	// Only the valid checkbox should be parsed
	assert.Len(t, result, 1)
	assert.Equal(t, "butter", result[0].ItemName)
}

func TestParseShoppingList_UnicodeCharacters(t *testing.T) {
	content := `- [ ] Brød
- [ ] Øl
- [ ] Gulrøtter
- [ ] Smør`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 4)
	assert.Equal(t, "brød", result[0].ItemName)
	assert.Equal(t, "øl", result[1].ItemName)
	assert.Equal(t, "gulrøtter", result[2].ItemName)
	assert.Equal(t, "smør", result[3].ItemName)
}

func TestParseShoppingList_SpecialCharacters(t *testing.T) {
	content := `- [ ] Coffee & Tea
- [ ] Salt/Pepper
- [ ] Peanut Butter & Jelly`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 3)
	assert.Equal(t, "coffee & tea", result[0].ItemName)
	assert.Equal(t, "salt/pepper", result[1].ItemName)
}

func TestParseShoppingList_TrailingWhitespace(t *testing.T) {
	content := "- [ ] Milk   \n- [ ] Eggs  "
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, "milk", result[0].ItemName)
	assert.Equal(t, "Milk", result[0].DisplayName) // Display name should be trimmed
}

func TestParseShoppingList_VeryLongItemName(t *testing.T) {
	longName := "This is a very long item name that someone might write including lots of details about the specific brand and variety they want"
	content := "- [ ] " + longName
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Contains(t, result[0].ItemName, "very long item name")
}

func TestParseShoppingList_OnlyHeaders(t *testing.T) {
	content := `## Groceries
## Hardware
## Other`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Empty(t, result)
}

func TestParseShoppingList_NestedSections(t *testing.T) {
	content := `## Groceries
### Dairy
- [ ] Milk
### Produce
- [ ] Carrots`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 2)
	// Should use the most recent heading
	assert.Equal(t, "Dairy", result[0].SectionHeader)
	assert.Equal(t, "Produce", result[1].SectionHeader)
}

func TestParseShoppingList_ComplexQuantityFormats(t *testing.T) {
	tests := []struct {
		name         string
		content      string
		expectedMin  *float64
		expectedMax  *float64
		expectedUnit string
		expectedItem string
	}{
		{
			name:         "Integer kg",
			content:      "- [ ] 2kg potatoes",
			expectedMin:  float64Ptr(2.0),
			expectedMax:  float64Ptr(2.0),
			expectedUnit: "kg",
			expectedItem: "potatoes",
		},
		{
			name:         "Decimal with L",
			content:      "- [ ] 1.5L milk",
			expectedMin:  float64Ptr(1.5),
			expectedMax:  float64Ptr(1.5),
			expectedUnit: "L",
			expectedItem: "milk",
		},
		{
			name:         "Fractional cups",
			content:      "- [ ] 1/2 cup sugar",
			expectedMin:  float64Ptr(0.5),
			expectedMax:  float64Ptr(0.5),
			expectedUnit: "cup",
			expectedItem: "sugar",
		},
		{
			name:         "Multiple words unit",
			content:      "- [ ] 2 tablespoons olive oil",
			expectedMin:  float64Ptr(2.0),
			expectedMax:  float64Ptr(2.0),
			expectedUnit: "tablespoons",
			expectedItem: "olive oil",
		},
		{
			name:         "No unit just number",
			content:      "- [ ] 10 potatoes",
			expectedMin:  float64Ptr(10.0),
			expectedMax:  float64Ptr(10.0),
			expectedUnit: "",
			expectedItem: "potatoes",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseShoppingList(tt.content)
			assert.NoError(t, err)
			assert.Len(t, result, 1)
			assert.Equal(t, tt.expectedItem, result[0].ItemName)

			if tt.expectedMin != nil || tt.expectedMax != nil {
				assert.NotNil(t, result[0].Quantity)
				if tt.expectedMin != nil {
					assert.Equal(t, *tt.expectedMin, *result[0].Quantity.Min)
				}
				if tt.expectedMax != nil {
					assert.Equal(t, *tt.expectedMax, *result[0].Quantity.Max)
				}
				assert.Equal(t, tt.expectedUnit, result[0].Quantity.Unit)
			}
		})
	}
}

func TestParseShoppingList_IDsAreGenerated(t *testing.T) {
	content := `- [ ] Milk
- [ ] Eggs`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 2)

	// IDs should be generated
	assert.NotEqual(t, uuid.Nil, result[0].ID)
	assert.NotEqual(t, uuid.Nil, result[1].ID)

	// IDs should be different
	assert.NotEqual(t, result[0].ID, result[1].ID)
}

func TestParseShoppingList_CreatedAtIsSet(t *testing.T) {
	content := "- [ ] Milk"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)

	// CreatedAt should be recent (within last minute)
	assert.WithinDuration(t, time.Now(), result[0].CreatedAt, time.Minute)
}

func TestParseShoppingList_QuantityAfterItemWithComma(t *testing.T) {
	content := "- [ ] Carrots, 5kg"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "carrots", result[0].ItemName)
	assert.Equal(t, "Carrots, 5kg", result[0].DisplayName)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 5.0, *result[0].Quantity.Min)
	assert.Equal(t, 5.0, *result[0].Quantity.Max)
	assert.Equal(t, "kg", result[0].Quantity.Unit)
}

func TestParseShoppingList_QuantityAfterItemNoComma(t *testing.T) {
	content := "- [ ] Carrots 5kg"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "carrots", result[0].ItemName)
	assert.Equal(t, "Carrots 5kg", result[0].DisplayName)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 5.0, *result[0].Quantity.Min)
	assert.Equal(t, 5.0, *result[0].Quantity.Max)
	assert.Equal(t, "kg", result[0].Quantity.Unit)
}

func TestParseShoppingList_QuantityAfterItemInParens(t *testing.T) {
	content := "- [ ] Milk (2L)"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "milk", result[0].ItemName)
	assert.Equal(t, "Milk (2L)", result[0].DisplayName)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 2.0, *result[0].Quantity.Min)
	assert.Equal(t, "L", result[0].Quantity.Unit)
	// Notes should contain the parenthetical
	assert.Contains(t, result[0].Notes, "2L")
}

func TestParseShoppingList_QuantityAfterItemWithDash(t *testing.T) {
	content := "- [ ] Flour - 2kg"
	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, "flour", result[0].ItemName)
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 2.0, *result[0].Quantity.Min)
	assert.Equal(t, "kg", result[0].Quantity.Unit)
}

func TestParseShoppingList_MixedQuantityFormats(t *testing.T) {
	content := `- [ ] 1kg Carrots
- [ ] Potatoes, 2kg
- [ ] Milk (1L)
- [ ] 500g Flour
- [ ] Sugar 3kg`

	result, err := ParseShoppingList(content)

	assert.NoError(t, err)
	assert.Len(t, result, 5)

	// All should have quantities
	assert.NotNil(t, result[0].Quantity)
	assert.Equal(t, 1.0, *result[0].Quantity.Min)

	assert.NotNil(t, result[1].Quantity)
	assert.Equal(t, 2.0, *result[1].Quantity.Min)

	assert.NotNil(t, result[2].Quantity)
	assert.Equal(t, 1.0, *result[2].Quantity.Min)

	assert.NotNil(t, result[3].Quantity)
	assert.Equal(t, 500.0, *result[3].Quantity.Min)
	assert.Equal(t, "g", result[3].Quantity.Unit)

	assert.NotNil(t, result[4].Quantity)
	assert.Equal(t, 3.0, *result[4].Quantity.Min)
}

func TestParseShoppingList_QuantityWithSpacesAtEnd(t *testing.T) {
	tests := []struct {
		name         string
		content      string
		expectedQty  float64
		expectedUnit string
		expectedItem string
	}{
		{
			name:         "Comma separator with space",
			content:      "- [ ] Carrots, 5 kg",
			expectedQty:  5.0,
			expectedUnit: "kg",
			expectedItem: "carrots",
		},
		{
			name:         "Parentheses with space",
			content:      "- [ ] Milk (2 L)",
			expectedQty:  2.0,
			expectedUnit: "L",
			expectedItem: "milk",
		},
		{
			name:         "Dash separator with space",
			content:      "- [ ] Flour - 2 kg",
			expectedQty:  2.0,
			expectedUnit: "kg",
			expectedItem: "flour",
		},
		{
			name:         "No separator with space",
			content:      "- [ ] Sugar 3 kg",
			expectedQty:  3.0,
			expectedUnit: "kg",
			expectedItem: "sugar",
		},
		{
			name:         "Decimal quantity with space",
			content:      "- [ ] Oil, 1.5 L",
			expectedQty:  1.5,
			expectedUnit: "L",
			expectedItem: "oil",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseShoppingList(tt.content)
			assert.NoError(t, err)
			assert.Len(t, result, 1)
			assert.Equal(t, tt.expectedItem, result[0].ItemName)
			assert.NotNil(t, result[0].Quantity)
			assert.Equal(t, tt.expectedQty, *result[0].Quantity.Min)
			assert.Equal(t, tt.expectedUnit, result[0].Quantity.Unit)
		})
	}
}

// Helper function for test cases
func float64Ptr(v float64) *float64 {
	return &v
}
