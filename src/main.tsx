import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AccessGate } from "@/components/access-gate"
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AccessGate>
      <App />
    </AccessGate>
  </StrictMode>,
)
