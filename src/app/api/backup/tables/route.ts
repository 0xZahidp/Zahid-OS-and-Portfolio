import { NextRequest, NextResponse } from 'next/server';
import { ALL_TABLE_NAMES, TABLE_SCHEMAS, TableName } from '@/lib/table-store';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const tableCounts: Record<string, number> = {};
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        // Query live row counts across tables
        await Promise.all(
          ALL_TABLE_NAMES.map(async (tableName) => {
            try {
              const { count, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
              tableCounts[tableName] = !error && typeof count === 'number' ? count : 0;
            } catch {
              tableCounts[tableName] = 0;
            }
          })
        );
      } catch (err) {
        console.warn('[BackupTables] Error fetching live row counts:', err);
      }
    }

    const tables = ALL_TABLE_NAMES.map((name: TableName) => {
      const meta = TABLE_SCHEMAS[name];
      const count = tableCounts[name] || 0;
      return {
        id: name,
        name,
        category: meta?.category || 'General',
        description: meta?.description || name,
        count,
        isEmpty: count === 0,
        hasSample: Boolean(meta?.sampleRow),
        columnsCount: meta?.columns?.length || 0,
        columns: meta?.columns || [],
        sampleRow: meta?.sampleRow || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        tables,
        totalTables: ALL_TABLE_NAMES.length,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve tables metadata';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

