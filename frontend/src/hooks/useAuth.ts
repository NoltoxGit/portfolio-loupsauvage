import { useCallback, useEffect, useState } from "react";
import { navigateTo } from "../app/navigation";
import { getAuthSession, loginOwner, logoutOwner } from "../api/auth";
import type { AuthSession } from "../types/auth";

export interface AuthState {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAuthSession()
      .then((nextSession) => {
        if (active) setSession(nextSession);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);

    try {
      const nextSession = await loginOwner({ email, password });
      setSession(nextSession);
      return true;
    } catch {
      setError("Email ou mot de passe incorrect.");
      setSession(null);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (session?.csrfToken) {
      await logoutOwner(session.csrfToken).catch(() => undefined);
    }

    setSession(null);
    navigateTo("/admin/login");
  }, [session]);

  return { session, loading, error, login, logout };
}
