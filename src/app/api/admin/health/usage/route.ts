import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getHealthCollection } from '@/lib/health/health-store';
import { HealthStorageUsage } from '@/types/health';

const ONE_GB_BYTES = 1024 * 1024 * 1024; // 1 GB free-tier storage quota

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const documents = await getHealthCollection('documents');
    const totalBytes = documents.reduce((sum, doc) => sum + (doc.sizeBytes || 0), 0);
    const fileCount = documents.length;

    const usage: HealthStorageUsage = {
      totalBytes,
      fileCount,
      limitBytes: ONE_GB_BYTES,
    };

    return NextResponse.json({ success: true, usage });
  } catch {
    return NextResponse.json({ error: 'Failed to calculate storage usage' }, { status: 500 });
  }
}

