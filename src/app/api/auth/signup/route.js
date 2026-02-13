import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { username, password, role, zone, branch } = await request.json();

        if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
        if (!username || !password) return NextResponse.json({ error: 'Username and password required' }, { status: 400 });

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const result = db.prepare(`
                INSERT INTO users (username, password, role, zone, branch)
                VALUES (?, ?, ?, ?, ?)
            `).run(username, hashedPassword, role || 'member', zone || '', branch || '');

            return NextResponse.json({ success: true, id: result.lastInsertRowid });
        } catch (e) {
            // Check for unique constraint violation (username)
            if (e.code === 'SQLITE_CONSTRAINT_UNIQUE' || e.message.includes('UNIQUE constraint failed')) {
                return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
            }
            throw e;
        }

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
