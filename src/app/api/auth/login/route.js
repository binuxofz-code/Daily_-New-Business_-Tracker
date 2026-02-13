import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        // Check if database is ready
        if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

        // Find user
        const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = stmt.get(username);

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });

        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({ user: userWithoutPassword });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
