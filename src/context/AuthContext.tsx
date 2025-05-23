// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

interface User {
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded users as requested
const USERS: User[] = [
  { username: 'Saad', password: 'elegnoiaceo' },
  { username: 'Areeba', password: 'elegnoiaai' }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('pak-kharcha-user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Verify the user still exists in our hardcoded list
        const validUser = USERS.find(u => u.username === parsedUser.username);
        if (validUser) {
          setUser(validUser);
        } else {
          localStorage.removeItem('pak-kharcha-user');
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('pak-kharcha-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    const foundUser = USERS.find(
      u => u.username === username && u.password === password
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('pak-kharcha-user', JSON.stringify({ username: foundUser.username }));
      toast.success(`Welcome back, ${foundUser.username}!`);
      return true;
    } else {
      toast.error('Invalid username or password');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pak-kharcha-user');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};