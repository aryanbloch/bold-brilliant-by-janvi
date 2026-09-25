// Public browser client. Uses the anon key, which is safe to expose - row level
// security policies in Supabase control what each signed-in customer can read or write.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables once you
// create a Supabase project (Project Settings -> API).
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
