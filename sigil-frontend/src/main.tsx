import React from "react"
import ReactDOM from "react-dom/client"

import { App } from "./app"
import { Provider } from "components/ui/provider"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider>
      <App />
    </Provider>
  </React.StrictMode>
)
