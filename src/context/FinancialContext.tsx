// src/context/FinancialContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { CSVDataManager } from '@/lib/csv-data-manager';

// Define transaction types for startup financial management
export type TransactionType = 'income' | 'expense';

export type IncomeCategory = 
  | 'Client Projects' 
  | 'Software Licenses'
  | 'Consulting Services'
  | 'Maintenance Contracts'
  | 'Product Sales'
  | 'Subscription Revenue'
  | 'Partnership Revenue'
  | 'Investment Income'
  | 'Other Income';

export type ExpenseCategory = 
  | 'Employee Salaries'
  | 'Software Subscriptions' 
  | 'Office Rent'
  | 'Utilities'
  | 'Marketing & Advertising'
  | 'Professional Services'
  | 'Equipment & Hardware'
  | 'Travel & Business'
  | 'Training & Development'
  | 'Insurance'
  | 'Taxes & Compliance'
  | 'Miscellaneous Business';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: IncomeCategory | ExpenseCategory;
  description: string;
  date: string;
  clientProject?: string; // For income transactions
  invoiceNumber?: string;
  paymentMethod?: string;
  notes?: string;
}

interface FinancialContextType {
  transactions: FinancialTransaction[];
  addTransaction: (transaction: Omit<FinancialTransaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (transaction: FinancialTransaction) => Promise<void>;
  loading: boolean;
  getMonthlyTransactions: (month: number, year: number) => FinancialTransaction[];
  getMonthlyIncome: (month: number, year: number) => number;
  getMonthlyExpenses: (month: number, year: number) => number;
  getMonthlyProfit: (month: number, year: number) => number;
  getTotalByCategory: (type: TransactionType, month: number, year: number) => Record<string, number>;
  getIncomeByCategory: (month: number, year: number) => Record<IncomeCategory, number>;
  getExpensesByCategory: (month: number, year: number) => Record<ExpenseCategory, number>;
  getCashFlow: () => { month: string; income: number; expenses: number; profit: number }[];
  getTopClients: (month: number, year: number) => { client: string; revenue: number }[];
  exportUserData: () => Promise<void>;
  importUserData: (file: File) => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Load transactions when user changes or component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const loadUserTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userTransactions = await CSVDataManager.loadTransactions(user.username);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Failed to load user transactions:', error);
      toast.error('Failed to load your financial data');
    } finally {
      setLoading(false);
    }
  };

  const saveUserTransactions = async (newTransactions: FinancialTransaction[]) => {
    if (!user) return;
    
    try {
      const success = await CSVDataManager.saveTransactions(user.username, newTransactions);
      if (!success) {
        toast.error('Failed to save financial data');
      }
    } catch (error) {
      console.error('Failed to save user transactions:', error);
      toast.error('Failed to save financial data');
    }
  };

  const addTransaction = async (transaction: Omit<FinancialTransaction, 'id'>) => {
    if (!user) {
      toast.error('You must be logged in to add transactions');
      return;
    }

    try {
      const newTransaction = {
        ...transaction,
        id: crypto.randomUUID(),
      };

      const newTransactions = [...transactions, newTransaction];
      setTransactions(newTransactions);
      await saveUserTransactions(newTransactions);
      
      const actionType = transaction.type === 'income' ? 'Income' : 'Expense';
      toast.success(`${actionType} added successfully`);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete transactions');
      return;
    }

    try {
      const newTransactions = transactions.filter((transaction) => transaction.id !== id);
      setTransactions(newTransactions);
      await saveUserTransactions(newTransactions);
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      toast.error('Failed to delete transaction');
      await loadUserTransactions();
    }
  };

  const updateTransaction = async (updatedTransaction: FinancialTransaction) => {
    if (!user) {
      toast.error('You must be logged in to update transactions');
      return;
    }

    try {
      const newTransactions = transactions.map((transaction) => 
        transaction.id === updatedTransaction.id ? updatedTransaction : transaction
      );
      setTransactions(newTransactions);
      await saveUserTransactions(newTransactions);
      toast.success('Transaction updated successfully');
    } catch (error) {
      console.error('Failed to update transaction:', error);
      toast.error('Failed to update transaction');
      await loadUserTransactions();
    }
  };

  // Get transactions for a specific month and year
  const getMonthlyTransactions = (month: number, year: number) => {
    return transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  };

  // Calculate monthly income
  const getMonthlyIncome = (month: number, year: number) => {
    const monthlyTransactions = getMonthlyTransactions(month, year);
    return monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  // Calculate monthly expenses
  const getMonthlyExpenses = (month: number, year: number) => {
    const monthlyTransactions = getMonthlyTransactions(month, year);
    return monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  // Calculate monthly profit
  const getMonthlyProfit = (month: number, year: number) => {
    return getMonthlyIncome(month, year) - getMonthlyExpenses(month, year);
  };

  // Get totals by category for a specific type
  const getTotalByCategory = (type: TransactionType, month: number, year: number) => {
    const monthlyTransactions = getMonthlyTransactions(month, year);
    const filteredTransactions = monthlyTransactions.filter(t => t.type === type);
    
    return filteredTransactions.reduce((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
      return totals;
    }, {} as Record<string, number>);
  };

  // Get income by category
  const getIncomeByCategory = (month: number, year: number): Record<IncomeCategory, number> => {
    const monthlyTransactions = getMonthlyTransactions(month, year);
    const incomeTransactions = monthlyTransactions.filter(t => t.type === 'income');
    
    const initialTotals: Record<IncomeCategory, number> = {
      'Client Projects': 0,
      'Software Licenses': 0,
      'Consulting Services': 0,
      'Maintenance Contracts': 0,
      'Product Sales': 0,
      'Subscription Revenue': 0,
      'Partnership Revenue': 0,
      'Investment Income': 0,
      'Other Income': 0,
    };

    return incomeTransactions.reduce((totals, transaction) => {
      totals[transaction.category as IncomeCategory] += transaction.amount;
      return totals;
    }, initialTotals);
  };

  // Get expenses by category
  const getExpensesByCategory = (month: number, year: number): Record<ExpenseCategory, number> => {
    const monthlyTransactions = getMonthlyTransactions(month, year);
    const expenseTransactions = monthlyTransactions.filter(t => t.type === 'expense');
    
    const initialTotals: Record<ExpenseCategory, number> = {
      'Employee Salaries': 0,
      'Software Subscriptions': 0,
      'Office Rent': 0,
      'Utilities': 0,
      'Marketing & Advertising': 0,
      'Professional Services': 0,
      'Equipment & Hardware': 0,
      'Travel & Business': 0,
      'Training & Development': 0,
      'Insurance': 0,
      'Taxes & Compliance': 0,
      'Miscellaneous Business': 0,
    };

    return expenseTransactions.reduce((totals, transaction) => {
      totals[transaction.category as ExpenseCategory] += transaction.amount;
      return totals;
    }, initialTotals);
  };

  // Get cash flow over the last 6 months
  const getCashFlow = () => {
    const result: { month: string; income: number; expenses: number; profit: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();
      const monthYear = targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const income = getMonthlyIncome(month, year);
      const expenses = getMonthlyExpenses(month, year);
      const profit = income - expenses;
      
      result.push({ month: monthYear, income, expenses, profit });
    }
    
    return result;
  };

  // Get top clients by revenue
  const getTopClients = (month: number, year: number) => {
    const monthlyTransactions = getMonthlyTransactions(month, year);
    const incomeTransactions = monthlyTransactions.filter(t => t.type === 'income' && t.clientProject);
    
    const clientTotals = incomeTransactions.reduce((totals, transaction) => {
      const client = transaction.clientProject || 'Unknown Client';
      totals[client] = (totals[client] || 0) + transaction.amount;
      return totals;
    }, {} as Record<string, number>);
    
    return Object.entries(clientTotals)
      .map(([client, revenue]) => ({ client, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
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
      await loadUserTransactions();
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
        setTransactions([]);
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
    await loadUserTransactions();
  };

  return (
    <FinancialContext.Provider 
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        loading,
        getMonthlyTransactions,
        getMonthlyIncome,
        getMonthlyExpenses,
        getMonthlyProfit,
        getTotalByCategory,
        getIncomeByCategory,
        getExpensesByCategory,
        getCashFlow,
        getTopClients,
        exportUserData,
        importUserData,
        clearAllData,
        refreshData,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancials must be used within a FinancialProvider');
  }
  return context;
};