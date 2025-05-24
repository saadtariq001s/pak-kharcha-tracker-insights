// src/lib/ai-service.ts
import { FinancialTransaction } from '@/context/FinancialContext';

interface FinancialAnalysis {
  summary: string;
  profitTrends: string;
  recommendations: string[];
  cashFlowInsights: string;
  riskAssessment: string;
  growthOpportunities: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class GeminiAIService {
  private static readonly API_KEY = 'AIzaSyBg3Hip1lHjGdquwPUeLyR0Mhr9gTn17-g';
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  private static async makeRequest(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No response generated');
      }
    } catch (error) {
      console.error('Gemini AI request failed:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  static async analyzeFinancialData(
    transactions: FinancialTransaction[],
    monthlyIncome: number,
    monthlyExpenses: number,
    monthlyProfit: number
  ): Promise<FinancialAnalysis> {
    const prompt = `
As an expert financial advisor for startups and tech companies, analyze the following financial data for Elegnoia (a technology company) and provide actionable insights:

FINANCIAL DATA:
- Monthly Income: $${monthlyIncome.toLocaleString()}
- Monthly Expenses: $${monthlyExpenses.toLocaleString()}
- Monthly Profit: $${monthlyProfit.toLocaleString()}
- Total Transactions: ${transactions.length}

TRANSACTION BREAKDOWN:
${this.formatTransactionSummary(transactions)}

Please provide a comprehensive analysis in the following structure:

1. EXECUTIVE SUMMARY (2-3 sentences)
2. PROFIT TRENDS & PERFORMANCE
3. TOP 5 ACTIONABLE RECOMMENDATIONS
4. CASH FLOW INSIGHTS
5. RISK ASSESSMENT
6. GROWTH OPPORTUNITIES

Focus on:
- Profit optimization strategies
- Cash flow management
- Cost reduction opportunities
- Revenue growth potential
- Financial health indicators
- Startup-specific advice

Keep recommendations practical and immediately actionable for a tech startup's accounts department.
`;

    try {
      const response = await this.makeRequest(prompt);
      return this.parseFinancialAnalysis(response);
    } catch (error) {
      // Return fallback analysis if API fails
      return this.getFallbackAnalysis(monthlyIncome, monthlyExpenses, monthlyProfit);
    }
  }

  static async generateBusinessInsight(question: string, context: {
    transactions: FinancialTransaction[];
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyProfit: number;
  }): Promise<string> {
    const prompt = `
As a financial advisor for Elegnoia (a technology startup), answer this business question:

QUESTION: ${question}

FINANCIAL CONTEXT:
- Monthly Income: $${context.monthlyIncome.toLocaleString()}
- Monthly Expenses: $${context.monthlyExpenses.toLocaleString()}
- Monthly Profit: $${context.monthlyProfit.toLocaleString()}
- Profit Margin: ${context.monthlyIncome > 0 ? ((context.monthlyProfit / context.monthlyIncome) * 100).toFixed(1) : 0}%

RECENT TRANSACTIONS:
${this.formatTransactionSummary(context.transactions.slice(-10))}

Provide a detailed, actionable response that:
1. Directly addresses the question
2. Uses the provided financial data
3. Offers specific recommendations
4. Considers startup/tech company challenges
5. Includes numbers and percentages where relevant

Keep the response concise but comprehensive (200-400 words).
`;

    try {
      return await this.makeRequest(prompt);
    } catch (error) {
      return `I apologize, but I'm currently unable to process your question due to a technical issue. However, based on your current financial position with $${context.monthlyIncome.toLocaleString()} in monthly income and $${context.monthlyExpenses.toLocaleString()} in expenses, I recommend focusing on optimizing your profit margin and maintaining positive cash flow. Please try asking your question again in a moment.`;
    }
  }

  static async getCashFlowPrediction(
    historicalData: { month: string; income: number; expenses: number; profit: number }[]
  ): Promise<string> {
    const prompt = `
As a financial forecasting expert, analyze this 6-month cash flow data for Elegnoia and provide a prediction for the next 3 months:

HISTORICAL CASH FLOW DATA:
${historicalData.map(d => `${d.month}: Income $${d.income.toLocaleString()}, Expenses $${d.expenses.toLocaleString()}, Profit $${d.profit.toLocaleString()}`).join('\n')}

Provide:
1. CASH FLOW PREDICTION for next 3 months (with specific numbers)
2. KEY TRENDS identified in the data
3. CRITICAL RECOMMENDATIONS for cash flow optimization
4. RISK FACTORS to monitor
5. GROWTH OPPORTUNITIES based on trends

Focus on actionable insights for a tech startup's financial planning.
`;

    try {
      return await this.makeRequest(prompt);
    } catch (error) {
      return "Cash flow prediction is temporarily unavailable. Based on your recent trends, I recommend maintaining current income levels while optimizing expenses to improve profit margins.";
    }
  }

  private static formatTransactionSummary(transactions: FinancialTransaction[]): string {
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const incomeByCategory = income.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const expensesByCategory = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    let summary = "INCOME BREAKDOWN:\n";
    Object.entries(incomeByCategory).forEach(([category, amount]) => {
      summary += `- ${category}: $${amount.toLocaleString()}\n`;
    });
    
    summary += "\nEXPENSE BREAKDOWN:\n";
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      summary += `- ${category}: $${amount.toLocaleString()}\n`;
    });

