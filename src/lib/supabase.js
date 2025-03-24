import { createClient } from "@supabase/supabase-js";

// Project 1
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_PROJECT_1;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROJECT_1;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Project 2
const supabaseUrl2 = process.env.NEXT_PUBLIC_SUPABASE_URL_PROJECT_2;
const supabaseAnonKey2 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROJECT_2;
const supabase2 = createClient(supabaseUrl2, supabaseAnonKey2);

export { supabase, supabase2 };
