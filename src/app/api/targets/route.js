
import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        if (!supabase) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const results = [];

        for (const row of rows) {
            // Mapping from Excel Columns (Assuming simple mapping or exact names)
            // Example Excel headers: Username, Month, New_Target, Renew_Target, Renew_Collected

            const username = row['Username'] || row['username'] || '';
            const month = row['Month'] || row['month'] || new Date().toISOString().slice(0, 7); // Default current month if missing

            if (!username) continue;

            const new_target = parseFloat(row['New_Target'] || row['New Business Target'] || 0);
            const renew_target = parseFloat(row['Renew_Target'] || row['Renewal Target'] || 0);
            const renew_collected = parseFloat(row['Renew_Collected'] || row['Renewal Collected'] || 0);

            // Upsert Logic
            const { data, error } = await supabase
                .from('monthly_targets')
                .upsert({
                    username,
                    month,
                    new_business_target: new_target,
                    renewal_target: renew_target,
                    renewal_collected: renew_collected,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'username, month' })
                .select();

            if (error) {
                console.error('Row Error:', error);
                results.push({ username, status: 'failed', error: error.message });
            } else {
                results.push({ username, status: 'success' });
            }
        }

        return NextResponse.json({ success: true, processed: results.length });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Fetch Targets (Optional for UI)
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const username = searchParams.get('username');

    if (!supabase) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    let query = supabase.from('monthly_targets').select('*');
    if (month) query = query.eq('month', month);
    if (username) query = query.eq('username', username);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
}
