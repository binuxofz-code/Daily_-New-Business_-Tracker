import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const date = searchParams.get('date');
    const zoneQuery = searchParams.get('zone');

    if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });
    if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    try {
        const query = `
            SELECT 
                r.*,
                u.username, u.role, u.zone as user_zone, u.branch as user_branch
            FROM daily_records r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.date = ?
        `;
        const records = db.prepare(query).all(date);

        // Improve Data Shape
        const augmentedRecords = records.map(r => ({
            ...r,
            // Prefer record's zone/branch, fallback to user's
            zone: r.zone || r.user_zone || 'Unknown',
            branch: r.branch || r.user_branch || 'Unknown',
            role: r.role
        }));

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
                // Use zone_plan if typically one record per zone per day in new system, else sum branch_plans
                // In new simplification, we have ONE record per zone with zone_plan.
                // So summing needs care if there are duplicate records. Assuming one record per zone-branch or zone.
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
}
