import { client } from "./client"
import { commonHeaders } from "./utils"

// Types for the tree structure from the backend
export interface TreeNote {
  id: string
  title: string
}

export interface TreeSection {
  id: string
  title: string
  notes: TreeNote[]
}

export interface TreeNotebook {
  id: string
  title: string
  sections: TreeSection[]
  unsectioned: TreeNote[]
}

export interface TreeData {
  notebooks: TreeNotebook[]
  unassigned: TreeNote[]
}

export const treeClient = {
  fetch: async (): Promise<TreeData> => {
    return await client
      .get("tree", {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<TreeData>()
  },
}
