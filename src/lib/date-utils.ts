
import { format, parse } from 'date-fns';

// Format date as YYYY-MM-DD (for input fields)
export const formatDateForInput = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Format date as DD MMM YYYY (for display)
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd MMM yyyy');
};

// Get current month and year
export const getCurrentMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
  };
};

// Get month name from month number (0-based)
export const getMonthName = (month: number): string => {
  const date = new Date();
  date.setMonth(month);
  return format(date, 'MMMM');
};

// Get array of previous n months
export const getPreviousMonths = (n: number): { month: number; year: number }[] => {
  const result: { month: number; year: number }[] = [];
  const now = new Date();
  
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    result.push({
      month: date.getMonth(),
      year: date.getFullYear(),
    });
  }
  
  return result;
};

// Group by month
export const groupByMonth = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
};
