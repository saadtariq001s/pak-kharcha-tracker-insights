
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface VoiceRecognitionProps {
  onResult: (text: string) => void;
  onCommandDetected?: (command: ExpenseCommand) => void;
}

export interface ExpenseCommand {
  action: 'add' | 'update';
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
}

const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({ onResult, onCommandDetected }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US'; // Default to English
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        
        // Process the command if callback is provided
        if (onCommandDetected) {
          const command = parseExpenseCommand(transcript);
          if (command) {
            onCommandDetected(command);
          }
        }
        
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast.error('Voice recognition failed. Please try again.');
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      toast.error('Speech recognition is not supported in your browser.');
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [onResult, onCommandDetected]);

  const toggleListening = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  // Parse natural language commands related to expenses
  const parseExpenseCommand = (text: string): ExpenseCommand | null => {
    const command: ExpenseCommand = { action: 'add' };
    const lowercaseText = text.toLowerCase();
    
    // Extract amount (looking for currency patterns like "500 rupees" or "Rs. 500")
    const amountRegex = /(\d+)\s*(rupees|pkr|rs\.?|rupee)/i;
    const amountMatch = lowercaseText.match(amountRegex);
    if (amountMatch) {
      command.amount = parseInt(amountMatch[1], 10);
    }
    
    // Extract category
    const categoryKeywords = {
      'food': 'Food & Groceries',
      'grocery': 'Food & Groceries',
      'groceries': 'Food & Groceries',
      'transport': 'Transportation',
      'bus': 'Transportation',
      'taxi': 'Transportation',
      'ride': 'Transportation',
      'fuel': 'Transportation',
      'petrol': 'Transportation',
      'electricity': 'Utilities',
      'gas': 'Utilities',
      'water': 'Utilities',
      'bill': 'Utilities',
      'rent': 'Housing',
      'doctor': 'Healthcare',
      'medicine': 'Healthcare',
      'medical': 'Healthcare',
      'school': 'Education',
      'college': 'Education',
      'tuition': 'Education',
      'movie': 'Entertainment',
      'game': 'Entertainment',
      'dining': 'Entertainment',
      'clothes': 'Shopping',
      'shoes': 'Shopping',
      'donation': 'Charity/Zakat',
      'zakat': 'Charity/Zakat',
      'sadaqah': 'Charity/Zakat',
      'phone': 'Mobile/Internet',
      'internet': 'Mobile/Internet',
      'wifi': 'Mobile/Internet',
      'data': 'Mobile/Internet',
      'family': 'Family Support',
      'parents': 'Family Support',
      'loan': 'Debt Payment',
      'debt': 'Debt Payment',
      'credit': 'Debt Payment',
    };
    
    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (lowercaseText.includes(keyword)) {
        command.category = category;
        break;
      }
    }
    
    // Extract description (anything after "for" or "on")
    const descriptionRegex = /\s(?:for|on)\s(.*?)(?:\s(?:on|at|in)\s|$)/i;
    const descMatch = text.match(descriptionRegex);
    if (descMatch) {
      command.description = descMatch[1].trim();
    }
    
    // If we couldn't determine a description but have text, use part of the text
    if (!command.description && text.length > 10) {
      command.description = text.split(' ').slice(0, 5).join(' ') + '...';
    }
    
    // Extract date (today, yesterday, or specific date mentions)
    if (lowercaseText.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      command.date = yesterday.toISOString().split('T')[0];
    } else if (lowercaseText.includes('today')) {
      command.date = new Date().toISOString().split('T')[0];
    }
    
    return command;
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggleListening}
      className={`${isListening ? 'bg-red-50 text-red-700 border-red-300' : 'text-gray-700'}`}
    >
      {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
      {isListening ? 'Recording...' : 'Add by Voice'}
    </Button>
  );
};

export default VoiceRecognition;
