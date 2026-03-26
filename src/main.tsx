import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import {
  hydrateQueryClientFromStorage,
  queryClient,
  setupQueryCachePersistence,
} from "./lib/queryClient";

hydrateQueryClientFromStorage();
setupQueryCachePersistence();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
