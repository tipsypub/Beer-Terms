import { createClient } from '@supabase/supabase-js'
// import type { Database } from '../types/supabase' // Temporarily commented out as it cannot be generated.

// 兼容 Vite 和 Node.js 的环境变量
const supabaseUrl = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.')
}

// 默认使用 'public' schema，因此不再需要指定
// Using `any` as a final workaround because `supabase gen types` is not available in this environment.
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey)
