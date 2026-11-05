import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';
import { getHealthCollection, saveHealthCollection } from '@/lib/health/health-store';
import { HealthDocument, HealthDocumentCategory } from '@/types/health';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function detectMimeAndExtension(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  // WebP: 'RIFF' .... 'WEBP'
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { mime: 'application/pdf', ext: 'pdf' };
  }

  return null;
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const category = ((formData.get('category') as string) || 'prescription') as HealthDocumentCategory;
    const date = (formData.get('date') as string) || new Date().toISOString().split('T')[0];
    const doctor = (formData.get('doctor') as string) || '';
    const notes = (formData.get('notes') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit. Please compress image.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes
    const detected = detectMimeAndExtension(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: 'Invalid or unsupported file format. Only JPEG, PNG, WebP, and PDF are allowed.' },
        { status: 400 }
      );
    }

    // Unguessable path: {uuid}/{uuid}.{ext}
    const folderId = crypto.randomUUID();
    const fileId = crypto.randomUUID();
    const storagePath = `${folderId}/${fileId}.${detected.ext}`;

    const supabase = supabaseServer();

    // Upload to private bucket
    const { error: uploadError } = await supabase.storage
      .from('health-private')
      .upload(storagePath, buffer, {
        contentType: detected.mime,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const documentId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newDoc: HealthDocument = {
      id: documentId,
      title: title.trim() || 'Untitled Medical Document',
      category,
      date,
      doctor: doctor.trim() || undefined,
      storagePath,
      mimeType: detected.mime,
      sizeBytes: file.size,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Save document metadata
    const existingDocs = await getHealthCollection('documents');
    await saveHealthCollection('documents', [newDoc, ...existingDocs]);

    return NextResponse.json({ success: true, document: newDoc });
  } catch {
    return NextResponse.json({ error: 'Failed to process document upload' }, { status: 500 });
  }
}

