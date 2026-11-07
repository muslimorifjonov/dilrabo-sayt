import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './media';

/**
 * Faqat admin panel uchun. Faqat publishable (anon) kalit ishlatiladi.
 * service_role kaliti HECH QACHON frontendga qo‘yilmaydi.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'dilrabo-admin-auth',
      },
    })
  : null;
