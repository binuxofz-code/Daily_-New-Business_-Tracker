import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/middleware/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const recordSchema = z.object({
    user_id: z.string(),
    date: z.string(),
    zone_plan: z.union([z.string(), z.number()]).optional(),
    branch_plan: z.union([z.string(), z.number()]).optional(),
    morning_plan: z.union([z.string(), z.number()]).optional(),
    agent_achievement: z.union([z.string(), z.number()]).optional(),
    bdo_branch_performance: z.union([z.string(), z.number()]).optional(),
    actual_business: z.union([z.string(), z.number()]).optional(),
    zone: z.string().optional(),
    branch: z.string().optional()
});

export const POST = requireAuth(async function (request) {
    try {
        const body = await request.json();
        const records = Array.isArray(body) ? body : [body];

        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        const results = await Promise.all(records.map(async (rec) => {
            // Validate input
            const result = recordSchema.safeParse(rec);
            if (!result.success) throw new Error(result.error.errors[0].message);

            const data = result.data;
            const { user_id, date, zone, branch } = data;

            // Get user role for uniqueness logic
            const { data: userData } = await supabase.from('users').select('role').eq('id', user_id).single();
            const role = userData ? userData.role : 'member';

            // Check existing record for this user + date
            let query = supabase
                .from('daily_records')
                .select('*')
                .eq('user_id', user_id)
                .eq('date', date);

            if (role === 'zonal_manager' && branch) {
                query = query.eq('branch', branch);
            }

            const { data: checks } = await query;
            const check = checks && checks.length > 0 ? checks[0] : null;

            const finalAgentAch = data.agent_achievement !== undefined ? parseFloat(data.agent_achievement) : (data.actual_business !== undefined ? parseFloat(data.actual_business) : 0);
            const finalBranchPerf = data.bdo_branch_performance !== undefined ? parseFloat(data.bdo_branch_performance) : 0;
            const total_business_val = finalAgentAch + finalBranchPerf;
            const finalMorningPlan = data.morning_plan !== undefined ? data.morning_plan.toString() : (data.zone_plan || data.branch_plan || '').toString();

            if (check) {
                const updates = {};
                if (data.zone_plan !== undefined) updates.zone_plan = data.zone_plan.toString();
                if (data.branch_plan !== undefined) updates.branch_plan = data.branch_plan.toString();
                if (data.morning_plan !== undefined) updates.morning_plan = data.morning_plan.toString();
                if (data.agent_achievement !== undefined || data.actual_business !== undefined) updates.agent_achievement = finalAgentAch;
                if (data.bdo_branch_performance !== undefined) updates.bdo_branch_performance = finalBranchPerf;
                if (data.actual_business !== undefined) updates.actual_business = parseFloat(data.actual_business);
                updates.total_business = total_business_val;
                if (zone) updates.zone = zone;
                if (branch) updates.branch = branch;
                updates.updated_at = new Date().toISOString();

                const { error } = await supabase.from('daily_records').update(updates).eq('id', check.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('daily_records').insert({
                    user_id, date,
                    zone_plan: data.zone_plan?.toString() || '',
                    branch_plan: data.branch_plan?.toString() || '',
                    morning_plan: finalMorningPlan,
                    agent_achievement: finalAgentAch,
                    bdo_branch_performance: finalBranchPerf,
                    total_business: total_business_val,
                    actual_business: parseFloat(data.actual_business || 0),
                    zone: zone || '',
                    branch: branch || ''
                });
                if (error) throw error;
            }
            return true;
        }));

        return NextResponse.json({ success: true, count: results.length });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const GET = requireAuth(async function (request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    try {
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
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
});

export const DELETE = requireAuth(async function (request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

        const { error } = await supabase.from('daily_records').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
