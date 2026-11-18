import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';

export const supabase = createClient({
  auth: {
    adapter: SupabaseAuthAdapter({
      persistSession: true,
      autoRefreshToken: true,
    }),
    url: 'https://neon.tech',
  },
  dataApi: {
    url: 'https://neon.tech',
  },
});
