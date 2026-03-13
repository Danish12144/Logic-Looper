export const getLocalDayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const addDaysToKey = (dayKey, amount) => {
  const date = new Date(`${dayKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return getLocalDayKey(date);
};

export const getDayOfYear = (dayKey) => {
  const date = new Date(`${dayKey}T00:00:00`);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};