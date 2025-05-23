// src/components/AIInsights.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useExpenses } from '@/context/ExpenseContext';
import { usePakistanEconomy } from '@/context/PakistanEconomyContext';
import { formatCurrency } from '@/lib/expense-utils';
import { getCurrentMonthYear } from '@/lib/date-utils';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  MessageSquare,
  Clock,
  Target
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
}

interface ExpenseInsight {
  type: 'trend' | 'anomaly' | 'recommendation' | 'warning';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

const AIInsights: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  
  const { expenses, getTotalByCategory, getMonthlyTotal } = useExpenses();
  const { currentInflationRate, economicMetrics } = usePakistanEconomy();
  const { month, year } = getCurrentMonthYear();
  
  // Advanced expense analytics
  const expenseAnalytics = useMemo(() => {
    const monthlyTotal = getMonthlyTotal(month, year);
    const categoryTotals = getTotalByCategory(month, year);
    
    // Find spending patterns
    const topCategories = Object.entries(categoryTotals)
      .filter(([_, amount]) => amount > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5);
    
    // Calculate trends (comparing with previous month)
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthTotal = getMonthlyTotal(prevMonth, prevYear);
    const monthlyGrowth = prevMonthTotal > 0 ? 
      ((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0;
    
    // Calculate daily averages
    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDay = today.getDate();
    const dailyAverage = monthlyTotal / currentDay;
    const projectedMonthlyTotal = dailyAverage * daysInMonth;
    
    // Risk assessment
    const spendingVelocity = monthlyTotal / currentDay;
    const isHighSpending = spendingVelocity > (prevMonthTotal / 30) * 1.2;
    
    return {
      monthlyTotal,
      prevMonthTotal,
      monthlyGrowth,
      topCategories,
      dailyAverage,
      projectedMonthlyTotal,
      spendingVelocity,
      isHighSpending,
      currentDay,
      daysInMonth
    };
  }, [expenses, month, year, getMonthlyTotal, getTotalByCategory]);
  
  // Generate intelligent insights
  const generateInsights = useMemo((): ExpenseInsight[] => {
    const insights: ExpenseInsight[] = [];
    const { monthlyGrowth, isHighSpending, projectedMonthlyTotal, topCategories } = expenseAnalytics;
    
    // Trend analysis
    if (Math.abs(monthlyGrowth) > 15) {
      insights.push({
        type: monthlyGrowth > 0 ? 'warning' : 'trend',
        title: `${monthlyGrowth > 0 ? 'Increased' : 'Decreased'} Spending Alert`,
        description: `Your spending has ${monthlyGrowth > 0 ? 'increased' : 'decreased'} by ${Math.abs(monthlyGrowth).toFixed(1)}% compared to last month. ${monthlyGrowth > 0 ? 'Consider reviewing your budget.' : 'Great job on reducing expenses!'}`,
        confidence: 0.9,
        actionable: monthlyGrowth > 0
      });
    }
    
    // High spending velocity warning
    if (isHighSpending) {
      insights.push({
        type: 'warning',
        title: 'High Spending Velocity Detected',
        description: `At your current rate, you're projected to spend ${formatCurrency(projectedMonthlyTotal)} this month, which is significantly higher than usual.`,
        confidence: 0.85,
        actionable: true
      });
    }
    
    // Category-specific insights
    if (topCategories.length > 0) {
      const [topCategory, topAmount] = topCategories[0];
      const categoryPercentage = (topAmount / expenseAnalytics.monthlyTotal) * 100;
      
      if (categoryPercentage > 40) {
        insights.push({
          type: 'anomaly',
          title: `High ${topCategory} Spending`,
          description: `${topCategory} accounts for ${categoryPercentage.toFixed(1)}% of your monthly spending (${formatCurrency(topAmount)}). Consider if this aligns with your priorities.`,
          confidence: 0.8,
          actionable: true
        });
      }
    }
    
    // Inflation impact
    const inflationImpact = expenseAnalytics.monthlyTotal * (currentInflationRate / 100);
    if (inflationImpact > 1000) {
      insights.push({
        type: 'recommendation',
        title: 'Inflation Impact Analysis',
        description: `Current inflation (${currentInflationRate}%) is adding approximately ${formatCurrency(inflationImpact)} to your monthly costs. Consider inflation-protected investments.`,
        confidence: 0.95,
        actionable: true
      });
    }
    
    return insights;
  }, [expenseAnalytics, currentInflationRate]);
  
  useEffect(() => {
    // Generate contextual suggested questions
    const questions = [
      `How can I reduce my ${expenseAnalytics.topCategories[0]?.[0] || 'Food & Groceries'} expenses?`,
      `What should be my monthly budget based on my spending patterns?`,
      `How is inflation affecting my purchasing power?`,
      `What are the best savings strategies for someone in Pakistan?`,
      `How can I optimize my spending across different categories?`,
      `What's my spending trend over the last few months?`,
      `How does my spending compare to recommended budgets?`
    ];
    
    setSuggestedQuestions(questions);
  }, [expenseAnalytics]);
  
  // Enhanced AI response generation
  const generateAIResponse = async (userQuestion: string): Promise<string> => {
    const lowerQuestion = userQuestion.toLowerCase();
    const { monthlyTotal, topCategories, monthlyGrowth, dailyAverage } = expenseAnalytics;
    
    // Keyword matching with context
    if (lowerQuestion.includes('reduce') || lowerQuestion.includes('save') || lowerQuestion.includes('cut')) {
      const targetCategory = topCategories.find(([category]) => 
        lowerQuestion.includes(category.toLowerCase())
      );
      
      if (targetCategory) {
        const [category, amount] = targetCategory;
        return `To reduce your ${category} expenses (currently ${formatCurrency(amount)}):

🎯 **Immediate Actions:**
• Set a weekly budget of ${formatCurrency(amount / 4)} for ${category}
• Track every ${category} expense for the next 2 weeks
• Look for alternatives - compare prices before purchasing

📊 **Based on your data:**
• This category represents ${((amount / monthlyTotal) * 100).toFixed(1)}% of your monthly spending
• A 20% reduction would save you ${formatCurrency(amount * 0.2)} monthly

💡 **Smart Tips for ${category}:**
${getCategorySpecificTips(category)}

🇵🇰 **Pakistan-specific advice:**
Consider local markets for better prices and bulk buying during sales seasons.`;
      }
    }
    
    if (lowerQuestion.includes('budget') || lowerQuestion.includes('plan')) {
      const recommendedBudget = monthlyTotal * 1.1; // 10% buffer
      return `Based on your spending patterns, here's a personalized budget plan:

📊 **Current Analysis:**
• Monthly spending: ${formatCurrency(monthlyTotal)}
• Daily average: ${formatCurrency(dailyAverage)}
• Growth vs last month: ${monthlyGrowth > 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}%

💰 **Recommended Monthly Budget: ${formatCurrency(recommendedBudget)}**

🏗️ **Budget Breakdown (50/30/20 rule adapted for Pakistan):**
• **Needs (55%)**: ${formatCurrency(recommendedBudget * 0.55)}
  - Housing, utilities, groceries, transportation
• **Wants (25%)**: ${formatCurrency(recommendedBudget * 0.25)}
  - Entertainment, dining out, shopping
• **Savings (20%)**: ${formatCurrency(recommendedBudget * 0.20)}
  - Emergency fund, investments, future goals

⚠️ **Action Required:**
${monthlyTotal > recommendedBudget * 0.8 ? 
  'Your current spending is near the recommended limit. Focus on the "wants" category for reductions.' :
  'You have good spending control. Consider increasing your savings rate.'
}`;
    }
    
    if (lowerQuestion.includes('inflation') || lowerQuestion.includes('economy')) {
      const inflationImpact = monthlyTotal * (currentInflationRate / 100);
      return `🇵🇰 **Inflation Impact on Your Finances:**

📈 **Current Situation:**
• Pakistan's inflation rate: ${currentInflationRate}%
• Monthly impact on your expenses: ${formatCurrency(inflationImpact)}
• Annual impact: ${formatCurrency(inflationImpact * 12)}

💡 **Inflation Protection Strategies:**

**1. Smart Shopping:**
• Buy non-perishables in bulk during sales
• Switch to local brands for similar quality
• Use price comparison apps

**2. Income Enhancement:**
• Negotiate salary increases matching inflation
• Develop side skills for additional income
• Consider freelancing in your expertise area

**3. Investment Options:**
• National Savings Certificates (usually beat inflation)
• Real estate (historically inflation-resistant in Pakistan)
• Prize bonds for capital protection

**4. Expense Management:**
• Focus on variable costs - they're easier to control
• Substitute expensive items with local alternatives
• Time your purchases with seasonal price drops`;
    }
    
    if (lowerQuestion.includes('trend') || lowerQuestion.includes('pattern')) {
      return `📊 **Your Spending Trends Analysis:**

📈 **Monthly Trend:**
• Current month: ${formatCurrency(monthlyTotal)}
• Change from last month: ${monthlyGrowth > 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}%
• Daily spending rate: ${formatCurrency(dailyAverage)}

🏆 **Top Spending Categories:**
${topCategories.slice(0, 3).map(([category, amount], index) => 
  `${index + 1}. ${category}: ${formatCurrency(amount)} (${((amount / monthlyTotal) * 100).toFixed(1)}%)`
).join('\n')}

🔍 **Insights:**
${generateTrendInsights()}

💪 **Actionable Recommendations:**
• ${monthlyGrowth > 10 ? 'Review and reduce discretionary spending' : 'Maintain current spending discipline'}
• Focus on optimizing your top spending category
• Set weekly spending limits to improve control`;
    }
    
    // Default comprehensive response
    return `I'd be happy to help you with that! Here's what I can tell you based on your expense data:

📊 **Your Financial Snapshot:**
• Monthly spending: ${formatCurrency(monthlyTotal)}
• Top expense category: ${topCategories[0]?.[0] || 'No data available'}
• Spending change: ${monthlyGrowth.toFixed(1)}% vs last month

💡 **I can help you with:**
• Budget planning and optimization
• Expense reduction strategies
• Inflation impact analysis
• Spending trend analysis
• Category-specific saving tips

Please ask a more specific question about budgeting, saving, or expense management, and I'll provide detailed, personalized advice!`;
  };
  
  const getCategorySpecificTips = (category: string): string => {
    const tips = {
      'Food & Groceries': '• Plan weekly meals and make shopping lists\n• Buy seasonal produce from local markets\n• Cook at home more often\n• Buy generic brands for staples',
      'Transportation': '• Use public transport or carpooling\n• Maintain your vehicle regularly for fuel efficiency\n• Consider ride-sharing for occasional trips\n• Walk or cycle for short distances',
      'Utilities': '• Use energy-efficient appliances\n• Optimize AC usage with proper insulation\n• Switch to LED bulbs\n• Monitor water usage',
      'Entertainment': '• Look for free local events\n• Use streaming services instead of cable\n• Take advantage of student/group discounts\n• Plan home entertainment options'
    };
    
    return tips[category] || '• Track all expenses in this category\n• Look for alternatives and substitutes\n• Set weekly spending limits\n• Compare prices before purchasing';
  };
  
  const generateTrendInsights = (): string => {
    const { monthlyGrowth, isHighSpending } = expenseAnalytics;
    
    if (monthlyGrowth > 15) {
      return 'Your spending has increased significantly. This could be due to seasonal factors, one-time purchases, or lifestyle changes.';
    } else if (monthlyGrowth < -15) {
      return 'Excellent work on reducing expenses! You\'re showing great financial discipline.';
    } else if (isHighSpending) {
      return 'Your spending velocity is higher than usual. Consider implementing daily spending limits.';
    } else {
      return 'Your spending pattern is relatively stable, which indicates good budget control.';
    }
  };
  
  const handleSubmit = async () => {
    if (!question.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setQuestion('');
    
    try {
      const response = await generateAIResponse(question);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date(),
        confidence: 0.85
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I encountered an error while processing your question. Please try again with a different question.',
        timestamp: new Date(),
        confidence: 0.1
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestedQuestion = (q: string) => {
    setQuestion(q);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4" />;
      case 'anomaly': return <TrendingDown className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return 'border-blue-200 bg-blue-50';
      case 'warning': return 'border-red-200 bg-red-50';
      case 'recommendation': return 'border-green-200 bg-green-50';
      case 'anomaly': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Overview */}
      {generateInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-pakistan-green" />
              Smart Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your spending patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {generateInsights.map((insight, index) => (
                <div key={index} className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{insight.description}</p>
                      {insight.actionable && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleSuggestedQuestion(`How can I address the issue: ${insight.title}?`)}
                        >
                          <Target className="w-3 h-3 mr-1" />
                          Get Action Plan
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pakistan-green" />
            AI Financial Assistant
          </CardTitle>
          <CardDescription>
            Ask questions about your finances and get personalized advice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Suggested Questions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Suggested Questions</label>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.slice(0, 4).map((q, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSuggestedQuestion(q)}
                  className="text-xs text-left h-auto py-2 px-3"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-3 p-3 border rounded-lg bg-gray-50">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-pakistan-green text-white' 
                      : 'bg-white border shadow-sm'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      <Clock className="w-3 h-3" />
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {message.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {(message.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Input Area */}
          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium">Ask a Question</label>
            <div className="flex gap-2">
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about budgeting, savings, spending patterns, or financial advice..."
                className="flex-1 min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button 
                onClick={handleSubmit} 
                disabled={!question.trim() || isLoading}
                className="bg-pakistan-green hover:bg-pakistan-lightGreen self-end"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Ask AI
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;