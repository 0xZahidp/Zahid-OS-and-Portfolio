import { NextRequest, NextResponse } from 'next/server';
import { ALL_TABLE_NAMES, getTableRows, saveTableRows } from '@/lib/table-store';
import { createDatabaseZip, extractDatabaseZip } from '@/lib/csv-zip';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const tablesData: Record<string, Record<string, unknown>[]> = {};

    for (const tableName of ALL_TABLE_NAMES) {
      tablesData[tableName] = await getTableRows(tableName);
    }

    const zipBuffer = await createDatabaseZip(tablesData);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `folioframe-database-backup-${dateStr}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export database ZIP';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const extractedTables = await extractDatabaseZip(arrayBuffer);

    const tablesRestored: Record<string, number> = {};

    for (const [tableName, rows] of Object.entries(extractedTables)) {
      const res = await saveTableRows(tableName, rows);
      tablesRestored[tableName] = res.count;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${Object.keys(tablesRestored).length} tables from ZIP backup.`,
      tablesRestored,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to restore ZIP backup';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
