
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

// Only initialize if we have a valid-looking URL (avoiding placeholder values)
const isValidUrl = (url) => {
    try {
        return url && url.startsWith('http') && !url.includes('your_supabase_url_here');
    } catch (e) {
        return false;
    }
};

if (isValidUrl(supabaseUrl) && supabaseAnonKey && !supabaseAnonKey.includes('your_supabase_anon_key_here')) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn('Supabase configuration missing or contains placeholders - Database is NOT connected.');
}

export default supabase;
