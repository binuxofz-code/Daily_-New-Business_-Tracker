import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });

        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({ user: userWithoutPassword });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
