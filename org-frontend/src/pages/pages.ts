import { IconType } from "react-icons"
import {
  LuAtom,
  LuBookOpen,
  LuChefHat,
  LuHome,
  LuLogIn,
  LuPlus,
  LuUserPlus,
} from "react-icons/lu"

interface Page {
  path: string
  display: string
  icon: IconType
}

interface Pages {
  public: {
    login: Page
    register: Page
  }
  private: {
    home: Page
    new: Page
    recipe: Page
    notebooks: Page
    browse: Page
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
    register: {
      path: "/register",
      display: "Register",
      icon: LuUserPlus,
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
    browse: {
      path: "/notes/browse",
      display: "Browse",
      icon: LuHome,
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
