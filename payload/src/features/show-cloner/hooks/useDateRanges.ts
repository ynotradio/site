import { useState } from 'react';
import { getDaysDifference, addDays } from '../utils';

const getMostRecentMonday = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
};

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useDateRanges = () => {
  const today = new Date();
  const currentMonday = getMostRecentMonday(today);
  const lastWeekMonday = new Date(currentMonday);
  lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
  const lastWeekSunday = new Date(lastWeekMonday);
  lastWeekSunday.setDate(lastWeekSunday.getDate() + 6);
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const [sourceStartDate, setSourceStartDate] = useState<string>(
    formatDateForInput(lastWeekMonday),
  );
  const [sourceEndDate, setSourceEndDate] = useState<string>(formatDateForInput(lastWeekSunday));
  const [targetStartDate, setTargetStartDate] = useState<string>(formatDateForInput(nextMonday));

  const targetEndDate = sourceStartDate && sourceEndDate && targetStartDate
    ? addDays(targetStartDate, getDaysDifference(sourceStartDate, sourceEndDate))
    : '';

  return {
    sourceStartDate,
    sourceEndDate,
    targetStartDate,
    targetEndDate,
    setSourceStartDate,
    setSourceEndDate,
    setTargetStartDate,
  };
};
