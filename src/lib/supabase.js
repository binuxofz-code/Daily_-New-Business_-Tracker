import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use Service Role Key on server for full access, Anon key on client
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

// Only initialize if we have a valid-looking URL (avoiding placeholder values)
const isValidUrl = (url) => {
    try {
        return url && url.startsWith('http') && !url.includes('your_supabase_url_here');
    } catch (e) {
        return false;
    }
};

if (isValidUrl(supabaseUrl) && supabaseKey && !supabaseKey.includes('your_supabase_anon_key_here')) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false // Since we handle auth manually, don't persist
        }
    });
} else {
    console.warn('Supabase configuration missing or contains placeholders - Database is NOT connected.');
}

export default supabase;
