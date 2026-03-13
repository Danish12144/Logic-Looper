import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginGoogle, loginGuest, fetchMe } from "../services/api";
import { clearSession, loadSession, saveSession } from "../services/db";

const initialState = {
  token: null,
  user: null,
  status: "idle",
  error: null,
};

export const bootstrapSession = createAsyncThunk("auth/bootstrapSession", async () => {
  const session = await loadSession();
  if (!session?.token) return null;
  try {
    const user = await fetchMe(session.token);
    const result = { token: session.token, user };
    await saveSession(result);
    return result;
  } catch {
    await clearSession();
    return null;
  }
});

export const guestLoginThunk = createAsyncThunk("auth/guestLogin", async (name) => {
  const response = await loginGuest(name);
  await saveSession(response);
  return response;
});

export const googleLoginThunk = createAsyncThunk("auth/googleLogin", async (idToken) => {
  const response = await loginGoogle(idToken);
  await saveSession(response);
  return response;
});

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await clearSession();
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "idle";
    },
    applyStatsUpdate(state, action) {
      if (!state.user) return;
      state.user = {
        ...state.user,
        streak: action.payload.streak,
        longest_streak: action.payload.longest_streak,
        total_solved: action.payload.total_solved,
        total_score: action.payload.total_score,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.status = "loading";
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.status = "idle";
        state.token = action.payload?.token || null;
        state.user = action.payload?.user || null;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.status = "idle";
      })
      .addCase(guestLoginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(guestLoginThunk.fulfilled, (state, action) => {
        state.status = "idle";
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(guestLoginThunk.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
      })
      .addCase(googleLoginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(googleLoginThunk.fulfilled, (state, action) => {
        state.status = "idle";
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(googleLoginThunk.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.status = "idle";
      });
  },
});

export const { logout, applyStatsUpdate } = authSlice.actions;
export default authSlice.reducer;