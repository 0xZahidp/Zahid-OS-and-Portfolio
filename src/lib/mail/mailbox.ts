/**
 * Single source of truth for mailbox classification (Official vs Unofficial vs Ignore).
 * Inbound emails to @zahidp.com are split into Official (critical team/system aliases)
 * and Unofficial (all other @zahidp.com addresses). Emails destined for foreign domains
 * (such as disposable temp-mail domains) are ignored cleanly by this inbox.
 */

export const OFFICIAL_DOMAIN = 'zahidp.com';

export const OFFICIAL_SLUGS = new Set([
  'contact',
  'hello',
  'info',
  'support',
  'hire',
  'jobs',
  'careers',
  'business',
  'partnerships',
  'billing',
  'privacy',
  'legal',
  'security',
  'abuse',
  'postmaster',
  'admin',
  'zahid',
]);

export type Mailbox = 'official' | 'unofficial' | 'ignore';

/**
 * Extracts and normalizes the email address, stripping surrounding names/brackets
 * and +tags from the local part (e.g. "Support <support+urgent@zahidp.com>" -> slug "support").
 */
export function parseEmailAddress(raw: string): { local: string; slug: string; domain: string } | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Extract address between angle brackets if present: "Name <addr@domain>"
  const angleMatch = trimmed.match(/<([^>]+)>/);
  const addr = (angleMatch ? angleMatch[1] : trimmed).trim();

  const atIdx = addr.indexOf('@');
  if (atIdx <= 0 || atIdx === addr.length - 1) return null;

  const local = addr.slice(0, atIdx).trim().toLowerCase();
  const domain = addr.slice(atIdx + 1).trim().toLowerCase();

  // Strip +tag from the local part (e.g. "support+x" -> "support")
  const slug = local.split('+')[0].trim();

  return { local, slug, domain };
}

/**
 * Classifies an incoming message based on all its recipient addresses (to, cc, bcc).
 * Rules:
 * 1. Check ALL recipients, case-insensitive.
 * 2. Parse "Name <addr@domain>" and plain addresses. Strip +tag from local part.
 * 3. Any recipient on OFFICIAL_DOMAIN with slug in OFFICIAL_SLUGS -> 'official'.
 * 4. Else any recipient on OFFICIAL_DOMAIN -> 'unofficial'.
 * 5. Else (other domains, empty or unparsable list) -> 'ignore'.
 */
export function classifyMailbox(recipients: string[]): Mailbox {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return 'ignore';
  }

  let hasOfficial = false;
  let hasUnofficial = false;

  for (const raw of recipients) {
    if (!raw) continue;
    // Support comma-separated recipient strings
    const parts = raw.split(',');
    for (const part of parts) {
      const parsed = parseEmailAddress(part);
      if (!parsed) continue;

      if (parsed.domain === OFFICIAL_DOMAIN.toLowerCase()) {
        if (OFFICIAL_SLUGS.has(parsed.slug)) {
          hasOfficial = true;
        } else {
          hasUnofficial = true;
        }
      }
    }
  }

  if (hasOfficial) return 'official';
  if (hasUnofficial) return 'unofficial';
  return 'ignore';
}

