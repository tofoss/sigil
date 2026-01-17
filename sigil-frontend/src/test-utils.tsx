import type { PropsWithChildren, ReactElement } from "react"
import { render, RenderOptions } from "@testing-library/react"
import { Provider } from "components/ui/provider"

const AllProviders = ({ children }: PropsWithChildren) => {
  return <Provider>{children}</Provider>
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllProviders, ...options })
