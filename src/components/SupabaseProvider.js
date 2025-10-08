"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

const SupabaseContext = createContext();

export function SupabaseProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tier, setTier] = useState('free');
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const router = useRouter();

    const fetchTier = async () => {
        if (!user) {
            setTier('free');
            return;
        }

        try {
            const response = await fetch('/api/subscription');
            const data = await response.json();
            if (response.ok) {
                setTier(data.tier);
            } else {
                setTier('free');
            }
        } catch (error) {
            console.error('Error fetching tier:', error);
            setTier('free');
        }
    };

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);

                if (event === 'SIGNED_OUT') {
                    setTier('free');
                    router.push('/login');
                } else if (event === 'SIGNED_IN') {
                    // For backward compatibility: migrate any existing session-based likes to user-based likes
                    try {
                        const migrateResponse = await fetch('/api/profile/migrate-likes', {
                            method: 'POST',
                        });

                        if (!migrateResponse.ok) {
                            console.error('Error migrating likes:', await migrateResponse.text());
                        } else {
                            const result = await migrateResponse.json();
                            console.log('Likes migration result:', result);
                        }
                    } catch (migrationError) {
                        console.error('Error calling migration endpoint:', migrationError);
                    }

                    await fetchTier();
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase, router]);

    useEffect(() => {
        if (user) {
            fetchTier();
        } else {
            setTier('free');
        }
    }, [user]);

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
            }
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const value = {
        supabase,
        user,
        loading,
        tier,
        signOut,
        fetchTier,
    };

    return (
        <SupabaseContext.Provider value={value}>
            {children}
        </SupabaseContext.Provider>
    );
}

export function useSupabase() {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
}