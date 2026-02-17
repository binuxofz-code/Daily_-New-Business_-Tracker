/**
 * EXAMPLE: Protected API Route Implementation
 * 
 * This shows how to use the authentication middleware to protect your API routes.
 * You can apply this pattern to all sensitive API routes.
 */
import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/middleware/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation Schemas
const recruitSchema = z.object({
    recruit_name: z.string().min(1, 'Name is required').max(100),
    contact_no: z.string().max(20).optional().nullable(),
    nic: z.string().max(20).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    user_id: z.string().optional() // Usually taken from auth, but kept for compatibility
});

const updateSchema = z.object({
    id: z.union([z.string(), z.number()]),
    recruit_name: z.string().min(1).max(100).optional(),
    contact_no: z.string().max(20).optional().nullable(),
    nic: z.string().max(20).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    date_file_submitted: z.string().optional().nullable(),
    date_exam_passed: z.string().optional().nullable(),
    date_documents_complete: z.string().optional().nullable(),
    date_appointed: z.string().optional().nullable(),
    date_code_issued: z.string().optional().nullable()
});

// GET - List recruits (Authenticated)
export const GET = requireAuth(async function (request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const zone = searchParams.get('zone');
    const branch = searchParams.get('branch');

    if (!supabase) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    let query = supabase.from('recruitments').select(`
        *,
        users!inner (username, role, zone, branch)
    `).order('created_at', { ascending: false });

    // If filtering by specific user, or restricted based on role (could add more logic here)
    if (userId) {
        query = query.eq('user_id', userId);
    } else {
        if (zone) query = query.eq('users.zone', zone);
        if (branch) query = query.eq('users.branch', branch);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
});

// POST - Create recruit (Authenticated)
export const POST = requireAuth(async function (request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection not initialized' }, { status: 500 });
        }

        const body = await request.json();

        // Validate input
        const result = recruitSchema.safeParse(body);
        if (!result.success) {
            const errorMessage = result.error?.errors?.[0]?.message || result.error?.message || 'Validation failed';
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        const { recruit_name, nic, contact_no, notes } = result.data;
        // Use user_id from auth token if available, otherwise from body
        const user_id = request.user?.id || body.user_id;

        if (!user_id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

        const { data, error } = await supabase.from('recruitments').insert({
            user_id,
            recruit_name,
            nic: nic || null,
            contact_no: contact_no || null,
            notes: notes || null
        }).select().single();

        if (error) {
            console.error('Database Error:', error);
            throw new Error(error.message);
        }

        return NextResponse.json(data);
    } catch (e) {
        console.error('API Error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
});

// PUT - Update recruit stages (Authenticated)
export const PUT = requireAuth(async function (request) {
    try {
        const body = await request.json();

        // Validate input
        const result = updateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }

        const { id, ...updates } = result.data;

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
});

// DELETE - Remove recruit (Authenticated)
export const DELETE = requireAuth(async function (request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { error } = await supabase.from('recruitments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
});
