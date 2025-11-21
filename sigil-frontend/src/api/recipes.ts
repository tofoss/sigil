import { client } from "./client"
import {
  CreateRecipeRequest,
  CreateRecipeResponse,
  RecipeJobResponse,
  fromJobResponseJson,
} from "./model/recipe"
import { commonHeaders } from "./utils"

export const recipeClient = {
  createFromUrl: (url: string) =>
    client
      .post("recipes", {
        json: { url } as CreateRecipeRequest,
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<CreateRecipeResponse>(),

  getJobStatus: (jobId: string) =>
    client
      .get(`recipes/jobs/${jobId}`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<RecipeJobResponse>()
      .then(fromJobResponseJson),
}
