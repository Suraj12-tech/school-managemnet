import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("auth:expired", expire);
    const token = localStorage.getItem("token");
    if (token) {
      api("/api/auth/me")
        .then((current) => setUser((previous) => ({ ...previous, ...current })))
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        });
    }
    return () => window.removeEventListener("auth:expired", expire);
  }, []);

  const value = useMemo(() => ({
    user,
    can: (moduleName, action) => {
      if (!user) return false;
      if (user.roles?.includes("ADMIN")) return true;
      return user.permissions?.includes(moduleName + ":" + action);
    },
    login: async (username, password) => {
      const data = await api("/api/auth/login", "POST", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      return data;
    },
    logout: async () => {
      try {
        await api("/api/auth/logout", "POST");
      } catch {
        /* token may already be invalid */
      }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    },
    updateUser: (next) => {
      setUser((current) => {
        const updated = { ...current, ...next };
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
