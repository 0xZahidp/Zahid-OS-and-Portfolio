import { NextRequest, NextResponse } from 'next/server';
import {
  getCareerApplications,
  saveCareerApplications,
} from '@/lib/career/career-store';
import { CareerApplication } from '@/types/career';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const data = await getCareerApplications();
    return NextResponse.json({ success: true, ...data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Database service unavailable' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined;
    const { applications } = await getCareerApplications();

    const newApp: CareerApplication = {
      id: body.id || `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      company_name: body.company_name?.trim() || 'Untitled Company',
      company_website: body.company_website?.trim() || '',
      company_location: body.company_location?.trim() || '',
      company_logo: body.company_logo?.trim() || '',
      role_title: body.role_title?.trim() || 'Software Engineer',
      type: body.type === 'scholarship' ? 'scholarship' : 'job',
      status: body.status || 'applied',
      priority: body.priority || 'medium',
      stageChangedAt: new Date().toISOString(),
      source: body.source || 'linkedin',
      source_detail: body.source_detail?.trim() || '',
      source_url: body.source_url?.trim() || '',
      remote_type: body.remote_type || 'remote',
      location: body.location?.trim() || '',
      employment_type: body.employment_type || 'full_time',
      applied_date: body.applied_date || new Date().toISOString(),
      deadline: body.deadline || '',
      salary_currency: body.salary_currency || 'USD',
      salary_min: body.salary_min ? Number(body.salary_min) : undefined,
      salary_max: body.salary_max ? Number(body.salary_max) : undefined,
      salary_period: body.salary_period || 'yearly',
      compensation_notes: body.compensation_notes?.trim() || '',
      notes: body.notes?.trim() || '',
      cv_version: body.cv_version?.trim() || '',
      cover_letter_url: body.cover_letter_url?.trim() || '',
      portfolio_url: body.portfolio_url?.trim() || '',
      next_followup_date: body.next_followup_date || '',
      next_followup_notes: body.next_followup_notes?.trim() || '',
      contacts: Array.isArray(body.contacts) ? body.contacts : [],
      interviews: Array.isArray(body.interviews) ? body.interviews : [],
      archived: Boolean(body.archived),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newApp, ...applications];
    const { version: newVersion } = await saveCareerApplications(updated, expectedVersion);

    return NextResponse.json({ success: true, application: newApp, version: newVersion });
  } catch (err: unknown) {
    const isConflict =
      (err as { status?: number })?.status === 409 ||
      (err instanceof Error && err.message.includes('changed elsewhere'));
    if (isConflict) {
      return NextResponse.json(
        { success: false, error: 'This data changed elsewhere, reload before saving' },
        { status: 409 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Failed to create application';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
    }

    const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined;
    const { applications } = await getCareerApplications();
    const index = applications.findIndex((a) => a.id === body.id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const existing = applications[index];
    const statusChanged = body.status && body.status !== existing.status;

    const updatedApp: CareerApplication = {
      ...existing,
      ...body,
      stageChangedAt: statusChanged
        ? new Date().toISOString()
        : (body.stageChangedAt || existing.stageChangedAt || existing.updated_at || existing.created_at),
      type: body.type !== undefined ? body.type : (existing.type || 'job'),
      updated_at: new Date().toISOString(),
    };

    applications[index] = updatedApp;
    const { version: newVersion } = await saveCareerApplications(applications, expectedVersion);

    return NextResponse.json({ success: true, application: updatedApp, version: newVersion });
  } catch (err: unknown) {
    const isConflict =
      (err as { status?: number })?.status === 409 ||
      (err instanceof Error && err.message.includes('changed elsewhere'));
    if (isConflict) {
      return NextResponse.json(
        { success: false, error: 'This data changed elsewhere, reload before saving' },
        { status: 409 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Failed to update application';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const expectedVersion = searchParams.get('expectedVersion')
      ? Number(searchParams.get('expectedVersion'))
      : undefined;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const { applications } = await getCareerApplications();
    const filtered = applications.filter((a) => a.id !== id);

    const { version: newVersion } = await saveCareerApplications(filtered, expectedVersion);
    return NextResponse.json({ success: true, version: newVersion });
  } catch (err: unknown) {
    const isConflict =
      (err as { status?: number })?.status === 409 ||
      (err instanceof Error && err.message.includes('changed elsewhere'));
    if (isConflict) {
      return NextResponse.json(
        { success: false, error: 'This data changed elsewhere, reload before saving' },
        { status: 409 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Failed to delete application';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const applications = Array.isArray(body.applications) ? body.applications : [];
    const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : undefined;

    const { version: newVersion } = await saveCareerApplications(applications, expectedVersion);
    return NextResponse.json({ success: true, version: newVersion });
  } catch (err: unknown) {
    const isConflict =
      (err as { status?: number })?.status === 409 ||
      (err instanceof Error && err.message.includes('changed elsewhere'));
    if (isConflict) {
      return NextResponse.json(
        { success: false, error: 'This data changed elsewhere, reload before saving' },
        { status: 409 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Failed to save applications';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

