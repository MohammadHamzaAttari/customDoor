import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

// Use startTransition so React doesn't block the main thread during hydration
React.startTransition(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// Remove the static shell once React has painted
requestAnimationFrame(() => {
  const shell = document.getElementById("app-shell");
  if (shell) {
    shell.style.transition = "opacity 0.3s ease";
    shell.style.opacity = "0";
    setTimeout(() => shell.remove(), 300);
  }
});