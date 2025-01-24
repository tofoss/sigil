import { IconType } from "react-icons"
import { LuBook, LuHome, LuLogIn, LuPlus } from "react-icons/lu"

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
      path: "/articles/new",
      display: "New Article",
      icon: LuPlus,
    },
    browse: {
      path: "/articles/browse",
      display: "Browse",
      icon: LuBook,
    },
  },
}
