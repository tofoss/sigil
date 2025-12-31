package utils

import (
	"fmt"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"
	"tofoss/sigil-go/pkg/models"

	"github.com/google/uuid"
)

var (
	// Regex for checkbox items: - [ ] or - [x] with optional leading whitespace
	checkboxRegex = regexp.MustCompile(`^\s*-\s*\[([ xX])\]\s*(.+)$`)

	// Regex for section headers: ## Header or ### Sub-header
	headerRegex = regexp.MustCompile(`^#{2,}\s+(.+)$`)

	// Regex for quantity patterns at the beginning (more specific patterns first)
	atLeastRegex        = regexp.MustCompile(`^(?i)at\s+least\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$`)
	upToRegex           = regexp.MustCompile(`^(?i)up\s+to\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$`)
	rangeRegex          = regexp.MustCompile(`^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$`)
	fractionRegex       = regexp.MustCompile(`^(\d+)/(\d+)\s+([a-zA-Z]+)\s+(.+)$`)
	simpleQuantityRegex = regexp.MustCompile(`^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$`)

	// Regex for quantity patterns at the end (allow optional space between number and unit)
	endQuantityWithCommaRegex = regexp.MustCompile(`^(.+?),\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$`)
	endQuantityWithDashRegex  = regexp.MustCompile(`^(.+?)\s*-\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$`)
	endQuantityNoSepRegex     = regexp.MustCompile(`^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$`)

	// Regex for extracting notes
	parentheticalRegex = regexp.MustCompile(`\(([^)]+)\)`)
	linkRegex          = regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
)

// ParseShoppingList parses markdown content and returns a slice of shopping list entries
func ParseShoppingList(content string) ([]models.ShoppingListEntry, error) {
	if content == "" {
		return []models.ShoppingListEntry{}, nil
	}

	lines := strings.Split(content, "\n")
	var entries []models.ShoppingListEntry
	currentSection := ""
	position := 0

	for _, line := range lines {
		// Check for section headers
		if headerMatch := headerRegex.FindStringSubmatch(line); headerMatch != nil {
			currentSection = strings.TrimSpace(headerMatch[1])
			continue
		}

		// Check for checkbox items
		if checkboxMatch := checkboxRegex.FindStringSubmatch(line); checkboxMatch != nil {
			// checked if the checkbox contains 'x' or 'X', unchecked if it contains ' '
			checked := checkboxMatch[1] != " "
			itemText := strings.TrimSpace(checkboxMatch[2])

			entry := parseItem(itemText, checked, position, currentSection)
			entries = append(entries, entry)
			position++
		}
	}

	return entries, nil
}

// parseItem parses a single checkbox item text and returns a ShoppingListEntry
func parseItem(text string, checked bool, position int, sectionHeader string) models.ShoppingListEntry {
	displayName := text
	itemName := ""
	notes := ""
	var quantity *models.Quantity

	// Extract notes from parenthetical expressions
	parentheticals := parentheticalRegex.FindAllString(text, -1)
	if len(parentheticals) > 0 {
		notes = strings.Join(parentheticals, " ")
	}

	// Extract links and treat them specially
	if linkMatch := linkRegex.FindStringSubmatch(text); linkMatch != nil {
		linkText := linkMatch[1]
		linkURL := linkMatch[2]
		itemName = normalizeItemName(linkText)
		notes = linkURL
	} else {
		// Try to parse quantity
		remainingText := text
		quantity, remainingText = parseQuantity(text)

		// Remove parenthetical notes from item name
		cleanText := parentheticalRegex.ReplaceAllString(remainingText, "")
		cleanText = strings.TrimSpace(cleanText)

		itemName = normalizeItemName(cleanText)
	}

	return models.ShoppingListEntry{
		ID:            uuid.New(),
		ItemName:      itemName,
		DisplayName:   displayName,
		Quantity:      quantity,
		Notes:         notes,
		Checked:       checked,
		Position:      position,
		SectionHeader: sectionHeader,
		CreatedAt:     time.Now(),
	}
}

// parseQuantity attempts to extract quantity information from the text
// Returns the quantity (if found) and the remaining text
func parseQuantity(text string) (*models.Quantity, string) {
	// First try parsing quantity at the beginning
	qty, remaining := parseQuantityAtBeginning(text)
	if qty != nil {
		return qty, remaining
	}

	// If no match at beginning, try at the end
	return parseQuantityAtEnd(text)
}

