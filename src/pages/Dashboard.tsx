// src/pages/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { useAuth } from '@/context/AuthContext';
import { usePakistanEconomy } from '@/context/PakistanEconomyContext';
import { getCurrentMonthYear, getMonthName, getPreviousMonths } from '@/lib/date-utils';
import { 
  formatCurrency, 
  calculateMonthlyChangePercentage, 
  calculateExpenseTrend, 
  findTopCategories,
  calculateDailyAverage 
} from '@/lib/expense-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Target,
  Calendar,
  PieChart,
  BarChart,
  Info
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { expenses, addExpense, getMonthlyExpenses, getMonthlyTotal, loading } = useExpenses();
  const { user } = useAuth();
  const { currentInflationRate, getSavingsRecommendations } = usePakistanEconomy();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { month, year } = getCurrentMonthYear();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  
  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    const currentMonthExpenses = getMonthlyExpenses(month, year);
    const currentMonthTotal = getMonthlyTotal(month, year);
    const previousMonthTotal = getMonthlyTotal(prevMonth, prevYear);
    const changePercentage = calculateMonthlyChangePercentage(currentMonthTotal, previousMonthTotal);
    
    // Calculate running totals for last 6 months
    const last6Months = getPreviousMonths(6);
    const monthlyTotals = last6Months.map(({ month: m, year: y }) => ({
      month: getMonthName(m),
      total: getMonthlyTotal(m, y),
      expenses: getMonthlyExpenses(m, y).length
    }));
    
    const avgMonthlySpending = monthlyTotals.reduce((sum, m) => sum + m.total, 0) / 6;
    const totalExpenses = expenses.length;
    const dailyAverage = calculateDailyAverage(currentMonthExpenses);
    
    // Days since first expense
    const daysSinceFirst = expenses.length > 0 ? 
      Math.ceil((Date.now() - Math.min(...expenses.map(e => new Date(e.date).getTime()))) / (1000 * 60 * 60 * 24)) : 0;
    
    // Calculate spending velocity (expenses per week)
    const spendingVelocity = totalExpenses > 0 && daysSinceFirst > 0 ? 
      (totalExpenses / daysSinceFirst) * 7 : 0;
    
    return {
      currentMonthTotal,
      previousMonthTotal,
      changePercentage,
      avgMonthlySpending,
      dailyAverage,
      totalExpenses,
      monthlyTotals,
      daysSinceFirst,
      spendingVelocity,
      currentMonthExpenses: currentMonthExpenses.length
    };
  }, [expenses, month, year, prevMonth, prevYear, getMonthlyExpenses, getMonthlyTotal]);
  
  // Get expense trend for the last 6 months
  const trendData = calculateExpenseTrend(expenses, 6);
  
  // Get top spending categories for current month
  const categoryData = findTopCategories(getMonthlyExpenses(month, year)).map(cat => ({
    name: cat.category,
    value: cat.amount,
    percentage: cat.percentage
  }));
  
  // Budget insights
  const budgetInsights = useMemo(() => {
    const assumedIncome = 75000; // Default assumption
    const recommendations = getSavingsRecommendations(assumedIncome, metrics.currentMonthTotal);
    const savingsRate = ((assumedIncome - metrics.currentMonthTotal) / assumedIncome) * 100;
    const inflationAdjustedSpending = metrics.currentMonthTotal * (1 + currentInflationRate / 100);
    
    return {
      assumedIncome,
      savingsRate: Math.max(0, savingsRate),
      recommendations: recommendations.slice(0, 3), // Top 3 recommendations
      inflationAdjustedSpending,
      budgetHealth: savingsRate > 20 ? 'excellent' : savingsRate > 10 ? 'good' : savingsRate > 0 ? 'fair' : 'poor'
    };
  }, [metrics.currentMonthTotal, currentInflationRate, getSavingsRecommendations]);
  
  const handleAddExpense = async (values: Omit<any, 'id'>) => {
    try {
      await addExpense(values);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const getBudgetHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pakistan-green"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with user greeting */}
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.username}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your financial overview for {getMonthName(month)} {year}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pakistan-green hover:bg-pakistan-lightGreen">
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Enter the details of your new expense. You can also use voice recognition!
              </DialogDescription>
            </DialogHeader>
            <ExpenseForm onSubmit={handleAddExpense} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Health Alert */}
      {budgetInsights.budgetHealth === 'poor' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Budget Alert:</strong> Your expenses exceed your estimated income this month. 
            Consider reviewing your spending patterns and implementing cost-saving measures.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="This Month's Expenses"
          value={formatCurrency(metrics.currentMonthTotal)}
          icon={<Wallet className="w-4 h-4" />}
          trend={metrics.changePercentage > 0 ? 'up' : metrics.changePercentage < 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(metrics.changePercentage).toFixed(1)}%`}
          description={`${metrics.currentMonthExpenses} transactions this month`}
        />
        
        <StatCard
          title="Daily Average"
          value={formatCurrency(metrics.dailyAverage)}
          icon={<Calendar className="w-4 h-4" />}
          description="Average spending per day this month"
        />
        
        <StatCard
          title="6-Month Average"
          value={formatCurrency(metrics.avgMonthlySpending)}
          icon={<BarChart className="w-4 h-4" />}
          description="Your average monthly spending"
        />
        
        <StatCard
          title="Savings Rate"
          value={`${budgetInsights.savingsRate.toFixed(1)}%`}
          icon={<Target className="w-4 h-4" />}
          trend={budgetInsights.savingsRate > 20 ? 'up' : budgetInsights.savingsRate > 0 ? 'neutral' : 'down'}
          description={`Budget health: ${budgetInsights.budgetHealth}`}
        />
      </div>

      {/* Budget Overview Card */}
      <Card className={`border-2 ${getBudgetHealthColor(budgetInsights.budgetHealth)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Budget Overview
            <Badge variant="outline" className={getBudgetHealthColor(budgetInsights.budgetHealth)}>
              {budgetInsights.budgetHealth.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Based on estimated monthly income of {formatCurrency(budgetInsights.assumedIncome)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monthly Budget Usage</span>
              <span className="text-sm text-muted-foreground">
                {((metrics.currentMonthTotal / budgetInsights.assumedIncome) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={(metrics.currentMonthTotal / budgetInsights.assumedIncome) * 100} 
              className="h-2"
            />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">{formatCurrency(metrics.currentMonthTotal)}</div>
                <div className="text-xs text-muted-foreground">Spent</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {formatCurrency(Math.max(0, budgetInsights.assumedIncome - metrics.currentMonthTotal))}
                </div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {formatCurrency(budgetInsights.inflationAdjustedSpending - metrics.currentMonthTotal)}
                </div>
                <div className="text-xs text-muted-foreground">Inflation Impact</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <ExpenseChart data={categoryData} />
        <TrendChart data={trendData} />
      </div>

      {/* Insights and Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Quick Insights
            </CardTitle>
            <CardDescription>Key observations about your spending</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Spending Velocity</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.spendingVelocity.toFixed(1)} expenses per week
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-pakistan-green" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Tracking Period</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.daysSinceFirst} days, {metrics.totalExpenses} total expenses
                  </p>
                </div>
                <Calendar className="w-4 h-4 text-pakistan-green" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Change vs Last Month</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Math.abs(metrics.currentMonthTotal - metrics.previousMonthTotal))} 
                    {metrics.changePercentage > 0 ? ' increase' : ' decrease'}
                  </p>
                </div>
                {metrics.changePercentage > 0 ? 
                  <TrendingUp className="w-4 h-4 text-red-500" /> :
                  <TrendingDown className="w-4 h-4 text-green-500" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Economy */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and economic updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button 
                variant="outline" 
                className="justify-start border-dashed"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add today's expense
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start border-dashed"
                onClick={() => window.location.href = '/expenses'}
              >
                <Wallet className="w-4 h-4 mr-2" /> View all expenses
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start border-dashed"
                onClick={() => window.location.href = '/analytics'}
              >
                <PieChart className="w-4 h-4 mr-2" /> Detailed analytics
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <EconomyMetrics />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Recommendations */}
      {budgetInsights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalized Recommendations</CardTitle>
            <CardDescription>
              AI-powered suggestions based on your spending and Pakistan's economy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {budgetInsights.recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{rec.title}</h4>
                    <Badge variant="outline" className={
                      rec.priority === 'high' ? 'border-red-500 text-red-500' :
                      rec.priority === 'medium' ? 'border-yellow-500 text-yellow-500' :
                      'border-green-500 text-green-500'
                    }>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;