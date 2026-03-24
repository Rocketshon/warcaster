
  import './lib/errorTracking';
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import './lib/i18n';
  import "./styles/index.css";

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("Root element #root not found in DOM");
  createRoot(rootEl).render(<App />);
  