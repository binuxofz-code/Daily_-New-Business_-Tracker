import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const records = Array.isArray(body) ? body : [body];

        if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

        const processRecords = db.transaction((recs) => {
            let count = 0;
            for (const rec of recs) {
                const { user_id, date, zone_plan, branch_plan, morning_plan, aaf_agents, agent_achievement, bdo_branch_performance, actual_business, zone, branch } = rec;

                // Get user role for uniqueness logic
                const user = db.prepare('SELECT role FROM users WHERE id = ?').get(user_id);
                const role = user ? user.role : 'member';

                // Check existing record
                let checkQuery = 'SELECT * FROM daily_records WHERE user_id = ? AND date = ?';
                let checkParams = [user_id, date];

                if (role === 'zonal_manager' && branch) {
                    checkQuery += ' AND branch = ?';
                    checkParams.push(branch);
                } else if (role === 'zonal_manager' && !branch) {
                    // Fallback for old data or if branch is missing but should be unique
                    checkQuery += ' AND (branch IS NULL OR branch = "")';
                }

                const check = db.prepare(checkQuery).get(...checkParams);

                const finalAgentAch = agent_achievement !== undefined ? parseFloat(agent_achievement) : (actual_business !== undefined ? parseFloat(actual_business) : 0);
                const finalBranchPerf = bdo_branch_performance !== undefined ? parseFloat(bdo_branch_performance) : 0;
                const total_business_val = finalAgentAch + finalBranchPerf;
                const finalMorningPlan = morning_plan !== undefined ? morning_plan : (zone_plan || branch_plan || '');

                if (check) {
                    // Update
                    const updates = [];
                    const params = [];

                    if (zone_plan !== undefined) { updates.push('zone_plan = ?'); params.push(zone_plan); }
                    if (branch_plan !== undefined) { updates.push('branch_plan = ?'); params.push(branch_plan); }
                    if (morning_plan !== undefined) { updates.push('morning_plan = ?'); params.push(morning_plan); }
                    // if (aaf_agents !== undefined) { updates.push('aaf_agents = ?'); params.push(aaf_agents); } // checking if column exists in schema
                    if (agent_achievement !== undefined || actual_business !== undefined) { updates.push('agent_achievement = ?'); params.push(finalAgentAch); }
                    if (bdo_branch_performance !== undefined) { updates.push('bdo_branch_performance = ?'); params.push(finalBranchPerf); }
                    if (actual_business !== undefined) { updates.push('actual_business = ?'); params.push(actual_business); }

                    updates.push('total_business = ?'); params.push(total_business_val);
                    if (zone) { updates.push('zone = ?'); params.push(zone); }
                    if (branch) { updates.push('branch = ?'); params.push(branch); }

                    updates.push('updated_at = ?'); params.push(new Date().toISOString());

                    params.push(check.id);

                    if (updates.length > 0) {
                        db.prepare(`UPDATE daily_records SET ${updates.join(', ')} WHERE id = ?`).run(...params);
                    }
                } else {
                    // Insert
                    db.prepare(`
                        INSERT INTO daily_records (
                            user_id, date, zone_plan, branch_plan, morning_plan, 
                            agent_achievement, bdo_branch_performance, total_business, 
                            actual_business, zone, branch
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        user_id, date,
                        zone_plan || 0, branch_plan || 0, finalMorningPlan || '',
                        finalAgentAch, finalBranchPerf, total_business_val,
                        actual_business || 0, zone || '', branch || ''
                    );
                }
                count++;
            }
            return count;
        });

        const count = processRecords(records);

        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    try {
        if (userId && date) {
            const records = db.prepare('SELECT * FROM daily_records WHERE user_id = ? AND date = ?').all(userId, date);
            return NextResponse.json(records || []);
        }

        if (userId) {
            const records = db.prepare('SELECT * FROM daily_records WHERE user_id = ? ORDER BY date DESC LIMIT 30').all(userId);
            return NextResponse.json(records || []);
        }

        return NextResponse.json([]);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

        const info = db.prepare('DELETE FROM daily_records WHERE id = ?').run(id);

        if (info.changes === 0) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
