"use client";

/**
 * Auth state for the whole app: who is signed in, and actions that change it.
 * The API remains the source of truth; this context only mirrors the current session.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, setUnauthorizedHandler, usersApi } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/token";

/** @typedef {"loading" | "authenticated" | "anonymous"} AuthStatus */

const AuthContext = createContext(null);

const ANONYMOUS = { status: "anonymous", user: null };
const LOGIN_PATH = "/login";

/**
 * Restores the session from the stored token and provides auth state and actions.
 * Status starts as `loading` on both server and client, so the first render always matches.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState({ status: "loading", user: null });
  const router = useRouter();

  // When any authenticated request gets 401, the token is already cleared: reset state and go to sign in.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(ANONYMOUS);
      router.replace(LOGIN_PATH);
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();

    async function restoreSession() {
      // Token is read inside the effect so server and client renders stay identical.
      const token = getToken();
      if (!token) return ANONYMOUS;
      try {
        const { user } = await authApi.me(controller.signal);
        return { status: "authenticated", user };
      } catch (err) {
        if (err?.name === "AbortError") return null;
        // Expired or invalid token: start signed out.
        if (err?.status === 401) clearToken();
        return ANONYMOUS;
      }
    }

    restoreSession().then((next) => {
      if (next && !controller.signal.aborted) setSession(next);
    });

    return () => controller.abort();
  }, []);

  const register = useCallback(async (values) => {
    const { token, user } = await authApi.register(values);
    setToken(token);
    setSession({ status: "authenticated", user });
    return user;
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, user } = await authApi.login(credentials);
    setToken(token);
    setSession({ status: "authenticated", user });
    return user;
  }, []);

  const updateProfile = useCallback(async (values) => {
    const { user } = await usersApi.updateMe(values);
    setSession({ status: "authenticated", user });
    return user;
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    const { user } = await usersApi.uploadAvatar(file);
    setSession({ status: "authenticated", user });
    return user;
  }, []);

  const removeAvatar = useCallback(async () => {
    const { user } = await usersApi.removeAvatar();
    setSession({ status: "authenticated", user });
    return user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setSession(ANONYMOUS);
    router.replace(LOGIN_PATH);
  }, [router]);

  const value = useMemo(
    () => ({ ...session, register, login, logout, updateProfile, uploadAvatar, removeAvatar }),
    [session, register, login, logout, updateProfile, uploadAvatar, removeAvatar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reads auth state and actions.
 *
 * @returns {{
 *   status: AuthStatus,
 *   user: object | null,
 *   register: (values: { name: string, email: string, password: string }) => Promise<object>,
 *   login: (credentials: { email: string, password: string }) => Promise<object>,
 *   logout: () => void,
 *   updateProfile: (values: { name?: string, interests?: string[] }) => Promise<object>,
 *   uploadAvatar: (file: File) => Promise<object>,
 *   removeAvatar: () => Promise<object>,
 * }}
 * @throws {Error} If used outside <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
