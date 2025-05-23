// src/lib/backup-manager.ts
import { Expense } from '@/context/ExpenseContext';
import { CSVDataManager } from './csv-data-manager';

export interface BackupMetadata {
  version: string;
  username: string;
  createdAt: string;
  expenseCount: number;
  totalAmount: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  categories: string[];
  checksum: string;
}

export interface BackupFile {
  metadata: BackupMetadata;
  expenses: Expense[];
  format: 'pak-kharcha-backup';
}

export interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastBackup: string | null;
  nextBackup: string | null;
  retentionDays: number;
}

export class BackupManager {
  private static readonly BACKUP_VERSION = '1.0';
  private static readonly BACKUP_PREFIX = 'pak-kharcha-backup';
  private static readonly SCHEDULE_KEY = 'backup-schedule';

  static async createBackup(username: string, expenses: Expense[]): Promise<string> {
    try {
      if (!expenses.length) {
        throw new Error('No expenses to backup');
      }

      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const dates = expenses.map(e => e.date).sort();
      const categories = [...new Set(expenses.map(e => e.category))];

      const metadata: BackupMetadata = {
        version: this.BACKUP_VERSION,
        username,
        createdAt: new Date().toISOString(),
        expenseCount: expenses.length,
        totalAmount,
        dateRange: {
          earliest: dates[0],
          latest: dates[dates.length - 1]
        },
        categories,
        checksum: this.calculateChecksum(JSON.stringify(expenses))
      };

      const backupFile: BackupFile = {
        metadata,
        expenses,
        format: 'pak-kharcha-backup'
      };

      const backupContent = JSON.stringify(backupFile, null, 2);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `${this.BACKUP_PREFIX}-${username}-${timestamp}.json`;

      // Create downloadable backup
      const blob = new Blob([backupContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Store backup locally for quick recovery
      this.storeLocalBackup(username, backupFile);

      return filename;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  static async restoreFromBackup(username: string, file: File): Promise<{
    success: boolean;
    restoredCount: number;
    errors: string[];
    metadata?: BackupMetadata;
  }> {
    try {
      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error('Backup files must be in JSON format');
      }

      const content = await file.text();
      const backupFile: BackupFile = JSON.parse(content);

      // Validate backup format
      if (backupFile.format !== 'pak-kharcha-backup') {
        throw new Error('Invalid backup file format');
      }

      if (!backupFile.metadata || !backupFile.expenses) {
        throw new Error('Corrupted backup file - missing required sections');
      }

      // Verify checksum
      const expectedChecksum = this.calculateChecksum(JSON.stringify(backupFile.expenses));
      if (backupFile.metadata.checksum !== expectedChecksum) {
        console.warn('Backup checksum mismatch - data may be corrupted');
      }

      // Validate expenses data
      const errors: string[] = [];
      const validExpenses: Expense[] = [];

      backupFile.expenses.forEach((expense, index) => {
        try {
          this.validateExpense(expense);
          validExpenses.push(expense);
        } catch (error) {
          errors.push(`Expense ${index + 1}: ${error.message}`);
        }
      });

      if (validExpenses.length === 0) {
        throw new Error('No valid expenses found in backup file');
      }

      // Save restored data
      await CSVDataManager.saveExpenses(username, validExpenses);

      return {
        success: true,
        restoredCount: validExpenses.length,
        errors,
        metadata: backupFile.metadata
      };
    } catch (error) {
      return {
        success: false,
        restoredCount: 0,
        errors: [error.message]
      };
    }
  }

  static getLocalBackups(username: string): BackupMetadata[] {
    try {
      const backups: BackupMetadata[] = [];
      const prefix = `backup-${username}-`;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          try {
            const backup = JSON.parse(localStorage.getItem(key) || '');
            if (backup.metadata) {
              backups.push(backup.metadata);
            }
          } catch (error) {
            console.warn('Failed to parse backup:', key);
          }
        }
      }

      return backups.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error retrieving local backups:', error);
      return [];
    }
  }

  static async restoreFromLocalBackup(username: string, backupId: string): Promise<boolean> {
    try {
      const backupKey = `backup-${username}-${backupId}`;
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        throw new Error('Backup not found');
      }

      const backup: BackupFile = JSON.parse(backupData);
      await CSVDataManager.saveExpenses(username, backup.expenses);
      
      return true;
    } catch (error) {
      console.error('Local backup restoration failed:', error);
      return false;
    }
  }

