import { NextRequest, NextResponse } from 'next/server';
import { getTableRows, saveTableRows } from '@/lib/table-store';
import { serializeToCsv, parseCsv } from '@/lib/csv-zip';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json({ success: false, error: 'Table name parameter is required' }, { status: 400 });
    }

    const rows = await getTableRows(table);
    const csvContent = serializeToCsv(rows);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${table}-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export table CSV';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');

    if (!table) {
      return NextResponse.json({ success: false, error: 'Table name parameter is required' }, { status: 400 });
    }

    let csvText = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded in form data' }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      csvText = await req.text();
    }

    if (!csvText.trim()) {
      return NextResponse.json({ success: false, error: 'CSV content is empty' }, { status: 400 });
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid data rows found in CSV' }, { status: 400 });
    }

    const result = await saveTableRows(table, rows);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.count} rows into '${table}'.`,
      count: result.count,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import CSV';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

