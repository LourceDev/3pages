import { LoginOutput } from "@/api";
import type { PayloadAction } from "@reduxjs/toolkit";
import { configureStore, createSlice } from "@reduxjs/toolkit";

export interface AppState {
  token: string | null;
  user: { id: number; email: string; name: string; createdAt: string } | null;
}

const initialState: AppState = {
  token: null,
  user: null,
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
    rehydrate(state) {
      // only runs on client
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token) state.token = token;
      if (user) state.user = JSON.parse(user);
    },
  },
});

// Action creators are generated for each case reducer function
export const { loginSuccess, rehydrate } = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
