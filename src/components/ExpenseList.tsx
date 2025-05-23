// src/components/ExpenseList.tsx
import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Expense, ExpenseCategory } from '@/context/ExpenseContext';
import { formatDateForDisplay } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/expense-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ExpenseForm from './ExpenseForm';
import { 
  MoreVertical, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Filter,
  Search,
  Trash2,
  Edit3,
  Eye,
  Download,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExpenseListProps {
  expenses: Expense[];
  onUpdateExpense: (expense: Expense) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  title?: string;
  showFilters?: boolean;
  allowBulkOperations?: boolean;
}

type SortField = 'date' | 'amount' | 'category' | 'description';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  search: string;
  category: string;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ 
  expenses, 
  onUpdateExpense, 
  onDeleteExpense,
  title = "Expenses",
  showFilters = true,
  allowBulkOperations = true
}) => {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFiltersPanel] = useState(false);
  
  const categories: ExpenseCategory[] = [
    'Food & Groceries', 'Transportation', 'Utilities', 'Housing', 'Healthcare',
    'Education', 'Entertainment', 'Shopping', 'Charity/Zakat', 'Mobile/Internet',
    'Family Support', 'Debt Payment', 'Miscellaneous'
  ];

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses.filter(expense => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          expense.description.toLowerCase().includes(searchTerm) ||
          expense.category.toLowerCase().includes(searchTerm) ||
          formatCurrency(expense.amount).toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (filters.category && expense.category !== filters.category) {
        return false;
      }
      
      // Amount filters
      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount);
        if (!isNaN(minAmount) && expense.amount < minAmount) return false;
      }
      
      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount);
        if (!isNaN(maxAmount) && expense.amount > maxAmount) return false;
      }
      
      // Date filters
      if (filters.dateFrom) {
        if (new Date(expense.date) < new Date(filters.dateFrom)) return false;
      }
      
      if (filters.dateTo) {
        if (new Date(expense.date) > new Date(filters.dateTo)) return false;
      }
      
      return true;
    });
    
    // Sort expenses
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [expenses, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateSubmit = async (values: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      setIsProcessing(true);
      try {
        await onUpdateExpense({
          ...values,
          id: editingExpense.id,
        });
        setIsEditDialogOpen(false);
        setEditingExpense(null);
      } catch (error) {
        console.error('Failed to update expense:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      setIsProcessing(true);
      try {
        await onDeleteExpense(deleteConfirmId);
      } catch (error) {
        console.error('Failed to delete expense:', error);
      } finally {
        setDeleteConfirmId(null);
        setIsProcessing(false);
      }
    }
  };

  const handleSelectExpense = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedExpenses);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedExpenses(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(new Set(filteredAndSortedExpenses.map(e => e.id)));
    } else {
      setSelectedExpenses(new Set());
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      const deletePromises = Array.from(selectedExpenses).map(id => onDeleteExpense(id));
      await Promise.all(deletePromises);
      setSelectedExpenses(new Set());
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete expenses:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportSelectedToCSV = () => {
    const selectedExpenseData = filteredAndSortedExpenses
      .filter(expense => selectedExpenses.has(expense.id));
    
    if (selectedExpenseData.length === 0) return;
    
    const csvContent = [
      'Date,Category,Description,Amount',
      ...selectedExpenseData.map(expense => 
        `"${expense.date}","${expense.category}","${expense.description}","${expense.amount}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');
  const isAllSelected = filteredAndSortedExpenses.length > 0 && selectedExpenses.size === filteredAndSortedExpenses.length;
  const isIndeterminate = selectedExpenses.size > 0 && selectedExpenses.size < filteredAndSortedExpenses.length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>No expenses found for this period.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 h-16 w-16 text-muted-foreground">
            <Eye className="h-full w-full" />
          </div>
          <p className="text-lg text-muted-foreground">No expenses to display</p>
          <p className="text-sm text-muted-foreground mt-1">Add an expense to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title and bulk actions */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedExpenses.length} of {expenses.length} expenses
            {selectedExpenses.size > 0 && ` (${selectedExpenses.size} selected)`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showFilters && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFiltersPanel(!showFilters)}
              className={hasActiveFilters ? 'border-pakistan-green' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && <Badge variant="secondary" className="ml-2">Active</Badge>}
            </Button>
          )}
          
          {allowBulkOperations && selectedExpenses.size > 0 && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportSelectedToCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                Export ({selectedExpenses.size})
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedExpenses.size})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filter Expenses</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFiltersPanel(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search description, category..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="minAmount">Min Amount</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    placeholder="0"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Max Amount</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    placeholder="Any"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      <Card>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {allowBulkOperations && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all expenses"
                      className={isIndeterminate ? 'data-[state=checked]:bg-orange-500' : ''}
                    />
                  </TableHead>
                )}
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('date')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Date
                    <SortIcon field="date" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('category')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Category
                    <SortIcon field="category" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('description')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Description
                    <SortIcon field="description" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('amount')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Amount
                    <SortIcon field="amount" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedExpenses.map((expense) => (
                <TableRow key={expense.id} className={selectedExpenses.has(expense.id) ? 'bg-blue-50' : ''}>
                  {allowBulkOperations && (
                    <TableCell>
                      <Checkbox
                        checked={selectedExpenses.has(expense.id)}
                        onCheckedChange={(checked) => handleSelectExpense(expense.id, checked as boolean)}
                        aria-label={`Select expense ${expense.description}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {formatDateForDisplay(expense.date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.description}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(expense)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(expense.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Make changes to your expense here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              onSubmit={handleUpdateSubmit}
              defaultValues={{
                amount: editingExpense.amount,
                category: editingExpense.category,
                description: editingExpense.description,
                date: editingExpense.date,
              }}
              buttonText="Save Changes"
              isLoading={isProcessing}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Expenses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedExpenses.size} selected expenses? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : `Delete ${selectedExpenses.size} Expenses`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExpenseList;