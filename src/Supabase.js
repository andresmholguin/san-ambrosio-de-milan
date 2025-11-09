import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
const supabaseUrl = import.meta.env.VITE_URL;
const supabaseApiKey = import.meta.env.VITE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseApiKey);

export default supabase;
