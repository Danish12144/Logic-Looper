import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  timedChallenge: false,
  reducedMotion: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    hydrateSettings(state, action) {
      if (!action.payload) return;
      state.timedChallenge = Boolean(action.payload.timedChallenge);
      state.reducedMotion = Boolean(action.payload.reducedMotion);
    },
    toggleTimedChallenge(state) {
      state.timedChallenge = !state.timedChallenge;
    },
    toggleReducedMotion(state) {
      state.reducedMotion = !state.reducedMotion;
    },
  },
});

export const { hydrateSettings, toggleTimedChallenge, toggleReducedMotion } = settingsSlice.actions;

export default settingsSlice.reducer;