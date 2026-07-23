import { authApi } from "@/features/auth/api/auth-api";
import authReducer from "@/features/auth/model/auth-slice";
import { topologyApi } from "@/features/topology";
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [topologyApi.reducerPath]: topologyApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, topologyApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