  static setupAutoBackup(username: string, schedule: BackupSchedule): void {
    try {
      const scheduleKey = `${this.SCHEDULE_KEY}-${username}`;
      localStorage.setItem(scheduleKey, JSON.stringify(schedule));

      if (schedule.enabled) {
        this.scheduleNextBackup(username, schedule);
      }
    } catch (error) {
      console.error('Auto backup setup failed:', error);
    }
  }

  static getBackupSchedule(username: string): BackupSchedule | null {
    try {
      const scheduleKey = `${this.SCHEDULE_KEY}-${username}`;
      const schedule = localStorage.getItem(scheduleKey);
      
      return schedule ? JSON.parse(schedule) : null;
    } catch (error) {
      console.error('Error retrieving backup schedule:', error);
      return null;
    }
  }

  static async performScheduledBackup(username: string): Promise<boolean> {
    try {
      const expenses = await CSVDataManager.loadExpenses(username);
      if (expenses.length === 0) {
        return false;
      }

      await this.createBackup(username, expenses);
      
      // Update schedule
      const schedule = this.getBackupSchedule(username);
      if (schedule) {
        schedule.lastBackup = new Date().toISOString();
        schedule.nextBackup = this.calculateNextBackup(schedule.frequency).toISOString();
        this.setupAutoBackup(username, schedule);
      }

      return true;
    } catch (error) {
      console.error('Scheduled backup failed:', error);
      return false;
    }
  }

  static cleanupOldBackups(username: string, retentionDays: number = 30): void {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const prefix = `backup-${username}-`;
      const keysToDelete: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          try {
            const backup = JSON.parse(localStorage.getItem(key) || '');
            const backupDate = new Date(backup.metadata.createdAt);
            
            if (backupDate < cutoffDate) {
              keysToDelete.push(key);
            }
          } catch (error) {
            // If we can't parse it, it's probably corrupted - delete it
            keysToDelete.push(key);
          }
        }
      }

      keysToDelete.forEach(key => localStorage.removeItem(key));
      
      if (keysToDelete.length > 0) {
        console.log(`Cleaned up ${keysToDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Backup cleanup failed:', error);
    }
  }

  private static storeLocalBackup(username: string, backup: BackupFile): void {
    try {
      const backupId = Date.now().toString();
      const backupKey = `backup-${username}-${backupId}`;
      
      localStorage.setItem(backupKey, JSON.stringify(backup));
      
      // Cleanup old backups (keep last 5)
      const backups = this.getLocalBackups(username);
      if (backups.length > 5) {
        const oldBackups = backups.slice(5);
        oldBackups.forEach(backup => {
          const key = `backup-${username}-${new Date(backup.createdAt).getTime()}`;
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.warn('Failed to store local backup:', error);
    }
  }

  private static scheduleNextBackup(username: string, schedule: BackupSchedule): void {
    const nextBackup = this.calculateNextBackup(schedule.frequency);
    const timeUntilBackup = nextBackup.getTime() - Date.now();

    if (timeUntilBackup > 0) {
      setTimeout(() => {
        this.performScheduledBackup(username);
      }, Math.min(timeUntilBackup, 24 * 60 * 60 * 1000)); // Max 24 hours
    }
  }

  private static calculateNextBackup(frequency: BackupSchedule['frequency']): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'daily':
        next.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(now.getMonth() + 1);
        break;
    }

    return next;
  }

  private static validateExpense(expense: any): void {
    if (!expense.id || typeof expense.id !== 'string') {
      throw new Error('Invalid expense ID');
    }
    
    if (typeof expense.amount !== 'number' || expense.amount <= 0) {
      throw new Error('Invalid expense amount');
    }
    
    if (!expense.category || typeof expense.category !== 'string') {
      throw new Error('Invalid expense category');
    }
    
    if (!expense.description || typeof expense.description !== 'string') {
      throw new Error('Invalid expense description');
    }
    
    if (!expense.date || isNaN(new Date(expense.date).getTime())) {
      throw new Error('Invalid expense date');
    }
  }

  private static calculateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}