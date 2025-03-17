import { createClient } from "@supabase/supabase-js";

// Project 1
const supabaseUrl1 = process.env.NEXT_PUBLIC_SUPABASE_URL_PROJECT_1;
const supabaseAnonKey1 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROJECT_1;
const supabase1 = createClient(supabaseUrl1, supabaseAnonKey1);

// Project 2
const supabaseUrl2 = process.env.NEXT_PUBLIC_SUPABASE_URL_PROJECT_2;
const supabaseAnonKey2 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROJECT_2;
const supabase2 = createClient(supabaseUrl2, supabaseAnonKey2);

export { supabase1, supabase2 };
