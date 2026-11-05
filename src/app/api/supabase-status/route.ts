import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({
      configured: false,
      restConnected: false,
      tables: {
        portfolio_content: false,
        app_settings: false,
      },
      message: 'Supabase credentials missing in environment.',
    });
  }

  // Extract project reference
  let projectRef = '';
  try {
    const urlObj = new URL(supabaseUrl);
    projectRef = urlObj.hostname.split('.')[0] || '';
  } catch {
    // fallback
  }

  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  let restConnected = false;
  let portfolioContentExists = false;
  let appSettingsExists = false;
  let tablesInSchema = false;
  let errorMessage: string | null = null;

  try {
    // 1. Check REST endpoint health & OpenAPI schema
    const restRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    restConnected = restRes.ok;

    try {
      const swagger = await restRes.json();
      tablesInSchema = Boolean(
        swagger.definitions?.portfolio_content && swagger.definitions?.app_settings
      );
    } catch {
      // ignore
    }

    // 2. Check portfolio_content table read access
    const tableRes = await fetch(
      `${supabaseUrl}/rest/v1/portfolio_content?select=id,updated_at&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    portfolioContentExists = tableRes.ok;

    // 3. Check app_settings table read access
    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?select=key&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    appSettingsExists = settingsRes.ok;
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : 'Connection failed';
  }

  const needsGrant = tablesInSchema && (!portfolioContentExists || !appSettingsExists);
  const isReady = restConnected && portfolioContentExists && appSettingsExists;

  return NextResponse.json({
    configured: true,
    projectRef,
    sqlEditorUrl,
    restConnected,
    tablesInSchema,
    tables: {
      portfolio_content: portfolioContentExists,
      app_settings: appSettingsExists,
    },
    needsGrant,
    isReady,
    grantSql: `-- Run this in Supabase SQL editor to grant permissions:
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.portfolio_content TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.app_settings TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`,
    error: errorMessage,
  });
}
