import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

        // Fetch all members (and zonal managers if needed) to manage
        const users = db.prepare('SELECT id, username, role, zone, branch, managed_locations FROM users ORDER BY username ASC').all();

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { id, role, zone, branch, managed_locations } = await request.json();

        if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

        const updates = [];
        const params = [];

        if (role !== undefined) { updates.push('role = ?'); params.push(role); }
        if (zone !== undefined) { updates.push('zone = ?'); params.push(zone); }
        if (branch !== undefined) { updates.push('branch = ?'); params.push(branch); }
        if (managed_locations !== undefined) { updates.push('managed_locations = ?'); params.push(managed_locations); }

        if (updates.length > 0) {
            params.push(id);
            db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

        const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);

        if (info.changes === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
