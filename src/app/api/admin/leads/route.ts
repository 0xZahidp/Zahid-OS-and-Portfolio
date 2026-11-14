import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import {
  getFilteredLeads,
  updateLead,
  createLead,
  promoteLeadToCareerPipeline,
  calculateLeadMetrics,
  getAllLeads,
} from '@/lib/leads/leads-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get('track') || undefined;
    const signal_type = searchParams.get('signal_type') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const include_archived = searchParams.get('include_archived') === 'true';

    const result = await getFilteredLeads({
      track,
      signal_type,
      status,
      search,
      include_archived,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve startup leads';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, action, updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    // Action 1: Promote to Career Pipeline
    if (action === 'promote') {
      const promoteRes = await promoteLeadToCareerPipeline(id);
      if (!promoteRes.success) {
        return NextResponse.json(
          { success: false, error: promoteRes.error || 'Failed to promote lead' },
          { status: 500 }
        );
      }
      const all = await getAllLeads();
      return NextResponse.json({
        success: true,
        promoted: true,
        application: promoteRes.application,
        metrics: calculateLeadMetrics(all),
      });
    }

    // Action 2: Standard field/status update
    const updated = await updateLead(id, updates || {});
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

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();

    if (!body.company_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company Name is required' },
        { status: 400 }
      );
    }
    if (!body.role_or_headline?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Role or Headline is required' },
        { status: 400 }
      );
    }

    const createdLead = await createLead(body);
    const all = await getAllLeads();

    return NextResponse.json({
      success: true,
      lead: createdLead,
      metrics: calculateLeadMetrics(all),
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 500;
    const msg = err instanceof Error ? err.message : 'Failed to create lead';
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

