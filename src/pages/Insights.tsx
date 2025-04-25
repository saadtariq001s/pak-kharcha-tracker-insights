
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SavingsRecommendations from '@/components/SavingsRecommendations';
import AIInsights from '@/components/AIInsights';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

const Insights: React.FC = () => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(75000);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">
          Financial insights and recommendations based on your spending patterns and Pakistan's economy
        </p>
      </div>

      <Card className="p-4">
        <div className="max-w-sm">
          <Label htmlFor="monthly-income">Your Monthly Income (PKR)</Label>
          <Input
            id="monthly-income"
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            className="mt-1"
            min={0}
          />
          <p className="text-sm text-muted-foreground mt-2">
            This helps us provide more accurate financial recommendations
          </p>
        </div>
      </Card>

      <Tabs defaultValue="recommendations">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations">Savings Recommendations</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Financial Assistant</TabsTrigger>
        </TabsList>
        <TabsContent value="recommendations" className="mt-6">
          <SavingsRecommendations monthlyIncome={monthlyIncome} />
        </TabsContent>
        <TabsContent value="ai-insights" className="mt-6">
          <AIInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Insights;
