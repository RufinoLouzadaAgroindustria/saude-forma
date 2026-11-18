import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';

const host = 'ep-orange-king-be1wbe5k';
const region = 'c-9.us-east-2.aws.neon.tech';

export const supabase = createClient({
  auth: {
    adapter: SupabaseAuthAdapter(),
    url: 'https://' + host + '.neonauth.' + region + '/neondb/auth',
  },
  dataApi: {
    url: 'https://' + host + '.apirest.' + region + '/neondb/rest/v1',
  },
});
