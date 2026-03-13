import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import gameReducer from "./gameSlice";
import leaderboardReducer from "./leaderboardSlice";
import settingsReducer from "./settingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    leaderboard: leaderboardReducer,
    settings: settingsReducer,
  },
});