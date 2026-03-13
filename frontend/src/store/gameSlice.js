import { createSlice } from "@reduxjs/toolkit";
import { getLocalDayKey } from "../utils/date";

const initialState = {
  dayKey: getLocalDayKey(),
  puzzles: [],
  selectedPuzzleId: null,
  hydrationComplete: false,
  solvedById: {},
  hintsUsed: 0,
  hintLimit: 3,
  pendingEvents: [],
  syncStatus: "idle",
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    hydrateDay(state, action) {
      const { dayKey, puzzles, progress } = action.payload;
      state.dayKey = dayKey;
      state.puzzles = puzzles;
      state.selectedPuzzleId = puzzles?.[0]?.id || null;
      state.hydrationComplete = true;
      state.solvedById = progress?.solvedById || {};
      state.hintsUsed = progress?.hintsUsed || 0;
      state.pendingEvents = progress?.pendingEvents || [];
    },
    selectPuzzle(state, action) {
      state.selectedPuzzleId = action.payload;
    },
    incrementHintUsage(state) {
      if (state.hintsUsed < state.hintLimit) {
        state.hintsUsed += 1;
      }
    },
    markPuzzleSolved(state, action) {
      const { puzzleId, eventPayload } = action.payload;
      if (!state.solvedById[puzzleId]) {
        state.solvedById[puzzleId] = true;
        state.pendingEvents.push(eventPayload);
      }
    },
    markBatchSynced(state, action) {
      const count = action.payload;
      state.pendingEvents = state.pendingEvents.slice(count);
    },
    setSyncStatus(state, action) {
      state.syncStatus = action.payload;
    },
    setOnlineState(state, action) {
      state.isOnline = action.payload;
    },
    setCurrentDay(state, action) {
      state.dayKey = action.payload;
      state.puzzles = [];
      state.selectedPuzzleId = null;
      state.hydrationComplete = false;
      state.solvedById = {};
      state.hintsUsed = 0;
      state.pendingEvents = [];
      state.syncStatus = "idle";
    },
  },
});

export const {
  hydrateDay,
  selectPuzzle,
  incrementHintUsage,
  markPuzzleSolved,
  markBatchSynced,
  setSyncStatus,
  setOnlineState,
  setCurrentDay,
} = gameSlice.actions;

export default gameSlice.reducer;