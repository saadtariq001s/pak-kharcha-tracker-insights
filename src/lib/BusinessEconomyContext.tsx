// src/context/BusinessEconomyContext.tsx
import React, { createContext, useContext } from 'react';

interface BusinessMetric {
  name: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface BusinessRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'cost-reduction' | 'revenue-growth' | 'efficiency' | 'risk-management';
  expectedImpact: string;
}

interface BusinessEconomyContextType {
  businessMetrics: BusinessMetric[];
  getBusinessRecommendations: (
    monthlyIncome: number, 
    monthlyExpenses: number,
    profitMargin: number
  ) => BusinessRecommendation[];
  calculateBurnRate: (monthlyExpenses: number, cashOnHand: number) => number;
  getFinancialHealth: (income: number, expenses: number, growth: number) => {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    description: string;
  };
  getMarketBenchmarks: () => {
    profitMargin: { min: number; target: number; excellent: number };
    growthRate: { min: number; target: number; excellent: number };
    burnRate: { safe: number; warning: number; critical: number };
  };
}

const BusinessEconomyContext = createContext<BusinessEconomyContextType | undefined>(undefined);

export const BusinessEconomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current business metrics and market conditions
  const businessMetrics: BusinessMetric[] = [
    {
      name: 'Tech Market Growth',
      value: '12.5%',
      trend: 'up',
      impact: 'positive',
      description: 'Technology sector showing strong growth this quarter'
    },
    {
      name: 'SaaS Avg Profit Margin',
      value: '18-25%',
      trend: 'stable',
      impact: 'neutral',
      description: 'Industry standard for software companies'
    },
    {
      name: 'Startup Funding',
      value: 'Moderate',
      trend: 'down',
      impact: 'negative',
      description: 'VC funding becoming more selective in current market'
    },
    {
      name: 'Remote Work Adoption',
      value: '78%',
      trend: 'up',
      impact: 'positive',
      description: 'Continued growth in remote work reducing office costs'
    },
    {
      name: 'Cloud Services Demand',
      value: 'High',
      trend: 'up',
      impact: 'positive',
      description: 'Increasing demand for cloud-based solutions'
    },
  ];

  const getBusinessRecommendations = (
    monthlyIncome: number, 
    monthlyExpenses: number,
    profitMargin: number
  ): BusinessRecommendation[] => {
    const recommendations: BusinessRecommendation[] = [];
    
    // Profit margin analysis
    if (profitMargin < 10) {
      recommendations.push({
        title: 'Improve Profit Margins',
        description: 'Current profit margin is below industry standards. Focus on cost optimization and pricing strategy review.',
        priority: 'high',
        category: 'cost-reduction',
        expectedImpact: 'Increase profit margin by 5-8%'
      });
    }
    
    // Revenue optimization
    if (monthlyIncome < monthlyExpenses * 1.2) {
      recommendations.push({
        title: 'Revenue Growth Strategy',
        description: 'Implement aggressive revenue growth initiatives to improve financial stability and market position.',
        priority: 'high',
        category: 'revenue-growth',
        expectedImpact: 'Target 25% revenue increase over next quarter'
      });
    }
    
    // Cost structure optimization
    if (monthlyExpenses > 100000) {
      recommendations.push({
        title: 'Cost Structure Review',
        description: 'Analyze major expense categories for potential automation and efficiency improvements.',
        priority: 'medium',
        category: 'efficiency',
        expectedImpact: 'Reduce operational costs by 10-15%'
      });
    }
    
    // Cash flow management
    recommendations.push({
      title: 'Cash Flow Optimization',
      description: 'Implement invoice automation and improve collection processes to strengthen cash position.',
      priority: 'medium',
      category: 'efficiency',
      expectedImpact: 'Improve cash flow by 20-30 days'
    });
    
    // Technology investment
    if (profitMargin > 15) {
      recommendations.push({
        title: 'Technology Investment',
        description: 'Consider investing in automation tools and productivity software to scale operations.',
        priority: 'low',
        category: 'efficiency',
        expectedImpact: 'Increase team productivity by 15-25%'
      });
    }
    
    // Risk management
    if (monthlyIncome > 0) {
      const months_runway = monthlyIncome > monthlyExpenses ? 'Positive' : 'Limited';
      recommendations.push({
        title: 'Financial Risk Management',
        description: 'Establish emergency fund and diversify revenue streams to reduce business risk.',
        priority: months_runway === 'Limited' ? 'high' : 'medium',
        category: 'risk-management',
        expectedImpact: 'Improve financial stability and reduce risk exposure'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const calculateBurnRate = (monthlyExpenses: number, cashOnHand: number): number => {
    if (monthlyExpenses <= 0) return 0;
    return cashOnHand / monthlyExpenses;
  };

  const getFinancialHealth = (income: number, expenses: number, growth: number) => {
    const profitMargin = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const isProfit = income > expenses;
    
    let score = 0;
    
    // Profitability (40 points)
    if (isProfit) {
      score += 20;
      if (profitMargin > 20) score += 20;
      else if (profitMargin > 10) score += 15;
      else score += 10;
    }
    
    // Growth (30 points)
    if (growth > 20) score += 30;
    else if (growth > 10) score += 20;
    else if (growth > 0) score += 15;
    else if (growth > -10) score += 10;
    
    // Financial stability (30 points)
    if (income > expenses * 1.5) score += 30;
    else if (income > expenses * 1.2) score += 20;
    else if (income > expenses) score += 15;
    else score += 5;
    
    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    let description: string;
    
    if (score >= 80) {
      status = 'excellent';
      description = 'Outstanding financial performance with strong profitability and growth';
    } else if (score >= 65) {
      status = 'good';
      description = 'Solid financial health with room for optimization';
    } else if (score >= 50) {
      status = 'fair';
      description = 'Moderate financial position requiring attention';
    } else if (score >= 30) {
      status = 'poor';
      description = 'Financial challenges requiring immediate action';
    } else {
      status = 'critical';
      description = 'Critical financial situation requiring urgent intervention';
    }
    
    return { score, status, description };
  };

  const getMarketBenchmarks = () => ({
    profitMargin: { min: 5, target: 15, excellent: 25 },
    growthRate: { min: 10, target: 20, excellent: 40 },
    burnRate: { safe: 18, warning: 12, critical: 6 }
  });

  return (
    <BusinessEconomyContext.Provider
      value={{
        businessMetrics,
        getBusinessRecommendations,
        calculateBurnRate,
        getFinancialHealth,
        getMarketBenchmarks,
      }}
    >
      {children}
    </BusinessEconomyContext.Provider>
  );
};

export const useBusinessEconomy = () => {
  const context = useContext(BusinessEconomyContext);
  if (context === undefined) {
    throw new Error('useBusinessEconomy must be used within a BusinessEconomyProvider');
  }
  return context;
};