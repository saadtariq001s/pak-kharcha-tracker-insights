// src/components/ExpenseForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ExpenseCategory } from '@/context/ExpenseContext';
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
import VoiceRecognition, { ExpenseCommand } from './VoiceRecognition';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .min(1, 'Amount must be at least 1 PKR')
    .max(10000000, 'Amount cannot exceed 10,000,000 PKR'),
  category: z.string().min(1, 'Category is required'),
  description: z.string()
    .min(2, 'Description must be at least 2 characters')
    .max(200, 'Description cannot exceed 200 characters'),
  date: z.string().min(1, 'Date is required'),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  onSubmit: (values: ExpenseFormValues) => void | Promise<void>;
  defaultValues?: Partial<ExpenseFormValues>;
  buttonText?: string;
  isLoading?: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  onSubmit, 
  defaultValues = {
    amount: 0,
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  },
  buttonText = 'Add Expense',
  isLoading = false,
}) => {
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const categories: ExpenseCategory[] = [
    'Food & Groceries',
    'Transportation',
    'Utilities',
    'Housing',
    'Healthcare',
    'Education',
    'Entertainment',
    'Shopping',
    'Charity/Zakat',
    'Mobile/Internet',
    'Family Support',
    'Debt Payment',
    'Miscellaneous',
  ];

  const handleVoiceCommand = (command: ExpenseCommand) => {
    try {
      if (command.amount && command.amount > 0) {
        form.setValue('amount', command.amount);
      }
      
      if (command.category) {
        // Validate that the category exists in our list
        if (categories.includes(command.category as ExpenseCategory)) {
          form.setValue('category', command.category);
        }
      }
      
      if (command.description) {
        form.setValue('description', command.description);
      }
      
      if (command.date) {
        form.setValue('date', command.date);
      }
      
      toast.success('Voice command recognized and applied!');
    } catch (error) {
      console.error('Error applying voice command:', error);
      toast.error('Failed to apply voice command');
    }
  };

  const handleVoiceResult = (text: string) => {
    setVoiceTranscript(text);
  };

  const handleFormSubmit = async (values: ExpenseFormValues) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await onSubmit(values);
      // Reset form on successful submission (for add mode)
      if (buttonText === 'Add Expense') {
        form.reset({
          amount: 0,
          category: '',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
        });
        setVoiceTranscript('');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedAmount = form.watch('amount');
  const watchedCategory = form.watch('category');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {voiceTranscript && (
          <div className="p-3 bg-muted rounded-md mb-4 text-sm">
            <p className="font-medium">Voice transcript:</p>
            <p className="italic text-muted-foreground">{voiceTranscript}</p>
          </div>
        )}

        <div className="flex justify-end">
          <VoiceRecognition 
            onResult={handleVoiceResult} 
            onCommandDetected={handleVoiceCommand}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (PKR)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter amount"
                    min="1"
                    max="10000000"
                    step="1"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  {watchedAmount > 0 && (
                    <span className="text-pakistan-green font-medium">
                      {new Intl.NumberFormat('en-PK', { 
                        style: 'currency', 
                        currency: 'PKR' 
                      }).format(watchedAmount)}
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
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter expense description"
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
                <FormLabel>Date</FormLabel>
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

        {/* Preview section */}
        {watchedAmount > 0 && watchedCategory && (
          <div className="p-4 bg-pakistan-green/5 border border-pakistan-green/20 rounded-lg">
            <h4 className="font-medium text-pakistan-green mb-2">Expense Preview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <span className="ml-2 font-medium">{new Intl.NumberFormat('en-PK', { 
                  style: 'currency', 
                  currency: 'PKR' 
                }).format(watchedAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <span className="ml-2 font-medium">{watchedCategory}</span>
              </div>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-pakistan-green hover:bg-pakistan-lightGreen"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? 'Saving...' : buttonText}
        </Button>
      </form>
    </Form>
  );
};

export default ExpenseForm;