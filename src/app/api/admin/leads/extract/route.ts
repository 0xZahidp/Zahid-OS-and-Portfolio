import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { extractLeadFromTextWithGemini } from '@/lib/leads/leads-ai';
import { createLead, getAllLeads, calculateLeadMetrics } from '@/lib/leads/leads-store';
import { lookupHunterEmail } from '@/lib/leads/hunter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const rawText = body.text?.trim();
    const sourceUrl = body.source_url?.trim() || null;

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'Raw post text is required for AI extraction.' },
        { status: 400 }
      );
    }

    // 1. AI extraction via Gemini
    const extracted = await extractLeadFromTextWithGemini(rawText);

    // 2. Hunter.io email enrichment if email missing but domain + name present
    let contactEmail = extracted.contact_email;
    let emailConfidence = extracted.contact_email ? 'extracted' : 'missing';

    if (!contactEmail && extracted.website_domain && extracted.contact_name) {
      try {
        const hunter = await lookupHunterEmail(extracted.website_domain, extracted.contact_name);
        if (hunter) {
          contactEmail = hunter.email;
          emailConfidence = hunter.confidence;
        }
      } catch {
        // ignore
      }
    }

    // 3. Create lead in store / database with strict deduplication
    const newLead = await createLead({
      company_name: extracted.company_name,
      role_or_headline: extracted.role_or_headline,
      source_url: sourceUrl,
      track: extracted.track,
      signal_type: extracted.signal_type,
      website_domain: extracted.website_domain,
      contact_name: extracted.contact_name,
      contact_title: extracted.contact_title,
      contact_email: contactEmail,
      email_confidence: emailConfidence as 'verified' | 'extracted' | 'guessed' | 'missing',
      startup_summary: extracted.startup_summary,
      pitch_hook: extracted.pitch_hook,
    });

    const all = await getAllLeads();

    return NextResponse.json({
      success: true,
      lead: newLead,
      metrics: calculateLeadMetrics(all),
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 500;
    const msg = err instanceof Error ? err.message : 'AI Lead extraction failed';
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

