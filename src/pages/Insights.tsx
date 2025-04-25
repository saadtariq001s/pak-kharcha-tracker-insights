
import React, { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { usePakistanEconomy } from '@/context/PakistanEconomyContext';
import { getCurrentMonthYear } from '@/lib/date-utils';
import { formatCurrency, calculateSavingsPotential } from '@/lib/expense-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SavingsRecommendations from '@/components/SavingsRecommendations';
import EconomyMetrics from '@/components/EconomyMetrics';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, Lightbulb } from 'lucide-react';

const Insights: React.FC = () => {
  const { expenses, getMonthlyExpenses, getMonthlyTotal, getAverageMonthlyExpenditure } = useExpenses();
  const { currentInflationRate } = usePakistanEconomy();
  const [monthlyIncome, setMonthlyIncome] = useState(100000); // Example default income
  const [savingGoal, setSavingGoal] = useState(500000); // Example saving goal
  
  const { month, year } = getCurrentMonthYear();
  const monthlyExpenses = getMonthlyExpenses(month, year);
  const monthlyTotal = getMonthlyTotal(month, year);
  const averageMonthly = getAverageMonthlyExpenditure();
  
  // Calculate potential savings
  const savingsPotential = calculateSavingsPotential(monthlyExpenses, monthlyIncome);
  const totalPotentialSavings = savingsPotential.reduce((total, item) => total + item.potentialSaving, 0);
  
  // Calculate time to reach saving goal
  const monthlySavings = monthlyIncome - monthlyTotal;
  const monthsToGoal = monthlySavings > 0 ? Math.ceil(savingGoal / monthlySavings) : Infinity;
  
  // Inflation impact over time
  const inflationImpactMonthly = monthlyTotal * (currentInflationRate / 100 / 12);
  const yearlyCostIncrease = monthlyTotal * currentInflationRate / 100;
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Insights</h1>
        <p className="text-muted-foreground">
          Personalized insights and recommendations for your financial well-being
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Financial Profile</CardTitle>
            <CardDescription>Update your information to get personalized insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="monthly-income">Monthly Income (PKR)</Label>
                <Input 
                  id="monthly-income" 
                  type="number" 
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="saving-goal">Saving Goal (PKR)</Label>
                <Input 
                  id="saving-goal" 
                  type="number" 
                  value={savingGoal}
                  onChange={(e) => setSavingGoal(Number(e.target.value))}
                />
              </div>
              
              <div className="p-4 mt-4 border rounded-md bg-gray-50">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                    <p className="text-lg font-bold">{formatCurrency(monthlyTotal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Savings</p>
                    <p className="text-lg font-bold">{formatCurrency(monthlyIncome - monthlyTotal)}</p>
                  </div>
                </div>
                
                {monthsToGoal !== Infinity ? (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Time to Reach Saving Goal</p>
                    <p className="text-lg font-bold">
                      {monthsToGoal} months ({Math.floor(monthsToGoal / 12)} years {monthsToGoal % 12} months)
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-2 text-red-600 bg-red-50 rounded">
                    <p>You need to increase income or reduce expenses to reach your saving goal.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <EconomyMetrics />
      </div>
      
      <SavingsRecommendations monthlyIncome={monthlyIncome} />
      
      <Card>
        <CardHeader>
          <CardTitle>Potential Savings Opportunities</CardTitle>
          <CardDescription>Areas where you might be able to reduce spending</CardDescription>
        </CardHeader>
        <CardContent>
          {savingsPotential.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Current Amount</TableHead>
                    <TableHead className="text-right">Recommended</TableHead>
                    <TableHead className="text-right">Potential Saving</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savingsPotential.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.currentAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.recommendedAmount)}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(item.potentialSaving)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={3} className="font-bold">Total Potential Monthly Savings</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(totalPotentialSavings)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="mt-4 p-3 bg-pakistan-green/10 rounded-md">
                <div className="flex items-start">
                  <Lightbulb className="w-5 h-5 mr-2 mt-0.5 text-pakistan-green" />
                  <p className="text-sm">
                    By making these adjustments, you could save approximately{' '}
                    <span className="font-bold">{formatCurrency(totalPotentialSavings)}</span> per month,
                    or <span className="font-bold">{formatCurrency(totalPotentialSavings * 12)}</span> per year.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-lg text-gray-500">Add more expenses to get saving insights</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Inflation Impact Analysis</CardTitle>
          <CardDescription>How inflation affects your financial future in Pakistan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="font-semibold mb-2">Monthly Impact</p>
              <p>
                At the current inflation rate of {currentInflationRate}%, your monthly expenses of{' '}
                {formatCurrency(monthlyTotal)} will effectively cost you an extra{' '}
                {formatCurrency(inflationImpactMonthly)} each month.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="font-semibold mb-2">Annual Impact</p>
              <p>
                Over a year, your current spending patterns will require an additional{' '}
                {formatCurrency(yearlyCostIncrease)} just to maintain the same lifestyle.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="font-semibold mb-2">5-Year Projection</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Projected Monthly Cost</TableHead>
                    <TableHead className="text-right">Yearly Increase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }, (_, i) => {
                    const yearNumber = year + i;
                    const inflationMultiplier = Math.pow(1 + currentInflationRate / 100, i);
                    const projectedCost = monthlyTotal * inflationMultiplier;
                    const yearlyIncrease = i > 0 
                      ? projectedCost - (monthlyTotal * Math.pow(1 + currentInflationRate / 100, i - 1))
                      : 0;
                      
                    return (
                      <TableRow key={yearNumber}>
                        <TableCell>{yearNumber}</TableCell>
                        <TableCell className="text-right">{formatCurrency(projectedCost)}</TableCell>
                        <TableCell className="text-right">
                          {i === 0 ? '—' : formatCurrency(yearlyIncrease * 12)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Insights;
