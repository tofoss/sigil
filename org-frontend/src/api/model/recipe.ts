// eslint-disable-next-line no-restricted-imports
import dayjs, { Dayjs } from "dayjs"

export interface Recipe {
  id: string
  name: string
  summary?: string
  servings?: number
  prepTime?: string
  sourceUrl?: string
  ingredients: Ingredient[]
  steps: string[]
  createdAt: Dayjs
  updatedAt: Dayjs
}

export interface Ingredient {
  name: string
  quantity?: Quantity
  isOptional: boolean
  notes: string
}

export interface Quantity {
  min?: number
  max?: number
  unit: string
}

export interface RecipeJob {
  id: string
  userId: string
  url: string
  status: "pending" | "processing" | "completed" | "failed"
  errorMessage?: string
  recipeId?: string
  noteId?: string
  createdAt: Dayjs
  completedAt?: Dayjs
}

export interface CreateRecipeRequest {
  url: string
}

export interface CreateRecipeResponse {
  jobId: string
}

export interface RecipeJobResponse {
  job: RecipeJob
  recipe?: Recipe
  note?: {
    id: string
    title: string
    content: string
  }
}

export function fromRecipeJson(recipe: Recipe): Recipe {
  return {
    ...recipe,
    createdAt: dayjs(recipe.createdAt),
    updatedAt: dayjs(recipe.updatedAt),
  }
}

export function fromJobJson(job: RecipeJob): RecipeJob {
  return {
    ...job,
    createdAt: dayjs(job.createdAt),
    completedAt: job.completedAt ? dayjs(job.completedAt) : undefined,
  }
}

export function fromJobResponseJson(
  response: RecipeJobResponse
): RecipeJobResponse {
  return {
    ...response,
    job: fromJobJson(response.job),
    recipe: response.recipe ? fromRecipeJson(response.recipe) : undefined,
  }
}