// parseQuantityAtBeginning tries to match quantity patterns at the start of text
func parseQuantityAtBeginning(text string) (*models.Quantity, string) {
	// Try "at least X unit" pattern
	if match := atLeastRegex.FindStringSubmatch(text); match != nil {
		min, _ := strconv.ParseFloat(match[1], 64)
		unit := match[2]
		remaining := match[3]
		return &models.Quantity{
			Min:  &min,
			Max:  nil,
			Unit: unit,
		}, remaining
	}

	// Try "up to X unit" pattern
	if match := upToRegex.FindStringSubmatch(text); match != nil {
		max, _ := strconv.ParseFloat(match[1], 64)
		unit := match[2]
		remaining := match[3]
		return &models.Quantity{
			Min:  nil,
			Max:  &max,
			Unit: unit,
		}, remaining
	}

	// Try range pattern "X-Y unit"
	if match := rangeRegex.FindStringSubmatch(text); match != nil {
		min, _ := strconv.ParseFloat(match[1], 64)
		max, _ := strconv.ParseFloat(match[2], 64)
		unit := match[3]
		remaining := match[4]
		return &models.Quantity{
			Min:  &min,
			Max:  &max,
			Unit: unit,
		}, remaining
	}

	// Try fraction pattern "X/Y unit"
	if match := fractionRegex.FindStringSubmatch(text); match != nil {
		numerator, _ := strconv.ParseFloat(match[1], 64)
		denominator, _ := strconv.ParseFloat(match[2], 64)
		value := numerator / denominator
		unit := match[3]
		remaining := match[4]
		return &models.Quantity{
			Min:  &value,
			Max:  &value,
			Unit: unit,
		}, remaining
	}

	// Try simple quantity pattern "X unit" or "Xunit" (like "1kg")
	if match := simpleQuantityRegex.FindStringSubmatch(text); match != nil {
		value, err := strconv.ParseFloat(match[1], 64)
		if err != nil {
			// Not a valid number, return original text
			return nil, text
		}

		unit := match[2]
		remaining := match[3]

		// Check if this looks like a quantity (has a unit or remaining text makes sense)
		// Avoid matching things like "10 potatoes" as quantity+unit
		if unit != "" || isLikelyQuantity(match[1], remaining) {
			return &models.Quantity{
				Min:  &value,
				Max:  &value,
				Unit: unit,
			}, remaining
		}
	}

	// No quantity found
	return nil, text
}

// parseQuantityAtEnd tries to match quantity patterns at the end of text
func parseQuantityAtEnd(text string) (*models.Quantity, string) {
	// First check for quantities in parentheses like "Milk (2L)"
	// Extract from parentheticals first
	if matches := parentheticalRegex.FindAllStringSubmatch(text, -1); len(matches) > 0 {
		for _, match := range matches {
			parenContent := match[1]
			// Try to parse the content as a quantity
			qty, _ := parseSimpleQuantityOnly(parenContent)
			if qty != nil {
				// Remove the parenthetical from the text to get the item name
				itemText := parentheticalRegex.ReplaceAllString(text, "")
				itemText = strings.TrimSpace(itemText)
				return qty, itemText
			}
		}
	}

	// Try "Item, Xunit" pattern (e.g., "Carrots, 5kg")
	if match := endQuantityWithCommaRegex.FindStringSubmatch(text); match != nil {
		itemText := strings.TrimSpace(match[1])
		value, _ := strconv.ParseFloat(match[2], 64)
		unit := match[3]
		return &models.Quantity{
			Min:  &value,
			Max:  &value,
			Unit: unit,
		}, itemText
	}

	// Try "Item - Xunit" pattern (e.g., "Flour - 2kg")
	// But be careful not to match range patterns from beginning
	if match := endQuantityWithDashRegex.FindStringSubmatch(text); match != nil {
		itemText := strings.TrimSpace(match[1])
		// Make sure itemText doesn't look like a number (to avoid matching "2-3kg" incorrectly)
		if _, err := strconv.ParseFloat(itemText, 64); err != nil {
			value, _ := strconv.ParseFloat(match[2], 64)
			unit := match[3]
			return &models.Quantity{
				Min:  &value,
				Max:  &value,
				Unit: unit,
			}, itemText
		}
	}

	// Try "Item Xunit" pattern (e.g., "Carrots 5kg")
	if match := endQuantityNoSepRegex.FindStringSubmatch(text); match != nil {
		itemText := strings.TrimSpace(match[1])
		value, _ := strconv.ParseFloat(match[2], 64)
		unit := match[3]

		// Only accept if unit looks like a real unit (not a word)
		if isUnit(unit) {
			return &models.Quantity{
				Min:  &value,
				Max:  &value,
				Unit: unit,
			}, itemText
		}
	}

	// No quantity found
	return nil, text
}

