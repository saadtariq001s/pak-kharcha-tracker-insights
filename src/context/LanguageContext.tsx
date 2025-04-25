
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define supported languages
type Language = 'en' | 'ur';

// Translations for key phrases
const translations: Record<Language, Record<string, string>> = {
  en: {
    // English translations (default)
    'dashboard': 'Dashboard',
    'expenses': 'Expenses',
    'analytics': 'Analytics',
    'insights': 'Insights',
    'settings': 'Settings',
    'add_expense': 'Add Expense',
    'amount': 'Amount',
    'category': 'Category',
    'description': 'Description',
    'date': 'Date',
    'total': 'Total',
    'monthly_total': 'Monthly Total',
    'daily_average': 'Daily Average',
    'savings_recommendations': 'Savings Recommendations',
    'add_by_voice': 'Add by Voice',
    'food': 'Food & Groceries',
    'transportation': 'Transportation',
    'utilities': 'Utilities',
    'housing': 'Housing',
    'healthcare': 'Healthcare',
    'education': 'Education',
    'entertainment': 'Entertainment',
    'shopping': 'Shopping',
    'charity': 'Charity/Zakat',
    'mobile': 'Mobile/Internet',
    'family': 'Family Support',
    'debt': 'Debt Payment',
    'miscellaneous': 'Miscellaneous'
  },
  ur: {
    // Urdu translations
    'dashboard': 'ڈیش بورڈ',
    'expenses': 'اخراجات',
    'analytics': 'تجزیات',
    'insights': 'بصیرت',
    'settings': 'ترتیبات',
    'add_expense': 'خرچہ شامل کریں',
    'amount': 'رقم',
    'category': 'زمرہ',
    'description': 'تفصیل',
    'date': 'تاریخ',
    'total': 'کل',
    'monthly_total': 'ماہانہ کل',
    'daily_average': 'روزانہ اوسط',
    'savings_recommendations': 'بچت کی سفارشات',
    'add_by_voice': 'آواز سے شامل کریں',
    'food': 'کھانا اور گروسری',
    'transportation': 'نقل و حمل',
    'utilities': 'یوٹیلیٹیز',
    'housing': 'رہائش',
    'healthcare': 'صحت کی دیکھ بھال',
    'education': 'تعلیم',
    'entertainment': 'تفریح',
    'shopping': 'خریداری',
    'charity': 'خیرات/زکوٰۃ',
    'mobile': 'موبائل/انٹرنیٹ',
    'family': 'خاندانی مدد',
    'debt': 'قرض کی ادائیگی',
    'miscellaneous': 'متفرق'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  
  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ur')) {
      setLanguage(savedLanguage);
    }
  }, []);
  
  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);
  
  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
