
import { NextResponse } from 'next/server';
// import db from '@/lib/db';
import supabase from '@/lib/supabase';

export async function GET(request) {
    try {
        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        // Fetch all members (and zonal managers if needed) to manage
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, role, zone, branch')
            .order('username', { ascending: true });

        if (error) throw error;

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { id, zone, branch } = await request.json();

        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        const { error } = await supabase
            .from('users')
            .update({ zone, branch })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
