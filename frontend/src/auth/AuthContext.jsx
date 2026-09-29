import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import {
  clearSession,
  getSavedUser,
  saveSession,
  updateSavedUser
} from "./authStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
    }

    window.addEventListener("auth:expired", handleExpiredSession);
    if (getSavedUser()) {
      api("/api/auth/me")
        .then((current) => setUser((previous) => ({ ...previous, ...current })))
        .catch(() => {
          clearSession();
          setUser(null);
        });
    }

    return () => window.removeEventListener("auth:expired", handleExpiredSession);
  }, []);

  const value = useMemo(() => ({
    user,
    can: (moduleName, action) => hasPermission(user, moduleName, action),
    login: async (username, password) => {
      const data = await api("/api/auth/login", "POST", { username, password });
      saveSession(data.token, data);
      setUser(data);
      return data;
    },
    logout: async () => {
      try {
        await api("/api/auth/logout", "POST");
      } catch {
        // The local session must still be cleared if the server session expired.
      }
      clearSession();
      setUser(null);
    },
    updateUser: (next) => {
      setUser((current) => {
        const updated = { ...current, ...next };
        updateSavedUser(updated);
        return updated;
      });
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

function hasPermission(user, moduleName, action) {
  if (!user) return false;
  if (user.roles?.includes("ADMIN")) return true;
  return user.permissions?.includes(`${moduleName}:${action}`) ?? false;
}
