
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

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.string(),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  date: z.string(),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  onSubmit: (values: ExpenseFormValues) => void;
  defaultValues?: Partial<ExpenseFormValues>;
  buttonText?: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  onSubmit, 
  defaultValues = {
    amount: 0,
    category: 'Food & Groceries',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  },
  buttonText = 'Add Expense'
}) => {
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

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
    if (command.amount) {
      form.setValue('amount', command.amount);
    }
    
    if (command.category) {
      form.setValue('category', command.category);
    }
    
    if (command.description) {
      form.setValue('description', command.description);
    }
    
    if (command.date) {
      form.setValue('date', command.date);
    }
    
    toast.success('Voice command recognized!');
  };

  const handleVoiceResult = (text: string) => {
    setVoiceTranscript(text);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {voiceTranscript && (
          <div className="p-3 bg-muted rounded-md mb-4 text-sm">
            <p className="font-medium">Voice transcript:</p>
            <p className="italic">{voiceTranscript}</p>
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
                  <Input type="number" {...field} />
                </FormControl>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Textarea {...field} />
                </FormControl>
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
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-pakistan-green hover:bg-pakistan-lightGreen">
          {buttonText}
        </Button>
      </form>
    </Form>
  );
};

export default ExpenseForm;
