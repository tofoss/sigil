import { IconType } from "react-icons"
import { LuAtom, LuBook, LuHome, LuLogIn, LuPlus } from "react-icons/lu"

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
  }
  sub: {
    note: Page
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
  },
  sub: {
    note: {
      path: "/notes/:id",
      display: "Note",
      icon: LuAtom,
    },
  },
}
