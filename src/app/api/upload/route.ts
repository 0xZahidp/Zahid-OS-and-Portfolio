import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const contentType = req.headers.get('content-type') || '';

    // 1. JSON payload with base64 dataUrl
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { dataUrl, filename } = body;

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ success: false, error: 'dataUrl is required' }, { status: 400 });
      }

      const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ success: false, error: 'Invalid data URL format' }, { status: 400 });
      }

      const ext = match[1] === 'svg+xml' ? 'svg' : match[1] || 'png';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const safeBaseName = (filename || 'company-logo')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-');
      const uniqueName = `${safeBaseName}-${Date.now()}.${ext}`;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');

      try {
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, uniqueName);
        await fs.writeFile(filePath, buffer);

        return NextResponse.json({
          success: true,
          url: `/uploads/logos/${uniqueName}`,
          size: buffer.length,
          filename: uniqueName,
        });
      } catch (fsErr) {
        console.warn('[Upload] Disk write failed (serverless fallback to dataUrl):', fsErr);
        // Fallback: return dataUrl directly so nothing breaks
        return NextResponse.json({
          success: true,
          url: dataUrl,
          fallback: true,
          size: buffer.length,
        });
      }
    }

    // 2. FormData file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.png';
      const baseName = path.basename(file.name, ext).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const uniqueName = `${baseName}-${Date.now()}${ext}`;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueName);
      await fs.writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/logos/${uniqueName}`,
        size: buffer.length,
        filename: uniqueName,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported Content-Type header' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload processing failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

