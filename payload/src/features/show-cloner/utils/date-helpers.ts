/**
 * Helper function to get the most recent Monday
 */
export const getMostRecentMonday = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; otherwise go back to Monday
  result.setDate(result.getDate() + diff);
  return result;
};

/**
 * Helper function to format date as YYYY-MM-DD
 */
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculate default date ranges for the Show Cloner
 * Source: Most recent complete week (Mon-Sun that has already ended)
 * Target: The upcoming Monday (next week)
 */
export const getDefaultDateRanges = () => {
  const today = new Date();
  const currentMonday = getMostRecentMonday(today);

  // Get the Monday of the previous week (the most recent complete week)
  const lastWeekMonday = new Date(currentMonday);
  lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);

  const lastWeekSunday = new Date(lastWeekMonday);
  lastWeekSunday.setDate(lastWeekSunday.getDate() + 6);

  // Target: Next Monday (the week after current)
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  return {
    sourceStartDate: formatDateForInput(lastWeekMonday),
    sourceEndDate: formatDateForInput(lastWeekSunday),
    targetStartDate: formatDateForInput(nextMonday),
  };
};
