import { getLocalDayKey } from "./date";

export const getHeatmapDaysCount = (year) => {
  const leap = new Date(year, 1, 29).getMonth() === 1;
  return leap ? 366 : 365;
};

export const getIntensityLevel = (activity) => {
  if (!activity?.completed) return 0;
  if (activity.score >= 230) return 4;
  if (activity.difficulty === "Hard") return 3;
  if (activity.difficulty === "Medium") return 2;
  return 1;
};

export const generateHeatmapGrid = (activities = {}, referenceDate = new Date()) => {
  const year = referenceDate.getFullYear();
  const totalDays = getHeatmapDaysCount(year);
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - (totalDays - 1));

  const days = [];
  for (let i = 0; i < totalDays; i += 1) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    const key = getLocalDayKey(day);
    const activity = activities[key] || null;
    days.push({
      dayKey: key,
      date: day,
      isToday: key === getLocalDayKey(referenceDate),
      intensity: getIntensityLevel(activity),
      activity,
    });
  }

  const columns = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }
  return columns;
};