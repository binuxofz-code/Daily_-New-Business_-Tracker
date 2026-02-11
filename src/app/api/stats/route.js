
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
        // v2 Logic: Aggregate based on RECORDS principally, since Zonal Managers enter multiple records.
        // We fetch ALL records for the date.

        let query = supabase.from('daily_records').select(`
            *,
            users (username, role, zone, branch)
        `).eq('date', date);

        // Note: Filtering by zone here on the record level might be tricky if records don't have zone yet (migration).
        // Best fetch all for date and filter in memory for now to handle mixed data.

        const { data: records, error } = await query;
        if (error) throw error;

        // Improve Data Shape
        // If record has direct zone/branch, use it. Else fall back to user's zone/branch.
        const augmentedRecords = records.map(r => {
            const u = r.users || {};
            return {
                ...r,
                username: u.username,
                // Prefer record's zone/branch (v2), fallback to user's (v1)
                zone: r.zone || u.zone || 'Unknown',
                branch: r.branch || u.branch || 'Unknown',
                role: u.role
            };
        });

        // If zone filter applied
        const filtered = zone
            ? augmentedRecords.filter(r => r.zone === zone)
            : augmentedRecords;

        if (type === 'zone') {
            const groups = {};
            filtered.forEach(r => {
                const z = r.zone;
                if (!groups[z]) groups[z] = { zone: z, branches: 0, aaf_agents: 0, agent_achievement: 0, bdo_branch_performance: 0, total_business: 0 };
                groups[z].branches++;
                groups[z].aaf_agents += (r.aaf_agents || 0);
                groups[z].agent_achievement += (r.agent_achievement || 0);
                groups[z].bdo_branch_performance += (r.bdo_branch_performance || 0);
                groups[z].total_business += ((r.agent_achievement || 0) + (r.bdo_branch_performance || 0));
            });
            // Map for Admin dashboard compatibility (it expects "agents" field for some charts)
            return NextResponse.json(Object.values(groups).map(g => ({ ...g, agents: g.aaf_agents })));
        }

        if (type === 'branch') {
            const groups = {};
            filtered.forEach(r => {
                const b = r.branch;
                if (!groups[b]) groups[b] = { branch: b, aaf_agents: 0, agent_achievement: 0, bdo_branch_performance: 0, total_business: 0 };
                groups[b].aaf_agents += (r.aaf_agents || 0);
                groups[b].agent_achievement += (r.agent_achievement || 0);
                groups[b].bdo_branch_performance += (r.bdo_branch_performance || 0);
                groups[b].total_business += ((r.agent_achievement || 0) + (r.bdo_branch_performance || 0));
            });
            return NextResponse.json(Object.values(groups).map(g => ({ ...g, agents: g.aaf_agents })));
        }

        // Overview / List
        // We also want to include "Missing" Agents if they haven't reported?
        // For simplicity v2, we just show "Reported" data. 
        // Showing missing agents is complex with Zonal Managers having n-branches.
        // Let's stick to showing the records we have.
        return NextResponse.json(filtered);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
