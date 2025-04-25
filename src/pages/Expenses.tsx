
import React, { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { getCurrentMonthYear, getMonthName } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/expense-utils';
import { Button } from '@/components/ui/button';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import MonthSelector from '@/components/MonthSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

const Expenses: React.FC = () => {
  const { expenses, addExpense, deleteExpense, updateExpense, getMonthlyExpenses, getMonthlyTotal } = useExpenses();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const currentDate = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
  const [selectedYear, setSelectedYear] = useState(currentDate.year);
  
  const monthlyExpenses = getMonthlyExpenses(selectedMonth, selectedYear);
  const monthlyTotal = getMonthlyTotal(selectedMonth, selectedYear);
  
  const handleAddExpense = (values: Omit<any, 'id'>) => {
    addExpense(values);
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Manage and track your expenses
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pakistan-green hover:bg-pakistan-lightGreen">
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Enter the details of your new expense.
              </DialogDescription>
            </DialogHeader>
            <ExpenseForm onSubmit={handleAddExpense} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <h2 className="text-xl font-semibold">
          {getMonthName(selectedMonth)} {selectedYear}
        </h2>
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-md">
        <p className="mb-2 text-sm font-medium text-gray-500">Total for {getMonthName(selectedMonth)}</p>
        <p className="text-3xl font-bold">{formatCurrency(monthlyTotal)}</p>
      </div>

      <ExpenseList
        expenses={monthlyExpenses}
        onUpdateExpense={updateExpense}
        onDeleteExpense={deleteExpense}
      />
    </div>
  );
};

export default Expenses;
