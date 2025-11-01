import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for client-side operations (React components).
 * Used for browser-based operations and future real-time subscriptions.
 *
 * @returns Supabase client instance configured for browser environment
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
