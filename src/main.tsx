import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";

import { appRouter } from "./app/routes/app-router.tsx";
import { store } from "./app/store";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={appRouter} />
    </Provider>
  </StrictMode>,
);
