import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';

export const supabase = createClient({
  auth: {
    adapter: SupabaseAuthAdapter(),
    url: 'https://neon.tech',
  },
  dataApi: {
    url: 'https://neon.tech',
  },
});
