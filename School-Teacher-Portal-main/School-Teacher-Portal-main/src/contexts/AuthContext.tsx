import React, { createContext, useContext, useEffect, useState } from "react";
import { clearToken, getToken } from "../services/apiClient";
import { teacherApi, type TeacherProfile } from "../services/teacherApi";

interface AuthContextType {
  currentTeacher: TeacherProfile | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const expireSession = () => {
      clearToken();
      setCurrentTeacher(null);
    };
    window.addEventListener("teacher:session-expired", expireSession);

    if (!getToken()) {
      setIsLoading(false);
      return () => window.removeEventListener("teacher:session-expired", expireSession);
    }

    teacherApi.profile()
      .then(profile => {
        if (mounted) setCurrentTeacher(profile);
      })
      .catch(() => {
        clearToken();
        if (mounted) setCurrentTeacher(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      window.removeEventListener("teacher:session-expired", expireSession);
    };
  }, []);

  const login = async (username: string, password: string) => {
    await teacherApi.login({ username, password });
    try {
      const profile = await teacherApi.profile();
      setCurrentTeacher(profile);
    } catch (error) {
      try {
        await teacherApi.logout();
      } finally {
        clearToken();
        setCurrentTeacher(null);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (getToken()) await teacherApi.logout();
    } finally {
      clearToken();
      setCurrentTeacher(null);
    }
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
