
import { NextResponse } from 'next/server';
// import db from '@/lib/db';
import supabase from '@/lib/supabase';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const date = searchParams.get('date');
    const zone = searchParams.get('zone');

    if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    try {
        // Fetch users and their records for the date.
        // Supabase JS doesn't do deep joins easily for aggregation without custom RPC or views.
        // We will fetch raw data and aggregate in JS for simplicity, as dataset is likely small (<1000 users).

        // Fetch all members first
        let userQuery = supabase.from('users').select('id, username, role, zone, branch').eq('role', 'member');
        if (zone) userQuery = userQuery.eq('zone', zone);

        const { data: users, error: userError } = await userQuery;

        if (userError) throw userError;

        // Fetch records for these users for the date
        const userIds = users.map(u => u.id);
        let records = [];
        if (userIds.length > 0) {
            const { data: recs, error: recError } = await supabase
                .from('daily_records')
                .select('*')
                .in('user_id', userIds)
                .eq('date', date);

            if (!recError) records = recs;
        }

        // Map records to users
        const combined = users.map(u => {
            const r = records.find(rec => rec.user_id === u.id);
            return {
                ...u,
                morning_plan: r?.morning_plan || '',
                actual_business: r?.actual_business || 0,
                updated_at: r?.updated_at
            };
        });

        if (type === 'zone') {
            // Aggregate by zone
            const groups = {};
            combined.forEach(u => {
                if (!u.zone) return;
                if (!groups[u.zone]) groups[u.zone] = { zone: u.zone, agents: 0, total_business: 0 };
                groups[u.zone].agents++;
                groups[u.zone].total_business += (u.actual_business || 0);
            });
            return NextResponse.json(Object.values(groups));
        }

        if (type === 'branch') {
            const groups = {};
            combined.forEach(u => {
                if (!u.branch) return;
                if (!groups[u.branch]) groups[u.branch] = { branch: u.branch, agents: 0, total_business: 0 };
                groups[u.branch].agents++;
                groups[u.branch].total_business += (u.actual_business || 0);
            });
            return NextResponse.json(Object.values(groups));
        }

        // Default list
        return NextResponse.json(combined);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
