import React, { createContext, useState, useContext, useEffect } from 'react';
import type { Teacher } from '../services/mockData';

interface AuthContextType {
  currentTeacher: Teacher | null;
  login: (teacher: Teacher) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load user from localStorage on mount
    const storedTeacher = localStorage.getItem('school_teacher_auth');
    if (storedTeacher) {
      try {
        setCurrentTeacher(JSON.parse(storedTeacher));
      } catch (e) {
        console.error('Failed to parse auth token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    localStorage.setItem('school_teacher_auth', JSON.stringify(teacher));
  };

  const logout = () => {
    setCurrentTeacher(null);
    localStorage.removeItem('school_teacher_auth');
  };

  return (
    <AuthContext.Provider value={{ currentTeacher, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