    return summary;
  }

  private static parseFinancialAnalysis(response: string): FinancialAnalysis {
    const sections = response.split(/\d+\.\s+/);
    
    return {
      summary: this.extractSection(response, ['EXECUTIVE SUMMARY', 'SUMMARY']) || 'Financial analysis completed.',
      profitTrends: this.extractSection(response, ['PROFIT TRENDS', 'PERFORMANCE']) || 'Profit trends analysis unavailable.',
      recommendations: this.extractRecommendations(response),
      cashFlowInsights: this.extractSection(response, ['CASH FLOW', 'FLOW INSIGHTS']) || 'Cash flow analysis unavailable.',
      riskAssessment: this.extractSection(response, ['RISK ASSESSMENT', 'RISKS']) || 'Risk assessment unavailable.',
      growthOpportunities: this.extractOpportunities(response)
    };
  }

  private static extractSection(text: string, keywords: string[]): string {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[^\\n]*\\n([^\\n]*(?:\\n(?!\\d+\\.|[A-Z ]+:)[^\\n]*)*)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  }

  private static extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    const lines = text.split('\n');
    let inRecommendations = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommendation')) {
        inRecommendations = true;
        continue;
      }
      
      if (inRecommendations) {
        if (line.match(/^\d+\.|^-|^•/) || line.trim().startsWith('*')) {
          recommendations.push(line.replace(/^\d+\.|^-|^•|^\*/, '').trim());
        } else if (line.match(/^\d+\.\s+[A-Z]/)) {
          break;
        }
      }
    }
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  private static extractOpportunities(text: string): string[] {
    const opportunities: string[] = [];
    const lines = text.split('\n');
    let inOpportunities = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('growth') || line.toLowerCase().includes('opportunit')) {
        inOpportunities = true;
        continue;
      }
      
      if (inOpportunities) {
        if (line.match(/^\d+\.|^-|^•/) || line.trim().startsWith('*')) {
          opportunities.push(line.replace(/^\d+\.|^-|^•|^\*/, '').trim());
        }
      }
    }
    
    return opportunities.slice(0, 3);
  }

  private static getFallbackAnalysis(income: number, expenses: number, profit: number): FinancialAnalysis {
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;
    
    return {
      summary: `Current financial position shows ${profit >= 0 ? 'profitable' : 'loss-making'} operations with a ${profitMargin.toFixed(1)}% profit margin.`,
      profitTrends: `Monthly profit of $${profit.toLocaleString()} indicates ${profit >= 0 ? 'positive' : 'negative'} performance. ${profitMargin > 20 ? 'Excellent' : profitMargin > 10 ? 'Good' : 'Needs improvement'} profit margin.`,
      recommendations: [
        profit < 0 ? 'Immediate cost reduction required' : 'Maintain current profitability',
        'Analyze highest expense categories for optimization',
        'Focus on increasing revenue from top-performing services',
        'Implement monthly financial reviews',
        'Consider automation to reduce operational costs'
      ],
      cashFlowInsights: `Cash flow shows ${income > expenses ? 'positive' : 'negative'} trend. Monitor payment cycles and expense timing.`,
      riskAssessment: `${profit < 0 ? 'High' : profit < income * 0.1 ? 'Medium' : 'Low'} financial risk based on current profit margins.`,
      growthOpportunities: [
        'Expand high-margin service offerings',
        'Optimize pricing strategy',
        'Invest in automation and efficiency'
      ]
    };
  }
}