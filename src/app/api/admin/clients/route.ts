import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { listClientProjects, createClientProject } from '@/lib/clients/client-store';
import { isVaultKeyConfigured, getVaultWarning } from '@/lib/crypto/vault';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const result = await listClientProjects();
    return NextResponse.json({
      success: true,
      clients: result.clients,
      tableMissing: Boolean(result.tableMissing),
      vaultConfigured: isVaultKeyConfigured(),
      vaultWarning: getVaultWarning(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load client projects';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const {
      client_name,
      project_name,
      summary,
      primary_domain,
      status,
      contact_name,
      contact_email,
      contact_phone,
      contact_handle,
      tech_stack,
      notes,
    } = body;

    if (!client_name?.trim() || !project_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Client Name and Project Name are required.' },
        { status: 400 }
      );
    }

    const client = await createClientProject({
      client_name,
      project_name,
      summary,
      primary_domain,
      status,
      contact_name,
      contact_email,
      contact_phone,
      contact_handle,
      tech_stack,
      notes,
    });

    return NextResponse.json({ success: true, client });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create client project';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
