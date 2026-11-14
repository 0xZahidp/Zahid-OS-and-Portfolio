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
import { lookupHunterEmail } from '@/lib/leads/hunter';
import { getAppSecret } from '@/lib/env-vault';

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

    // Action 2: Manual Hunter.io Email Lookup
    if (action === 'lookup_hunter') {
      const allLeads = await getAllLeads();
      const target = allLeads.find((l) => l.id === id);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      }

      if (!target.website_domain || !target.contact_name) {
        return NextResponse.json(
          {
            success: false,
            error: 'Both Website Domain and Contact Name are required for Hunter.io lookup.',
          },
          { status: 400 }
        );
      }

      const hunterKey = (await getAppSecret('HUNTER_API_KEY')) || process.env.HUNTER_API_KEY;
      if (!hunterKey) {
        return NextResponse.json(
          {
            success: false,
            error:
              'HUNTER_API_KEY is not configured in Supabase Secrets Vault or environment. Please add it in Settings > Secrets & .env Vault.',
          },
          { status: 400 }
        );
      }

      const hunterResult = await lookupHunterEmail(
        target.website_domain,
        target.contact_name,
        hunterKey
      );

      if (!hunterResult?.email) {
        return NextResponse.json(
          {
            success: false,
            error: `No email found on Hunter.io for "${target.contact_name}" at ${target.website_domain}.`,
          },
          { status: 404 }
        );
      }

      const updated = await updateLead(id, {
        contact_email: hunterResult.email,
        email_confidence: hunterResult.confidence,
      });

      const updatedAll = await getAllLeads();
      return NextResponse.json({
        success: true,
        lead: updated,
        hunter: hunterResult,
        metrics: calculateLeadMetrics(updatedAll),
      });
    }

    // Action 3: Standard field/status update
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

    const hunterKey = (await getAppSecret('HUNTER_API_KEY')) || process.env.HUNTER_API_KEY;

    const createdLead = await createLead({
      ...body,
      hunter_api_key: hunterKey,
    });
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

