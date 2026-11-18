import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';

export const supabase = createClient({
  auth: {
    adapter: SupabaseAuthAdapter(),
    url: 'https://ep-orange-king-be1wbe5k.neonauth.c-9.us-east-2.aws.neon.tech/neondb/auth',
  },
  dataApi: {
    url: 'https://ep-orange-king-be1wbe5k.apirest.c-9.us-east-2.aws.neon.tech/neondb/rest/v1',
  },
});
