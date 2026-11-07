import { NextRequest, NextResponse } from 'next/server';
import { TableMeta, TableColumnMeta } from '@/types/supabase-crud';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('placeholder.supabase.co')) {
    return NextResponse.json({
      success: false,
      configured: false,
      error: 'Supabase URL or Service Role key is not configured in .env.local.',
      tables: [],
    });
  }

  // Extract project ref
  let projectRef = '';
  try {
    const urlObj = new URL(supabaseUrl);
    projectRef = urlObj.hostname.split('.')[0] || '';
  } catch {
    // fallback
  }

  try {
    // 1. Fetch OpenAPI definition to discover all registered tables and schemas
    const restRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      next: { revalidate: 30 },
    });

    if (!restRes.ok) {
      return NextResponse.json({
        success: false,
        configured: true,
        projectRef,
        error: `Supabase REST API returned status ${restRes.status}`,
        tables: [],
      });
    }

    const openApiData = await restRes.json();
    const definitions = openApiData?.definitions || {};
    const tableNames = Object.keys(definitions);

    // If no definitions found, fallback to default tables
    const tablesToInspect = tableNames.length > 0 ? tableNames : ['portfolio_content', 'app_settings'];

    const tables: TableMeta[] = [];

    for (const name of tablesToInspect) {
      const def = definitions[name] || {};
      const properties = def.properties || {};
      const requiredFields = Array.isArray(def.required) ? def.required : [];

      let primaryKey = 'id';
      const columns: TableColumnMeta[] = [];

      for (const colName of Object.keys(properties)) {
        const prop = properties[colName] || {};
        const isPk =
          (typeof prop.description === 'string' && prop.description.includes('<pk/>')) ||
          colName === 'id' ||
          colName === 'key';

        if (isPk && (!primaryKey || colName === 'id' || colName === 'key')) {
          primaryKey = colName;
        }

        columns.push({
          name: colName,
          type: prop.type || (prop.format ? 'string' : 'any'),
          format: prop.format,
          isPrimaryKey: isPk,
          isRequired: requiredFields.includes(colName),
          defaultValue: typeof prop.default !== 'undefined' ? String(prop.default) : undefined,
        });
      }

      // Check permission and row count
      let hasPermission = false;
      let rowCount = 0;
      let permissionError: string | undefined;
      let grantHint: string | undefined;

      try {
        const filter = name === 'app_settings' ? '&key=not.like.RESEND_KEY_*' : '';
        const countRes = await fetch(`${supabaseUrl}/rest/v1/${name}?select=*${filter}`, {
          method: 'HEAD',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: 'count=exact',
          },
        });

        if (countRes.ok) {
          hasPermission = true;
          const contentRange = countRes.headers.get('content-range');
          if (contentRange) {
            const parts = contentRange.split('/');
            rowCount = parseInt(parts[1] || '0', 10);
            if (isNaN(rowCount)) rowCount = 0;
          }
        } else {
          // Check JSON error response
          const errRes = await fetch(`${supabaseUrl}/rest/v1/${name}?select=*${filter}&limit=1`, {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
          });
          const errData = await errRes.json();
          permissionError = errData?.message || `HTTP ${countRes.status}`;
          grantHint = errData?.hint || `GRANT ALL ON TABLE public.${name} TO service_role;`;
        }
      } catch (err: unknown) {
        permissionError = err instanceof Error ? err.message : 'Network error checking table';
      }

      tables.push({
        name,
        rowCount,
        primaryKey,
        columns,
        hasPermission,
        permissionError,
        grantHint,
      });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      projectRef,
      tables,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to discover Supabase tables';
    return NextResponse.json(
      {
        success: false,
        configured: true,
        projectRef,
        error: msg,
        tables: [],
      },
      { status: 500 }
    );
  }
}

