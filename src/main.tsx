import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

// Global protection: Prevent accidental number input increment/decrement when scrolling with mousewheel
if (typeof window !== "undefined") {
  window.addEventListener(
    "wheel",
    () => {
      const active = document.activeElement as HTMLInputElement | null
      if (active && active.tagName === "INPUT" && active.type === "number") {
        active.blur()
      }
    },
    { passive: true },
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
