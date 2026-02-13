import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/middleware/auth';

export const dynamic = 'force-dynamic';

export const GET = requireAuth(async function (request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const date = searchParams.get('date');
    const zoneQuery = searchParams.get('zone');

    if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    try {
        let query = supabase.from('daily_records').select(`
            *,
            users (username, role, zone, branch)
        `).eq('date', date);

        const { data: records, error } = await query;
        if (error) throw error;

        // Improve Data Shape
        const augmentedRecords = records.map(r => {
            const u = r.users || {};
            return {
                ...r,
                // Prefer record's zone/branch, fallback to user's
                zone: r.zone || u.zone || 'Unknown',
                branch: r.branch || u.branch || 'Unknown',
                role: r.role || u.role
            };
        });

        // Filter
        const filtered = zoneQuery
            ? augmentedRecords.filter(r => r.zone === zoneQuery)
            : augmentedRecords;

        if (type === 'zone') {
            const groups = {};
            filtered.forEach(r => {
                const z = r.zone;
                if (!groups[z]) groups[z] = { zone: z, branches: 0, plan: 0, agent_achievement: 0, bdo_branch_performance: 0, total_business: 0 };
                groups[z].branches++;
                groups[z].plan += (parseFloat(r.zone_plan) || parseFloat(r.branch_plan) || 0);
                groups[z].agent_achievement += (parseFloat(r.agent_achievement) || 0);
                groups[z].bdo_branch_performance += (parseFloat(r.bdo_branch_performance) || 0);
                groups[z].total_business += (parseFloat(r.total_business) || parseFloat(r.actual_business) || 0);
            });
            return NextResponse.json(Object.values(groups));
        }

        if (type === 'branch') {
            const groups = {};
            filtered.forEach(r => {
                const b = r.branch;
                if (!groups[b]) groups[b] = { branch: b, plan: 0, agent_achievement: 0, bdo_branch_performance: 0, total_business: 0 };
                groups[b].plan += (parseFloat(r.branch_plan) || 0);
                groups[b].agent_achievement += (parseFloat(r.agent_achievement) || 0);
                groups[b].bdo_branch_performance += (parseFloat(r.bdo_branch_performance) || 0);
                groups[b].total_business += (parseFloat(r.total_business) || parseFloat(r.actual_business) || 0);
            });
            return NextResponse.json(Object.values(groups));
        }

        return NextResponse.json(filtered);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
});
