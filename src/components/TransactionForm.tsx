// src/components/TransactionForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { TransactionType, IncomeCategory, ExpenseCategory } from '@/context/FinancialContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Building2,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .min(1, 'Amount must be at least 1')
    .max(10000000, 'Amount cannot exceed 10,000,000'),
  category: z.string().min(1, 'Category is required'),
  description: z.string()
    .min(2, 'Description must be at least 2 characters')
    .max(200, 'Description cannot exceed 200 characters'),
  date: z.string().min(1, 'Date is required'),
  clientProject: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSubmit: (values: TransactionFormValues) => void | Promise<void>;
  defaultValues?: Partial<TransactionFormValues>;
  buttonText?: string;
  isLoading?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onSubmit, 
  defaultValues = {
    type: 'expense' as TransactionType,
    amount: 0,
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    clientProject: '',
    invoiceNumber: '',
    paymentMethod: '',
    notes: '',
  },
  buttonText = 'Add Transaction',
  isLoading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });

  const watchedType = form.watch('type');
  const watchedAmount = form.watch('amount');
  const watchedCategory = form.watch('category');

  const incomeCategories: IncomeCategory[] = [
    'Client Projects',
    'Software Licenses',
    'Consulting Services',
    'Maintenance Contracts',
    'Product Sales',
    'Subscription Revenue',
    'Partnership Revenue',
    'Investment Income',
    'Other Income',
  ];

  const expenseCategories: ExpenseCategory[] = [
    'Employee Salaries',
    'Software Subscriptions',
    'Office Rent',
    'Utilities',
    'Marketing & Advertising',
    'Professional Services',
    'Equipment & Hardware',
    'Travel & Business',
    'Training & Development',
    'Insurance',
    'Taxes & Compliance',
    'Miscellaneous Business',
  ];

  const paymentMethods = [
    'Bank Transfer',
    'Credit Card',
    'Debit Card',
    'Cash',
    'Check',
    'Digital Wallet',
    'Cryptocurrency',
    'Other',
  ];

  const handleFormSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await onSubmit(values);
      // Reset form on successful submission (for add mode)
      if (buttonText === 'Add Transaction') {
        form.reset({
          type: 'expense' as TransactionType,
          amount: 0,
          category: '',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          clientProject: '',
          invoiceNumber: '',
          paymentMethod: '',
          notes: '',
        });
      }
      toast.success(`${values.type === 'income' ? 'Income' : 'Expense'} recorded successfully!`);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error.message || 'Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = () => {
    return watchedType === 'income' ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> : 
      <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getAmountColor = () => {
    return watchedType === 'income' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Transaction Type Tabs */}
        <Tabs value={watchedType} onValueChange={(value) => form.setValue('type', value as TransactionType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Income
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Expense
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="space-y-4 mt-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Recording Income</h3>
              <p className="text-sm text-green-700">
                Track revenue from clients, projects, subscriptions, and other income sources.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="expense" className="space-y-4 mt-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Recording Expense</h3>
              <p className="text-sm text-red-700">
                Track business expenses including salaries, subscriptions, office costs, and operational expenses.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Amount and Basic Info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Amount ($)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter amount"
                    min="1"
                    max="10000000"
                    step="1"
                    className="text-lg font-medium"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  {watchedAmount > 0 && (
                    <span className={`font-medium ${getAmountColor()}`}>
                      ${watchedAmount.toLocaleString()}
                    </span>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  {getCategoryIcon()}
                  Category
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(watchedType === 'income' ? incomeCategories : expenseCategories).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description and Date */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter transaction description"
                    className="resize-none"
                    maxLength={200}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  {field.value ? `${field.value.length}/200 characters` : '0/200 characters'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    max={format(new Date(), 'yyyy-MM-dd')}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Cannot be a future date
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Fields Based on Type */}
        {watchedType === 'income' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="clientProject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Client/Project (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Client name or project"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Track revenue by client or project
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="INV-001"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Reference invoice number
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Payment Method */}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Method (Optional)
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional notes or details"
                  className="resize-none"
                  maxLength={300}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {field.value ? `${field.value.length}/300 characters` : 'Optional additional context'}
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Preview section */}
        {watchedAmount > 0 && watchedCategory && (
          <div className={`p-4 rounded-lg border-l-4 ${
            watchedType === 'income' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
          }`}>
            <h4 className={`font-medium mb-2 ${
              watchedType === 'income' ? 'text-green-800' : 'text-red-800'
            }`}>
              Transaction Preview
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <Badge variant="outline" className="ml-2">
                  {watchedType === 'income' ? 'Income' : 'Expense'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className={`ml-2 font-medium ${getAmountColor()}`}>
                  ${watchedAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium">{watchedCategory}</span>
              </div>
              <div>
                <span className="text-gray-600">Impact:</span>
                <span className={`ml-2 font-medium ${
                  watchedType === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {watchedType === 'income' ? '+' : '-'}${watchedAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          className={`w-full ${
            watchedType === 'income' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? 'Saving...' : buttonText}
        </Button>
      </form>
    </Form>
  );
};

export default TransactionForm;