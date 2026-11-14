import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import {
  updateLead,
  deleteLead,
  getLeadById,
  getAllLeads,
  calculateLeadMetrics,
} from '@/lib/leads/leads-store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
  }

  try {
    const lead = await getLeadById(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, lead });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch lead';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updates = body.updates || body;

    const updated = await updateLead(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Lead not found or update failed' }, { status: 404 });
    }

    const all = await getAllLeads();
    return NextResponse.json({
      success: true,
      lead: updated,
      metrics: calculateLeadMetrics(all),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update lead';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
  }

  try {
    const deleted = await deleteLead(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Lead not found or delete failed' }, { status: 404 });
    }

    const all = await getAllLeads();
    return NextResponse.json({
      success: true,
      deleted: true,
      metrics: calculateLeadMetrics(all),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete lead';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
