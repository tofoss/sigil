import { IconType } from "react-icons"
import {
  LuAtom,
  LuBook,
  LuBookOpen,
  LuChefHat,
  LuHome,
  LuLogIn,
  LuPlus,
} from "react-icons/lu"

interface Page {
  path: string
  display: string
  icon: IconType
}

interface Pages {
  public: {
    login: Page
  }
  private: {
    home: Page
    browse: Page
    new: Page
    recipe: Page
    structure: Page
    notebooks: Page
  }
  sub: {
    note: Page
    notebook: Page
  }
}

export const pages: Pages = {
  public: {
    login: {
      path: "/login",
      display: "Login",
      icon: LuLogIn,
    },
  },
  private: {
    home: {
      path: "/",
      display: "Home",
      icon: LuHome,
    },
    new: {
      path: "/notes/new",
      display: "New Note",
      icon: LuPlus,
    },
    browse: {
      path: "/notes/browse",
      display: "Browse",
      icon: LuBook,
    },
    recipe: {
      path: "/recipes/new",
      display: "New Recipe",
      icon: LuChefHat,
    },
    notebooks: {
      path: "/notebooks",
      display: "Notebooks",
      icon: LuBookOpen,
    },
    structure: {
      path: "/structure",
      display: "Structure",
      icon: LuAtom,
    },
  },
  sub: {
    note: {
      path: "/notes/:id",
      display: "Note",
      icon: LuAtom,
    },
    notebook: {
      path: "/notebooks/:id",
      display: "Notebook",
      icon: LuBookOpen,
    },
  },
}
