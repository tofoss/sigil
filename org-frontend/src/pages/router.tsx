// eslint-disable-next-line no-restricted-imports
import { createBrowserRouter, ScrollRestoration } from "react-router-dom"
import { Layout, PublicLayout } from "shared/Layout"
import { pages } from "./pages"

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
        path: pages.sub.note.path,
        lazy: () => import("./Note"),
      },
      /*
		{
			path: "/products",
			loader: productsPageLoader,
			lazy: () => import("./Products"),
		},
		{
			path: "/products/:productId",
			loader: productPageLoader,
			lazy: () => import("./Product"),
		},
		{
			path: "/cart/:cartId",
			loader: cartPageLoader,
			lazy: () => import("./Cart"),
		},
		*/
    ],
  },
])
