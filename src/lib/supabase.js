import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Accept multiple key names — Supabase docs use different names in different places
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[Perki] Supabase credentials missing.',
    '\n  VITE_SUPABASE_URL:', supabaseUrl ? '✓ set' : '✗ missing',
    '\n  VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✓ set' : '✗ missing',
    '\n  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ set' : '✗ missing',
    '\n  VITE_SUPABASE_KEY:', import.meta.env.VITE_SUPABASE_KEY ? '✓ set' : '✗ missing',
    '\nSet one of these in .env.local or Vercel environment variables.'
  )
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null
