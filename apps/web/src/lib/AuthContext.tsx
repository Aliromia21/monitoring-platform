import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, getToken, setToken } from "./auth";
import * as authApi from "../api/auth";

type User = {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState<boolean>(!!token);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        if (!alive) return;
        setUser(res.user);
      } catch {
        // token invalid
        clearToken();
        setTokenState(null);
        setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [token]);

  const value = useMemo<AuthState>(() => ({
    user,
    token,
    isLoading,
    login: async (email, password) => {
      const res = await authApi.login({ email, password });
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    },
    register: async (name, email, password) => {
      const res = await authApi.register({ name, email, password });
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    },
    logout: () => {
      clearToken();
      setTokenState(null);
      setUser(null);
    }
  }), [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
