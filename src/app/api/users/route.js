import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireRole } from '@/middleware/auth';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['admin'])(async function (request) {
    try {
        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, role, zone, branch, managed_locations')
            .order('username', { ascending: true });

        if (error) throw error;

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const PUT = requireRole(['admin'])(async function (request) {
    try {
        const { id, role, zone, branch, managed_locations } = await request.json();

        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        const updates = {};
        if (role !== undefined) updates.role = role;
        if (zone !== undefined) updates.zone = zone;
        if (branch !== undefined) updates.branch = branch;
        if (managed_locations !== undefined) updates.managed_locations = managed_locations;

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const DELETE = requireRole(['admin'])(async function (request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
