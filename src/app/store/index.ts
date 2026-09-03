import { authApi } from "@/features/auth/api/auth-api";
import authReducer, { logout } from "@/features/auth/model/auth-slice";
import { topologyApi } from "@/features/topology";
import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";

const sessionListener = createListenerMiddleware();

sessionListener.startListening({
  actionCreator: logout,
  effect: (_action, api) => {
    api.dispatch(authApi.util.resetApiState());
    api.dispatch(topologyApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [topologyApi.reducerPath]: topologyApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(sessionListener.middleware)
      .concat(authApi.middleware, topologyApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
