import { openDB } from "idb";
import { compressToUTF16, decompressFromUTF16 } from "lz-string";

const DB_NAME = "logic-looper-db";
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains("daily_puzzles")) {
      database.createObjectStore("daily_puzzles");
    }
    if (!database.objectStoreNames.contains("daily_progress")) {
      database.createObjectStore("daily_progress");
    }
    if (!database.objectStoreNames.contains("session")) {
      database.createObjectStore("session");
    }
    if (!database.objectStoreNames.contains("settings")) {
      database.createObjectStore("settings");
    }
    if (!database.objectStoreNames.contains("daily_activity")) {
      database.createObjectStore("daily_activity");
    }
  },
});

const compressValue = (value) => compressToUTF16(JSON.stringify(value));

const decompressValue = (value) => {
  if (!value) return null;
  const raw = decompressFromUTF16(value);
  return raw ? JSON.parse(raw) : null;
};

export const cacheDailyPuzzles = async (dayKey, puzzles) => {
  const db = await dbPromise;
  await db.put("daily_puzzles", compressValue(puzzles), dayKey);
};

export const getCachedDailyPuzzles = async (dayKey) => {
  const db = await dbPromise;
  const compressed = await db.get("daily_puzzles", dayKey);
  return decompressValue(compressed);
};

export const saveDailyProgress = async (dayKey, payload) => {
  const db = await dbPromise;
  await db.put("daily_progress", compressValue(payload), dayKey);
};

export const loadDailyProgress = async (dayKey) => {
  const db = await dbPromise;
  const compressed = await db.get("daily_progress", dayKey);
  return decompressValue(compressed);
};

export const saveSession = async (session) => {
  const db = await dbPromise;
  await db.put("session", compressValue(session), "auth");
};

export const loadSession = async () => {
  const db = await dbPromise;
  const compressed = await db.get("session", "auth");
  return decompressValue(compressed);
};

export const clearSession = async () => {
  const db = await dbPromise;
  await db.delete("session", "auth");
};

export const saveSettings = async (settings) => {
  const db = await dbPromise;
  await db.put("settings", compressValue(settings), "preferences");
};

export const loadSettings = async () => {
  const db = await dbPromise;
  const compressed = await db.get("settings", "preferences");
  return decompressValue(compressed);
};

export const saveDailyActivity = async (dayKey, payload) => {
  const db = await dbPromise;
  await db.put("daily_activity", compressValue(payload), dayKey);
};

export const getDailyActivity = async (dayKey) => {
  const db = await dbPromise;
  const compressed = await db.get("daily_activity", dayKey);
  return decompressValue(compressed);
};

export const getAllDailyActivities = async () => {
  const db = await dbPromise;
  const keys = await db.getAllKeys("daily_activity");
  const values = await db.getAll("daily_activity");

  const map = {};
  keys.forEach((key, index) => {
    map[key] = decompressValue(values[index]);
  });
  return map;
};