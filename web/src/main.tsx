import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CanvasThemeProvider } from "./shims/cursor-canvas";
import Atlas from "./Atlas";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CanvasThemeProvider>
      <Atlas />
    </CanvasThemeProvider>
  </StrictMode>,
);
