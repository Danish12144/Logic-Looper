import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("REACT_APP_BACKEND_URL is required");
}

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
});

export const loginGuest = async (name) => {
  const { data } = await api.post("/auth/guest", { name });
  return data;
};

export const loginGoogle = async (idToken) => {
  const { data } = await api.post("/auth/google", { id_token: idToken });
  return data;
};

export const fetchMe = async (token) => {
  const { data } = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const syncProgress = async (token, puzzleEvents) => {
  const { data } = await api.post(
    "/progress/sync",
    { puzzle_events: puzzleEvents },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
};

export const syncDailyScore = async (token, puzzleEvent) => {
  const { data } = await api.post(
    "/sync/daily-scores",
    { puzzle_event: puzzleEvent },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
};

export const fetchLeaderboard = async () => {
  const { data } = await api.get("/leaderboard");
  return data;
};

export const fetchHeatmap = async (token) => {
  const { data } = await api.get("/stats/heatmap", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};