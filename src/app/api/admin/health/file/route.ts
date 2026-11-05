import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';
import { getHealthCollection, saveHealthCollection } from '@/lib/health/health-store';

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
    }

    const documents = await getHealthCollection('documents');
    const doc = documents.find((d) => d.id === id);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const supabase = supabaseServer();
    // 60-second signed URL for secure short-lived admin access
    const { data, error } = await supabase.storage
      .from('health-private')
      .createSignedUrl(doc.storagePath, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: data.signedUrl,
      document: doc,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
    }

    const documents = await getHealthCollection('documents');
    const doc = documents.find((d) => d.id === id);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const supabase = supabaseServer();
    // Delete file from storage
    if (doc.storagePath) {
      try {
        await supabase.storage.from('health-private').remove([doc.storagePath]);
      } catch {
        // Continue to remove metadata even if file delete throws
      }
    }

    // Remove metadata from documents collection
    const remaining = documents.filter((d) => d.id !== id);
    await saveHealthCollection('documents', remaining);

    return NextResponse.json({ success: true, deletedId: id });
  } catch {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}

