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

        const response = NextResponse.json({ user: userWithoutPassword });

        // Set secure session cookie
        response.cookies.set('user_session', JSON.stringify(userWithoutPassword), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/'
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
