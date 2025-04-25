
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

// Define expense category types specific to Pakistan
export type ExpenseCategory = 
  | 'Food & Groceries' 
  | 'Transportation' 
  | 'Utilities' 
  | 'Housing' 
  | 'Healthcare' 
  | 'Education' 
  | 'Entertainment' 
  | 'Shopping'
  | 'Charity/Zakat'
  | 'Mobile/Internet'
  | 'Family Support'
  | 'Debt Payment'
  | 'Miscellaneous';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
}

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;
  loading: boolean;
  getMonthlyExpenses: (month: number, year: number) => Expense[];
  getTotalByCategory: (month: number, year: number) => Record<ExpenseCategory, number>;
  getMonthlyTotal: (month: number, year: number) => number;
  getAverageMonthlyExpenditure: () => number;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEY = 'pakistan-expense-tracker';

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Load expenses from localStorage on initial render
  useEffect(() => {
    const storedExpenses = localStorage.getItem(STORAGE_KEY);
    if (storedExpenses) {
      try {
        setExpenses(JSON.parse(storedExpenses));
      } catch (error) {
        console.error('Failed to parse stored expenses', error);
        toast.error('Failed to load your expense data');
      }
    }
    setLoading(false);
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, loading]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = {
      ...expense,
      id: crypto.randomUUID(),
    };

    setExpenses((prev) => [...prev, newExpense]);
    toast.success('Expense added successfully');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    toast.success('Expense deleted');
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses((prev) => 
      prev.map((expense) => 
        expense.id === updatedExpense.id ? updatedExpense : expense
      )
    );
    toast.success('Expense updated');
  };

  // Get expenses for a specific month and year
  const getMonthlyExpenses = (month: number, year: number) => {
    return expenses.filter((expense) => {
      const date = new Date(expense.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  };

  // Calculate total expenses by category for a specific month
  const getTotalByCategory = (month: number, year: number) => {
    const monthlyExpenses = getMonthlyExpenses(month, year);
    
    const initialTotals: Record<ExpenseCategory, number> = {
      'Food & Groceries': 0,
      'Transportation': 0,
      'Utilities': 0,
      'Housing': 0,
      'Healthcare': 0,
      'Education': 0,
      'Entertainment': 0,
      'Shopping': 0,
      'Charity/Zakat': 0,
      'Mobile/Internet': 0,
      'Family Support': 0,
      'Debt Payment': 0,
      'Miscellaneous': 0,
    };

    return monthlyExpenses.reduce((totals, expense) => {
      totals[expense.category] += expense.amount;
      return totals;
    }, initialTotals);
  };

  // Get total expenses for a specific month
  const getMonthlyTotal = (month: number, year: number) => {
    const monthlyExpenses = getMonthlyExpenses(month, year);
    return monthlyExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  // Calculate average monthly expenditure
  const getAverageMonthlyExpenditure = () => {
    if (expenses.length === 0) return 0;
    
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Find the earliest and latest expense dates
    const dates = expenses.map(expense => new Date(expense.date));
    const earliestDate = new Date(Math.min(...dates.map(date => date.getTime())));
    const latestDate = new Date(Math.max(...dates.map(date => date.getTime())));
    
    // Calculate the number of months between the earliest and latest dates
    const monthsDiff = 
      (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + 
      (latestDate.getMonth() - earliestDate.getMonth()) + 1;
    
    // Return average monthly expenditure
    return monthsDiff > 0 ? totalAmount / monthsDiff : totalAmount;
  };

  return (
    <ExpenseContext.Provider 
      value={{
        expenses,
        addExpense,
        deleteExpense,
        updateExpense,
        loading,
        getMonthlyExpenses,
        getTotalByCategory,
        getMonthlyTotal,
        getAverageMonthlyExpenditure,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
