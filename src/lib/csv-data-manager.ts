// src/lib/csv-data-manager.ts
import { Expense, ExpenseCategory } from '@/context/ExpenseContext';

export interface CSVImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export class CSVDataManager {
  private static readonly CSV_VERSION = '2.0';
  private static readonly REQUIRED_HEADERS = ['id', 'amount', 'category', 'description', 'date'];
  
  private static getFileName(username: string): string {
    return `pak-kharcha-${username.toLowerCase()}-expenses.csv`;
  }

  private static validateExpense(expense: Partial<Expense>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!expense.id || typeof expense.id !== 'string') {
      errors.push('Invalid or missing ID');
    }
    
    if (typeof expense.amount !== 'number' || expense.amount <= 0 || expense.amount > 10000000) {
      errors.push('Amount must be a positive number between 1 and 10,000,000');
    }
    
    const validCategories: ExpenseCategory[] = [
      'Food & Groceries', 'Transportation', 'Utilities', 'Housing', 'Healthcare',
      'Education', 'Entertainment', 'Shopping', 'Charity/Zakat', 'Mobile/Internet',
      'Family Support', 'Debt Payment', 'Miscellaneous'
    ];
    
    if (!expense.category || !validCategories.includes(expense.category as ExpenseCategory)) {
      errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
    
    if (!expense.description || typeof expense.description !== 'string' || expense.description.length < 2) {
      errors.push('Description must be at least 2 characters long');
    }
    
    if (expense.description && expense.description.length > 200) {
      errors.push('Description cannot exceed 200 characters');
    }
    
    if (!expense.date || typeof expense.date !== 'string') {
      errors.push('Invalid or missing date');
    } else {
      const date = new Date(expense.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format');
      } else if (date > new Date()) {
        errors.push('Date cannot be in the future');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  private static expenseToCSVRow(expense: Expense): string {
    // Escape commas, quotes, and newlines in text fields
    const escapeCSVField = (field: string): string => {
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    return [
      escapeCSVField(expense.id),
      expense.amount.toString(),
      escapeCSVField(expense.category),
      escapeCSVField(expense.description),
      escapeCSVField(expense.date)
    ].join(',');
  }

  private static csvRowToExpense(row: string, rowIndex: number): { expense: Expense | null; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Enhanced CSV parser that handles quoted fields with commas
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      let i = 0;
      
      while (i < row.length) {
        const char = row[i];
        
        if (char === '"') {
          if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i += 2;
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
            i++;
          }
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
          i++;
        } else {
          current += char;
          i++;
        }
      }
      
      // Add the last field
      fields.push(current.trim());

      if (fields.length !== 5) {
        errors.push(`Row ${rowIndex}: Expected 5 fields, got ${fields.length}`);
        return { expense: null, errors };
      }

      const [id, amountStr, category, description, date] = fields;
      
      // Parse and validate amount
      const amount = parseFloat(amountStr);
      if (isNaN(amount)) {
        errors.push(`Row ${rowIndex}: Invalid amount "${amountStr}"`);
      }

      const expense: Partial<Expense> = {
        id: id || crypto.randomUUID(), // Generate new ID if missing
        amount,
        category: category as ExpenseCategory,
        description,
        date,
      };

      const validation = this.validateExpense(expense);
      if (!validation.isValid) {
        errors.push(`Row ${rowIndex}: ${validation.errors.join(', ')}`);
        return { expense: null, errors };
      }

      return { expense: expense as Expense, errors: [] };
    } catch (error) {
      errors.push(`Row ${rowIndex}: Parsing error - ${error.message}`);
      return { expense: null, errors };
    }
  }

  static async saveExpenses(username: string, expenses: Expense[]): Promise<boolean> {
    try {
      if (!username || !Array.isArray(expenses)) {
        throw new Error('Invalid username or expenses data');
      }

      const fileName = this.getFileName(username);
      const timestamp = new Date().toISOString();
      
      // Create CSV with metadata header
      const csvHeader = [
        `# Pak-Kharcha Expense Data Export`,
        `# Version: ${this.CSV_VERSION}`,
        `# User: ${username}`,
        `# Export Date: ${timestamp}`,
        `# Total Expenses: ${expenses.length}`,
        '#',
        'id,amount,category,description,date'
      ].join('\n') + '\n';
      
      const csvRows = expenses.map(expense => this.expenseToCSVRow(expense)).join('\n');
      const csvContent = csvHeader + csvRows;

      // Save to localStorage with versioning
      const storageKey = `csv-${fileName}`;
      const backupKey = `csv-backup-${fileName}`;
      
      // Create backup of existing data
      const existingData = localStorage.getItem(storageKey);
      if (existingData) {
        localStorage.setItem(backupKey, existingData);
      }
      
      localStorage.setItem(storageKey, csvContent);
      localStorage.setItem(`csv-metadata-${fileName}`, JSON.stringify({
        version: this.CSV_VERSION,
        username,
        lastSaved: timestamp,
        expenseCount: expenses.length,
        checksum: this.calculateChecksum(csvContent)
      }));
      
      return true;
    } catch (error) {
      console.error('Error saving expenses to CSV:', error);
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }

  static async loadExpenses(username: string): Promise<Expense[]> {
    try {
      if (!username) {
        throw new Error('Username is required');
      }

      const fileName = this.getFileName(username);
      const csvContent = localStorage.getItem(`csv-${fileName}`);
      
      if (!csvContent) {
        return [];
      }

      // Verify data integrity
      const metadata = localStorage.getItem(`csv-metadata-${fileName}`);
      if (metadata) {
        try {
          const meta = JSON.parse(metadata);
          const currentChecksum = this.calculateChecksum(csvContent);
          if (meta.checksum && meta.checksum !== currentChecksum) {
            console.warn('Data integrity check failed - checksum mismatch');
          }
        } catch (error) {
          console.warn('Failed to verify data integrity:', error);
        }
      }

      const lines = csvContent.split('\n');
      const expenses: Expense[] = [];
      const errors: string[] = [];
      let dataStartIndex = 0;

      // Find where actual data starts (skip metadata comments)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('id,amount,category')) {
          dataStartIndex = i + 1;
          break;
        }
      }

      // Parse data rows
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('#')) {
          const result = this.csvRowToExpense(line, i + 1);
          if (result.expense) {
            expenses.push(result.expense);
          }
          errors.push(...result.errors);
        }
      }

      if (errors.length > 0) {
        console.warn('CSV parsing errors:', errors);
      }

      return expenses;
    } catch (error) {
      console.error('Error loading expenses from CSV:', error);
      throw new Error(`Failed to load data: ${error.message}`);
    }
  }

  static async exportUserData(username: string): Promise<string | null> {
    try {
      const fileName = this.getFileName(username);
      const csvContent = localStorage.getItem(`csv-${fileName}`);
      
      if (!csvContent) {
        return null;
      }

      // Create enhanced export with additional metadata
      const exportContent = csvContent + '\n\n# Export completed at: ' + new Date().toISOString();

      // Create downloadable file
      const blob = new Blob([exportContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const downloadFileName = `pak-kharcha-${username.toLowerCase()}-${timestamp}.csv`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return downloadFileName;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  static async importUserData(username: string, file: File): Promise<CSVImportResult> {
    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('File must be a CSV file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      const csvContent = await file.text();
      
      if (!csvContent.trim()) {
        throw new Error('File is empty');
      }

      const lines = csvContent.split('\n');
      const errors: string[] = [];
      const expenses: Expense[] = [];
      let importedCount = 0;
      let skippedCount = 0;
      let dataStartIndex = 0;

      // Find data start
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        if (line.includes('id') && line.includes('amount') && line.includes('category')) {
          dataStartIndex = i + 1;
          break;
        }
      }

      if (dataStartIndex === 0) {
        throw new Error('Invalid CSV format: Header row not found');
      }

      // Process data rows
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('#')) {
          const result = this.csvRowToExpense(line, i + 1);
          if (result.expense) {
            // Check for duplicates
            const isDuplicate = expenses.some(existing => 
              existing.id === result.expense!.id ||
              (existing.amount === result.expense!.amount &&
               existing.category === result.expense!.category &&
               existing.description === result.expense!.description &&
               existing.date === result.expense!.date)
            );

            if (!isDuplicate) {
              expenses.push(result.expense);
              importedCount++;
            } else {
              skippedCount++;
              errors.push(`Row ${i + 1}: Duplicate expense skipped`);
            }
          } else {
            skippedCount++;
            errors.push(...result.errors);
          }
        }
      }

      if (expenses.length === 0) {
        throw new Error('No valid expenses found in the file');
      }

      // Save imported data
      await this.saveExpenses(username, expenses);

      return {
        success: true,
        importedCount,
        skippedCount,
        errors
      };
    } catch (error) {
      console.error('Error importing user data:', error);
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        errors: [error.message]
      };
    }
  }

  static async deleteUserData(username: string): Promise<boolean> {
    try {
      const fileName = this.getFileName(username);
      const keys = [
        `csv-${fileName}`,
        `csv-backup-${fileName}`,
        `csv-metadata-${fileName}`,
        `csv-url-${fileName}`
      ];

      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error deleting user data:', error);
      return false;
    }
  }

  static async getUserDataSize(username: string): Promise<{ bytes: number; expenses: number }> {
    try {
      const fileName = this.getFileName(username);
      const csvContent = localStorage.getItem(`csv-${fileName}`);
      
      if (!csvContent) {
        return { bytes: 0, expenses: 0 };
      }

      const metadata = localStorage.getItem(`csv-metadata-${fileName}`);
      let expenseCount = 0;

      if (metadata) {
        try {
          const meta = JSON.parse(metadata);
          expenseCount = meta.expenseCount || 0;
        } catch (error) {
          // Count manually if metadata is corrupted
          const lines = csvContent.split('\n');
          expenseCount = lines.filter(line => 
            line.trim() && !line.startsWith('#') && line.includes(',')
          ).length - 1; // Subtract header
        }
      }

      return {
        bytes: new Blob([csvContent]).size,
        expenses: Math.max(0, expenseCount)
      };
    } catch (error) {
      console.error('Error getting user data size:', error);
      return { bytes: 0, expenses: 0 };
    }
  }

  static async backupUserData(username: string): Promise<boolean> {
    try {
      const fileName = this.getFileName(username);
      const csvContent = localStorage.getItem(`csv-${fileName}`);
      
      if (!csvContent) {
        return false;
      }

      const backupKey = `csv-backup-${fileName}-${Date.now()}`;
      localStorage.setItem(backupKey, csvContent);
      
      // Keep only last 3 backups to prevent storage bloat
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(`csv-backup-${fileName}-`))
        .sort();

      if (backupKeys.length > 3) {
        const oldBackups = backupKeys.slice(0, -3);
        oldBackups.forEach(key => localStorage.removeItem(key));
      }

      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      return false;
    }
  }

  private static calculateChecksum(content: string): string {
    // Simple checksum for data integrity verification
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}