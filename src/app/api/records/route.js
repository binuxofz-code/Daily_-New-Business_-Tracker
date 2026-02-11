
import { NextResponse } from 'next/server';
// import db from '@/lib/db';
import supabase from '@/lib/supabase';

export async function POST(request) {
    try {
        const { user_id, date, morning_plan, actual_business, zone, branch } = await request.json();

        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        // Check existing record for this user + date + branch (if branch provided)
        let query = supabase
            .from('daily_records')
            .select('*')
            .eq('user_id', user_id)
            .eq('date', date);

        if (branch) {
            query = query.eq('branch', branch);
        }

        // If no branch is specified, it might pick up an arbitrary record if multiple exist.
        // Usually frontend sends branch for Zonal Manager.
        // For Members, branch comes from their profile or is null/empty in DB.

        const { data: checks } = await query;
        const check = checks && checks.length > 0 ? checks[0] : null;

        if (check) {
            // Update
            const updates = {};
            if (morning_plan !== undefined) updates.morning_plan = morning_plan;
            if (actual_business !== undefined) updates.actual_business = actual_business;
            if (zone) updates.zone = zone; // Update zone just in case
            if (branch) updates.branch = branch;
            updates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('daily_records')
                .update(updates)
                .eq('id', check.id);

            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabase.from('daily_records').insert({
                user_id, date,
                morning_plan: morning_plan || '',
                actual_business: actual_business || 0,
                zone: zone || '',
                branch: branch || ''
            });
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    if (userId && date) {
        const { data: record } = await supabase
            .from('daily_records')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date)
            .single();
        return NextResponse.json(record || {});
    }

    if (userId) {
        const { data: records } = await supabase
            .from('daily_records')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(30);
        return NextResponse.json(records || []);
    }

    return NextResponse.json([]);
}
