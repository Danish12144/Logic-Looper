import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchLeaderboard } from "../services/api";

const initialState = {
  entries: [],
  status: "idle",
  error: null,
  generatedAt: null,
};

export const fetchLeaderboardThunk = createAsyncThunk(
  "leaderboard/fetch",
  async () => fetchLeaderboard(),
);

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboardThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLeaderboardThunk.fulfilled, (state, action) => {
        state.status = "ready";
        state.entries = action.payload.entries;
        state.generatedAt = action.payload.generated_at;
      })
      .addCase(fetchLeaderboardThunk.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
      });
  },
});

export default leaderboardSlice.reducer;