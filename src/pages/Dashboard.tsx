
import React, { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { usePakistanEconomy } from '@/context/PakistanEconomyContext';
import { getCurrentMonthYear, getMonthName } from '@/lib/date-utils';
import { formatCurrency, calculateMonthlyChangePercentage, calculateExpenseTrend, findTopCategories } from '@/lib/expense-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/StatCard';
import ExpenseChart from '@/components/ExpenseChart';
import TrendChart from '@/components/TrendChart';
import EconomyMetrics from '@/components/EconomyMetrics';
import ExpenseForm from '@/components/ExpenseForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Wallet, ArrowDown, ArrowUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { expenses, addExpense, getMonthlyExpenses, getMonthlyTotal } = useExpenses();
  const { currentInflationRate } = usePakistanEconomy();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { month, year } = getCurrentMonthYear();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  
  // Calculate monthly totals
  const currentMonthTotal = getMonthlyTotal(month, year);
  const previousMonthTotal = getMonthlyTotal(prevMonth, prevYear);
  
  // Calculate change percentage
  const changePercentage = calculateMonthlyChangePercentage(currentMonthTotal, previousMonthTotal);
  
  // Get monthly expense trend for the last 6 months
  const trendData = calculateExpenseTrend(expenses, 6);
  
  // Get top spending categories
  const categoryData = findTopCategories(getMonthlyExpenses(month, year)).map(cat => ({
    name: cat.category,
    value: cat.amount,
    percentage: cat.percentage
  }));
  
  const handleAddExpense = (values: Omit<any, 'id'>) => {
    addExpense(values);
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage your expenses for {getMonthName(month)} {year}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Expenses (This Month)"
          value={formatCurrency(currentMonthTotal)}
          icon={<Wallet className="w-4 h-4" />}
          trend={changePercentage > 0 ? 'up' : changePercentage < 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(changePercentage).toFixed(1)}%`}
        />
        
        <StatCard
          title="Previous Month"
          value={formatCurrency(previousMonthTotal)}
          description={`${getMonthName(prevMonth)} ${prevYear}`}
        />
        
        <StatCard
          title="Inflation Impact"
          value={formatCurrency(currentMonthTotal * (currentInflationRate / 100))}
          description={`At ${currentInflationRate}% annual inflation rate`}
          trend="up"
          trendValue={`${currentInflationRate}%`}
        />
        
        <StatCard
          title="Expenses Count"
          value={getMonthlyExpenses(month, year).length}
          description={`Number of transactions this month`}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <ExpenseChart data={categoryData} />
        <TrendChart data={trendData} />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button 
              variant="outline" 
              className="justify-start border-dashed"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Add today's expense
            </Button>
          </CardContent>
        </Card>
        <EconomyMetrics />
      </div>
    </div>
  );
};

export default Dashboard;
