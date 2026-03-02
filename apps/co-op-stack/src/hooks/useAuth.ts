import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    void fetchSession();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signInAnonymously = async (displayName: string) => {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    // * Mock for development if Supabase fails (e.g. 422)
    if (error && import.meta.env.DEV) {
      console.warn("Bolt: Mocking successful auth for development due to Supabase error");
      // We need to manually update state because onAuthStateChange won't fire for local mock
      const mockUser = {
        id: "mock-user-id",
        email: "mock@example.com",
        app_metadata: {},
        user_metadata: { display_name: displayName },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        role: "authenticated"
      } as unknown as User;

      setUser(mockUser);
      setSession({
        user: mockUser,
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
        expires_in: 3600,
        token_type: "bearer"
      } as Session);
      return { data: { user: mockUser, session: { user: mockUser, access_token: "mock-token", refresh_token: "mock-refresh-token", expires_in: 3600, token_type: "bearer" } as Session }, error: null };
    }
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInAnonymously,
    signOut,
  };
};
