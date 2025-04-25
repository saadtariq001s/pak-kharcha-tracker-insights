
import React, { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { usePakistanEconomy } from '@/context/PakistanEconomyContext';
import { getCurrentMonthYear, getPreviousMonths, getMonthName } from '@/lib/date-utils';
import { 
  formatCurrency, 
  calculateExpenseTrend, 
  findTopCategories,
  calculateDailyAverage
} from '@/lib/expense-utils';
import ExpenseChart from '@/components/ExpenseChart';
import TrendChart from '@/components/TrendChart';
import MonthSelector from '@/components/MonthSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatCard from '@/components/StatCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';

const Analytics: React.FC = () => {
  const { expenses, getMonthlyExpenses, getMonthlyTotal } = useExpenses();
  const { currentInflationRate } = usePakistanEconomy();
  const currentDate = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
  const [selectedYear, setSelectedYear] = useState(currentDate.year);
  
  // Get monthly expenses
  const monthlyExpenses = getMonthlyExpenses(selectedMonth, selectedYear);
  const monthlyTotal = getMonthlyTotal(selectedMonth, selectedYear);
  
  // Calculate inflation adjusted value
  const inflationAdjustedValue = monthlyTotal * (1 + currentInflationRate / 100);
  
  // Get previous month
  const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const prevMonthTotal = getMonthlyTotal(prevMonth, prevYear);
  
  // Calculate change percentage
  const changePercentage = prevMonthTotal > 0 
    ? ((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 100
    : 0;
  
  // Get top spending categories
  const categoryData = findTopCategories(monthlyExpenses, 10).map(cat => ({
    name: cat.category,
    value: cat.amount,
    percentage: cat.percentage
  }));
  
  // Calculate daily average
  const dailyAverage = calculateDailyAverage(monthlyExpenses);
  
  // Get expense trend for the last 6 months
  const trendData = calculateExpenseTrend(expenses, 6);
  
  // Category comparison data
  const categoryComparison = () => {
    // Get current and previous month top categories
    const currentCategories = findTopCategories(monthlyExpenses);
    const prevMonthExpenses = getMonthlyExpenses(prevMonth, prevYear);
    const prevCategories = findTopCategories(prevMonthExpenses);
    
    // Map to compare
    const comparisonData = currentCategories.map(current => {
      const prev = prevCategories.find(p => p.category === current.category);
      const prevAmount = prev ? prev.amount : 0;
      const change = prevAmount > 0 
        ? ((current.amount - prevAmount) / prevAmount) * 100
        : 0;
      
      return {
        category: current.category,
        currentAmount: current.amount,
        prevAmount,
        change
      };
    });
    
    return comparisonData;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Visualize and understand your spending patterns
          </p>
        </div>
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(monthlyTotal)}
          icon={<BarChart className="w-4 h-4" />}
          trend={changePercentage > 0 ? 'up' : changePercentage < 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(changePercentage).toFixed(1)}%`}
        />
        
        <StatCard
          title="Daily Average"
          value={formatCurrency(dailyAverage)}
          icon={<Calendar className="w-4 h-4" />}
          description="Average spending per day"
        />
        
        <StatCard
          title="Inflation Impact"
          value={formatCurrency(inflationAdjustedValue - monthlyTotal)}
          description={`Real cost increase at ${currentInflationRate}% inflation`}
          trend="up"
          trendValue={`${currentInflationRate}%`}
        />
        
        <StatCard
          title="Total Transactions"
          value={monthlyExpenses.length}
          description={`Number of expenses in ${getMonthName(selectedMonth)}`}
        />
      </div>
      
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="comparison">Category Comparison</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ExpenseChart data={categoryData} />
            <TrendChart data={trendData} />
          </div>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Category Comparison</CardTitle>
              <CardDescription>
                Compare your spending against the previous month by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">This Month</TableHead>
                    <TableHead className="text-right">Last Month</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryComparison().map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.currentAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.prevAmount)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`flex items-center justify-end ${
                          item.change > 0 ? 'text-red-500' : 
                          item.change < 0 ? 'text-green-500' : 'text-gray-500'
                        }`}>
                          {item.change > 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : 
                           item.change < 0 ? <ArrowDownRight className="w-4 h-4 mr-1" /> : null}
                          {Math.abs(item.change).toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <TrendChart 
            data={trendData} 
            title="6-Month Expense Trend"
            description="See how your spending has changed over the past 6 months"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
