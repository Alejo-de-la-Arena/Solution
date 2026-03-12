import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
    else setProfile(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, options = {}) => {
    const signUpOptions = {
      data: options.userMetadata,
      ...(options.emailRedirectTo && { emailRedirectTo: options.emailRedirectTo }),
    };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: signUpOptions,
    });
    if (error) throw error;
    // Solo crear perfil si ya hay sesión (ej. confirmación desactivada). Con confirmación, el callback crea el perfil.
    if (data.user && data.session) {
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          email: data.user.email ?? email,
          full_name: options.userMetadata?.full_name ?? null,
          role: 'retail',
          wholesale_status: 'none',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      await fetchProfile(data.user.id);
    }
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = () => {
    if (user?.id) fetchProfile(user.id);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin: profile?.role === 'admin',
    isWholesaleApproved:
      (profile?.role === 'wholesale' && profile?.wholesale_status === 'approved') || profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
