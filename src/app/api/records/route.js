
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
// import db from '@/lib/db';
import supabase from '@/lib/supabase';

export async function POST(request) {
    try {
        const { user_id, date, zone_plan, branch_plan, morning_plan, aaf_agents, agent_achievement, bdo_branch_performance, actual_business, zone, branch } = await request.json();

        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        // Get user role for uniqueness logic
        const { data: userData } = await supabase.from('users').select('role').eq('id', user_id).single();
        const role = userData?.role || 'member';

        // Check existing record for this user + date
        let query = supabase
            .from('daily_records')
            .select('*')
            .eq('user_id', user_id)
            .eq('date', date);

        // Zonal managers save one record PER branch
        if (role === 'zonal_manager' && branch) {
            query = query.eq('branch', branch);
        }

        const { data: checks } = await query;
        // If it's a member, we just want the ONE record for that day
        const check = checks && checks.length > 0 ? checks[0] : null;

        const finalAgentAch = agent_achievement !== undefined ? parseFloat(agent_achievement) : (actual_business !== undefined ? parseFloat(actual_business) : 0);
        const finalBranchPerf = bdo_branch_performance !== undefined ? parseFloat(bdo_branch_performance) : 0;
        const total_business_val = finalAgentAch + finalBranchPerf;

        const finalMorningPlan = morning_plan !== undefined ? morning_plan : (zone_plan || branch_plan || '');

        if (check) {
            // Update
            const updates = {};
            if (zone_plan !== undefined) updates.zone_plan = zone_plan;
            if (branch_plan !== undefined) updates.branch_plan = branch_plan;
            if (morning_plan !== undefined) updates.morning_plan = morning_plan;
            if (aaf_agents !== undefined) updates.aaf_agents = aaf_agents;
            if (agent_achievement !== undefined || actual_business !== undefined) updates.agent_achievement = finalAgentAch;
            if (bdo_branch_performance !== undefined) updates.bdo_branch_performance = finalBranchPerf;
            if (actual_business !== undefined) updates.actual_business = actual_business;
            updates.total_business = total_business_val;
            if (zone) updates.zone = zone;
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
                zone_plan: zone_plan || '',
                branch_plan: branch_plan || '',
                morning_plan: finalMorningPlan,
                aaf_agents: aaf_agents || 0,
                agent_achievement: finalAgentAch,
                bdo_branch_performance: finalBranchPerf,
                total_business: total_business_val,
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
            .eq('date', date);
        return NextResponse.json(record || []);
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

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        const { error } = await supabase
            .from('daily_records')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
