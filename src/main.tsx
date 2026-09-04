import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";

import { appRouter } from "./app/routes/app-router.tsx";
import { store } from "./app/store";
import { AuthSessionManager } from "./features/auth/ui/auth-session-manager.tsx";
import { HealingSyncManager } from "./features/topology/ui/healing-sync-manager.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <HealingSyncManager />
      <AuthSessionManager>
        <RouterProvider router={appRouter} />
      </AuthSessionManager>
    </Provider>
  </StrictMode>,
);
