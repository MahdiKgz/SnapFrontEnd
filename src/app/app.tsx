import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";

import { AuthSessionManager } from "@features/auth";
import { ThemeSync } from "@features/theme";

import { HealingSyncManager } from "./providers/healing-sync";
import { appRouter } from "./router/app-router";
import { store } from "./store";

export function App() {
  return (
    <>
      <ThemeSync />
      <Provider store={store}>
        <HealingSyncManager />
        <AuthSessionManager>
          <RouterProvider router={appRouter} />
        </AuthSessionManager>
      </Provider>
    </>
  );
}
