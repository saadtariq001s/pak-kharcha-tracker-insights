// src/components/UserMenu.tsx
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useExpenses } from '@/context/ExpenseContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, Download, RotateCcw, Database } from 'lucide-react';
import { CSVDataManager } from '@/lib/csv-data-manager';
import { toast } from '@/components/ui/sonner';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { refreshData, expenses } = useExpenses();

  const handleLogout = () => {
    logout();
  };

  const handleRefreshData = async () => {
    try {
      await refreshData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    try {
      const fileName = await CSVDataManager.exportUserData(user.username);
      if (fileName) {
        toast.success(`Data exported as ${fileName}`);
      } else {
        toast.error('No data to export');
      }
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getDataStats = async () => {
    if (!user) return 'No data';
    
    try {
      const size = await CSVDataManager.getUserDataSize(user.username);
      const expenseCount = expenses.length;
      return `${expenseCount} expenses (${(size / 1024).toFixed(1)} KB)`;
    } catch (error) {
      return 'Error loading stats';
    }
  };

  if (!user) return null;

  const userInitials = user.username.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-pakistan-green text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              Pak-Kharcha User
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleRefreshData}>
          <RotateCcw className="mr-2 h-4 w-4" />
          <span>Refresh Data</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          <span>Export Data</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem disabled>
          <Database className="mr-2 h-4 w-4" />
          <span className="text-xs">
            {expenses.length} expenses stored
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;