// src/pages/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import { useFinancials } from '@/context/FinancialContext';
import { useAuth } from '@/context/AuthContext';
import { useBusinessEconomy } from '@/context/BusinessEconomyContext';
import { getCurrentMonthYear, getMonthName } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/expense-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import StatCard from '@/components/StatCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TransactionForm from '@/components/TransactionForm';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  Calendar,
  PieChart,
  AlertTriangle,
  BarChart3,
  Zap,
  Building2,
  Users,
  Brain
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { 
    transactions, 
    addTransaction, 
    getMonthlyIncome,
    getMonthlyExpenses,
    getMonthlyProfit,
    getCashFlow,
    getTopClients,
    loading 
  } = useFinancials();
  
  const { user } = useAuth();
  const { getBusinessRecommendations, getFinancialHealth, getMarketBenchmarks } = useBusinessEconomy();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { month, year } = getCurrentMonthYear();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  
  // Calculate comprehensive financial metrics
  const metrics = useMemo(() => {
    const currentIncome = getMonthlyIncome(month, year);
    const currentExpenses = getMonthlyExpenses(month, year);
    const currentProfit = getMonthlyProfit(month, year);
    
    const prevIncome = getMonthlyIncome(prevMonth, prevYear);
    const prevExpenses = getMonthlyExpenses(prevMonth, prevYear);
    const prevProfit = getMonthlyProfit(prevMonth, prevYear);
    
    const profitMargin = currentIncome > 0 ? (currentProfit / currentIncome) * 100 : 0;
    const expenseRatio = currentIncome > 0 ? (currentExpenses / currentIncome) * 100 : 0;
    
    // Growth calculations
    const incomeGrowth = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseGrowth = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0;
    const profitGrowth = prevProfit !== 0 ? ((currentProfit - prevProfit) / Math.abs(prevProfit)) * 100 : 0;
    
    // Cash flow analysis
    const cashFlowData = getCashFlow();
    const avgMonthlyProfit = cashFlowData.reduce((sum, d) => sum + d.profit, 0) / cashFlowData.length;
    
    return {
      currentIncome,
      currentExpenses,
      currentProfit,
      profitMargin,
      expenseRatio,
      incomeGrowth,
      expenseGrowth,
      profitGrowth,
      avgMonthlyProfit,
      cashFlowData,
      totalTransactions: transactions.length
    };
  }, [transactions, month, year, prevMonth, prevYear, getMonthlyIncome, getMonthlyExpenses, getMonthlyProfit, getCashFlow]);
  
  // Financial health assessment
  const financialHealth = getFinancialHealth(
    metrics.currentIncome, 
    metrics.currentExpenses, 
    metrics.incomeGrowth
  );
  
  // Business recommendations
  const recommendations = getBusinessRecommendations(
    metrics.currentIncome,
    metrics.currentExpenses,
    metrics.profitMargin
  );
  
  // Market benchmarks
  const benchmarks = getMarketBenchmarks();
  
  // Top clients for current month
  const topClients = getTopClients(month, year);

  const handleAddTransaction = async (values: any) => {
    try {
      await addTransaction(values);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'financial-health-excellent';
      case 'good': return 'financial-health-good';
      case 'fair': return 'financial-health-fair';
      case 'poor': return 'financial-health-poor';
      case 'critical': return 'financial-health-critical';
      default: return 'profit-neutral';
    }
  };

  const getProfitTrendIcon = (profit: number) => {
    if (profit > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (profit < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Target className="w-4 h-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center h-64">
          <div className="loading-shimmer h-12 w-12 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome to Elegnoia FinanceAI 🚀
            </h1>
            <p className="text-blue-100 mt-2">
              Smart financial management for {getMonthName(month)} {year}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="secondary" className="bg-blue-500 text-white">
                Financial Health: {financialHealth.status.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="border-blue-300 text-blue-100">
                {metrics.totalTransactions} transactions tracked
              </Badge>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="business-button">
                <Plus className="w-4 h-4" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
                <DialogDescription>
                  Record income or expense transaction with AI-powered categorization
                </DialogDescription>
              </DialogHeader>
              <TransactionForm onSubmit={handleAddTransaction} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Financial Health Alert */}
      {financialHealth.status === 'critical' || financialHealth.status === 'poor' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Financial Alert:</strong> {financialHealth.description}
            {metrics.currentProfit < 0 && " Immediate action required to improve cash flow."}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Performance Indicators */}
      <div className="kpi-grid">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(metrics.currentIncome)}
          icon={<DollarSign className="w-4 h-4" />}
          trend={metrics.incomeGrowth > 0 ? 'up' : metrics.incomeGrowth < 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(metrics.incomeGrowth).toFixed(1)}%`}
          description="Total income this month"
          className="metric-card"
        />
        
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(metrics.currentExpenses)}
          icon={<BarChart3 className="w-4 h-4" />}
          trend={metrics.expenseGrowth > 0 ? 'down' : 'up'} // Higher expenses = bad trend
          trendValue={`${Math.abs(metrics.expenseGrowth).toFixed(1)}%`}
          description={`${metrics.expenseRatio.toFixed(1)}% of revenue`}
          className="metric-card"
        />
        
        <StatCard
          title="Net Profit"
          value={formatCurrency(metrics.currentProfit)}
          icon={getProfitTrendIcon(metrics.currentProfit)}
          trend={metrics.currentProfit > 0 ? 'up' : 'down'}
          trendValue={`${metrics.profitMargin.toFixed(1)}% margin`}
          description="Profit this month"
          className={`metric-card ${metrics.currentProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}
        />
        
        <StatCard
          title="Financial Score"
          value={`${financialHealth.score}/100`}
          icon={<Target className="w-4 h-4" />}
          description={financialHealth.status}
          className={`metric-card ${getHealthStatusColor(financialHealth.status)}`}
        />
      </div>

      {/* Financial Health Overview */}
      <Card className={`border-2 ${getHealthStatusColor(financialHealth.status)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Performance Overview
            <Badge variant="outline" className={getHealthStatusColor(financialHealth.status)}>
              {financialHealth.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            {financialHealth.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metrics.profitMargin.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Profit Margin</div>
                <div className="text-xs text-gray-500 mt-1">
                  Target: {benchmarks.profitMargin.target}%
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{metrics.incomeGrowth.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Revenue Growth</div>
                <div className="text-xs text-gray-500 mt-1">
                  Target: {benchmarks.growthRate.target}%
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.avgMonthlyProfit)}</div>
                <div className="text-sm text-gray-600">Avg Monthly Profit</div>
                <div className="text-xs text-gray-500 mt-1">
                  6-month average
                </div>
              </div>
            </div>
            
            {/* Profit Margin Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Profit Margin Progress</span>
                <span>{metrics.profitMargin.toFixed(1)}% / {benchmarks.profitMargin.excellent}%</span>
              </div>
              <Progress 
                value={(metrics.profitMargin / benchmarks.profitMargin.excellent) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights and Top Clients */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Insights Preview */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              AI Financial Insights
            </CardTitle>
            <CardDescription>Key observations about your business performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  rec.priority === 'high' ? 'bg-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {rec.expectedImpact}
                  </Badge>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => window.location.href = '/insights'}
            >
              <Zap className="w-4 h-4 mr-2" />
              Get Full AI Analysis
            </Button>
          </CardContent>
        </Card>

        {/* Top Clients & Quick Actions */}
        <Card className="chart-container">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Top Clients & Quick Actions
            </CardTitle>
            <CardDescription>Revenue leaders and common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topClients.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Top Revenue Sources</h4>
                {topClients.slice(0, 3).map((client, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium">{client.client}</span>
                    <span className="text-sm text-blue-600">{formatCurrency(client.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No client data yet</p>
              </div>
            )}
            
            <div className="border-t pt-4 space-y-2">
              <h4 className="font-medium text-sm">Quick Actions</h4>
              <div className="grid gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="justify-start"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Record Income
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="justify-start"
                  onClick={() => window.location.href = '/analytics'}
                >
                  <PieChart className="w-4 h-4 mr-2" /> View Analytics
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="justify-start"
                  onClick={() => window.location.href = '/transactions'}
                >
                  <Calendar className="w-4 h-4 mr-2" /> All Transactions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Trend */}
      <Card className="chart-container">
        <CardHeader>
          <CardTitle>6-Month Cash Flow Trend</CardTitle>
          <CardDescription>
            Track your business's financial performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {metrics.cashFlowData.map((data, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{data.month}</div>
                  <div className={`h-20 rounded flex flex-col justify-end p-1 text-xs ${
                    data.profit >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div className="font-medium">
                      {formatCurrency(data.profit).replace('PKR ', '₹')}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {((data.income > 0 ? data.profit / data.income : 0) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Monthly Profit Trend</span>
              <span>Profit Margin %</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;