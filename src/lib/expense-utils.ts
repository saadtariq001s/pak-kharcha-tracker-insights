
import { Expense, ExpenseCategory } from '../context/ExpenseContext';
import { groupByMonth } from './date-utils';

// Calculate total expenses
export const calculateTotal = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

// Calculate average daily expense for a period
export const calculateDailyAverage = (expenses: Expense[]): number => {
  if (expenses.length === 0) return 0;
  
  const total = calculateTotal(expenses);
  const dates = expenses.map(expense => new Date(expense.date).getTime());
  
  const earliestDate = new Date(Math.min(...dates));
  const latestDate = new Date(Math.max(...dates));
  
  // Calculate the difference in days
  const dayDiff = Math.max(1, Math.floor((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  return total / dayDiff;
};

// Calculate month-to-month spending change percentage
export const calculateMonthlyChangePercentage = (
  currentMonthTotal: number,
  previousMonthTotal: number
): number => {
  if (previousMonthTotal === 0) return 0;
  return ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
};

// Group expenses by month
export const groupExpensesByMonth = (expenses: Expense[]): Record<string, Expense[]> => {
  return expenses.reduce<Record<string, Expense[]>>((grouped, expense) => {
    const key = groupByMonth(expense.date);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(expense);
    return grouped;
  }, {});
};

// Calculate expenses trend over the last n months
export const calculateExpenseTrend = (
  expenses: Expense[],
  months: number = 6
): { month: string; total: number }[] => {
  const now = new Date();
  const result: { month: string; total: number }[] = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthYear = targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === targetDate.getMonth() && 
             expenseDate.getFullYear() === targetDate.getFullYear();
    });
    
    const total = calculateTotal(monthExpenses);
    result.push({ month: monthYear, total });
  }
  
  return result;
};

// Find top spending categories
export const findTopCategories = (
  expenses: Expense[],
  limit: number = 3
): { category: ExpenseCategory; amount: number; percentage: number }[] => {
  if (expenses.length === 0) return [];
  
  // Group by category
  const categoryTotals = expenses.reduce<Record<string, number>>((totals, expense) => {
    const { category, amount } = expense;
    totals[category] = (totals[category] || 0) + amount;
    return totals;
  }, {});
  
  const totalSpent = calculateTotal(expenses);
  
  // Convert to array and sort
  const categoriesArray = Object.entries(categoryTotals).map(([category, amount]) => ({
    category: category as ExpenseCategory,
    amount,
    percentage: (amount / totalSpent) * 100
  }));
  
  // Sort by amount (descending) and limit results
  return categoriesArray.sort((a, b) => b.amount - a.amount).slice(0, limit);
};

// Calculate potential savings based on category benchmarks
// These values are approximations for Pakistan's context
const CATEGORY_BENCHMARKS: Record<ExpenseCategory, number> = {
  'Food & Groceries': 35, // 35% of total expenses
  'Transportation': 15,
  'Utilities': 10,
  'Housing': 30,
  'Healthcare': 5,
  'Education': 10,
  'Entertainment': 5,
  'Shopping': 10,
  'Charity/Zakat': 2.5, // Typical zakat percentage 
  'Mobile/Internet': 5,
  'Family Support': 10,
  'Debt Payment': 20,
  'Miscellaneous': 5,
};

export const calculateSavingsPotential = (
  expenses: Expense[],
  monthlyIncome: number
): { category: ExpenseCategory; currentAmount: number; recommendedAmount: number; potentialSaving: number }[] => {
  if (expenses.length === 0 || monthlyIncome <= 0) return [];
  
  const totalExpenses = calculateTotal(expenses);
  
  // Group by category
  const categoryTotals = expenses.reduce<Record<string, number>>((totals, expense) => {
    const { category, amount } = expense;
    totals[category] = (totals[category] || 0) + amount;
    return totals;
  }, {});
  
  // Calculate potential savings by category
  return Object.entries(categoryTotals)
    .map(([category, amount]) => {
      const categoryName = category as ExpenseCategory;
      const benchmarkPercentage = CATEGORY_BENCHMARKS[categoryName];
      const recommendedAmount = (totalExpenses * benchmarkPercentage) / 100;
      
      // Only suggest savings if current amount exceeds recommended amount
      const potentialSaving = amount > recommendedAmount ? amount - recommendedAmount : 0;
      
      return {
        category: categoryName,
        currentAmount: amount,
        recommendedAmount,
        potentialSaving,
      };
    })
    .filter(item => item.potentialSaving > 0)
    .sort((a, b) => b.potentialSaving - a.potentialSaving);
};

// Format currency as PKR
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ur-PK', { 
    style: 'currency', 
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper to generate sample data for current month (for initial UI before user adds data)
export const generateSampleData = (): Expense[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const startDate = new Date(currentYear, currentMonth, 1);
  const endDate = new Date(currentYear, currentMonth + 1, 0);
  
  const sampleCategories: ExpenseCategory[] = [
    'Food & Groceries',
    'Transportation',
    'Utilities',
    'Housing',
    'Healthcare',
    'Mobile/Internet',
    'Entertainment'
  ];
  
  const sampleExpenses: Expense[] = [];
  
  // Generate sample groceries expenses
  for (let i = 0; i < 4; i++) {
    const date = new Date(
      currentYear,
      currentMonth,
      Math.floor(Math.random() * endDate.getDate()) + 1
    );
    
    sampleExpenses.push({
      id: crypto.randomUUID(),
      amount: Math.floor(Math.random() * 3000) + 2000,
      category: 'Food & Groceries',
      description: 'Weekly grocery shopping',
      date: date.toISOString().split('T')[0],
    });
  }
  
  // Generate sample utility expenses
  sampleExpenses.push({
    id: crypto.randomUUID(),
    amount: Math.floor(Math.random() * 5000) + 5000,
    category: 'Utilities',
    description: 'Electricity bill',
    date: new Date(currentYear, currentMonth, 15).toISOString().split('T')[0],
  });
  
  sampleExpenses.push({
    id: crypto.randomUUID(),
    amount: Math.floor(Math.random() * 1500) + 1000,
    category: 'Utilities',
    description: 'Water bill',
    date: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0],
  });
  
  // Generate sample transportation expenses
  for (let i = 0; i < 5; i++) {
    const date = new Date(
      currentYear,
      currentMonth,
      Math.floor(Math.random() * endDate.getDate()) + 1
    );
    
    sampleExpenses.push({
      id: crypto.randomUUID(),
      amount: Math.floor(Math.random() * 500) + 300,
      category: 'Transportation',
      description: 'Fuel',
      date: date.toISOString().split('T')[0],
    });
  }
  
  // Generate other random expenses
  for (let i = 0; i < 10; i++) {
    const date = new Date(
      currentYear,
      currentMonth,
      Math.floor(Math.random() * endDate.getDate()) + 1
    );
    
    const category = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
    
    sampleExpenses.push({
      id: crypto.randomUUID(),
      amount: Math.floor(Math.random() * 2000) + 500,
      category,
      description: `${category} expense`,
      date: date.toISOString().split('T')[0],
    });
  }
  
  return sampleExpenses;
};
