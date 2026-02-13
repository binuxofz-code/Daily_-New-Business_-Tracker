import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear session cookie
    response.cookies.set('user_session', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/'
    });

    return response;
}
