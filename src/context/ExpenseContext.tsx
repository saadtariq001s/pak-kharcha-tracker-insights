// src/context/ExpenseContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { CSVDataManager } from '@/lib/csv-data-manager';

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
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  loading: boolean;
  getMonthlyExpenses: (month: number, year: number) => Expense[];
  getTotalByCategory: (month: number, year: number) => Record<ExpenseCategory, number>;
  getMonthlyTotal: (month: number, year: number) => number;
  getAverageMonthlyExpenditure: () => number;
  exportUserData: () => Promise<void>;
  importUserData: (file: File) => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Load expenses when user changes or component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserExpenses();
    } else {
      setExpenses([]);
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const loadUserExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userExpenses = await CSVDataManager.loadExpenses(user.username);
      setExpenses(userExpenses);
    } catch (error) {
      console.error('Failed to load user expenses:', error);
      toast.error('Failed to load your expense data');
    } finally {
      setLoading(false);
    }
  };

  const saveUserExpenses = async (newExpenses: Expense[]) => {
    if (!user) return;
    
    try {
      const success = await CSVDataManager.saveExpenses(user.username, newExpenses);
      if (!success) {
        toast.error('Failed to save expense data');
      }
    } catch (error) {
      console.error('Failed to save user expenses:', error);
      toast.error('Failed to save expense data');
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) {
      toast.error('You must be logged in to add expenses');
      return;
    }

    try {
      const newExpense = {
        ...expense,
        id: crypto.randomUUID(),
      };

      const newExpenses = [...expenses, newExpense];
      setExpenses(newExpenses);
      await saveUserExpenses(newExpenses);
      toast.success('Expense added successfully');
    } catch (error) {
      console.error('Failed to add expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete expenses');
      return;
    }

    try {
      const newExpenses = expenses.filter((expense) => expense.id !== id);
      setExpenses(newExpenses);
      await saveUserExpenses(newExpenses);
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete expense');
      // Revert on error
      await loadUserExpenses();
    }
  };

  const updateExpense = async (updatedExpense: Expense) => {
    if (!user) {
      toast.error('You must be logged in to update expenses');
      return;
    }

    try {
      const newExpenses = expenses.map((expense) => 
        expense.id === updatedExpense.id ? updatedExpense : expense
      );
      setExpenses(newExpenses);
      await saveUserExpenses(newExpenses);
      toast.success('Expense updated successfully');
    } catch (error) {
      console.error('Failed to update expense:', error);
      toast.error('Failed to update expense');
      // Revert on error
      await loadUserExpenses();
    }
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

  const exportUserData = async () => {
    if (!user) {
      toast.error('You must be logged in to export data');
      return;
    }

    try {
      const fileName = await CSVDataManager.exportUserData(user.username);
      if (fileName) {
        toast.success(`Data exported successfully as ${fileName}`);
      } else {
        toast.error('No data to export');
      }
    } catch (error) {
      console.error('Failed to export user data:', error);
      toast.error('Failed to export data');
    }
  };

  const importUserData = async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to import data');
      return;
    }

    try {
      await CSVDataManager.importUserData(user.username, file);
      await loadUserExpenses(); // Reload data after import
      toast.success('Data imported successfully');
    } catch (error) {
      console.error('Failed to import user data:', error);
      toast.error(`Failed to import data: ${error.message || 'Unknown error'}`);
    }
  };

  const clearAllData = async () => {
    if (!user) {
      toast.error('You must be logged in to clear data');
      return;
    }

    try {
      const success = await CSVDataManager.deleteUserData(user.username);
      if (success) {
        setExpenses([]);
        toast.success('All data cleared successfully');
      } else {
        toast.error('Failed to clear data');
      }
    } catch (error) {
      console.error('Failed to clear user data:', error);
      toast.error('Failed to clear data');
    }
  };

  const refreshData = async () => {
    await loadUserExpenses();
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
        exportUserData,
        importUserData,
        clearAllData,
        refreshData,
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