import { configureStore } from "@reduxjs/toolkit";
import agentReducer from "./agentSlice";
export const store = configureStore({
  reducer: {
    agentFeature: agentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
