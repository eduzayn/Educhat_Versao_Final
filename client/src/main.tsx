import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Filter out react-beautiful-dnd deprecation warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('Support for defaultProps will be removed from memo components')) {
    return; // Suppress this specific warning
  }
  originalWarn.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
