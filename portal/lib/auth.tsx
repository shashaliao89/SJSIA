"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, dashboardPath } from "./api";
import type { User } from "./types";

const TOKEN_KEY = "sjsia_portal_token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => void;
  refresh: () => Promise<void>;
}

interface RegisterPayload {
  email: string;
  password: string;
  role: "brand" | "kol";
  brandName?: string;
  kolName?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((t: string | null, u: User | null) => {
    setToken(t);
    setUser(u);
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  const refresh = useCallback(async () => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      persist(null, null);
      setLoading(false);
      return;
    }
    try {
      const data = await api<{ user: User }>("/api/auth/me", { token: stored });
      persist(stored, data.user);
    } catch {
      persist(null, null);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persist(data.token, data.user);
      return dashboardPath(data.user.role);
    },
    [persist]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await api<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      persist(data.token, data.user);
      return dashboardPath(data.user.role);
    },
    [persist]
  );

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refresh }),
    [user, token, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
