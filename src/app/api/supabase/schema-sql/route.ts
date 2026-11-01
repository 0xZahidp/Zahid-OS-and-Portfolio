import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sqlPath = path.join(process.cwd(), 'supabase', 'schema_relational.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');

    return new NextResponse(sql, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SQL file not found';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
