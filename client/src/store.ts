import type { PayloadAction } from "@reduxjs/toolkit";
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { LoginOutput } from "./api";
import { isClient } from "./utils";

export interface AppState {
  token: string | null;
  user: { id: number; email: string; name: string; createdAt: string } | null;
}

const initialState: AppState = {
  token: isClient() ? localStorage.getItem("token") : null,
  user: isClient() ? JSON.parse(localStorage.getItem("user") || "null") : null,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<LoginOutput>) {
      state.token = action.payload.token;
      localStorage.setItem("token", action.payload.token);
      state.user = action.payload.user;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
  },
});

// Action creators are generated for each case reducer function
export const { loginSuccess } = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
