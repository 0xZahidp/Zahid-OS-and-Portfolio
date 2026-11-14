import { StartupLeadTrack, StartupLeadSignalType } from '@/types/leads';
import { getAppSecret } from '@/lib/env-vault';

export interface ExtractedLeadData {
  company_name: string;
  website_domain?: string | null;
  track: StartupLeadTrack;
  signal_type: StartupLeadSignalType;
  role_or_headline: string;
  startup_summary?: string | null;
  contact_name?: string | null;
  contact_title?: string | null;
  contact_email?: string | null;
  pitch_hook?: string | null;
}

/**
 * Uses Google Gemini Free Tier API to parse raw post/article text into a structured Startup Lead.
 */
export async function extractLeadFromTextWithGemini(
  rawText: string,
  apiKey?: string
): Promise<ExtractedLeadData> {
  const key = apiKey || (await getAppSecret('GEMINI_API_KEY')) || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured in Supabase Secrets Vault or environment. Please add it to your Secrets & .env Vault in Settings.');
  }

  const prompt = `You are an expert AI scout extracting structured tech talent & startup lead intelligence for Zahid Hasan (portfolio: zahidp.com).
Zahid has a rare triple-threat profile:
1. Web3 Growth Leader: Scaled NexGami to 500K+ registered users and $5M raised, leading growth loops, tokenomics, and Web3 BD.
2. Full-Stack Engineer: Computer Science background, modern TypeScript, Next.js, Node.js, and cloud systems architect.
3. Certified Salesforce Developer: Apex, LWC, complex integrations, and CRM workflow automation.

Analyze the following raw post text (e.g. from LinkedIn, X/Twitter, or seed funding news):

"""
${rawText.slice(0, 3000)}
"""

Extract and return a single valid JSON object with the following fields:
- "company_name": (string, required) Clean company or startup name (e.g. "Monad Labs", "Stripe")
- "website_domain": (string or null) Domain name if mentioned or obvious (e.g. "monad.xyz")
- "track": (string, required, one of: "Web3 Growth", "Full-Stack", "Salesforce")
- "signal_type": (string, required, one of: "early_hiring_post", "seed_funding")
- "role_or_headline": (string, required) Specific role being hired (e.g. "Founding Full-Stack Engineer") or funding headline (e.g. "Raises $3.5M Seed for Decentralized Compute")
- "startup_summary": (string) 1-2 sentence concise summary of product & funding
- "contact_name": (string or null) Founder, hiring lead, or poster name if present in text
- "contact_title": (string or null) e.g. "Founder & CEO", "CTO", "Head of Engineering"
- "contact_email": (string or null) Explicit email address if mentioned in text
- "pitch_hook": (string) A punchy 1-sentence angle connecting their specific needs/product to Zahid's triple-threat profile:
  * For Web3 Growth: Highlight scaling NexGami to 500K users & $5M raise, driving on-chain growth and viral loops.
  * For Full-Stack: Highlight CS background, production-grade Next.js/TypeScript/Node architectures, fast zero-to-one delivery.
  * For Salesforce: Highlight certified Salesforce development, Apex/LWC integrations, CRM workflows, and automation.

Return ONLY the JSON object.`;

  const models = [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
  ];
  let lastError = 'Failed to extract with Gemini';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = `${model} returned ${res.status}: ${errText.slice(0, 150)}`;
        continue;
      }

      const data = await res.json();
      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) continue;

      const parsed = JSON.parse(rawJson);
      if (!parsed.company_name) {
        lastError = 'AI response did not contain a valid company name';
        continue;
      }

      const validTrack: StartupLeadTrack = ['Web3 Growth', 'Salesforce'].includes(parsed.track)
        ? parsed.track
        : 'Full-Stack';

      const validSignal: StartupLeadSignalType = parsed.signal_type === 'seed_funding'
        ? 'seed_funding'
        : 'early_hiring_post';

      return {
        company_name: parsed.company_name.trim(),
        website_domain: parsed.website_domain?.trim() || null,
        track: validTrack,
        signal_type: validSignal,
        role_or_headline: parsed.role_or_headline?.trim() || 'Software Engineer',
        startup_summary: parsed.startup_summary?.trim() || null,
        contact_name: parsed.contact_name?.trim() || null,
        contact_title: parsed.contact_title?.trim() || null,
        contact_email: parsed.contact_email?.trim() || null,
        pitch_hook: parsed.pitch_hook?.trim() || null,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(`Gemini extraction failed: ${lastError}`);
}

