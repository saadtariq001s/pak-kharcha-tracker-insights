import React, { createContext, useContext } from 'react';

interface EconomicMetric {
  name: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'positive' | 'negative' | 'neutral';
}

interface SavingRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface PakistanEconomyContextType {
  currentInflationRate: number;
  interestRate: number;
  exchangeRate: { USD: number, EUR: number, GBP: number, SAR: number };
  economicMetrics: EconomicMetric[];
  getSavingsRecommendations: (
    monthlyIncome: number, 
    monthlyExpenses: number, 
    savingGoal?: number
  ) => SavingRecommendation[];
  getInflationAdjustedValue: (value: number) => number;
}

const PakistanEconomyContext = createContext<PakistanEconomyContextType | undefined>(undefined);

// Pakistan economy constants (these are example values - would be updated regularly in a real app)
const INFLATION_RATE = 28.3; // %
const INTEREST_RATE = 22.0; // %
const EXCHANGE_RATE = {
  USD: 278.5,
  EUR: 304.3,
  GBP: 352.7,
  SAR: 74.2
};

export const PakistanEconomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current economic metrics for Pakistan
  const economicMetrics: EconomicMetric[] = [
    {
      name: 'Inflation Rate',
      value: `${INFLATION_RATE}%`,
      trend: 'down',
      impact: 'positive'
    },
    {
      name: 'Policy Rate',
      value: `${INTEREST_RATE}%`,
      trend: 'stable',
      impact: 'neutral'
    },
    {
      name: 'USD Exchange Rate',
      value: `PKR ${EXCHANGE_RATE.USD}`,
      trend: 'up',
      impact: 'negative'
    },
    {
      name: 'Utility Prices',
      value: 'High',
      trend: 'up',
      impact: 'negative'
    },
  ];

  // Generate savings recommendations based on user's financial situation
  const getSavingsRecommendations = (
    monthlyIncome: number, 
    monthlyExpenses: number,
    savingGoal?: number
  ): SavingRecommendation[] => {
    const recommendations: SavingRecommendation[] = [];
    
    // Calculate saving capacity
    const currentSavings = monthlyIncome - monthlyExpenses;
    const savingRate = monthlyIncome > 0 ? (currentSavings / monthlyIncome) * 100 : 0;
    
    // Basic recommendations
    if (savingRate < 10) {
      recommendations.push({
        title: 'Increase Savings Rate',
        description: 'Try to save at least 10-20% of your monthly income to build financial security in this high inflation environment.',
        priority: 'high'
      });
    }
    
    // Inflation protection
    recommendations.push({
      title: 'Beat Inflation',
      description: `With current inflation at ${INFLATION_RATE}%, consider investing in inflation-protected securities, gold, or real estate to preserve wealth.`,
      priority: 'high'
    });
    
    // Currency protection
    if (currentSavings > 50000) {
      recommendations.push({
        title: 'Currency Diversification',
        description: 'Consider keeping some savings in stable foreign currencies or investments to protect against PKR depreciation.',
        priority: 'medium'
      });
    }
    
    // Debt management in high interest environment
    recommendations.push({
      title: 'Pay Off High-Interest Debt',
      description: `With the current policy rate at ${INTEREST_RATE}%, prioritize paying off loans and credit cards to reduce interest burden.`,
      priority: 'high'
    });
    
    // Emergency fund
    recommendations.push({
      title: 'Build Emergency Fund',
      description: 'In the current economic uncertainty, maintain an emergency fund covering 3-6 months of expenses.',
      priority: 'medium'
    });
    
    // If user has specific savings goal
    if (savingGoal && savingGoal > 0) {
      const monthsToGoal = savingGoal / (currentSavings > 0 ? currentSavings : monthlyIncome * 0.1);
      
      recommendations.push({
        title: 'Savings Goal Plan',
        description: `At your current rate, you'll reach your savings goal in ${Math.round(monthsToGoal)} months. Consider additional income sources to accelerate this timeline.`,
        priority: 'medium'
      });
    }
    
    // Pakistan-specific savings options
    recommendations.push({
      title: 'National Savings Schemes',
      description: 'Consider Pakistan\'s National Savings Schemes which offer competitive returns that may beat inflation.',
      priority: 'medium'
    });
    
    return recommendations;
  };

  // Calculate inflation-adjusted values
  const getInflationAdjustedValue = (value: number): number => {
    return value * (1 + INFLATION_RATE / 100);
  };

  return (
    <PakistanEconomyContext.Provider
      value={{
        currentInflationRate: INFLATION_RATE,
        interestRate: INTEREST_RATE,
        exchangeRate: EXCHANGE_RATE,
        economicMetrics,
        getSavingsRecommendations,
        getInflationAdjustedValue,
      }}
    >
      {children}
    </PakistanEconomyContext.Provider>
  );
};

export const usePakistanEconomy = () => {
  const context = useContext(PakistanEconomyContext);
  if (context === undefined) {
    throw new Error('usePakistanEconomy must be used within a PakistanEconomyProvider');
  }
  return context;
};
