// src/components/OnboardingTour.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useExpenses } from '@/context/ExpenseContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Target, 
  TrendingUp, 
  Mic, 
  Download, 
  ArrowRight, 
  CheckCircle,
  Gift,
  Sparkles,
  Users,
  Shield
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

const OnboardingTour: React.FC = () => {
  const { user } = useAuth();
  const { expenses, addExpense } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      const onboardingKey = `onboarding-seen-${user.username}`;
      const seen = localStorage.getItem(onboardingKey);
      
      if (!seen && expenses.length === 0) {
        setIsOpen(true);
        setHasSeenOnboarding(false);
      } else {
        setHasSeenOnboarding(true);
      }
    }
  }, [user, expenses.length]);

  const markOnboardingComplete = () => {
    if (user) {
      const onboardingKey = `onboarding-seen-${user.username}`;
      localStorage.setItem(onboardingKey, 'true');
      setHasSeenOnboarding(true);
      setIsOpen(false);
    }
  };

  const addSampleExpense = async () => {
    try {
      await addExpense({
        amount: 500,
        category: 'Food & Groceries',
        description: 'Sample grocery expense',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Failed to add sample expense:', error);
    }
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: `Welcome to Pak-Kharcha, ${user?.username}! 🎉`,
      description: 'Your personal expense tracker designed specifically for Pakistan\'s economy. Let\'s get you started with a quick tour of the key features.',
      icon: <Sparkles className="w-6 h-6" />,
      completed: true
    },
    {
      id: 'security',
      title: 'Your Data is Secure 🔒',
      description: 'Each user has completely separate data stored in CSV format. Your financial information is private and secure, with no data sharing between accounts.',
      icon: <Shield className="w-6 h-6" />,
      completed: true
    },
    {
      id: 'add-expense',
      title: 'Add Your First Expense',
      description: 'Start tracking by adding an expense. You can enter details manually or use voice recognition (in supported browsers).',
      icon: <Wallet className="w-6 h-6" />,
      completed: expenses.length > 0,
      action: addSampleExpense,
      actionLabel: 'Add Sample Expense'
    },
    {
      id: 'voice-feature',
      title: 'Try Voice Recognition',
      description: 'Say something like "I spent 100 rupees on groceries" and watch the form auto-populate! Works in Chrome, Safari, and Edge.',
      icon: <Mic className="w-6 h-6" />,
      completed: false
    },
    {
      id: 'analytics',
      title: 'View Your Analytics',
      description: 'Get insights into your spending patterns with charts, trends, and AI-powered recommendations tailored for Pakistan\'s economy.',
      icon: <TrendingUp className="w-6 h-6" />,
      completed: false
    },
    {
      id: 'export',
      title: 'Export Your Data',
      description: 'Your data belongs to you. Export it anytime as a CSV file for backup or analysis in other tools.',
      icon: <Download className="w-6 h-6" />,
      completed: false
    }
  ];

  const completedSteps = onboardingSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / onboardingSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      markOnboardingComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    markOnboardingComplete();
  };

  if (!isOpen || hasSeenOnboarding) {
    return null;
  }

  const step = onboardingSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {step.icon}
              Getting Started
            </DialogTitle>
            <Badge variant="outline">
              Step {currentStep + 1} of {onboardingSteps.length}
            </Badge>
          </div>
          <DialogDescription>
            Let's help you get the most out of Pak-Kharcha
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>{completedSteps}/{onboardingSteps.length} completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current Step */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${step.completed ? 'bg-green-100 text-green-600' : 'bg-pakistan-green/10 text-pakistan-green'}`}>
                  {step.completed ? <CheckCircle className="w-6 h-6" /> : step.icon}
                </div>
                <div>
                  {step.title}
                  {step.completed && (
                    <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                      ✓ Complete
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription className="text-base">
                {step.description}
              </CardDescription>
            </CardHeader>
            {step.action && !step.completed && (
              <CardContent>
                <Button 
                  onClick={step.action}
                  className="bg-pakistan-green hover:bg-pakistan-lightGreen"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {step.actionLabel}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Quick Tips */}
          {currentStep === 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Multi-User System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>User: Saad</strong>
                    <p className="text-muted-foreground">Password: elegnoiaceo</p>
                  </div>
                  <div>
                    <strong>User: Areeba</strong>
                    <p className="text-muted-foreground">Password: elegnoiaai</p>
                  </div>
                </div>
                <p className="text-sm text-blue-700 mt-3">
                  Each user has completely separate expense data. Try switching users to see the isolation in action!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Feature Highlights */}
          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">Data Privacy</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your data is stored locally in CSV format. No cloud storage means complete privacy.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-800">Data Ownership</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Export your data anytime. It's your data, and you have full control over it.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip Tour
            </Button>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button 
                onClick={handleNext}
                className="bg-pakistan-green hover:bg-pakistan-lightGreen"
              >
                {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-pakistan-green' 
                    : index < currentStep 
                      ? 'bg-green-400' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;