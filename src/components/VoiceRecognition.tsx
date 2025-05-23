// src/components/VoiceRecognition.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [isSupported, setIsSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in your browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    try {
      const recognitionInstance = new SpeechRecognition();
      
      // Configure recognition
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setError('');
        // Set a timeout to prevent infinite listening
        timeoutRef.current = setTimeout(() => {
          if (recognitionInstance) {
            recognitionInstance.stop();
          }
        }, 15000); // 15 seconds timeout
      };
      
      recognitionInstance.onresult = (event) => {
        try {
          if (event.results && event.results.length > 0) {
            const transcript = event.results[0][0].transcript.trim();
            
            if (transcript) {
              onResult(transcript);
              
              // Process the command if callback is provided
              if (onCommandDetected) {
                const command = parseExpenseCommand(transcript);
                if (command) {
                  onCommandDetected(command);
                }
              }
              
              toast.success('Voice command processed successfully');
            } else {
              toast.error('No speech detected. Please try again.');
            }
          }
        } catch (error) {
          console.error('Error processing speech result:', error);
          toast.error('Error processing voice input');
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'not-allowed':
            setPermissionDenied(true);
            setError('Microphone access denied. Please allow microphone permission and try again.');
            toast.error('Microphone permission denied');
            break;
          case 'no-speech':
            setError('No speech detected. Please try speaking clearly.');
            toast.error('No speech detected');
            break;
          case 'audio-capture':
            setError('No microphone found. Please check your device settings.');
            toast.error('Microphone not found');
            break;
          case 'network':
            setError('Network error occurred. Please check your internet connection.');
            toast.error('Network error');
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
            toast.error('Voice recognition failed. Please try again.');
        }
        
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
      
      recognitionRef.current = recognitionInstance;
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setIsSupported(false);
      setError('Failed to initialize speech recognition');
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.error('Error cleaning up speech recognition:', error);
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onResult, onCommandDetected]);

  const toggleListening = async () => {
    if (!recognitionRef.current || !isSupported) return;
    
    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsListening(false);
      }
    } else {
      try {
        // Check for microphone permission first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
            setPermissionDenied(false);
          } catch (permissionError) {
            setPermissionDenied(true);
            setError('Microphone permission required. Please allow access and try again.');
            return;
          }
        }
        
        recognitionRef.current.start();
        setError('');
      } catch (error) {
        console.error('Error starting recognition:', error);
        setError('Failed to start voice recognition');
        setIsListening(false);
      }
    }
  };

  // Parse natural language commands related to expenses
  const parseExpenseCommand = (text: string): ExpenseCommand | null => {
    const command: ExpenseCommand = { action: 'add' };
    const lowercaseText = text.toLowerCase();
    
    try {
      // Extract amount (looking for currency patterns)
      const amountRegex = /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|pkr|rs\.?|taka)/i;
      const simpleAmountRegex = /(\d+(?:,\d{3})*(?:\.\d{2})?)/;
      
      let amountMatch = lowercaseText.match(amountRegex);
      if (!amountMatch) {
        amountMatch = lowercaseText.match(simpleAmountRegex);
      }
      
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (amount > 0 && amount <= 10000000) {
          command.amount = amount;
        }
      }
      
      // Extract category with better mapping
      const categoryKeywords = {
        'food': 'Food & Groceries',
        'grocery': 'Food & Groceries',
        'groceries': 'Food & Groceries',
        'eat': 'Food & Groceries',
        'restaurant': 'Food & Groceries',
        'lunch': 'Food & Groceries',
        'dinner': 'Food & Groceries',
        'breakfast': 'Food & Groceries',
        
        'transport': 'Transportation',
        'bus': 'Transportation',
        'taxi': 'Transportation',
        'uber': 'Transportation',
        'careem': 'Transportation',
        'ride': 'Transportation',
        'fuel': 'Transportation',
        'petrol': 'Transportation',
        'gas': 'Transportation',
        'rickshaw': 'Transportation',
        
        'electricity': 'Utilities',
        'electric': 'Utilities',
        'water': 'Utilities',
        'bill': 'Utilities',
        'utility': 'Utilities',
        
        'rent': 'Housing',
        'house': 'Housing',
        'home': 'Housing',
        'mortgage': 'Housing',
        
        'doctor': 'Healthcare',
        'medicine': 'Healthcare',
        'medical': 'Healthcare',
        'hospital': 'Healthcare',
        'pharmacy': 'Healthcare',
        
        'school': 'Education',
        'college': 'Education',
        'university': 'Education',
        'tuition': 'Education',
        'book': 'Education',
        'course': 'Education',
        
        'movie': 'Entertainment',
        'cinema': 'Entertainment',
        'game': 'Entertainment',
        'gaming': 'Entertainment',
        'entertainment': 'Entertainment',
        
        'clothes': 'Shopping',
        'clothing': 'Shopping',
        'shoes': 'Shopping',
        'shopping': 'Shopping',
        'mall': 'Shopping',
        
        'donation': 'Charity/Zakat',
        'charity': 'Charity/Zakat',
        'zakat': 'Charity/Zakat',
        'sadaqah': 'Charity/Zakat',
        
        'phone': 'Mobile/Internet',
        'mobile': 'Mobile/Internet',
        'internet': 'Mobile/Internet',
        'wifi': 'Mobile/Internet',
        'data': 'Mobile/Internet',
        
        'family': 'Family Support',
        'parents': 'Family Support',
        'mother': 'Family Support',
        'father': 'Family Support',
        
        'loan': 'Debt Payment',
        'debt': 'Debt Payment',
        'credit': 'Debt Payment',
        'payment': 'Debt Payment',
      };
      
      for (const [keyword, category] of Object.entries(categoryKeywords)) {
        if (lowercaseText.includes(keyword)) {
          command.category = category;
          break;
        }
      }
      
      // Extract description (clean up the text)
      let description = text;
      
      // Remove amount phrases
      description = description.replace(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|pkr|rs\.?|taka)/gi, '');
      description = description.replace(/^(?:i\s+)?(?:spent|paid|bought|purchase)/i, '');
      description = description.replace(/\s+/g, ' ').trim();
      
      if (description.length > 5 && description.length <= 200) {
        command.description = description.substring(0, 200);
      } else if (!command.category) {
        command.description = 'Voice expense entry';
      } else {
        command.description = `${command.category} expense`;
      }
      
      // Extract date (today, yesterday, or specific date mentions)
      if (lowercaseText.includes('yesterday')) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        command.date = yesterday.toISOString().split('T')[0];
      } else if (lowercaseText.includes('today') || !lowercaseText.includes('day')) {
        command.date = new Date().toISOString().split('T')[0];
      }
      
      // Only return command if we have at least amount or category
      if (command.amount || command.category) {
        return command;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing expense command:', error);
      return null;
    }
  };

  if (!isSupported) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {error && !isListening && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {permissionDenied && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To use voice recognition, please allow microphone access in your browser settings.
          </AlertDescription>
        </Alert>
      )}
      
      <Button
        type="button"
        variant="outline"
        onClick={toggleListening}
        disabled={!isSupported}
        className={`${isListening ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100' : 'text-gray-700 hover:bg-gray-50'}`}
      >
        {isListening ? (
          <>
            <MicOff className="mr-2 h-4 w-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            Add by Voice
          </>
        )}
      </Button>
      
      {isListening && (
        <p className="text-xs text-muted-foreground">
          Listening... Speak clearly and mention amount and category.
        </p>
      )}
    </div>
  );
};

export default VoiceRecognition;