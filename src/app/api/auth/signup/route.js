import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { username, password, role, zone, branch } = await request.json();

        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        if (!username || !password) return NextResponse.json({ error: 'Username and password required' }, { status: 400 });

        const hashedPassword = await bcrypt.hash(password, 10);

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
