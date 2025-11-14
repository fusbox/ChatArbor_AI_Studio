import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as apiService from '../services/apiService';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const user = await apiService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch current user", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoggedInUser();
  }, []);

  const migrateGuestChat = async (userId: string) => {
    const guestId = apiService.getGuestUserId();
    if (guestId) {
        const guestHistory = await apiService.getChatHistory(guestId);
        if (guestHistory.length > 1) { 
            const userHistory = await apiService.getChatHistory(userId);
            const combinedHistory = [...guestHistory, ...userHistory];
            await apiService.saveFullChatHistory(userId, combinedHistory);
        }
        await apiService.clearChatHistory(guestId);
        apiService.clearGuestUserId(); // Clear the guest ID from local storage
    }
  };

  const login = async (email: string, password: string) => {
    const user = await apiService.login(email, password);
    await migrateGuestChat(user.id);
    setCurrentUser(user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const user = await apiService.signUp(name, email, password);
    await login(user.email, user.password); // Log in to migrate chat and set current user
  };

  const logout = async () => {
    await apiService.logout();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    isLoading,
    login,
    signUp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
