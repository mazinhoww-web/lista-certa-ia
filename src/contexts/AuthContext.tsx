import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Role = Database["public"]["Enums"]["user_role"];

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    // Logs id only (never tokens or PII fields).
    console.warn("[auth] profile fetch error", { user_id: userId, message: error.message });
    return null;
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Atomic load: user + profile arrive in the same setState pair, so consumers
  // never observe "user logged in but profile null" mid-fetch.
  const loadSessionAndProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    const fetched = await fetchProfile(session.user.id);
    setUser(session.user);
    setProfile(fetched);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    // onAuthStateChange fires INITIAL_SESSION immediately on subscribe with the
    // currently persisted session (or null). That is our load-on-mount path.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        // Pure token refresh — keep profile, just refresh user reference.
        if (session?.user) setUser(session.user);
        return;
      }

      // INITIAL_SESSION, SIGNED_IN, USER_UPDATED → (re)load profile.
      void loadSessionAndProfile(session);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [loadSessionAndProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will fire SIGNED_OUT and clear the state.
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
