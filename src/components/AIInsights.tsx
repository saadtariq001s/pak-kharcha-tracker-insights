
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useExpenses } from '@/context/ExpenseContext';
import { usePakistanEconomy } from '@/context/PakistanEconomyContext';
import { formatCurrency } from '@/lib/expense-utils';
import { getCurrentMonthYear } from '@/lib/date-utils';

const AIInsights: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  
  const { expenses, getTotalByCategory, getMonthlyTotal } = useExpenses();
  const { currentInflationRate, economicMetrics } = usePakistanEconomy();
  const { month, year } = getCurrentMonthYear();
  
  useEffect(() => {
    // Generate suggested questions based on user data
    const monthlyTotal = getMonthlyTotal(month, year);
    const categoryTotals = getTotalByCategory(month, year);
    
    // Find top spending category
    let topCategory = 'Food & Groceries';
    let topAmount = 0;
    
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      if (amount > topAmount) {
        topAmount = amount;
        topCategory = category;
      }
    });
    
    const questions = [
      `How can I reduce my ${topCategory} expenses?`,
      `What should be my monthly budget based on my spending patterns?`,
      `How is inflation affecting my expenses?`,
      `What are some savings strategies for salaried individuals in Pakistan?`,
      `How can I save for my child's education with current inflation?`
    ];
    
    setSuggestedQuestions(questions);
  }, [expenses, getTotalByCategory, getMonthlyTotal, month, year]);
  
  const generateAnswer = async () => {
    if (!question) return;
    
    setIsLoading(true);
    
    try {
      // This is a simple AI simulation - in a real app, this would call an AI service
      const monthlyTotal = getMonthlyTotal(month, year);
      const categoryTotals = getTotalByCategory(month, year);
      
      // Simple rule-based responses - would be replaced with actual AI in production
      let response: string;
      
      if (question.toLowerCase().includes('reduce') && question.toLowerCase().includes('expenses')) {
        const categoryMentioned = Object.keys(categoryTotals).find(cat => 
          question.toLowerCase().includes(cat.toLowerCase())
        );
        
        if (categoryMentioned) {
          response = `To reduce your ${categoryMentioned} expenses, consider: 
          1. Setting a strict budget for this category
          2. Finding more affordable alternatives
          3. Tracking all expenses in this category to identify unnecessary spending
          4. Looking for seasonal discounts and promotions`;
        } else {
          response = `To reduce your overall expenses, focus on your highest spending categories: 
          ${Object.entries(categoryTotals)
            .filter(([_, amount]) => amount > 0)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 3)
            .map(([category, amount]) => `${category}: ${formatCurrency(amount)}`)
            .join(', ')}`;
        }
      } 
      else if (question.toLowerCase().includes('budget')) {
        const averageMonthly = monthlyTotal;
        response = `Based on your spending patterns, a suggested monthly budget is:
        - Essential expenses (60%): ${formatCurrency(averageMonthly * 0.6)}
        - Savings and debt repayment (20%): ${formatCurrency(averageMonthly * 0.2)}
        - Discretionary spending (20%): ${formatCurrency(averageMonthly * 0.2)}
        
        During high inflation periods like now (${currentInflationRate}%), try to increase your savings rate to at least 25-30% if possible.`;
      }
      else if (question.toLowerCase().includes('inflation')) {
        response = `With Pakistan's current inflation rate at ${currentInflationRate}%, your purchasing power is significantly reduced.
        
        Your monthly expenses of ${formatCurrency(monthlyTotal)} would need to increase to ${formatCurrency(monthlyTotal * (1 + currentInflationRate/100))} next year just to maintain the same lifestyle.
        
        Consider:
        1. Investing in inflation-protected assets
        2. Negotiating salary increases that at least match inflation
        3. Reducing luxury expenses temporarily
        4. Looking into National Savings certificates which often offer above-inflation returns`;
      }
      else if (question.toLowerCase().includes('education')) {
        response = `For education savings in Pakistan with high inflation:
        
        1. Consider Prize Bonds and National Savings certificates
        2. Look into education-specific savings accounts at Islamic banks
        3. Start small but be consistent - even PKR 5,000/month can grow significantly over time
        4. Consider foreign currency deposits for longer-term education goals
        5. Explore the Higher Education Commission's scholarships and financial aid options early`;
      }
      else if (question.toLowerCase().includes('saving') || question.toLowerCase().includes('salaried')) {
        response = `Savings strategies for salaried individuals in Pakistan:
        
        1. Use the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings
        2. Set up automatic transfers to savings accounts on salary day
        3. Consider National Savings schemes like Bahbood Savings and Regular Income Certificates
        4. Take advantage of company pension and provident fund schemes
        5. Use digital banks and fintech apps for better returns on savings
        6. Consider Islamic banking profit-sharing accounts`;
      }
      else {
        response = `I don't have specific information on that question. Consider asking about:
        - Ways to reduce specific category expenses
        - Budget planning based on your spending
        - Inflation impact on your finances
        - Savings strategies in Pakistan
        - Education savings plans`;
      }
      
      setAnswer(response);
    } catch (error) {
      console.error('Error generating AI response:', error);
      setAnswer('Sorry, I encountered an error while processing your question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestedQuestion = (q: string) => {
    setQuestion(q);
    setAnswer('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Financial Assistant</CardTitle>
        <CardDescription>
          Ask questions about your finances and get AI-powered advice tailored to Pakistan's economy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Suggested Questions</label>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <Button 
                key={i} 
                variant="outline" 
                size="sm" 
                onClick={() => handleSuggestedQuestion(q)}
                className="text-xs text-left"
              >
                {q}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="question" className="text-sm font-medium">Your Question</label>
          <div className="flex gap-2">
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about budgeting, savings, or financial advice..."
              className="flex-1"
            />
            <Button 
              onClick={generateAnswer} 
              disabled={!question || isLoading}
              className="bg-pakistan-green hover:bg-pakistan-lightGreen self-end"
            >
              Ask
            </Button>
          </div>
        </div>
        
        {isLoading && <p className="text-center text-muted-foreground">Generating advice...</p>}
        
        {answer && (
          <div className="p-4 bg-muted rounded-lg whitespace-pre-line">
            <p className="font-medium mb-2">Answer:</p>
            <p>{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsights;
