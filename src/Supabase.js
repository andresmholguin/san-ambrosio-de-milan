import { createClient } from "@supabase/supabase-js";

// Usar placeholders si no están definidas las variables de entorno para evitar pantalla blanca
const supabaseUrl = import.meta.env.VITE_URL || "https://placeholder-missing-url.supabase.co";
const supabaseApiKey = import.meta.env.VITE_API_KEY || "placeholder-missing-key";



const supabase = createClient(supabaseUrl, supabaseApiKey);

export default supabase;
