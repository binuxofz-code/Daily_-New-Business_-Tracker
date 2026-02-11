
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
// import db from '@/lib/db'; // Legacy SQLite
import supabase from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { username, password, role, zone, branch } = await request.json();

        // Check if supabase configured
        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Check existing user via Supabase
        const { data: existing } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
        }

        const { data, error } = await supabase.from('users').insert({
            username,
            password: hashedPassword,
            role: role || 'member',
            zone: zone || '',
            branch: branch || ''
        }).select().single();

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, id: data.id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
