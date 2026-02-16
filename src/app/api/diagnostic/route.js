import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const status = {
        supabaseUrl: url ? '✅ Configured' : '❌ Missing',
        anonKey: anonKey ? '✅ Configured' : '❌ Missing',
        serviceRoleKey: serviceRoleKey ? '✅ Configured' : '❌ MISSING (Required for new security features)',
        nodeEnv: process.env.NODE_ENV
    };

    if (!serviceRoleKey) {
        status.ACTION_REQUIRED = "Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local or Vercel Environment Variables. You can find this in your Supabase Project Settings > API > service_role (secret).";
    }

    return NextResponse.json(status, { status: 200 });
}
