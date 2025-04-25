
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePakistanEconomy } from '@/context/PakistanEconomyContext';
import { useExpenses } from '@/context/ExpenseContext';
import { getCurrentMonthYear } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/expense-utils';
import { Badge } from '@/components/ui/badge';

interface SavingsRecommendationsProps {
  monthlyIncome?: number;
}

const SavingsRecommendations: React.FC<SavingsRecommendationsProps> = ({ 
  monthlyIncome = 50000 // Default assumption
}) => {
  const { getSavingsRecommendations } = usePakistanEconomy();
  const { getMonthlyTotal } = useExpenses();
  const { month, year } = getCurrentMonthYear();
  
  const monthlyExpenses = getMonthlyTotal(month, year);
  const recommendations = getSavingsRecommendations(monthlyIncome, monthlyExpenses);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings Recommendations</CardTitle>
        <CardDescription>
          Based on your spending and Pakistan's current economic conditions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <p className="text-lg font-bold">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Expenses</p>
              <p className="text-lg font-bold">{formatCurrency(monthlyExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potential Savings</p>
              <p className="text-lg font-bold">{formatCurrency(monthlyIncome - monthlyExpenses)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p className="text-lg font-bold">
                {monthlyIncome > 0 
                  ? `${((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1)}%` 
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{rec.title}</h3>
                <Badge 
                  variant="outline"
                  className={getPriorityColor(rec.priority)}
                >
                  {rec.priority} priority
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{rec.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsRecommendations;
