import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Family, UserProfile } from './types';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  family: Family | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, retries = 0) => {
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // The signup trigger may not have committed yet — retry once after a short delay
    if (!profileData && retries < 3) {
      await new Promise((r) => setTimeout(r, 500));
      return fetchProfile(userId, retries + 1);
    }

    setProfile(profileData as UserProfile | null);

    if (profileData?.family_id) {
      const { data: familyData } = await supabase
        .from('families')
        .select('*')
        .eq('id', profileData.family_id)
        .maybeSingle();
      setFamily(familyData as Family | null);
    } else {
      setFamily(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        (async () => {
          await fetchProfile(newSession.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setFamily(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async (userId?: string) => {
    const id = userId ?? user?.id;
    if (id) await fetchProfile(id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setFamily(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, family, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
