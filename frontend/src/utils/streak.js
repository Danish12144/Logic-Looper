export const calculateStreakFromDays = (completedDayKeys = [], todayKey) => {
  if (!completedDayKeys.length) return 0;

  const uniqueSorted = [...new Set(completedDayKeys)].sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime(),
  );

  const todayDate = new Date(`${todayKey}T00:00:00`);
  const first = new Date(`${uniqueSorted[0]}T00:00:00`);

  let anchor = null;
  if (first.getTime() === todayDate.getTime()) anchor = todayDate;
  else {
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    if (first.getTime() === yesterday.getTime()) anchor = yesterday;
  }

  if (!anchor) return 0;

  let streak = 0;
  for (let index = 0; index < uniqueSorted.length; index += 1) {
    const expected = new Date(anchor);
    expected.setDate(expected.getDate() - index);
    const day = new Date(`${uniqueSorted[index]}T00:00:00`);
    if (day.getTime() === expected.getTime()) streak += 1;
    else break;
  }

  return streak;
};