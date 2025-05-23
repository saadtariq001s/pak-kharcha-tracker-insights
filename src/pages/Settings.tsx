// src/components/AdvancedSettings.tsx
import React, { useState, useEffect } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { useAuth } from '@/context/AuthContext';
import { BackupManager, BackupSchedule, BackupMetadata } from '@/lib/backup-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/sonner';
import { 
  Shield, 
  Download, 
  Upload, 
  Clock, 
  HardDrive,
  RefreshCw,
  Settings2,
  Calendar,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/expense-utils';

const AdvancedSettings: React.FC = () => {
  const { expenses } = useExpenses();
  const { user } = useAuth();
  const [backupSchedule, setBackupSchedule] = useState<BackupSchedule>({
    enabled: false,
    frequency: 'weekly',
    lastBackup: null,
    nextBackup: null,
    retentionDays: 30
  });
  const [localBackups, setLocalBackups] = useState<BackupMetadata[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadBackupSettings();
      loadLocalBackups();
    }
  }, [user]);

  const loadBackupSettings = () => {
    if (user) {
      const schedule = BackupManager.getBackupSchedule(user.username);
      if (schedule) {
        setBackupSchedule(schedule);
      }
    }
  };

  const loadLocalBackups = () => {
    if (user) {
      const backups = BackupManager.getLocalBackups(user.username);
      setLocalBackups(backups);
    }
  };

  const handleCreateBackup = async () => {
    if (!user) return;

    setIsCreatingBackup(true);
    try {
      const filename = await BackupManager.createBackup(user.username, expenses);
      toast.success(`Backup created successfully: ${filename}`);
      loadLocalBackups();
    } catch (error) {
      toast.error(`Backup failed: ${error.message}`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!user || !selectedBackupFile) return;

    setIsRestoringBackup(true);
    try {
      const result = await BackupManager.restoreFromBackup(user.username, selectedBackupFile);
      
      if (result.success) {
        toast.success(`Successfully restored ${result.restoredCount} expenses`);
        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} items had issues during restore`);
        }
        setShowBackupDialog(false);
        setSelectedBackupFile(null);
        // Refresh the page to reload data
        window.location.reload();
      } else {
        toast.error(`Restore failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      toast.error(`Restore failed: ${error.message}`);
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleScheduleChange = (updates: Partial<BackupSchedule>) => {
    const newSchedule = { ...backupSchedule, ...updates };
    setBackupSchedule(newSchedule);
    
    if (user) {
      BackupManager.setupAutoBackup(user.username, newSchedule);
      toast.success('Backup schedule updated');
    }
  };

  const handleCleanupOldBackups = () => {
    if (user) {
      BackupManager.cleanupOldBackups(user.username, backupSchedule.retentionDays);
      loadLocalBackups();
      toast.success('Old backups cleaned up');
    }
  };

  const getStorageUsage = () => {
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
      return (totalSize / 1024).toFixed(2); // KB
    } catch (error) {
      return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getBackupStatusColor = () => {
    if (!backupSchedule.enabled) return 'text-gray-500';
    if (!backupSchedule.lastBackup) return 'text-yellow-600';
    
    const lastBackup = new Date(backupSchedule.lastBackup);
    const daysSinceBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceBackup > 7) return 'text-red-600';
    if (daysSinceBackup > 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Backup Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Data Protection Status
          </CardTitle>
          <CardDescription>
            Keep your financial data safe with automated backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-pakistan-green">{expenses.length}</div>
              <div className="text-sm text-muted-foreground">Total Expenses</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{localBackups.length}</div>
              <div className="text-sm text-muted-foreground">Local Backups</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{getStorageUsage()} KB</div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-lg border-l-4 ${
            backupSchedule.enabled ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getBackupStatusColor()}`} />
              <span className="font-medium">
                {backupSchedule.enabled ? 'Auto-backup enabled' : 'Auto-backup disabled'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {backupSchedule.lastBackup 
                ? `Last backup: ${formatDate(backupSchedule.lastBackup)}`
                : 'No backups created yet'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Backup Management
          </CardTitle>
          <CardDescription>
            Create, restore, and schedule backups of your expense data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual Backup */}
          <div className="flex items-center justify-between border p-4 rounded-lg">
            <div>
              <p className="font-medium">Create Backup Now</p>
              <p className="text-sm text-muted-foreground">
                Download a complete backup of your expense data
              </p>
            </div>
            <Button 
              onClick={handleCreateBackup}
              disabled={isCreatingBackup || expenses.length === 0}
              className="bg-pakistan-green hover:bg-pakistan-lightGreen"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </div>

          {/* Restore Backup */}
          <div className="flex items-center justify-between border p-4 rounded-lg">
            <div>
              <p className="font-medium">Restore from Backup</p>
              <p className="text-sm text-muted-foreground">
                Upload and restore data from a backup file
              </p>
            </div>
            <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Restore Backup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Restore from Backup</DialogTitle>
                  <DialogDescription>
                    Select a backup file to restore your expense data. This will replace your current data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="backup-file">Select Backup File</Label>
                    <Input
                      id="backup-file"
                      type="file"
                      accept=".json"
                      onChange={(e) => setSelectedBackupFile(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                  </div>
                  
                  {selectedBackupFile && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-medium">Selected file:</p>
                      <p className="text-sm text-blue-700">{selectedBackupFile.name}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Size: {(selectedBackupFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleRestoreBackup}
                      disabled={!selectedBackupFile || isRestoringBackup}
                      className="bg-pakistan-green hover:bg-pakistan-lightGreen"
                    >
                      {isRestoringBackup ? 'Restoring...' : 'Restore Data'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Auto-backup Settings */}
          <div className="border p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Automatic Backups</p>
                <p className="text-sm text-muted-foreground">
                  Schedule regular backups of your data
                </p>
              </div>
              <Switch
                checked={backupSchedule.enabled}
                onCheckedChange={(enabled) => handleScheduleChange({ enabled })}
              />
            </div>

            {backupSchedule.enabled && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="frequency">Backup Frequency</Label>
                  <Select 
                    value={backupSchedule.frequency}
                    onValueChange={(frequency: BackupSchedule['frequency']) => 
                      handleScheduleChange({ frequency })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="retention">Retention (days)</Label>
                  <Input
                    id="retention"
                    type="number"
                    min="1"
                    max="365"
                    value={backupSchedule.retentionDays}
                    onChange={(e) => handleScheduleChange({ 
                      retentionDays: parseInt(e.target.value) || 30 
                    })}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Local Backups */}
      {localBackups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Recent Backups
              </div>
              <Button variant="outline" size="sm" onClick={handleCleanupOldBackups}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Cleanup Old
              </Button>
            </CardTitle>
            <CardDescription>
              Your recent local backups (automatically cleaned after {backupSchedule.retentionDays} days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {localBackups.slice(0, 5).map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(backup.createdAt)}</span>
                      <Badge variant="outline">{backup.expenseCount} expenses</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: {formatCurrency(backup.totalAmount)} • 
                      Range: {backup.dateRange.earliest} to {backup.dateRange.latest}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Categories: {backup.categories.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">v{backup.version}</Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restore from Local Backup</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will replace your current data with the backup from {formatDate(backup.createdAt)}. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              const backupId = new Date(backup.createdAt).getTime().toString();
                              BackupManager.restoreFromLocalBackup(user!.username, backupId)
                                .then(() => {
                                  toast.success('Data restored successfully');
                                  window.location.reload();
                                })
                                .catch(() => toast.error('Restore failed'));
                            }}
                            className="bg-pakistan-green hover:bg-pakistan-lightGreen"
                          >
                            Restore
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Storage Information
          </CardTitle>
          <CardDescription>
            Details about your local data storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Storage Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total storage used:</span>
                  <span className="font-medium">{getStorageUsage()} KB</span>
                </div>
                <div className="flex justify-between">
                  <span>Expense data:</span>
                  <span className="font-medium">{expenses.length} records</span>
                </div>
                <div className="flex justify-between">
                  <span>Local backups:</span>
                  <span className="font-medium">{localBackups.length} files</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-800">Data Security</h4>
              <div className="space-y-1 text-sm text-blue-700">
                <p>✓ Data stored locally on your device</p>
                <p>✓ No cloud storage or external access</p>
                <p>✓ Complete user data isolation</p>
                <p>✓ Export/import for data portability</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSettings;