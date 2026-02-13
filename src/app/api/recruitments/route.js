
import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const zone = searchParams.get('zone');
    const branch = searchParams.get('branch');
    const type = searchParams.get('type'); // 'all' for admin

    if (!supabase) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    // Base Query: Select recruits and JOIN with user details to filter by Zone/Branch
    let query = supabase.from('recruitments').select(`
        *,
        users!inner (username, role, zone, branch)
    `).order('created_at', { ascending: false });

    // Filters
    if (userId) {
        query = query.eq('user_id', userId);
    } else {
        // Only apply zone/branch filters if not filtering by specific user
        if (zone) query = query.eq('users.zone', zone);
        if (branch) query = query.eq('users.branch', branch);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { user_id, recruit_name, nic, contact_no, notes } = body;

        if (!user_id || !recruit_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase.from('recruitments').insert({
            user_id,
            recruit_name,
            nic,
            contact_no,
            notes
        }).select().single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const { data, error } = await supabase
            .from('recruitments')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { error } = await supabase.from('recruitments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
