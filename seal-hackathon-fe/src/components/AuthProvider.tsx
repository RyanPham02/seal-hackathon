"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  type CurrentUser,
  clearAuthSession,
  fetchCurrentUser,
  isAuthError,
} from "@/lib/api";

type AuthContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  // True from the moment logout() is invoked until the next route change.
  // Protected layouts (dashboard/admin/mentor) read this to suppress their
  // own "redirect to login" effect during sign-out, otherwise they race the
  // caller's router.push and the last push wins — landing the user on
  // /admin/login instead of their chosen post-logout route.
  loggingOut: boolean;
  // Re-fetches /Auth/me. Returns the fresh user, or null if the cookie has
  // expired (401/403). Rethrows network/server errors so callers can retry
  // without losing the previously verified user.
  refresh: () => Promise<CurrentUser | null>;
  // Clears the server cookie and the in-memory user. Caller handles redirect.
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

  // The logout flag must auto-clear after the post-logout navigation lands,
  // otherwise a subsequent unauthenticated visit to a protected route would
  // still be allowed through. Pathname-change is our "navigation completed"
  // signal — it fires once for the route the caller pushed us to.
  useEffect(() => {
    if (loggingOut) setLoggingOut(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const refresh = useCallback(async (): Promise<CurrentUser | null> => {
    try {
      const fresh = await fetchCurrentUser();
      setUser(fresh);
      setIsLoading(false);
      return fresh;
    } catch (err) {
      if (isAuthError(err)) {
        setUser(null);
        setIsLoading(false);
        return null;
      }
      // Network blip / 5xx: keep last-known user state so the UI doesn't
      // flap, and let the caller decide whether to retry or surface it.
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    // Set BEFORE the cookie call so the flag is already true when React
    // commits the setUser(null) at the end — protected layouts will see
    // loggingOut=true on their first re-render and skip their redirect.
    setLoggingOut(true);
    await clearAuthSession();
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((fresh) => {
        if (active) setUser(fresh);
      })
      .catch((err) => {
        // 401/403 on bootstrap just means "not signed in" — expected on
        // public pages. Anything else, log but don't block the tree.
        if (!isAuthError(err)) console.warn("Auth bootstrap failed:", err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loggingOut, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
