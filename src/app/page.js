"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';

export default function Home() {
  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();

  // Redirect users based on authentication status
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        router.replace('/profile');
      }
    }
  }, [user, authLoading, router]);

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, the useEffect will redirect
  if (!user) {
    return null;
  }

  return null;
}
