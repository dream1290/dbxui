import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuthStatus();

    // Listen for auth logout events (from token refresh failures)
    const handleAuthLogout = () => {
      setUser(null);
      queryClient.clear();
      toast({
        title: "Session expired",
        description: "Please log in again",
        variant: "destructive",
      });
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiService.setToken(token);
        const userData = await apiService.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear auth data on failure
      localStorage.removeItem('auth_token');
      apiService.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      apiService.setToken(response.access_token);
      setUser(response.user);
      
      // Set profile in React Query cache
      queryClient.setQueryData(['profile'], response.user);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await apiService.register(email, password, name);
      apiService.setToken(response.access_token);
      setUser(response.user);
      
      // Set profile in React Query cache
      queryClient.setQueryData(['profile'], response.user);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data (tokens are cleared in apiService.logout())
      setUser(null);
      
      // Clear all React Query cache
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await apiService.updateProfile(data);
      setUser(updatedUser);
      
      // Update profile in React Query cache
      queryClient.setQueryData(['profile'], updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};