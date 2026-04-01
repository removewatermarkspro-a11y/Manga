'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    credits: number;
    plan: string;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    credits: number;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    isLoggedIn: false,
    isLoading: true,
    credits: 0,
    signOut: async () => {},
    refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }
            return data as Profile;
        } catch (err) {
            console.error('Error fetching profile:', err);
            return null;
        }
    }, [supabase]);

    const refreshProfile = useCallback(async () => {
        if (user) {
            const profileData = await fetchProfile(user.id);
            if (profileData) {
                setProfile(profileData);
            }
        }
    }, [user, fetchProfile]);

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (initialSession?.user) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                    const profileData = await fetchProfile(initialSession.user.id);
                    if (profileData) {
                        setProfile(profileData);
                    }
                }
            } catch (error) {
                console.error('Error getting initial session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('Auth state changed:', event);
                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    const profileData = await fetchProfile(newSession.user.id);
                    if (profileData) {
                        setProfile(profileData);
                    }
                } else {
                    setProfile(null);
                }

                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isLoggedIn: !!user,
                isLoading,
                credits: profile?.credits ?? 0,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
