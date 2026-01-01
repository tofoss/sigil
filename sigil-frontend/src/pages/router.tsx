// eslint-disable-next-line no-restricted-imports
import { createBrowserRouter, ScrollRestoration } from "react-router-dom"
import { Layout, PublicLayout } from "shared/Layout"
import { pages } from "./pages"

// Normalize base route: ensure leading slash, remove trailing slash
const getBasename = () => {
  const base = import.meta.env.BASE_URL
  return base === "/" ? undefined : base
}

export const router = createBrowserRouter([
  {
    element: (
      <>
        <ScrollRestoration getKey={(location) => location.pathname} />
        <PublicLayout />
      </>
    ),
    children: [
      {
        path: pages.public.login.path,
        lazy: () => import("./Login"),
      },
      {
        path: pages.public.register.path,
        lazy: () => import("./Register"),
      },
    ],
  },
  {
    element: (
      <>
        <ScrollRestoration getKey={(location) => location.pathname} />
        <Layout />
      </>
    ),
    children: [
      {
        path: pages.private.home.path,
        lazy: () => import("./Browse"),
      },
      {
        path: pages.private.browse.path,
        lazy: () => import("./Browse"),
      },
      {
        path: pages.private.new.path,
        lazy: () => import("./New"),
      },
      {
        path: pages.private.recipe.path,
        lazy: () => import("./Recipe"),
      },
      {
        path: pages.private.shoppingList.path,
        lazy: () => import("./ShoppingList/New"),
      },
      {
        path: "/shopping-lists/:id",
        lazy: () => import("./ShoppingList"),
      },
      {
        path: pages.sub.note.path,
        lazy: () => import("./Note"),
      },
      {
        path: pages.private.notebooks.path,
        lazy: () => import("./Notebooks"),
      },
      {
        path: pages.sub.notebook.path,
        lazy: () => import("./Notebook"),
      },
    ],
  },
], {
  basename: getBasename(),
})
