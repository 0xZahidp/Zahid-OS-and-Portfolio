import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
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
  let errorMessage: string | null = null;

  try {
    // 1. Check REST endpoint health
    const restRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    restConnected = restRes.ok;

    // 2. Check portfolio_content table
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

    // 3. Check app_settings table
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

  return NextResponse.json({
    configured: true,
    projectRef,
    sqlEditorUrl,
    restConnected,
    tables: {
      portfolio_content: portfolioContentExists,
      app_settings: appSettingsExists,
    },
    isReady: restConnected && portfolioContentExists && appSettingsExists,
    error: errorMessage,
  });
}
