
import React, { useState } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/sonner';
import { generateSampleData } from '@/lib/expense-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash } from 'lucide-react';

const Settings: React.FC = () => {
  const { expenses, addExpense } = useExpenses();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currency, setCurrency] = useState('PKR');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const handleClearData = () => {
    // In a real app, you would implement delete all expenses here
    localStorage.removeItem('pakistan-expense-tracker');
    window.location.reload();
    setIsDeleteDialogOpen(false);
  };
  
  const handleAddSampleData = () => {
    const sampleData = generateSampleData();
    sampleData.forEach(expense => {
      addExpense({
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: expense.date,
      });
    });
    toast.success('Sample data added successfully');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and account settings
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure your application preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Only PKR (Pakistani Rupee) is fully supported
                </p>
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Switch between light and dark theme
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your expense data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border p-4 rounded-md">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">
                  Download your expense data as CSV
                </p>
              </div>
              <Button variant="outline">Export</Button>
            </div>
            
            <div className="flex items-center justify-between border p-4 rounded-md">
              <div>
                <p className="font-medium">Import Data</p>
                <p className="text-sm text-muted-foreground">
                  Upload expense data from CSV
                </p>
              </div>
              <Button variant="outline">Import</Button>
            </div>
            
            <div className="flex items-center justify-between border p-4 rounded-md">
              <div>
                <p className="font-medium">Add Sample Data</p>
                <p className="text-sm text-muted-foreground">
                  Populate your tracker with sample expense data
                </p>
              </div>
              <Button variant="outline" onClick={handleAddSampleData}>
                Add Samples
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between border border-red-200 p-4 rounded-md">
              <div>
                <p className="font-medium text-red-600">Clear All Data</p>
                <p className="text-sm text-muted-foreground">
                  Delete all your expense data permanently
                </p>
              </div>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="w-4 h-4 mr-2" />
                    Clear Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete all your expense data.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleClearData}>
                      Delete All Data
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About Pak-Kharcha</CardTitle>
            <CardDescription>Information about this expense tracker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Pak-Kharcha is your personal expense tracking solution designed specifically for Pakistan's economic context.
                Track your daily expenses, visualize spending patterns, and get personalized recommendations
                for better financial management.
              </p>
              
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="font-medium">Version 1.0.0</p>
                <p className="text-sm text-muted-foreground">Last Updated: April 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
