import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const TARGET_BUCKET = 'portfolio-public-assets';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'application/pdf',
]);

const FORBIDDEN_EXTENSIONS = new Set(['.svg', '.html', '.htm', '.js', '.exe', '.sh']);

function getExtension(mime: string, filename?: string): string {
  if (filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext) return ext.replace(/^\./, '');
  }
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let mimeType = '';
    let originalName = 'upload';

    // 1. JSON payload with base64 dataUrl
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { dataUrl, filename } = body;

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json({ success: false, error: 'dataUrl is required' }, { status: 400 });
      }

      const match = dataUrl.match(/^data:([a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ success: false, error: 'Invalid data URL format' }, { status: 400 });
      }

      mimeType = match[1].toLowerCase();
      const base64Data = match[2];
      buffer = Buffer.from(base64Data, 'base64');
      if (filename) originalName = filename;
    }
    // 2. FormData file upload
    else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }

      mimeType = file.type?.toLowerCase() || 'application/octet-stream';
      originalName = file.name || 'upload';
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported Content-Type header' },
        { status: 400 }
      );
    }

    // Check SVG or forbidden extensions
    const fileExt = path.extname(originalName).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.has(fileExt) || mimeType.includes('svg')) {
      return NextResponse.json(
        { success: false, error: 'SVG and executable files are forbidden for security.' },
        { status: 400 }
      );
    }

    // Check file size
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowed limit of 5MB.' },
        { status: 400 }
      );
    }

    // Normalize MIME type if needed
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      if (fileExt === '.webp') mimeType = 'image/webp';
      else if (fileExt === '.jpg' || fileExt === '.jpeg') mimeType = 'image/jpeg';
      else if (fileExt === '.png') mimeType = 'image/png';
      else if (fileExt === '.avif') mimeType = 'image/avif';
      else if (fileExt === '.pdf') mimeType = 'application/pdf';
      else {
        return NextResponse.json(
          { success: false, error: 'Only JPG, PNG, WEBP, AVIF, and PDF files are allowed.' },
          { status: 400 }
        );
      }
    }

    const safeBaseName = originalName
      .toLowerCase()
      .replace(new RegExp(`\\.${fileExt.replace('.', '')}$`, 'i'), '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');
    const ext = getExtension(mimeType, originalName);
    const storagePath = `uploads/${safeBaseName}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage via service_role
    try {
      const supabase = supabaseServer();
      const { error: uploadError } = await supabase.storage
        .from(TARGET_BUCKET)
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from(TARGET_BUCKET)
        .getPublicUrl(storagePath);

      return NextResponse.json({
        success: true,
        url: publicUrlData.publicUrl,
        size: buffer.length,
        filename: path.basename(storagePath),
      });
    } catch (storageErr) {
      console.warn('[Upload] Supabase storage upload failed:', storageErr);

      if (process.env.VERCEL) {
        return NextResponse.json(
          { success: false, error: 'Storage write failed.' },
          { status: 500 }
        );
      }

      // Local fallback for offline dev environment only
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
        await fs.mkdir(uploadDir, { recursive: true });
        const localFileName = `${safeBaseName}-${Date.now()}.${ext}`;
        const localFilePath = path.join(uploadDir, localFileName);
        await fs.writeFile(localFilePath, buffer);

        return NextResponse.json({
          success: true,
          url: `/uploads/logos/${localFileName}`,
          size: buffer.length,
          filename: localFileName,
          fallback: true,
        });
      } catch (fsErr) {
        console.error('[Upload] Local fallback write failed:', fsErr);
        return NextResponse.json(
          { success: false, error: 'Upload failed.' },
          { status: 500 }
        );
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload processing failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
