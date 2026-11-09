import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAppSecret } from '@/lib/env-vault';
import { upsertReceivedEmail, readMailStore, writeMailStore, getTombstoneResendIds } from '@/lib/mail/store';
import { supabaseServer } from '@/lib/supabase/server';
import { EmailAttachment } from '@/types/mail';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  return handleBackfill(req);
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  return handleBackfill(req);
}

async function handleBackfill(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const purgeMock = searchParams.get('purgeMock') !== 'false'; // default true

    const apiKey = (await getAppSecret('RESEND_API_KEY')) || process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'RESEND_API_KEY is not configured' }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    // 1. Fetch list of all received emails in Resend
    const listRes = await resend.emails.receiving.list();

    if (listRes.error || !listRes.data) {
      const errMsg = listRes.error?.message || 'Failed to list emails from Resend Receiving';
      return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }

    const emailSummaries = listRes.data.data || [];
    console.log(`[Backfill] Found ${emailSummaries.length} received emails in Resend`);

    // 2. If purgeMock is requested, remove initial seeded mock messages
    if (purgeMock) {
      const mockIds = ['msg_inbox_1', 'msg_inbox_2', 'msg_inbox_3', 'msg_sent_1'];
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
        try {
          const supabase = supabaseServer();
          await supabase.from('inbox_messages').delete().in('id', mockIds);
        } catch {
          // ignore
        }
      }

      // Also clean local store
      const store = await readMailStore();
      store.messages = store.messages.filter((m) => !mockIds.includes(m.id));
      await writeMailStore(store);
    }

    // 3. Fetch tombstones once per backfill to skip permanently deleted emails
    const tombstones = await getTombstoneResendIds();
    const eligibleSummaries = emailSummaries.filter((item) => !tombstones.has(item.id));
    console.log(
      `[Backfill] Resend total: ${emailSummaries.length}, tombstoned: ${tombstones.size}, eligible: ${eligibleSummaries.length}`
    );

    // 4. Ingest each eligible email by getting full body and upserting
    const imported: Array<{ id: string; subject: string; from: string; to: string[] }> = [];

    for (const item of eligibleSummaries) {
      try {
        const fullEmailRes = await resend.emails.receiving.get(item.id);
        if (fullEmailRes.data) {
          const fullEmail = fullEmailRes.data;
          const saved = await upsertReceivedEmail({
            id: fullEmail.id,
            from: fullEmail.from,
            to: fullEmail.to,
            subject: fullEmail.subject,
            html: fullEmail.html,
            text: fullEmail.text,
            created_at: fullEmail.created_at,
            headers: fullEmail.headers as Record<string, unknown> | undefined,
            attachments: fullEmail.attachments as EmailAttachment[] | undefined,
          });

          if (saved) {
            imported.push({
              id: saved.id,
              subject: saved.subject,
              from: saved.from.email,
              to: (Array.isArray(fullEmail.to) ? fullEmail.to : [fullEmail.to]) as string[],
            });
          }
        }
      } catch (itemErr) {
        console.error(`[Backfill] Error importing email ${item.id}:`, itemErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: imported.length,
      totalInResend: emailSummaries.length,
      imported,
      message: `Successfully synchronized ${imported.length} received emails from Resend Receiving.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backfill failed';
    console.error('[Backfill] Exception:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
