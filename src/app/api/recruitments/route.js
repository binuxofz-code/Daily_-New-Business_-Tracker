/**
 * EXAMPLE: Protected API Route Implementation
 * 
 * This shows how to use the authentication middleware to protect your API routes.
 * You can apply this pattern to all sensitive API routes.
 */

import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
// Uncomment to enable authentication:
// import { requireAuth, requireRole, rateLimit } from '@/middleware/auth';

export const dynamic = 'force-dynamic';

// EXAMPLE 1: Basic Authentication
// Wrap your handler with requireAuth to ensure user is logged in
/*
export const GET = requireAuth(async function(request) {
    // request.user is now available with user data
    const userId = request.user.id;
    
    // Your logic here...
});
*/

// EXAMPLE 2: Role-Based Access Control
// Only allow admin and zonal_manager to access
/*
export const GET = requireRole(['admin', 'zonal_manager'])(async function(request) {
    // Only admins and zonal managers can reach here
    const userRole = request.user.role;
    
    // Your logic here...
});
*/

// EXAMPLE 3: Rate Limiting
// Limit to 100 requests per 15 minutes
/*
export const GET = rateLimit(100, 15 * 60 * 1000)(async function(request) {
    // Rate limited endpoint
    
    // Your logic here...
});
*/

// EXAMPLE 4: Combine Multiple Protections
/*
export const POST = rateLimit(50, 15 * 60 * 1000)(
    requireRole(['admin', 'zonal_manager'])(
        async function(request) {
            // This endpoint is:
            // 1. Rate limited (50 requests per 15 min)
            // 2. Requires authentication
            // 3. Requires admin or zonal_manager role
            
            // Your logic here...
        }
    )
);
*/

// Current implementation (UNPROTECTED - for backward compatibility)
// To enable protection, uncomment the middleware imports and wrap handlers

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const zone = searchParams.get('zone');
    const branch = searchParams.get('branch');

    if (!supabase) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    let query = supabase.from('recruitments').select(`
        *,
        users!inner (username, role, zone, branch)
    `).order('created_at', { ascending: false });

    if (userId) {
        query = query.eq('user_id', userId);
    } else {
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
