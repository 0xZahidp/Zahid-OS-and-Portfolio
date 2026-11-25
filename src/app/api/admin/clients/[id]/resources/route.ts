import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import {
  upsertClientResource,
  deleteClientResource,
  getClientProjectById,
} from '@/lib/clients/client-store';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { id: clientId } = await params;
    const body = await req.json();

    if (!body.category || !body.provider?.trim() || !body.resource_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category, Provider, and Resource Name are required.' },
        { status: 400 }
      );
    }

    const resource = await upsertClientResource(clientId, body);
    const client = await getClientProjectById(clientId, false);
    return NextResponse.json({ success: true, resource, client });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save resource';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ success: false, error: 'resourceId is required' }, { status: 400 });
    }

    await deleteClientResource(clientId, resourceId);
    const client = await getClientProjectById(clientId, false);
    return NextResponse.json({ success: true, client });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete resource';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
