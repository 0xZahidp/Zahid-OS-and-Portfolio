import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth/admin-auth';
import { exportHealthData, restoreHealthData } from '@/lib/health/health-store';
import { HealthData } from '@/types/health';

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await exportHealthData();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `health-backup-${dateStr}.json`;

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to export health records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await req.json()) as Partial<HealthData>;

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid backup file structure' }, { status: 400 });
    }

    const result = await restoreHealthData(payload);
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to restore health data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      counts: result.counts,
      message: 'Health records successfully restored and merged',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to process restore' }, { status: 500 });
  }
}

