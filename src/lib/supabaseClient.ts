import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';

const neonDatabaseUrl = import.meta.env.VITE_NEON_DATABASE_URL;

if (!neonDatabaseUrl) {
  throw new Error(
    'Variável VITE_NEON_DATABASE_URL não configurada no ambiente.'
  );
}

export const supabase = createClient(neonDatabaseUrl, {
  auth: {
    adapter: SupabaseAuthAdapter(),
  },
});
