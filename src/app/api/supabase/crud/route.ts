import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

function getCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { supabaseUrl, serviceKey };
}

// GET /api/supabase/crud?table=...&page=1&limit=20&search=...&sortBy=...&order=asc|desc
export async function GET(req: NextRequest) {
  const { supabaseUrl, serviceKey } = getCredentials();
  const { searchParams } = new URL(req.url);

  const table = searchParams.get('table');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy');
  const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

  const colFiltersParam = searchParams.get('colFilters');
  const colFilters: Record<string, string> = {};
  if (colFiltersParam) {
    try {
      Object.assign(colFilters, JSON.parse(colFiltersParam));
    } catch {}
  }
  searchParams.forEach((val, key) => {
    if (key.startsWith('filter_')) {
      const colName = key.substring(7);
      if (colName && val) colFilters[colName] = val;
    }
  });

  if (!table) {
    return NextResponse.json({ success: false, error: 'Table name is required.' }, { status: 400 });
  }

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('placeholder.supabase.co')) {
    return NextResponse.json(
      { success: false, error: 'Supabase credentials not configured in environment.' },
      { status: 500 }
    );
  }

  const offset = (page - 1) * limit;

  try {
    // Build query URL
    const queryParts: string[] = ['select=*'];

    if (sortBy) {
      queryParts.push(`order=${encodeURIComponent(sortBy)}.${order}`);
    }

    queryParts.push(`limit=${limit}`);
    queryParts.push(`offset=${offset}`);

    const endpoint = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}?${queryParts.join('&')}`;

    const res = await fetch(endpoint, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'count=exact',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const contentRange = res.headers.get('content-range');
      let totalCount = Array.isArray(data) ? data.length : 0;

      if (contentRange) {
        const parts = contentRange.split('/');
        const parsed = parseInt(parts[1] || '0', 10);
        if (!isNaN(parsed)) totalCount = parsed;
      }

      // In-memory search filter if search keyword is present
      let filteredRows = data;
      if (search.trim()) {
        const q = search.toLowerCase();
        filteredRows = data.filter((row: Record<string, unknown>) =>
          JSON.stringify(row).toLowerCase().includes(q)
        );
      }

      // Per-column filter
      const activeFilterKeys = Object.keys(colFilters);
      if (activeFilterKeys.length > 0 && Array.isArray(filteredRows)) {
        filteredRows = filteredRows.filter((row: Record<string, unknown>) => {
          return activeFilterKeys.every((col) => {
            const filterVal = colFilters[col]?.toLowerCase().trim();
            if (!filterVal) return true;
            const cell = row[col];
            if (cell === undefined || cell === null) return false;
            return String(cell).toLowerCase().includes(filterVal);
          });
        });
      }

      return NextResponse.json({
        success: true,
        table,
        rows: filteredRows,
        totalCount,
        page,
        pageSize: limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        hasPermission: true,
        source: 'supabase',
      });
    }

    // If permission denied (403), check error details and provide local fallback data
    const errData = await res.json().catch(() => ({}));
    const grantHint =
      errData?.hint || `GRANT ALL ON TABLE public.${table} TO anon, authenticated, service_role;`;

    // Attempt local fallback for portfolio_content or app_settings
    let fallbackRows: Record<string, unknown>[] = [];
    if (table === 'portfolio_content') {
      try {
        const contentPath = path.join(process.cwd(), 'src', 'data', 'portfolio-content.json');
        const raw = await fs.readFile(contentPath, 'utf-8');
        const contentObj = JSON.parse(raw);
        fallbackRows = [
          {
            id: 'current',
            data: contentObj,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      } catch {
        // ignore
      }
    } else if (table === 'app_settings') {
      fallbackRows = [
        {
          key: 'github_pat_configured',
          value: 'true',
          is_secret: true,
          updated_at: new Date().toISOString(),
        },
        {
          key: 'resend_verified_domain',
          value: 'zahidp.com',
          is_secret: false,
          updated_at: new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json({
      success: false,
      table,
      rows: fallbackRows,
      totalCount: fallbackRows.length,
      page: 1,
      pageSize: limit,
      totalPages: 1,
      hasPermission: false,
      error: errData?.message || `Supabase query returned status ${res.status}`,
      hint: grantHint,
      source: fallbackRows.length > 0 ? 'local_fallback' : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database query failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/supabase/crud (Create new record)
export async function POST(req: NextRequest) {
  const { supabaseUrl, serviceKey } = getCredentials();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ success: false, error: 'Supabase credentials missing.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { table, record } = body;

    if (!table || !record || typeof record !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Table name and record object are required.' },
        { status: 400 }
      );
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(record),
    });

    const resData = await res.json().catch(() => null);

    if (res.ok) {
      return NextResponse.json({
        success: true,
        data: Array.isArray(resData) ? resData[0] : resData,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: resData?.message || `Insert failed with HTTP ${res.status}`,
        hint: resData?.hint,
      },
      { status: res.status }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to insert row';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH /api/supabase/crud (Update existing record)
export async function PATCH(req: NextRequest) {
  const { supabaseUrl, serviceKey } = getCredentials();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ success: false, error: 'Supabase credentials missing.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { table, pkColumn, pkValue, updates } = body;

    if (!table || !pkColumn || typeof pkValue === 'undefined' || !updates) {
      return NextResponse.json(
        { success: false, error: 'Table, pkColumn, pkValue, and updates are required.' },
        { status: 400 }
      );
    }

    const endpoint = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}?${encodeURIComponent(
      pkColumn
    )}=eq.${encodeURIComponent(String(pkValue))}`;

    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
    });

    const resData = await res.json().catch(() => null);

    if (res.ok) {
      return NextResponse.json({
        success: true,
        data: Array.isArray(resData) ? resData[0] : resData,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: resData?.message || `Update failed with HTTP ${res.status}`,
        hint: resData?.hint,
      },
      { status: res.status }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update row';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/supabase/crud?table=...&pkColumn=...&pkValue=...
export async function DELETE(req: NextRequest) {
  const { supabaseUrl, serviceKey } = getCredentials();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ success: false, error: 'Supabase credentials missing.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');
    const pkColumn = searchParams.get('pkColumn');
    const pkValue = searchParams.get('pkValue');

    if (!table || !pkColumn || !pkValue) {
      return NextResponse.json(
        { success: false, error: 'Table, pkColumn, and pkValue are required parameters.' },
        { status: 400 }
      );
    }

    const endpoint = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}?${encodeURIComponent(
      pkColumn
    )}=eq.${encodeURIComponent(pkValue)}`;

    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (res.ok) {
      return NextResponse.json({ success: true, table, pkColumn, pkValue });
    }

    const errData = await res.json().catch(() => null);
    return NextResponse.json(
      {
        success: false,
        error: errData?.message || `Delete failed with HTTP ${res.status}`,
        hint: errData?.hint,
      },
      { status: res.status }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete row';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

