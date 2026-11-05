import { NextRequest, NextResponse } from 'next/server';
import {
  getCareerApplications,
  saveCareerApplications,
} from '@/lib/career/career-store';
import { CareerApplication } from '@/types/career';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getCareerApplications();
    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch career applications';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applications } = await getCareerApplications();

    const newApp: CareerApplication = {
      id: body.id || `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      company_name: body.company_name?.trim() || 'Untitled Company',
      company_website: body.company_website?.trim() || '',
      company_location: body.company_location?.trim() || '',
      company_logo: body.company_logo?.trim() || '',
      role_title: body.role_title?.trim() || 'Software Engineer',
      status: body.status || 'applied',
      priority: body.priority || 'medium',
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
    await saveCareerApplications(updated);

    return NextResponse.json({ success: true, application: newApp });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create application';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
    }

    const { applications } = await getCareerApplications();
    const index = applications.findIndex((a) => a.id === body.id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const updatedApp: CareerApplication = {
      ...applications[index],
      ...body,
      updated_at: new Date().toISOString(),
    };

    applications[index] = updatedApp;
    await saveCareerApplications(applications);

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update application';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const { applications } = await getCareerApplications();
    const filtered = applications.filter((a) => a.id !== id);

    await saveCareerApplications(filtered);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete application';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