// parseSimpleQuantityOnly parses just a quantity string like "2L", "5kg", or "2 L"
func parseSimpleQuantityOnly(text string) (*models.Quantity, string) {
	// Match patterns like "2L", "5kg", "1.5L", "2 L"
	quantityOnlyRegex := regexp.MustCompile(`^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$`)
	if match := quantityOnlyRegex.FindStringSubmatch(text); match != nil {
		value, _ := strconv.ParseFloat(match[1], 64)
		unit := match[2]
		return &models.Quantity{
			Min:  &value,
			Max:  &value,
			Unit: unit,
		}, ""
	}
	return nil, text
}

// isUnit checks if a string looks like a measurement unit
func isUnit(s string) bool {
	commonUnits := []string{
		"kg", "g", "mg", "lb", "oz",
		"l", "ml", "dl", "cl", "gal", "qt", "pt",
		"cup", "cups", "tbsp", "tsp", "tablespoon", "tablespoons", "teaspoon", "teaspoons",
		"m", "cm", "mm", "ft", "in",
	}
	lowerUnit := strings.ToLower(s)
	return slices.Contains(commonUnits, lowerUnit)
}

// isLikelyQuantity checks if a number is likely a quantity rather than just a count
func isLikelyQuantity(numStr string, remaining string) bool {
	// If there's a decimal point, it's likely a quantity
	if strings.Contains(numStr, ".") {
		return true
	}

	// If the remaining text starts with common measurement words, it's a quantity
	lowerRemaining := strings.ToLower(remaining)
	quantityWords := []string{"cup", "tablespoon", "teaspoon", "tbsp", "tsp", "oz", "lb", "gram", "liter"}
	for _, word := range quantityWords {
		if strings.HasPrefix(lowerRemaining, word) {
			return true
		}
	}

	// Small numbers (< 10) with simple nouns might just be counts
	// Larger numbers are probably quantities
	num, _ := strconv.ParseFloat(numStr, 64)
	return num >= 10
}

// NormalizeItemName converts item name to lowercase and trims whitespace
func NormalizeItemName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

// Keep private version for internal use
func normalizeItemName(name string) string {
	return NormalizeItemName(name)
}

// NormalizeToShoppingList converts plain markdown lists to shopping list format
// - Converts `- item` to `- [ ] item`
// - Preserves checked state from `[x]` items
// - Flattens nested lists by removing indentation
// - Preserves links and parenthetical notes
func NormalizeToShoppingList(content string) string {
	if content == "" {
		return ""
	}

	lines := strings.Split(content, "\n")
	var normalized []string

	// Regex patterns
	plainListRegex := regexp.MustCompile(`^(\s*)-\s+(.+)$`)        // Matches plain list items
	checkboxListRegex := regexp.MustCompile(`^(\s*)-\s*\[([ xX])\]\s*(.+)$`) // Matches checkbox items

	for _, line := range lines {
		// Skip empty lines
		if strings.TrimSpace(line) == "" {
			normalized = append(normalized, "")
			continue
		}

		// If it's already a checkbox item, preserve it (flatten indentation)
		if checkboxMatch := checkboxListRegex.FindStringSubmatch(line); checkboxMatch != nil {
			checkState := checkboxMatch[2]
			itemText := checkboxMatch[3]
			// Flatten: remove indentation
			normalized = append(normalized, fmt.Sprintf("- [%s] %s", checkState, itemText))
			continue
		}

		// If it's a plain list item, convert to checkbox (flatten indentation)
		if plainMatch := plainListRegex.FindStringSubmatch(line); plainMatch != nil {
			itemText := plainMatch[2]
			// Convert to unchecked checkbox
			normalized = append(normalized, fmt.Sprintf("- [ ] %s", itemText))
			continue
		}

		// Not a list item, keep as-is (headers, paragraphs, etc.)
		normalized = append(normalized, line)
	}

	return strings.Join(normalized, "\n")
}
